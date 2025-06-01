import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
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
      'NEW_CHAT_MESSAGE', // <<< --- ADDED/ENSURED THIS TYPE
    ],
    required: true,
  },
  message: { type: String, required: true }, 
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null }, 
  relatedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, 
  collaborationId: { type: mongoose.Schema.Types.ObjectId, default: null },
  isRead: { type: Boolean, default: false },
  date: { type: Date, default: Date.now },
});

const Notification = mongoose.model('Notification', NotificationSchema);
export default Notification;