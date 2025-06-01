import Project from '../models/Project.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { io, activeUsers } from '../server.js'; // Import io
import { createNotification } from './notificationController.js';
import ChatRoom from '../models/ChatRoom.js';
import CollaborationRequest from '../models/CollaborationRequest.js';
import Invitation from '../models/Invitation.js';

const createProject = async (req, res) => {
  const { title, description, requiredSkills, isPublic } = req.body;
  try {
    const newProject = new Project({
      title,
      description,
      requiredSkills: requiredSkills || [],
      isPublic: isPublic === undefined ? true : isPublic,
      owner: req.user.id,
      teamMembers: [req.user.id],
    });

    const project = await newProject.save();
const newChatRoom = new ChatRoom({
    projectId: project._id,
    name: `${project.title} Chat`,
    members: [req.user.id]
});
await newChatRoom.save();
    await User.findByIdAndUpdate(req.user.id, { $push: { createdProjects: project._id, joinedProjects: project._id } });
    
    res.status(201).json(project);
  } catch (err) {
    //console.error(err.message);
    res.status(500).send('Server error');
  }
};

const getProjects = async (req, res) => {

  const loggedInUserId = req.user?._id; 
  //console.log('loggedInUserId:', loggedInUserId);

  const { skill, search, page = 1, limit = 10, listType } = req.query;
  //console.log('Query Params:', { skill, search, page, limit, listType });

  let query = {};

  if (listType === 'explore') {
    //console.log('Condition: explore');
    query.isPublic = true;
    if (loggedInUserId) {
      //console.log('Condition: explore - excluding owned by', loggedInUserId);
      query.owner = { $ne: loggedInUserId };
    }
  } else if (listType === 'myCreated' && loggedInUserId) {
  //console.log('Condition: myCreated - for user', loggedInUserId);
  query.owner = loggedInUserId; 
} else if (listType === 'myJoined' && loggedInUserId) {
  //console.log('Condition: myJoined - for user', loggedInUserId);
  query.teamMembers = loggedInUserId;
  query.owner = { $ne: loggedInUserId }; 
} else if (listType === 'allMyProjects' && loggedInUserId) {
    //console.log('Condition: allMyProjects - for user', loggedInUserId);
    query.owner = loggedInUserId; 
  }
  else { 
    //console.log('Condition: default fallback');
    query.isPublic = true;
    if (loggedInUserId) {
      //console.log('Condition: default fallback - excluding owned by', loggedInUserId);
      query.owner = { $ne: loggedInUserId }; 
    }
  }

  if (listType === 'explore' || (!listType && query.isPublic)) {
    if (skill) {
      query.requiredSkills = { $in: [new RegExp(`^${skill.trim()}$`, 'i')] };
    }
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: searchRegex }, { description: searchRegex }];
    }
  }
  //console.log('Final MongoDB Query:', JSON.stringify(query));

  try {
    const projects = await Project.find(query)
      .populate('owner', 'name avatar')
      .populate('teamMembers', 'name avatar')
      .sort({ date: -1 })
      .limit(parseInt(limit)) // Ensure limit is an int
      .skip((parseInt(page) - 1) * parseInt(limit)); 
    
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

const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name avatar email bio skills githubLink linkedinLink')
      .populate('teamMembers', 'name avatar email _id');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Access control:
    if (!project.isPublic) { 
        if (!req.user) { 
            return res.status(403).json({ message: 'Access denied. This is a private project.' });
        }
      
        const isOwner = project.owner._id.toString() === req.user.id;
        const isMember = project.teamMembers.some(member => member._id.toString() === req.user.id);
        if (!isOwner && !isMember) {
            return res.status(403).json({ message: 'Access denied for this private project.' });
        }
    }
  
    res.json(project);
  } catch (err) {
    //console.error("Error in getProjectById:", err.message); // Added context
    if (err.kind === 'ObjectId' || err.name === 'CastError') {
        return res.status(404).json({ message: 'Project not found (invalid ID format).' });
    }
    res.status(500).send('Server error');
  }
};

