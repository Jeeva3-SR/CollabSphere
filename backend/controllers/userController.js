import User from '../models/User.js';
import Project from '../models/Project.js';
import CollaborationRequest from '../models/CollaborationRequest.js';
import Invitation from '../models/Invitation.js';
import multer from 'multer';

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password')
      .populate('createdProjects', 'title _id status isPublic')
      .populate('joinedProjects', 'title _id status isPublic');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    if (err.kind === 'ObjectId' || err.name === 'CastError') {
      return res.status(404).json({ message: 'User not found (invalid ID format).' });
    }
    res.status(500).send('Server error');
  }
};

const updateUserProfile = async (req, res) => {
  const { name, bio, skills, githubLink, linkedinLink, avatar } = req.body;

  try {
    const user = await User.findById(req.user.id);

    if (user) {
      user.name = name || user.name;
      user.bio = bio !== undefined ? bio : user.bio;
      user.skills = skills || user.skills;
      user.githubLink = githubLink !== undefined ? githubLink : user.githubLink;
      user.linkedinLink = linkedinLink !== undefined ? linkedinLink : user.linkedinLink;

      if (avatar) {
        user.avatar = avatar;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        bio: updatedUser.bio,
        skills: updatedUser.skills,
        githubLink: updatedUser.githubLink,
        linkedinLink: updatedUser.linkedinLink,
        avatar: updatedUser.avatar,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ message: "Validation Error", errors: messages });
    }
    res.status(500).send('Server error');
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password -createdProjects -joinedProjects');
    res.json(users);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

const uploadUserProfilePicture = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated for picture upload.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded or file was rejected by filter.' });
    }

    const serverBaseUrl = `${req.protocol}://${req.get('host')}`;
    const avatarPath = `/uploads/${req.file.filename}`;
    user.avatar = `${serverBaseUrl}${avatarPath}`;

    const updatedUser = await user.save();

    res.json({
      message: 'Profile picture updated successfully',
      avatarUrl: updatedUser.avatar,
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        bio: updatedUser.bio,
        skills: updatedUser.skills,
        githubLink: updatedUser.githubLink,
        linkedinLink: updatedUser.linkedinLink,
        avatar: updatedUser.avatar,
      }
    });

  } catch (error) {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File is too large. Maximum 5MB allowed.' });
      }
      return res.status(400).json({ message: `File upload error: ${error.message}` });
    }
    if (error.message && error.message.includes('Images Only')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error during picture upload.' });
  }
};

const deleteUserAccount = async (req, res) => {
  const userIdToDelete = req.user.id;

  try {
    const user = await User.findById(userIdToDelete);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const ownedProjects = await Project.find({ owner: userIdToDelete });
    if (ownedProjects.length > 0) {
      return res.status(400).json({
        message: `Cannot delete account. You own ${ownedProjects.length} project(s). Please transfer or delete them first.`
      });
    }

    await Project.updateMany(
      { teamMembers: userIdToDelete, owner: { $ne: userIdToDelete } },
      { $pull: { teamMembers: userIdToDelete } }
    );

    await CollaborationRequest.deleteMany({ requester: userIdToDelete });

    await Invitation.deleteMany({
      $or: [{ inviter: userIdToDelete }, { invitee: userIdToDelete }]
    });

    await user.deleteOne();

    res.json({ message: 'Your account has been successfully deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error while deleting account. Please try again later.' });
  }
};

export {
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  uploadUserProfilePicture,
  deleteUserAccount
};
