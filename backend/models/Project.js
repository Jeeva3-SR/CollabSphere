import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teamMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  requiredSkills: [{ type: String }],
  isPublic: { type: Boolean, default: true },
  status: { type: String, enum: ['Open', 'In Progress', 'Completed', 'Archived'], default: 'Open' },
  date: { type: Date, default: Date.now },

});

const Project = mongoose.model('Project', ProjectSchema);
export default Project;