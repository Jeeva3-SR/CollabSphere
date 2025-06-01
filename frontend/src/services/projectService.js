
import api from './api';

export const createProject = async (projectData) => {
  const response = await api.post('/projects', projectData);
  return response.data;
};

export const getProjects = async (params = {}) => {
  //console.log("SERVICE (getProjects): Calling API with params:", params); 
  const response = await api.get('/projects', { params });
  return response.data;
};

export const getProjectById = async (projectId) => {
  //console.log(`SERVICE (getProjectById): Fetching project with ID: ${projectId}`); 
  const response = await api.get(`/projects/${projectId}`);
  return response.data;
};

export const updateProject = async (projectId, projectData) => {
  const response = await api.put(`/projects/${projectId}`, projectData);
  return response.data;
};

export const deleteProject = async (projectId) => {
  const response = await api.delete(`/projects/${projectId}`);
  return response.data;
};

export const addTeamMemberToProject = async (projectId, userId) => {
  const response = await api.post(`/projects/${projectId}/team`, { userId });
  return response.data;
};

export const removeTeamMember = async (projectId, memberIdToRemove) => {
  //console.log(`SERVICE (removeTeamMember): Attempting to remove member ${memberIdToRemove} from project ${projectId}`);
  try {
    const response = await api.delete(`/projects/${projectId}/team/${memberIdToRemove}`);
    //console.log(`SERVICE (removeTeamMember): API Response for remove:`, response.data);
    return response.data; 
  } catch (error) {
    //console.error(`SERVICE (removeTeamMember): API Error removing member ${memberIdToRemove} from project ${projectId}:`, error.response?.data || error.message);
    throw error;
  }
};

