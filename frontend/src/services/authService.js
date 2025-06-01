import api from './api';

export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data; 
};

export const loginUser = async (userData) => {
  const response = await api.post('/auth/login', userData);
  return response.data; 
};

export const getLoggedInUser = async () => {
  const response = await api.get('/auth/me');
  return response.data; 
};