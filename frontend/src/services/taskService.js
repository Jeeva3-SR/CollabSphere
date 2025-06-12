// src/services/taskService.js
import api from './api'; 

const API_BASE_URL = '/tasks'; 

export const getTasksForProject = async (projectId) => {
  const response = await api.get(`${API_BASE_URL}/project/${projectId}`);
  return response.data;
};

export const createTask = async (taskData) => {
  const response = await api.post(API_BASE_URL, taskData);
  return response.data;
};

export const updateTask = async (taskId, updateData) => {
  const response = await api.put(`${API_BASE_URL}/${taskId}`, updateData);
  return response.data;
};

export const deleteTask = async (taskId) => { 
  const response = await api.delete(`${API_BASE_URL}/${taskId}`);
  return response.data;
};

// --- NEW OR UPDATED SERVICE FUNCTION ---
export const submitTaskForReview = async (taskId) => {
  console.log(`SERVICE CALL: Submitting task ${taskId} for review.`);
  // This endpoint should trigger backend logic to set:
  // task.status = 'Review'
  // task.workflowStatus = 'submitted_for_review'
  // It might not need a request body if the action is implicit.
  // If it needs a body: await api.post(`${API_BASE_URL}/${taskId}/submit-review`, { someData });
  const response = await api.post(`${API_BASE_URL}/${taskId}/submit-review`); // Assuming a POST endpoint
  return response.data; // Backend MUST return the fully updated task object
};

export const approveReviewedTask = async (taskId) => {
  console.log(`SERVICE CALL: Approving task ${taskId}.`);
  // Backend: status='Done', workflowStatus='approved_completed'
  const response = await api.post(`${API_BASE_URL}/${taskId}/approve-review`);
  return response.data;
};

export const rejectReviewedTask = async (taskId, rejectionReason) => {
  console.log(`SERVICE CALL: Rejecting task ${taskId}`);
  // Backend: status='In Progress' (for owner), workflowStatus='rejected_by_owner', add comment
  const response = await api.post(`${API_BASE_URL}/${taskId}/reject-review`, { reason: rejectionReason });
  return response.data;
};