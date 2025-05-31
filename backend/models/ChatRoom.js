import mongoose from 'mongoose';

const ChatRoomSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, unique: true }, // Each project gets one chat room
  name: { type: String, required: true }, // e.g., "Project Alpha Chat"
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Users who are part of this chat
  createdAt: { type: Date, default: Date.now },
});
const ChatRoom = mongoose.model('ChatRoom', ChatRoomSchema);
export default ChatRoom;