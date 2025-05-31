import express from 'express';
import {
  sendCollaborationRequest,
  getReceivedCollaborationRequests,
  getSentCollaborationRequests,
  respondToCollaborationRequest,
  sendInvitation,
  getReceivedInvitations,
  getSentInvitations,
  respondToInvitation,
} from '../controllers/collaborationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Collaboration Requests
router.post('/request/:projectId', protect, sendCollaborationRequest);
router.get('/requests/received', protect, getReceivedCollaborationRequests); // For project owners
router.get('/requests/sent', protect, getSentCollaborationRequests); // For requesters
router.put('/request/:requestId/respond', protect, respondToCollaborationRequest); // For project owners

// Invitations
router.post('/invite/:projectId/:userIdToInvite', protect, sendInvitation); // For project owners
router.get('/invitations/received', protect, getReceivedInvitations); // For invitees
router.get('/invitations/sent', protect, getSentInvitations); // For inviters
router.put('/invitation/:invitationId/respond', protect, respondToInvitation); // For invitees

export default router;