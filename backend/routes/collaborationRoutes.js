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

router.post('/request/:projectId', protect, sendCollaborationRequest);
router.get('/requests/received', protect, getReceivedCollaborationRequests); 
router.get('/requests/sent', protect, getSentCollaborationRequests); 
router.put('/request/:requestId/respond', protect, respondToCollaborationRequest); 

// Invitations
router.post('/invite/:projectId/:userIdToInvite', protect, sendInvitation); 
router.get('/invitations/received', protect, getReceivedInvitations); 
router.get('/invitations/sent', protect, getSentInvitations);
router.put('/invitation/:invitationId/respond', protect, respondToInvitation);

export default router;