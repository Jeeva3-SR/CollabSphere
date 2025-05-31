import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios'; // Ensure axios is imported if not using the separate api.js
import jwt_decode from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

// Assuming your API URL is set in an environment variable
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Create an axios instance if you haven't set up a global one (like in api.js)
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const setAuthToken = useCallback((token) => {
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete apiClient.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null);
    setUser(null);
    // Clear any other sensitive state if necessary
    navigate('/login');
  }, [navigate, setAuthToken]);


  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwt_decode(token);
        if (decoded.exp * 1000 < Date.now()) {
         // console.log("Token expired, logging out.");
          logout();
          setLoading(false);
          return;
        }
        setAuthToken(token); // Set token for subsequent requests
        const res = await apiClient.get('/auth/me'); // Use apiClient
        setUser(res.data);
      } catch (err) {
        //console.error("Error loading user:", err.response?.data?.message || err.message);
        // If token is invalid or /auth/me fails, treat as logout
        logout();
      }
    }
    setLoading(false);
  }, [logout, setAuthToken]); // Added dependencies

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const register = async (userData) => {
    try {
      setError(null);
      setLoading(true);
      const res = await apiClient.post('/auth/register', userData); // Use apiClient
      setAuthToken(res.data.token);
      setUser(res.data); // The response should include user data without password and the token
      setLoading(false);
      // navigate('/dashboard'); // Navigation handled in component after successful registration
      return { success: true, data: res.data };
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed';
      setError(errorMessage);
      setLoading(false);
      setAuthToken(null); // Ensure token is cleared on failure
      return { success: false, error: errorMessage };
    }
  };

  const login = async (userData) => {
    try {
      setError(null);
      setLoading(true);
      const res = await apiClient.post('/auth/login', userData); // Use apiClient
      setAuthToken(res.data.token);
      setUser(res.data); // The response should include user data without password and the token
      setLoading(false);
      // navigate('/dashboard'); // Navigation handled in component after successful login
      return { success: true, data: res.data };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      setError(errorMessage);
      setLoading(false);
      setAuthToken(null); // Ensure token is cleared on failure
      return { success: false, error: errorMessage };
    }
  };

  const updateUserContext = (updatedUserData) => {
    setUser(prevUser => ({ ...prevUser, ...updatedUserData }));
  };


  return (
    <AuthContext.Provider value={{ user, setUser, loading, error, setError, register, login, logout, loadUser, setAuthToken, updateUserContext }}>
      {/* Render children only after initial loading is complete to avoid flicker or premature access */}
      {!loading && children}
    </AuthContext.Provider>
  );
};