import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getChatRoomForProject, getMessagesForChatRoom, postMessage } from '../controllers/chatController.js'; 

const router = express.Router();
router.get('/room/:projectId', protect, getChatRoomForProject);
router.get('/messages/:chatRoomId', protect, getMessagesForChatRoom);
router.post('/messages/:chatRoomId', protect, postMessage);
export default router;