const updateProject = async (req, res) => {
  const { title, description, requiredSkills, isPublic, status } = req.body;
  try {
    let project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

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

const deleteProject = async (req, res) => {
  console.log(`Attempting to delete project with ID: ${req.params.id}`);
  console.log(`User making request: ${req.user ? req.user.id : 'No user / Not authenticated'}`);

  try {
    const project = await Project.findById(req.params.id);
    console.log('Project found:', project ? project._id : 'Project not found in DB');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.owner.toString() !== req.user.id) {
      console.log(`Authorization failed: Project owner is ${project.owner}, user is ${req.user.id}`);
      return res.status(401).json({ message: 'User not authorized to delete this project' });
    }

    console.log('User authorized. Proceeding with data cleanup...');

    console.log(`Updating users who had project ${project._id} in their lists...`);
    const userUpdateResult = await User.updateMany(
        { $or: [{ createdProjects: project._id }, { joinedProjects: project._id }] },
        { $pull: { createdProjects: project._id, joinedProjects: project._id } }
    );
    console.log('User update result:', userUpdateResult);

    console.log(`Deleting collaboration requests for project ${project._id}...`);
    const colabReqDelResult = await CollaborationRequest.deleteMany({ project: project._id });
    console.log('Collaboration requests deletion result:', colabReqDelResult);

    console.log(`Deleting invitations for project ${project._id}...`);
    const invDelResult = await Invitation.deleteMany({ project: project._id });
    console.log('Invitations deletion result:', invDelResult);
    
    console.log(`Deleting notifications for project ${project._id}...`);
    const notifDelResult = await Notification.deleteMany({ projectId: project._id });
    console.log('Notifications deletion result:', notifDelResult);


    console.log(`Deleting project document ${project._id}...`);
    await project.deleteOne(); // Mongoose v6+
    console.log('Project document deleted successfully.');

    res.json({ message: 'Project removed successfully' });

  } catch (err) {
    console.error('!!! CRITICAL ERROR in deleteProject controller !!!');
    console.error('Error Message:', err.message);
    console.error('Error Stack:', err.stack);
    console.error('Full Error Object:', err); 
    res.status(500).send('Server error during project deletion'); 
  }
};


const addTeamMember = async (req, res) => {
    const { userId } = req.body;
    const { projectId } = req.params;

    try {
        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: 'Project not found' });

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
        
        await User.findByIdAndUpdate(userId, { $addToSet: { joinedProjects: project._id } });

        const notificationMsg = `${userToAdd.name} has joined the project: ${project.title}`;
        project.teamMembers.forEach(memberId => {
            if (memberId.toString() !== userId) {
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

const removeTeamMember = async (req, res) => {
   
    const { projectId, memberIdToRemove } = req.params; 
    const loggedInUserId = req.user.id; 

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
            return res.status(404).json({ message: 'Member to remove not found in system' }); 
        }

        const isOwner = project.owner.toString() === loggedInUserId;
        const isRemovingSelf = memberIdToRemove === loggedInUserId;

        if (!project.teamMembers.map(id => id.toString()).includes(memberIdToRemove)) {
            //console.log(`BACKEND CTRL: Member ${memberIdToRemove} is not currently in team for project ${projectId}. Team: ${project.teamMembers}`);
            return res.status(404).json({ message: 'Member not found in this project\'s team' });
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
        
        if (project.owner.toString() !== memberIdToRemove) { // Don't notify owner if they removed themselves
            const notificationMsg = `${userToRemove.name} was removed from project: ${project.title}`;
            if (isOwner && loggedInUserId !== project.owner.toString()) { // If an admin (not owner) removed someone, notify owner
                await createNotification(project.owner.toString(), 'TEAM_MEMBER_LEFT', notificationMsg, project._id, memberIdToRemove);
            }
     
            project.teamMembers.forEach(async (member_id) => {
                if (member_id.toString() !== loggedInUserId && member_id.toString() !== memberIdToRemove) {
                    await createNotification(member_id.toString(), 'TEAM_MEMBER_LEFT', notificationMsg, project._id, memberIdToRemove);
                }
            });
        
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