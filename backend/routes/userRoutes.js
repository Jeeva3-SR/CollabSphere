import express from 'express';
import multer from 'multer';
import path from 'path';
import {
    getUserProfile,
    updateUserProfile,
    getAllUsers,
    uploadUserProfilePicture,
    deleteUserAccount   
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/'); 
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

router.get('/', protect, getAllUsers);
router.put('/profile', protect, updateUserProfile);    
router.delete('/profile', protect, deleteUserAccount);  

router.post(
    '/profile/picture',  
    protect,             
    upload.single('profilePic'), 
                                 
    uploadUserProfilePicture  
);

router.get('/:userId', getUserProfile);

export default router;