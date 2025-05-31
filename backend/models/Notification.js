// backend/models/Notification.js
import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // User to notify
  type: {
    type: String,
    enum: [
      'REQUEST_RECEIVED',
      'REQUEST_ACCEPTED',
      'REQUEST_REJECTED',
      'INVITE_RECEIVED',
      'INVITE_ACCEPTED',
      'INVITE_DECLINED',
      'NEW_PROJECT_MATCHING_SKILLS',
      'TEAM_MEMBER_JOINED',
      'TEAM_MEMBER_LEFT',
      'NEW_MESSAGE', // <<< --- ADDED/ENSURED THIS TYPE
    ],
    required: true,
  },
  message: { type: String, required: true }, // e.g., "User X sent a message in Project Y" or "You have a new message"
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null }, // Project context for the message
  relatedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // e.g., sender of the message
  collaborationId: { type: mongoose.Schema.Types.ObjectId, default: null }, // ID of the request or invitation if applicable
  isRead: { type: Boolean, default: false },
  date: { type: Date, default: Date.now },
});

const Notification = mongoose.model('Notification', NotificationSchema);
export default Notification;