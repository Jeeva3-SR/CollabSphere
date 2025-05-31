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

// <<< --- ADD THIS FUNCTION --- >>>
export const uploadUserProfilePicture = async (formData) => {
  // formData will contain the file (e.g., formData.append('profilePic', file))
  const response = await api.post('/users/profile/picture', formData, {
    headers: {
      'Content-Type': 'multipart/form-data', // Crucial for file uploads
    },
  });
  return response.data; // Expected: { message, avatarUrl, user } from backend
};
