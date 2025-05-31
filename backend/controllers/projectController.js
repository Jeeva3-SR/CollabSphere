import Project from '../models/Project.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { io, activeUsers } from '../server.js'; // Import io
import { createNotification } from './notificationController.js';
import ChatRoom from '../models/ChatRoom.js';

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res) => {
  const { title, description, requiredSkills, isPublic } = req.body;
  try {
    const newProject = new Project({
      title,
      description,
      requiredSkills: requiredSkills || [],
      isPublic: isPublic === undefined ? true : isPublic,
      owner: req.user.id,
      teamMembers: [req.user.id], // Owner is initially a member
    });

    const project = await newProject.save();
    // Inside createProject, after project.save()
const newChatRoom = new ChatRoom({
    projectId: project._id,
    name: `${project.title} Chat`,
    members: [req.user.id]
});
await newChatRoom.save();
    // Add project to owner's createdProjects
    await User.findByIdAndUpdate(req.user.id, { $push: { createdProjects: project._id, joinedProjects: project._id } });
    
    res.status(201).json(project);
  } catch (err) {
    //console.error(err.message);
    res.status(500).send('Server error');
  }
};

// backend/controllers/projectController.js
const getProjects = async (req, res) => {
  // Logging from previous suggestions - good
  //console.log('--- getProjects ---');
  //console.log('req.user:', req.user);
  const loggedInUserId = req.user?._id; // Correctly uses optional chaining
  //console.log('loggedInUserId:', loggedInUserId);

  const { skill, search, page = 1, limit = 10, listType } = req.query;
  //console.log('Query Params:', { skill, search, page, limit, listType });

  let query = {};

  if (listType === 'explore') {
    //console.log('Condition: explore');
    query.isPublic = true;
    if (loggedInUserId) {
      //console.log('Condition: explore - excluding owned by', loggedInUserId);
      query.owner = { $ne: loggedInUserId }; // Correct: Explore excludes user's own projects
    }
  } else if (listType === 'myCreated' && loggedInUserId) {
  //console.log('Condition: myCreated - for user', loggedInUserId);
  query.owner = loggedInUserId; // CORRECT
} else if (listType === 'myJoined' && loggedInUserId) {
  //console.log('Condition: myJoined - for user', loggedInUserId);
  query.teamMembers = loggedInUserId;
  query.owner = { $ne: loggedInUserId }; // CORRECT - ensures it's joined but NOT owned
} else if (listType === 'allMyProjects' && loggedInUserId) {
    //console.log('Condition: allMyProjects - for user', loggedInUserId);
    query.owner = loggedInUserId; // Same as myCreated, which is fine.
  }
  else { // Default fallback
    //console.log('Condition: default fallback');
    query.isPublic = true;
    if (loggedInUserId) {
      //console.log('Condition: default fallback - excluding owned by', loggedInUserId);
      query.owner = { $ne: loggedInUserId }; // Default also excludes user's own projects if logged in
    }
  }

  // Apply common filters like skill and search
  // This condition is a bit complex, let's simplify.
  // Filters like skill/search are usually for public-facing views or when explicitly requested.
  // For 'myCreated' or 'myJoined', you might not want global search/skill filters to apply unless intended.
  if (listType === 'explore' || (!listType && query.isPublic)) { // Apply to 'explore' or default public lists
    if (skill) {
      query.requiredSkills = { $in: [new RegExp(`^${skill.trim()}$`, 'i')] };
    }
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: searchRegex }, { description: searchRegex }];
    }
  }
  // If you want search/skill to apply to 'myCreated' or 'myJoined', you'd add conditions:
  // else if ((listType === 'myCreated' || listType === 'myJoined') && search) { ... }

  //console.log('Final MongoDB Query:', JSON.stringify(query));

  try {
    const projects = await Project.find(query)
      .populate('owner', 'name avatar')
      .populate('teamMembers', 'name avatar')
      .sort({ date: -1 })
      .limit(parseInt(limit)) // Ensure limit is an int
      .skip((parseInt(page) - 1) * parseInt(limit)); // Ensure page/limit are ints
    
    const totalProjects = await Project.countDocuments(query);

    res.json({
        projects,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalProjects / parseInt(limit)),
        totalProjects
    });
  } catch (err) {
    //console.error("Error in getProjects controller:", err.message);
    res.status(500).send('Server error');
  }
};
// @desc    Get project by ID
// @route   GET /api/projects/:id
// @access  Public (if project is public or user is member/owner)
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name avatar email bio skills githubLink linkedinLink')
      .populate('teamMembers', 'name avatar email _id');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Access control:
    if (!project.isPublic) { // If project is private
        if (!req.user) { // And user is not logged in
            return res.status(403).json({ message: 'Access denied. This is a private project.' });
        }
        // User is logged in, check if they are owner or member
        const isOwner = project.owner._id.toString() === req.user.id;
        const isMember = project.teamMembers.some(member => member._id.toString() === req.user.id);
        if (!isOwner && !isMember) {
            return res.status(403).json({ message: 'Access denied for this private project.' });
        }
    }
    // If project is public, or if private and user has access, send the project
    res.json(project);
  } catch (err) {
    //console.error("Error in getProjectById:", err.message); // Added context
    if (err.kind === 'ObjectId' || err.name === 'CastError') { // More robust check for invalid ID format
        return res.status(404).json({ message: 'Project not found (invalid ID format).' });
    }
    res.status(500).send('Server error');
  }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private (Owner only)
