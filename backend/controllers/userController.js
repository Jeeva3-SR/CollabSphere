// backend/controllers/userController.js
import User from '../models/User.js';
import Project from '../models/Project.js'; // Needed for cleanup in deleteUserAccount
import Notification from '../models/Notification.js'; // Needed for cleanup in deleteUserAccount
import CollaborationRequest from '../models/CollaborationRequest.js'; // Needed for cleanup in deleteUserAccount
import Invitation from '../models/Invitation.js'; // Needed for cleanup in deleteUserAccount
// import ChatRoom from '../models/ChatRoom.js'; // Uncomment if you implement chat cleanup
// import ChatMessage from '../models/ChatMessage.js'; // Uncomment if you implement chat cleanup

import path from 'path'; // May not be strictly needed here if URLs are constructed fully on request
import multer from 'multer'; // Only if handling specific MulterErrors here, usually route handles it

// @desc    Get user profile by ID (publicly accessible for profiles)
// @route   GET /api/users/:userId
// @access  Public
const getUserProfile = async (req, res) => {
  //console.log(`Attempting to get profile for userId: ${req.params.userId}`);
  try {
    const user = await User.findById(req.params.userId)
      .select('-password') // Exclude password from populated user data
      .populate('createdProjects', 'title _id status isPublic') // Populate some project info
      .populate('joinedProjects', 'title _id status isPublic');  // Populate some project info

    if (!user) {
     //
      console.log(`User not found: ${req.params.userId}`);
      return res.status(404).json({ message: 'User not found' });
    }
    // console.log(`Profile found for ${req.params.userId}:`, user.name);
    res.json(user);
  } catch (err) {
   // console.error(`Error in getUserProfile for ${req.params.userId}:`, err.message);
    if (err.kind === 'ObjectId' || err.name === 'CastError') {
        return res.status(404).json({ message: 'User not found (invalid ID format).' });
    }
    res.status(500).send('Server error');
  }
};

