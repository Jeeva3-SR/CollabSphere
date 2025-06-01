import mongoose from 'mongoose';

const ChatRoomSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, unique: true }, 
  name: { type: String, required: true }, 
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
});
const ChatRoom = mongoose.model('ChatRoom', ChatRoomSchema);
export default ChatRoom;