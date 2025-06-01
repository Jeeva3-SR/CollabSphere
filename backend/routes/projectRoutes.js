import express from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addTeamMember,
  removeTeamMember,
} from '../controllers/projectController.js';
import { protect } from '../middleware/authMiddleware.js';
import { check } from 'express-validator';


const router = express.Router();

router.post(
    '/',
    protect,
    [
        check('title', 'Title is required').not().isEmpty(),
        check('description', 'Description is required').not().isEmpty(),
    ],
    createProject
);
router.get('/',protect, getProjects); 
router.get('/:id', protect,getProjectById); 
router.put('/:id', protect, updateProject);
router.delete('/:id', protect, deleteProject); 

router.post('/:projectId/team', protect, addTeamMember); 
router.delete(
    '/:projectId/team/:memberIdToRemove', 
    protect,                           
    removeTeamMember                     
);

export default router;