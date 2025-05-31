import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bio: { type: String, default: '' },
  skills: [{ type: String }],
  githubLink: { type: String, default: '' },
  linkedinLink: { type: String, default: '' },
  avatar: { type: String, default: 'https://via.placeholder.com/150' }, // Default avatar
  createdProjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  joinedProjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  date: { type: Date, default: Date.now },
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', UserSchema);
export default User;