// backend/routes/taskRoutes.js
import express from 'express';
import {
    createTask,
    getTasksForProject,
    updateTask,
    deleteTask,
    submitTaskForReview, // <<< NEW CONTROLLER FUNCTION
    approveTask,         // <<< NEW CONTROLLER FUNCTION
    rejectTask           // <<< NEW CONTROLLER FUNCTION
} from '../controllers/taskController.js';
import { protect } from '../middleware/authMiddleware.js'; // Assuming you have auth middleware

const router = express.Router();

router.route('/')
    .post(protect, createTask); // Your existing create route

router.route('/project/:projectId')
    .get(protect, getTasksForProject); // Your existing get tasks route

router.route('/:taskId')
    .put(protect, updateTask)    // Your existing update route
    .delete(protect, deleteTask); // Your existing delete route

// --- NEW ROUTES FOR REVIEW WORKFLOW ---
router.route('/:taskId/submit-review')
    .post(protect, submitTaskForReview); // POST to submit for review

router.route('/:taskId/approve-review')
    .post(protect, approveTask);       // POST to approve

router.route('/:taskId/reject-review')
    .post(protect, rejectTask);        // POST to reject (might include a body for reason)

export default router;