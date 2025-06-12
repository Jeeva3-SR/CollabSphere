// backend/controllers/taskController.js
import mongoose from 'mongoose'; 
import Task from '../models/Task.js';
import Project from '../models/Project.js';

// Helper to check if user is project owner or a listed team member
const isProjectParticipant = async (projectId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(userId)) {
    console.warn("Invalid ID format for project or user in isProjectParticipant");
    return false;
  }
  const project = await Project.findById(projectId);
  if (!project) {
    console.warn(`Project not found: ${projectId} in isProjectParticipant`);
    return false;
  }
  const userIdStr = userId.toString();
  return project.owner.toString() === userIdStr || project.teamMembers.some(memberId => memberId.toString() === userIdStr);
};


export const createTask = async (req, res) => {
  const { 
    projectId, 
    title, 
    description, 
    assignee: assigneeId, // Frontend sends assigneeId
    deadline, 
    priority,
  } = req.body;
  
  const createdBy = req.user._id; // From authMiddleware
  const creatorName = req.user.name; // From authMiddleware

  try {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ message: 'Invalid Project ID format' });
    }
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    if (project.owner.toString() !== createdBy.toString()) {
        return res.status(403).json({ message: 'Only the project owner can create tasks.' });
    }
    if (!mongoose.Types.ObjectId.isValid(assigneeId)) {
        return res.status(400).json({ message: 'Invalid Assignee ID format.' });
    }
    // Ensure assignee is either owner or a team member
    const isValidAssignee = project.teamMembers.some(m => m.toString() === assigneeId.toString()) || project.owner.toString() === assigneeId.toString();
    if (!isValidAssignee) {
        return res.status(400).json({ message: 'Assignee must be the project owner or a team member.' });
    }
    if (!deadline) {
        return res.status(400).json({ message: 'Deadline is mandatory.' });
    }


    let initialTaskStatus;
    let initialWorkflowStatus;

    if (assigneeId.toString() === createdBy.toString()) { // Owner assigned to self
        initialTaskStatus = 'To Do';
        initialWorkflowStatus = 'assigned_to_self_todo';
    } else { // Owner assigned to a team member
        initialTaskStatus = 'In Progress'; // Owner sees it as 'In Progress' (delegated)
        initialWorkflowStatus = 'assigned_to_member';
    }

    const task = new Task({
      projectId,
      title,
      description: description || '',
      status: initialTaskStatus,
      workflowStatus: initialWorkflowStatus,
      assignee: assigneeId,
      createdBy,
      deadline: new Date(deadline),
      priority: priority || 'Medium',
      comments: []
    });

    const createdTask = await task.save();
    
    const populatedTask = await Task.findById(createdTask._id)
                                .populate('assignee', 'name email _id')
                                .populate('createdBy', 'name email _id');
    res.status(201).json(populatedTask);

  } catch (error) {
    console.error("Error in createTask:", error);
    if (error.name === 'ValidationError') {
        return res.status(400).json({ message: error.message, errors: error.errors });
    }
    res.status(500).json({ message: 'Server error while creating task' });
  }
};


export const getTasksForProject = async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user._id;

  try {
    if (! await isProjectParticipant(projectId, userId)) {
      return res.status(403).json({ message: 'Not authorized to view tasks for this project' });
    }

    const tasks = await Task.find({ projectId })
                            .populate('assignee', 'name email _id')
                            .populate('createdBy', 'name email _id')
                            .populate('comments.user', 'name _id') // Populate user within comments
                            .sort({ updatedAt: -1 });
    res.json(tasks);
  } catch (error) {
    console.error("Error in getTasksForProject:", error);
    res.status(500).json({ message: 'Server error while fetching tasks' });
  }
};


export const updateTask = async (req, res) => {
  const { taskId } = req.params;
  const userId = req.user._id;
  const updateData = req.body; // Contains fields like title, description, status, workflowStatus, assignee, deadline, priority

  try {
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.projectId);
    if (!project) return res.status(404).json({ message: 'Associated project not found.' });

    const isOwner = project.owner.toString() === userId.toString();

    // Only owner can perform general updates via this endpoint
    if (!isOwner) {
      return res.status(403).json({ message: 'Not authorized to update this task.' });
    }

    // Update fields provided in updateData
    Object.keys(updateData).forEach(key => {
      if (key === 'deadline' && updateData[key]) {
        task[key] = new Date(updateData[key]);
      } else if (updateData[key] !== undefined) { // Check for undefined to allow clearing fields like description
        task[key] = updateData[key];
      }
    });

    // If status is changed to 'Done', ensure workflow is 'approved_completed'
    if (task.isModified('status') && task.status === 'Done') {
        task.workflowStatus = 'approved_completed';
    }
    // Add more specific workflow status updates based on status changes if needed here,
    // or handle them in specific action controllers (submit, approve, reject).

    task.updatedAt = Date.now();
    const updatedTask = await task.save();
    const populatedTask = await Task.findById(updatedTask._id)
                                .populate('assignee', 'name email _id')
                                .populate('createdBy', 'name email _id')
                                .populate('comments.user', 'name _id');
    res.json(populatedTask);

  } catch (error) {
    console.error("Error in updateTask:", error);
    if (error.name === 'ValidationError') {
        return res.status(400).json({ message: error.message, errors: error.errors });
    }
    res.status(500).json({ message: 'Server error while updating task' });
  }
};

