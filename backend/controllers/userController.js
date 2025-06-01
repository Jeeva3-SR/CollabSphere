import User from '../models/User.js';
import Project from '../models/Project.js';
import Notification from '../models/Notification.js';
import CollaborationRequest from '../models/CollaborationRequest.js'; 
import Invitation from '../models/Invitation.js'; 
import path from 'path'; 
import multer from 'multer';
const getUserProfile = async (req, res) => {
  //console.log(`Attempting to get profile for userId: ${req.params.userId}`);
  try {
    const user = await User.findById(req.params.userId)
      .select('-password') // Exclude password from populated user data
      .populate('createdProjects', 'title _id status isPublic') 
      .populate('joinedProjects', 'title _id status isPublic');  

    if (!user) {
    
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

const updateUserProfile = async (req, res) => {
  const { name, bio, skills, githubLink, linkedinLink, avatar } = req.body; 
  //console.log(`Attempting to update profile for user: ${req.user.id}`);
  //console.log('Received update data:', req.body);

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
     // console.log(`Profile updated for user: ${updatedUser._id}`);
      res.json({ // Return a clean user object
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
   // console.error(`Error updating profile for ${req.user.id}:`, err.message);
     if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({ message: "Validation Error", errors: messages });
    }
    res.status(500).send('Server error');
  }
};

const getAllUsers = async (req, res) => {
  //console.log("Attempting to get all users.");
  try {
    const users = await User.find({}).select('-password -createdProjects -joinedProjects'); // Exclude sensitive/large fields by default
    res.json(users);
  } catch (err) {
    //console.error("Error in getAllUsers:", err.message);
    res.status(500).send('Server Error');
  }
};

const uploadUserProfilePicture = async (req, res) => {
 
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
    if (error.message && error.message.includes('Images Only')) {
        return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error during picture upload.' });
  }
};


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