// @desc    Update logged-in user's profile (text fields, skills, links)
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  const { name, bio, skills, githubLink, linkedinLink, avatar } = req.body; // Avatar URL can be updated here manually too
  //console.log(`Attempting to update profile for user: ${req.user.id}`);
  //console.log('Received update data:', req.body);

  try {
    const user = await User.findById(req.user.id);

    if (user) {
      user.name = name || user.name;
      user.bio = bio !== undefined ? bio : user.bio; // Allow setting bio to empty string
      user.skills = skills || user.skills;
      user.githubLink = githubLink !== undefined ? githubLink : user.githubLink;
      user.linkedinLink = linkedinLink !== undefined ? linkedinLink : user.linkedinLink;
      
      // Only update avatar if a new URL is provided in this text update
      // The dedicated picture upload route handles file uploads primarily.
      if (avatar) { 
        user.avatar = avatar;
      }

      // Password change would be a separate, more secure flow
      // if (req.body.password) { user.password = req.body.password; } // Requires rehashing

      const updatedUser = await user.save();
     // console.log(`Profile updated for user: ${updatedUser._id}`);
      res.json({ // Return a clean user object
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email, // Email typically not changeable this way
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
   // console.error(`Error updating profile for ${req.user.id}:`, err.message);
     if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({ message: "Validation Error", errors: messages });
    }
    res.status(500).send('Server error');
  }
};

// @desc    Get all users (e.g., for search/invite functionality)
// @route   GET /api/users
// @access  Private (or Public with careful consideration for data exposure)
const getAllUsers = async (req, res) => {
  //console.log("Attempting to get all users.");
  try {
    // TODO: Implement pagination and search/filtering if needed for large user bases
    const users = await User.find({}).select('-password -createdProjects -joinedProjects'); // Exclude sensitive/large fields by default
    res.json(users);
  } catch (err) {
    //console.error("Error in getAllUsers:", err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Upload/Update user profile picture
// @route   POST /api/users/profile/picture
// @access  Private
const uploadUserProfilePicture = async (req, res) => {
 //
 // console.log("BACKEND CONTROLLER: uploadUserProfilePicture hit.");
  //console.log("BACKEND CONTROLLER: req.file:", req.file);
  //console.log("BACKEND CONTROLLER: req.user:", req.user ? req.user.id : 'No user');

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
    const avatarPath = `/uploads/${req.file.filename}`; // Relative path served by static middleware
    user.avatar = `${serverBaseUrl}${avatarPath}`;     // Full URL for DB storage

    const updatedUser = await user.save();
    //console.log("BACKEND CONTROLLER: User avatar updated to:", updatedUser.avatar);

    res.json({
      message: 'Profile picture updated successfully',
      avatarUrl: updatedUser.avatar,
      user: { 
         _id: updatedUser._id, name: updatedUser.name, email: updatedUser.email,
         bio: updatedUser.bio, skills: updatedUser.skills,
         githubLink: updatedUser.githubLink, linkedinLink: updatedUser.linkedinLink,
         avatar: updatedUser.avatar,
      }
    });

  } catch (error) {
    //console.error("Error uploading profile picture in controller:", error);
    if (error instanceof multer.MulterError) { // Specific Multer errors
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File is too large. Maximum 5MB allowed.' });
        }
        return res.status(400).json({ message: `File upload error: ${error.message}` });
    }
    if (error.message && error.message.includes('Images Only')) { // Custom error from checkFileType
        return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error during picture upload.' });
  }
};

// @desc    Delete user account (user deletes their own account)
// @route   DELETE /api/users/profile
// @access  Private
const deleteUserAccount = async (req, res) => {
  const userIdToDelete = req.user.id;
 // console.log(`Attempting to delete account for user: ${userIdToDelete}`);
  try {
    const user = await User.findById(userIdToDelete);
    if (!user) {
     // console.log(`User ${userIdToDelete} not found for deletion.`);
      return res.status(404).json({ message: 'User not found.' });
    }

    const ownedProjects = await Project.find({ owner: userIdToDelete });
    if (ownedProjects.length > 0) {
      //console.log(`User ${userIdToDelete} owns ${ownedProjects.length} projects. Deletion prevented.`);
      return res.status(400).json({ 
        message: `Cannot delete account. You own ${ownedProjects.length} project(s). Please transfer ownership or delete them first.` 
      });
    }

    //console.log(`Removing user ${userIdToDelete} from teams of projects they joined...`);
    const updateResult = await Project.updateMany(
      { teamMembers: userIdToDelete, owner: { $ne: userIdToDelete } },
      { $pull: { teamMembers: userIdToDelete } }
    );
    //console.log(`Removed from ${updateResult.modifiedCount} project teams.`);

    //console.log(`Deleting collaboration requests sent by user ${userIdToDelete}...`);
    const collabReqDel = await CollaborationRequest.deleteMany({ requester: userIdToDelete });
    //console.log(`Deleted ${collabReqDel.deletedCount} collaboration requests.`);

    //console.log(`Deleting invitations involving user ${userIdToDelete}...`);
    const inviteDel = await Invitation.deleteMany({ 
      $or: [{ inviter: userIdToDelete }, { invitee: userIdToDelete }] 
    });
    //console.log(`Deleted ${inviteDel.deletedCount} invitations.`);
    
    //console.log(`Deleting notifications for user ${userIdToDelete}...`);
    const notifDelUser = await Notification.deleteMany({ user: userIdToDelete });
    //console.log(`Deleted ${notifDelUser.deletedCount} notifications targeting the user.`);
    
    // Optionally cleanup ChatRoom memberships if Chat feature is implemented
    // await ChatRoom.updateMany(
    //     { members: userIdToDelete },
    //     { $pull: { members: userIdToDelete } }
    // );

    //console.log(`Deleting user document for ${userIdToDelete}...`);
    await user.deleteOne();

    //console.log(`User account ${userIdToDelete} deleted successfully.`);
    res.json({ message: 'Your account has been successfully deleted.' });

  } catch (error) {
    //console.error('Error deleting user account:', error);
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