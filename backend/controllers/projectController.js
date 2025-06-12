import Project from '../models/Project.js';
import User from '../models/User.js';
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
      members: [req.user.id],
    });
    await newChatRoom.save();

    await User.findByIdAndUpdate(req.user.id, {
      $push: { createdProjects: project._id, joinedProjects: project._id },
    });

    res.status(201).json(project);
  } catch (err) {
    res.status(500).send('Server error');
  }
};

const getProjects = async (req, res) => {
  const loggedInUserId = req.user?._id;
  const { skill, search, page = 1, limit = 10, listType, userId } = req.query;

  let query = {};

  if (listType === 'explore') {
    query.isPublic = true;
    if (loggedInUserId) query.owner = { $ne: loggedInUserId };
  } else if (listType === 'myCreated' && loggedInUserId) {
    query.owner = loggedInUserId;
  } else if (listType === 'myJoined' && loggedInUserId) {
    query.teamMembers = loggedInUserId;
    query.owner = { $ne: loggedInUserId };
  } else if (listType === 'allMyProjects' && loggedInUserId) {
    query.owner = loggedInUserId;
  } else if (listType === 'userCreated' && userId) {
    query.owner = userId;
    if (!loggedInUserId || loggedInUserId.toString() !== userId.toString()) {
      query.isPublic = true;
    }
  } else {
    query.isPublic = true;
    if (loggedInUserId) query.owner = { $ne: loggedInUserId };
  }

  if (listType === 'explore' || listType === 'userCreated' || (!listType && query.isPublic)) {
    if (skill) {
      query.requiredSkills = { $in: [new RegExp(`^${skill.trim()}$`, 'i')] };
    }
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: searchRegex }, { description: searchRegex }];
    }
  }

  try {
    const projects = await Project.find(query)
      .populate('owner', 'name avatar')
      .populate('teamMembers', 'name avatar')
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const totalProjects = await Project.countDocuments(query);

    res.json({
      projects,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalProjects / parseInt(limit)),
      totalProjects,
    });
  } catch (err) {
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

    if (!project.isPublic) {
      if (!req.user) {
        return res.status(403).json({ message: 'Access denied. This is a private project.' });
      }
      const isOwner = project.owner && project.owner._id.toString() === req.user.id;
      const isMember = project.teamMembers.some(
        (member) => member && member._id.toString() === req.user.id
      );
      if (!isOwner && !isMember) {
        return res.status(403).json({ message: 'Access denied for this private project.' });
      }
    }

    res.json(project);
  } catch (err) {
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

    project.title = title !== undefined ? title : project.title;
    project.description = description !== undefined ? description : project.description;
    project.requiredSkills = requiredSkills !== undefined ? requiredSkills : project.requiredSkills;
    if (isPublic !== undefined) project.isPublic = isPublic;
    project.status = status !== undefined ? status : project.status;

    project = await project.save();
    res.json(project);
  } catch (err) {
    res.status(500).send('Server error');
  }
};

const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.owner.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to delete this project' });
    }

    await User.updateMany(
      { $or: [{ createdProjects: project._id }, { joinedProjects: project._id }] },
      { $pull: { createdProjects: project._id, joinedProjects: project._id } }
    );
    await CollaborationRequest.deleteMany({ project: project._id });
    await Invitation.deleteMany({ project: project._id });
    await ChatRoom.deleteOne({ projectId: project._id });

    await project.deleteOne();

    res.json({ message: 'Project removed successfully' });
  } catch (err) {
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
      return res.status(403).json({ message: 'Not authorized to add members directly to this project' });
    }

    const userToAdd = await User.findById(userId);
    if (!userToAdd) return res.status(404).json({ message: 'User to add not found' });

    if (project.teamMembers.map((id) => id.toString()).includes(userId)) {
      return res.status(400).json({ message: 'User is already in the team' });
    }

    project.teamMembers.push(userId);
    await project.save();

    await User.findByIdAndUpdate(userId, { $addToSet: { joinedProjects: project._id } });

    await ChatRoom.findOneAndUpdate(
      { projectId: project._id },
      { $addToSet: { members: userId } }
    );

    res.json(project.teamMembers);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const removeTeamMember = async (req, res) => {
  const { projectId, memberIdToRemove } = req.params;
  const loggedInUserId = req.user.id;

  try {
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const userToRemove = await User.findById(memberIdToRemove);
    if (!userToRemove) return res.status(404).json({ message: 'Member to remove not found' });

    const isOwner = project.owner.toString() === loggedInUserId;
    const isRemovingSelf = memberIdToRemove === loggedInUserId;

    if (!project.teamMembers.map((id) => id.toString()).includes(memberIdToRemove)) {
      return res.status(404).json({ message: 'Member not in project' });
    }

    if (isOwner && isRemovingSelf && project.teamMembers.length === 1) {
      return res.status(400).json({ message: 'Owner cannot be removed if they are the last member' });
    } else if (!isOwner && !isRemovingSelf) {
      return res.status(403).json({ message: 'Not authorized to remove this member' });
    }

    project.teamMembers = project.teamMembers.filter((id) => id.toString() !== memberIdToRemove);
    await project.save();

    await User.findByIdAndUpdate(memberIdToRemove, { $pull: { joinedProjects: project._id } });

    await ChatRoom.findOneAndUpdate(
      { projectId: project._id },
      { $pull: { members: memberIdToRemove } }
    );

    res.json({ message: 'Member removed successfully.', teamMembers: project.teamMembers });
  } catch (error) {
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
