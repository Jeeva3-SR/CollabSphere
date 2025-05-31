import CollaborationRequest from '../models/CollaborationRequest.js';
import Invitation from '../models/Invitation.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { createNotification } from './notificationController.js'; // Assuming this helper exists

// === Collaboration Requests ===

// @desc    Request to join a project
// @route   POST /api/collaborations/request/:projectId
// @access  Private
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

    // Notify project owner
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
    if (error.code === 11000) { // MongoServerError for unique index violation
        return res.status(400).json({ message: 'A pending request to join this project already exists for you.' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get pending requests for user's projects (user is owner)
// @route   GET /api/collaborations/requests/received
// @access  Private
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

// @desc    Get requests sent by the user
// @route   GET /api/collaborations/requests/sent
// @access  Private
const getSentCollaborationRequests = async (req, res) => {
    try {
        const requests = await CollaborationRequest.find({ requester: req.user.id })
            .populate('project', 'title status')
            .populate('projectOwner', 'name avatar'); // Populate project owner as well
        res.json(requests);
    } catch (error) {
        //console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


// @desc    Respond to a collaboration request (Accept/Reject)
// @route   PUT /api/collaborations/request/:requestId/respond
// @access  Private (Project Owner)
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

    // Authorization: Only project owner can respond
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
        // Add project to user's joinedProjects
        await User.findByIdAndUpdate(request.requester, { $addToSet: { joinedProjects: project._id } });

        // Notify requester
        await createNotification(
          request.requester,
          'REQUEST_ACCEPTED',
          `Your request to join "${project.title}" has been accepted.`,
          project._id,
          req.user.id // The one who accepted
        );
        // Notify other team members (optional)
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
    } else { // Rejected
        // Notify requester
        await createNotification(
            request.requester,
            'REQUEST_REJECTED',
            `Your request to join "${request.project.title}" has been rejected.`,
            request.project._id,
            req.user.id // The one who rejected
        );
    }
    
    res.json(request);
  } catch (error) {
    //console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


// === Invitations ===

// @desc    Invite a user to a project
// @route   POST /api/collaborations/invite/:projectId/:userIdToInvite
// @access  Private (Project Owner or authorized member)
const sendInvitation = async (req, res) => {
  const { projectId, userIdToInvite } = req.params;
  const inviterId = req.user.id;
  const { message } = req.body;

  try {
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Authorization: For now, only project owner can invite
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

    // Notify invitee
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
     if (error.code === 11000) { // MongoServerError for unique index violation
        return res.status(400).json({ message: 'An invitation to this project is already pending for this user.' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get pending invitations received by the user
// @route   GET /api/collaborations/invitations/received
// @access  Private
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

// @desc    Get invitations sent by the user (or for their projects)
// @route   GET /api/collaborations/invitations/sent
// @access  Private
const getSentInvitations = async (req, res) => {
    try {
        // Could also query for invitations where inviter is req.user.id OR project.owner is req.user.id
        const invitations = await Invitation.find({ inviter: req.user.id })
            .populate('project', 'title')
            .populate('invitee', 'name avatar email status');
        res.json(invitations);
    } catch (error) {
        //console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


// @desc    Respond to an invitation (Accept/Decline)
// @route   PUT /api/collaborations/invitation/:invitationId/respond
// @access  Private (Invitee)
const respondToInvitation = async (req, res) => {
  const { invitationId } = req.params;
  const { status } = req.body; // 'Accepted' or 'Declined'

  if (!['Accepted', 'Declined'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const invitation = await Invitation.findById(invitationId).populate('project');
    if (!invitation) return res.status(404).json({ message: 'Invitation not found' });
    if (invitation.status !== 'Pending') return res.status(400).json({ message: `Invitation already ${invitation.status.toLowerCase()}` });

    // Authorization: Only invitee can respond
    if (invitation.invitee.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    invitation.status = status;
    await invitation.save();
    
    const project = await Project.findById(invitation.project._id); // Re-fetch project to be safe

    if (status === 'Accepted') {
      if (project && !project.teamMembers.includes(req.user.id)) {
        project.teamMembers.push(req.user.id);
        await project.save();
        // Add project to user's joinedProjects
        await User.findByIdAndUpdate(req.user.id, { $addToSet: { joinedProjects: project._id } });

        // Notify inviter (project owner)
        await createNotification(
          invitation.inviter,
          'INVITE_ACCEPTED',
          `${req.user.name} accepted your invitation to join "${project.title}".`,
          project._id,
          req.user.id // The one who accepted
        );
        // Notify other team members (optional)
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
    } else { // Declined
        // Notify inviter (project owner)
        await createNotification(
            invitation.inviter,
            'INVITE_DECLINED',
            `${req.user.name} declined your invitation to join "${invitation.project.title}".`,
            invitation.project._id,
            req.user.id // The one who declined
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