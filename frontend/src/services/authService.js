import api from './api'; // Using the centralized api instance

export const registerUser = async (userData) => {
  // The try-catch for UI feedback (toast, setError) is better handled in the component or AuthContext
  // This service should just make the API call and return/throw.
  const response = await api.post('/auth/register', userData);
  return response.data; // Contains user object and token
};

export const loginUser = async (userData) => {
  const response = await api.post('/auth/login', userData);
  return response.data; // Contains user object and token
};

// This is to fetch the current user's data if a token exists (e.g., on page refresh)
export const getLoggedInUser = async () => {
  const response = await api.get('/auth/me');
  return response.data; // Contains user object
};