const updateProject = async (req, res) => {
  const { title, description, requiredSkills, isPublic, status } = req.body;
  try {
    let project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is owner
    if (project.owner.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    project.title = title || project.title;
    project.description = description || project.description;
    project.requiredSkills = requiredSkills || project.requiredSkills;
    if (isPublic !== undefined) project.isPublic = isPublic;
    project.status = status || project.status;

    project = await project.save();
    res.json(project);
  } catch (err) {
    //console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private (Owner only)
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.owner.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    // Remove project from all users' createdProjects and joinedProjects arrays
    await User.updateMany(
        { _id: { $in: [project.owner, ...project.teamMembers] } }, // Target owner and all team members
        { $pull: { createdProjects: project._id, joinedProjects: project._id } }
    );
    
    // Delete related collaboration requests for this project
    await CollaborationRequest.deleteMany({ project: project._id }); // Assuming CollaborationRequest model is imported
    
    // Delete related invitations for this project
    await Invitation.deleteMany({ project: project._id }); // Assuming Invitation model is imported
    
    // Delete related notifications for this project
    await Notification.deleteMany({ projectId: project._id });

    // Finally, delete the project itself
    await project.deleteOne();
    res.json({ message: 'Project and associated data removed successfully' });
  } catch (err) {
    //console.error("Error deleting project:", err.message); // Added context
    res.status(500).send('Server error');
  }
};


// @desc    Add a team member to a project (internal, usually after accept request/invite)
// @route   POST /api/projects/:projectId/team
// @access  Private (Owner or authorized member)
const addTeamMember = async (req, res) => {
    const { userId } = req.body;
    const { projectId } = req.params;

    try {
        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        // Authorization: Only project owner can add members directly (or admin)
        // For now, this is simplified. Invitations/Requests handle adding members.
        if (project.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to add members directly' });
        }

        const userToAdd = await User.findById(userId);
        if (!userToAdd) return res.status(404).json({ message: 'User to add not found' });

        if (project.teamMembers.includes(userId)) {
            return res.status(400).json({ message: 'User is already in the team' });
        }

        project.teamMembers.push(userId);
        await project.save();
        
        // Add project to user's joinedProjects
        await User.findByIdAndUpdate(userId, { $addToSet: { joinedProjects: project._id } });

        // Notify project owner (if not the one adding) and other team members
        const notificationMsg = `${userToAdd.name} has joined the project: ${project.title}`;
        project.teamMembers.forEach(memberId => {
            if (memberId.toString() !== userId) { // Don't notify the new member themselves about joining
                 createNotification(
                    memberId,
                    'TEAM_MEMBER_JOINED',
                    notificationMsg,
                    project._id,
                    userId
                );
            }
        });


        res.json(project.teamMembers);
    } catch (error) {
        //console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Remove a team member from a project
// @route   DELETE /api/projects/:projectId/team/:memberId
// @access  Private (Owner or the member themselves)
const removeTeamMember = async (req, res) => {
    // These parameter names MUST MATCH what's in the route definition in projectRoutes.js
    const { projectId, memberIdToRemove } = req.params; 
    const loggedInUserId = req.user.id; // From 'protect' middleware

    //console.log(`BACKEND CTRL: removeTeamMember Attempt. ProjectID: ${projectId}, MemberIDToRemove: ${memberIdToRemove}, ByUser: ${loggedInUserId}`);

    try {
        const project = await Project.findById(projectId);
        if (!project) {
          //console.log(`BACKEND CTRL: Project ${projectId} not found.`);
            return res.status(404).json({ message: 'Project not found' });
        }

        const userToRemove = await User.findById(memberIdToRemove);
        if (!userToRemove) {
            //console.log(`BACKEND CTRL: User to remove ${memberIdToRemove} not found.`);
            return res.status(404).json({ message: 'Member to remove not found in system' }); // Clarified message
        }

        const isOwner = project.owner.toString() === loggedInUserId;
        const isRemovingSelf = memberIdToRemove === loggedInUserId;

        if (!project.teamMembers.map(id => id.toString()).includes(memberIdToRemove)) {
            //console.log(`BACKEND CTRL: Member ${memberIdToRemove} is not currently in team for project ${projectId}. Team: ${project.teamMembers}`);
            return res.status(404).json({ message: 'Member not found in this project\'s team' }); // Clarified message
        }

        // Authorization Logic
        if (isOwner) {
            if (isRemovingSelf) { 
                 if (project.teamMembers.length === 1) {
                    //console.log(`BACKEND CTRL: Owner ${loggedInUserId} cannot remove self as last member.`);
                    return res.status(400).json({ message: 'Owner cannot be removed if they are the last member. Delete or archive the project.' });
                 }
                 //console.log(`BACKEND CTRL: Owner ${loggedInUserId} is removing self from project ${projectId}.`);
            } else {
                //console.log(`BACKEND CTRL: Owner ${loggedInUserId} removing member ${memberIdToRemove} from project ${projectId}.`);
            }
        } else if (isRemovingSelf) {
            //console.log(`BACKEND CTRL: Member ${loggedInUserId} is removing self from project ${projectId}.`);
        } else {
            //console.log(`BACKEND CTRL: User ${loggedInUserId} (not owner) DENIED removal of ${memberIdToRemove}.`);
            return res.status(403).json({ message: 'Not authorized. Only the project owner can remove other members.' });
        }

        project.teamMembers = project.teamMembers.filter(id => id.toString() !== memberIdToRemove);
        await project.save();
        //console.log(`BACKEND CTRL: Member ${memberIdToRemove} removed from project.teamMembers. New team: ${project.teamMembers}`);

        await User.findByIdAndUpdate(memberIdToRemove, { $pull: { joinedProjects: project._id } });
        //console.log(`BACKEND CTRL: Project ${projectId} removed from user ${memberIdToRemove}'s joinedProjects.`);
        
        // Simplified Notification Logic Example
        if (project.owner.toString() !== memberIdToRemove) { // Don't notify owner if they removed themselves
            const notificationMsg = `${userToRemove.name} was removed from project: ${project.title}`;
            if (isOwner && loggedInUserId !== project.owner.toString()) { // If an admin (not owner) removed someone, notify owner
                await createNotification(project.owner.toString(), 'TEAM_MEMBER_LEFT', notificationMsg, project._id, memberIdToRemove);
            }
            // Notify other team members
            project.teamMembers.forEach(async (member_id) => {
                if (member_id.toString() !== loggedInUserId && member_id.toString() !== memberIdToRemove) {
                    await createNotification(member_id.toString(), 'TEAM_MEMBER_LEFT', notificationMsg, project._id, memberIdToRemove);
                }
            });
            // If user left themselves, notify owner
            if (isRemovingSelf && loggedInUserId !== project.owner.toString()) {
                 const selfLeftMsg = `${userToRemove.name} has left the project: ${project.title}`;
                 await createNotification(project.owner.toString(), 'TEAM_MEMBER_LEFT', selfLeftMsg, project._id, memberIdToRemove);
            }
        }


        res.json({ message: 'Member removed successfully.', teamMembers: project.teamMembers });
    } catch (error) {
        //console.error("BACKEND CTRL: Error removing team member:", error);
        res.status(500).json({ message: 'Server error while removing member' });
    }
};


export {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addTeamMember,
  removeTeamMember,
};