import api from './api';

export const getUserProfileById = async (userId) => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};

export const updateUserProfile = async (profileData) => {
  const response = await api.put('/users/profile', profileData);
  return response.data;
};

export const getAllUsers = async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data;
};

export const deleteAccount = async (passwordData) => {
  const response = await api.delete('/users/profile/delete', { data: passwordData });
  return response.data;
};
