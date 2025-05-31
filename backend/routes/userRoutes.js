// backend/routes/userRoutes.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import {
    getUserProfile,
    updateUserProfile,
    getAllUsers,
    uploadUserProfilePicture, // <<< Make sure this is imported
    deleteUserAccount        // <<< Make sure this is imported if you have it
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// --- Multer Configuration ---
const storage = multer.diskStorage({
  destination(req, file, cb) {
    // The 'uploads' folder should be in your 'backend' directory,
    // and your server.js should be configured to serve it.
    cb(null, 'uploads/'); // This path is relative to where your Node.js process starts.
                         // If server.js is in backend/, and uploads/ is in backend/, this is fine.
  },
  filename(req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    // Pass an error to Multer if file type is invalid
    cb(new Error('Images Only! (jpeg, jpg, png, gif, webp)'));
  }
}

const upload = multer({
  storage: storage,
  fileFilter: function(req, file, cb) {
    checkFileType(file, cb);
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});
// --- End Multer Configuration ---


// Existing User Routes
router.get('/', protect, getAllUsers);
router.put('/profile', protect, updateUserProfile);       // For text-based profile updates
router.delete('/profile', protect, deleteUserAccount);   // For deleting user's own account

// --- Profile Picture Upload Route ---
// This route MUST exist and be correctly defined
// It handles POST requests to /api/users/profile/picture
router.post(
    '/profile/picture',    // Path matches frontend call: /api/users/profile/picture
    protect,               // Ensures user is authenticated
    upload.single('profilePic'), // Multer middleware for single file upload
                                 // 'profilePic' is the field name from FormData
    uploadUserProfilePicture   // Controller function to handle the logic
);

// This route should generally be last if it has a parameter, to avoid conflicts
router.get('/:userId', getUserProfile);

export default router;