// --- REVIEW WORKFLOW CONTROLLERS ---

export const submitTaskForReview = async (req, res) => {
    const { taskId } = req.params;
    const userId = req.user._id; // Team member submitting

    try {
        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        // Permission: Only assigned user can submit
        if (task.assignee?.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'You are not assigned to this task to submit it for review.' });
        }
        // Check current workflow status - can only submit if assigned, rejected, overdue, or due_soon
        const allowedPreviousWorkflowStatuses = ['assigned_to_member', 'assigned_to_self_todo', 'rejected_by_owner', 'overdue', 'due_soon'];
        if (!allowedPreviousWorkflowStatuses.includes(task.workflowStatus)) {
            return res.status(400).json({ message: `Task in status '${task.workflowStatus}' cannot be submitted for review.`});
        }

        task.status = 'Review'; // Moves to Owner's 'Review' column
        task.workflowStatus = 'submitted_for_review';
        task.updatedAt = Date.now();
        
        const updatedTask = await task.save();
        const populatedTask = await Task.findById(updatedTask._id).populate('assignee', 'name email _id').populate('createdBy', 'name email _id').populate('comments.user', 'name _id');
        res.json(populatedTask);

    } catch (error) {
        console.error("Error in submitTaskForReview:", error);
        res.status(500).json({ message: 'Server error submitting task for review.' });
    }
};

export const approveTask = async (req, res) => { // Renamed from approveReviewedTask for consistency
    const { taskId } = req.params;
    const userId = req.user._id; // Owner

    try {
        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        const project = await Project.findById(task.projectId);
        if (!project || project.owner.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Only the project owner can approve tasks.' });
        }
        if (task.workflowStatus !== 'submitted_for_review') {
            return res.status(400).json({ message: 'Task is not awaiting review.' });
        }

        task.status = 'Done';
        task.workflowStatus = 'approved_completed';
        task.updatedAt = Date.now();

        const updatedTask = await task.save();
        const populatedTask = await Task.findById(updatedTask._id).populate('assignee', 'name email _id').populate('createdBy', 'name email _id').populate('comments.user', 'name _id');
        res.json(populatedTask);
    } catch (error) {
        console.error("Error in approveTask:", error);
        res.status(500).json({ message: 'Server error approving task.' });
    }
};

export const rejectTask = async (req, res) => { // Renamed from rejectReviewedTask
    const { taskId } = req.params;
    const { reason } = req.body; // Expect reason from client
    const userId = req.user._id; // Owner
    const userName = req.user.name;

    if (!reason || typeof reason !== 'string' || reason.trim() === '') {
        return res.status(400).json({ message: 'Rejection reason is mandatory.' });
    }

    try {
        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        const project = await Project.findById(task.projectId);
        if (!project || project.owner.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Only the project owner can reject tasks.' });
        }
        if (task.workflowStatus !== 'submitted_for_review') {
            return res.status(400).json({ message: 'Task is not awaiting review.' });
        }

        // Determine where it goes back to on Owner's board based on original assignee
        const assigneeWasOwner = task.assignee?.toString() === project.owner.toString();
        task.status = assigneeWasOwner ? 'To Do' : 'In Progress'; // Owner's ToDo if self, InProgress if member
        task.workflowStatus = 'rejected_by_owner';
        
        task.comments.push({
            text: `Rejected: ${reason}`,
            user: userId,
            userName: userName,
            type: 'rejection',
            createdAt: new Date()
        });
        task.updatedAt = Date.now();

        const updatedTask = await task.save();
        const populatedTask = await Task.findById(updatedTask._id).populate('assignee', 'name email _id').populate('createdBy', 'name email _id').populate('comments.user', 'name _id');
        res.json(populatedTask);
    } catch (error) {
        console.error("Error in rejectTask:", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message, errors: error.errors });
        }
        res.status(500).json({ message: 'Server error rejecting task.' });
    }
};


export const deleteTask = async (req, res) => {
  const { taskId } = req.params;
  const userId = req.user._id; 
  
  try {
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
        return res.status(400).json({ message: 'Invalid Task ID format' });
    }
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    const project = await Project.findById(task.projectId);
    if (!project) return res.status(404).json({ message: 'Associated project not found.' });
    
    if (project.owner.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this task.' });
    }

    await task.deleteOne(); 
    res.json({ message: 'Task removed successfully' });
  } catch (error) {
    console.error("Error in deleteTask:", error);
    res.status(500).json({ message: 'Server error while deleting task' });
  }
};