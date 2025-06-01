import mongoose from 'mongoose';

const InvitationSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  inviter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
  invitee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['Pending', 'Accepted', 'Declined'], default: 'Pending' },
  message: { type: String, default: '' },
  date: { type: Date, default: Date.now },
});

InvitationSchema.index({ project: 1, invitee: 1 }, { unique: true, partialFilterExpression: { status: 'Pending' } });

const Invitation = mongoose.model('Invitation', InvitationSchema);
export default Invitation;