import mongoose from 'mongoose';

const ChatMessageSchema = new mongoose.Schema({
  chatRoomId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // Optional: for read receipts
});
ChatMessageSchema.index({ chatRoomId: 1, timestamp: -1 }); // For efficient message fetching
const ChatMessage = mongoose.model('ChatMessage', ChatMessageSchema);
export default ChatMessage;