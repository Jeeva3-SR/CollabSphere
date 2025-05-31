import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional: Interceptor to handle 401 errors (e.g., token expired)
// This is a basic example. You might want to integrate this with AuthContext's logout.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized access
      // e.g., localStorage.removeItem('token'); window.location.href = '/login';
      // This needs careful handling to avoid infinite loops if /login itself fails or is the source of 401.
      // It's often better to let AuthContext handle the logout logic upon detecting an invalid token
      // or by checking the error in the calling service function.
      console.error("API request unauthorized (401). Token might be invalid or expired.");
      // Consider triggering a global logout event or directly calling logout from AuthContext if possible.
      // For now, just rejecting to let the caller handle it.
    }
    return Promise.reject(error);
  }
);

export default api;