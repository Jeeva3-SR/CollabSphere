import mongoose from 'mongoose';

const InvitationSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  inviter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Project owner or team member with permission
  invitee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['Pending', 'Accepted', 'Declined'], default: 'Pending' },
  message: { type: String, default: '' }, // Optional message from inviter
  date: { type: Date, default: Date.now },
});

// Ensure a user is not invited to the same project multiple times if pending
InvitationSchema.index({ project: 1, invitee: 1 }, { unique: true, partialFilterExpression: { status: 'Pending' } });

const Invitation = mongoose.model('Invitation', InvitationSchema);
export default Invitation;