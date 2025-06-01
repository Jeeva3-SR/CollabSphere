import CollaborationRequest from '../models/CollaborationRequest.js';
import Invitation from '../models/Invitation.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { createNotification } from './notificationController.js'; 

const sendCollaborationRequest = async (req, res) => {
  const { projectId } = req.params;
  const requesterId = req.user.id;
  const { message } = req.body;

  try {
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.owner.toString() === requesterId) {
        return res.status(400).json({ message: "You are the owner of this project." });
    }
    if (project.teamMembers.includes(requesterId)) {
        return res.status(400).json({ message: "You are already a member of this project." });
    }

    const existingRequest = await CollaborationRequest.findOne({ project: projectId, requester: requesterId, status: 'Pending' });
    if (existingRequest) {
      return res.status(400).json({ message: 'Request already sent and pending' });
    }

    const newRequest = new CollaborationRequest({
      project: projectId,
      requester: requesterId,
      projectOwner: project.owner,
      message
    });
    await newRequest.save();
    await createNotification(
      project.owner,
      'REQUEST_RECEIVED',
      `${req.user.name} wants to join your project: ${project.title}`,
      projectId,
      requesterId
    );
    
    res.status(201).json(newRequest);
  } catch (error) {
    //console.error(error);
    if (error.code === 11000) { 
        return res.status(400).json({ message: 'A pending request to join this project already exists for you.' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

const getReceivedCollaborationRequests = async (req, res) => {
    try {
        const requests = await CollaborationRequest.find({ projectOwner: req.user.id, status: 'Pending' })
            .populate('project', 'title')
            .populate('requester', 'name avatar email');
        res.json(requests);
    } catch (error) {
        //console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


const getSentCollaborationRequests = async (req, res) => {
    try {
        const requests = await CollaborationRequest.find({ requester: req.user.id })
            .populate('project', 'title status')
            .populate('projectOwner', 'name avatar'); 
        res.json(requests);
    } catch (error) {
        //console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};



const respondToCollaborationRequest = async (req, res) => {
  const { requestId } = req.params;
  const { status } = req.body; // 'Accepted' or 'Rejected'

  if (!['Accepted', 'Rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const request = await CollaborationRequest.findById(requestId).populate('project');
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'Pending') return res.status(400).json({ message: `Request already ${request.status.toLowerCase()}` });

    if (request.projectOwner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    request.status = status;
    await request.save();

    if (status === 'Accepted') {
      const project = await Project.findById(request.project._id);
      if (project && !project.teamMembers.includes(request.requester)) {
        project.teamMembers.push(request.requester);
        await project.save();
        await User.findByIdAndUpdate(request.requester, { $addToSet: { joinedProjects: project._id } });

        await createNotification(
          request.requester,
          'REQUEST_ACCEPTED',
          `Your request to join "${project.title}" has been accepted.`,
          project._id,
          req.user.id // The one who accepted
        );
         const requesterUser = await User.findById(request.requester).select('name');
         project.teamMembers.forEach(memberId => {
            if (memberId.toString() !== request.requester.toString() && memberId.toString() !== req.user.id.toString()) {
                 createNotification(
                    memberId,
                    'TEAM_MEMBER_JOINED',
                    `${requesterUser.name} has joined the project: ${project.title}`,
                    project._id,
                    request.requester
                );
            }
        });
      }
    } else { 
     
        await createNotification(
            request.requester,
            'REQUEST_REJECTED',
            `Your request to join "${request.project.title}" has been rejected.`,
            request.project._id,
            req.user.id 
        );
    }
    
    res.json(request);
  } catch (error) {
    //console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const sendInvitation = async (req, res) => {
  const { projectId, userIdToInvite } = req.params;
  const inviterId = req.user.id;
  const { message } = req.body;

  try {
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.owner.toString() !== inviterId) {
      return res.status(403).json({ message: 'Only project owner can send invites' });
    }

    const invitee = await User.findById(userIdToInvite);
    if (!invitee) return res.status(404).json({ message: 'User to invite not found' });

    if (project.teamMembers.includes(userIdToInvite)) {
      return res.status(400).json({ message: 'User is already in the project team' });
    }

    const existingInvite = await Invitation.findOne({ project: projectId, invitee: userIdToInvite, status: 'Pending' });
    if (existingInvite) {
      return res.status(400).json({ message: 'User has already been invited and invite is pending' });
    }

    const newInvitation = new Invitation({
      project: projectId,
      inviter: inviterId,
      invitee: userIdToInvite,
      message
    });
    await newInvitation.save();
    await createNotification(
      userIdToInvite,
      'INVITE_RECEIVED',
      `${req.user.name} invited you to join project: ${project.title}`,
      projectId,
      inviterId
    );

    res.status(201).json(newInvitation);
  } catch (error) {
    //console.error(error);
     if (error.code === 11000) { 
        return res.status(400).json({ message: 'An invitation to this project is already pending for this user.' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

const getReceivedInvitations = async (req, res) => {
    try {
        const invitations = await Invitation.find({ invitee: req.user.id, status: 'Pending' })
            .populate('project', 'title')
            .populate('inviter', 'name avatar email');
        res.json(invitations);
    } catch (error) {
        //console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getSentInvitations = async (req, res) => {
    try {
        const invitations = await Invitation.find({ inviter: req.user.id })
            .populate('project', 'title')
            .populate('invitee', 'name avatar email status');
        res.json(invitations);
    } catch (error) {
        //console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


const respondToInvitation = async (req, res) => {
  const { invitationId } = req.params;
  const { status } = req.body; 

  if (!['Accepted', 'Declined'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const invitation = await Invitation.findById(invitationId).populate('project');
    if (!invitation) return res.status(404).json({ message: 'Invitation not found' });
    if (invitation.status !== 'Pending') return res.status(400).json({ message: `Invitation already ${invitation.status.toLowerCase()}` });

    if (invitation.invitee.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    invitation.status = status;
    await invitation.save();
    
    const project = await Project.findById(invitation.project._id);

    if (status === 'Accepted') {
      if (project && !project.teamMembers.includes(req.user.id)) {
        project.teamMembers.push(req.user.id);
        await project.save();
        await User.findByIdAndUpdate(req.user.id, { $addToSet: { joinedProjects: project._id } });

        await createNotification(
          invitation.inviter,
          'INVITE_ACCEPTED',
          `${req.user.name} accepted your invitation to join "${project.title}".`,
          project._id,
          req.user.id 
        );
        project.teamMembers.forEach(memberId => {
            if (memberId.toString() !== req.user.id.toString() && memberId.toString() !== invitation.inviter.toString()) {
                 createNotification(
                    memberId,
                    'TEAM_MEMBER_JOINED',
                    `${req.user.name} has joined the project: ${project.title}`,
                    project._id,
                    req.user.id
                );
            }
        });
      }
    } else { 
        await createNotification(
            invitation.inviter,
            'INVITE_DECLINED',
            `${req.user.name} declined your invitation to join "${invitation.project.title}".`,
            invitation.project._id,
            req.user.id 
        );
    }

    res.json(invitation);
  } catch (error) {
    //console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export {
  sendCollaborationRequest,
  getReceivedCollaborationRequests,
  getSentCollaborationRequests,
  respondToCollaborationRequest,
  sendInvitation,
  getReceivedInvitations,
  getSentInvitations,
  respondToInvitation,
};