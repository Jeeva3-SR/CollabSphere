import mongoose from 'mongoose';

const CollaborationRequestSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  projectOwner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['Pending', 'Accepted', 'Rejected'], default: 'Pending' },
  message: { type: String, default: '' }, // Optional message from requester
  date: { type: Date, default: Date.now },
});

// Ensure a user can only request to join a project once if not already a member or pending
CollaborationRequestSchema.index({ project: 1, requester: 1 }, { unique: true, partialFilterExpression: { status: 'Pending' } });


const CollaborationRequest = mongoose.model('CollaborationRequest', CollaborationRequestSchema);
export default CollaborationRequest;