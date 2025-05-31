import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teamMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  requiredSkills: [{ type: String }],
  isPublic: { type: Boolean, default: true },
  status: { type: String, enum: ['Open', 'In Progress', 'Completed', 'Archived'], default: 'Open' },
  // Add roles if needed later: e.g., team: [{ user: ObjectId, role: String }]
  date: { type: Date, default: Date.now },
  // coverImage: { type: String, default: 'https://via.placeholder.com/800x450?text=Project+Cover' } // default project cover
});

const Project = mongoose.model('Project', ProjectSchema);
export default Project;