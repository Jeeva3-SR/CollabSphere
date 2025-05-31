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
router.get('/',protect, getProjects); // Can be public for feed, or protect for user-specific queries
router.get('/:id', protect,getProjectById); // Access control within controller
router.put('/:id', protect, updateProject); // Owner only - checked in controller
router.delete('/:id', protect, deleteProject); // Owner only - checked in controller

// Team Management specific to a project
router.post('/:projectId/team', protect, addTeamMember); // Owner only (simplified for now)
router.delete(
    '/:projectId/team/:memberIdToRemove', // <<< CRITICAL: Path with parameters
    protect,                              // <<< User must be authenticated
    removeTeamMember                      // <<< Controller function to handle it
); // Owner or self

export default router;