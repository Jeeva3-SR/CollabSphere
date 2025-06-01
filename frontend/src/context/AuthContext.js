import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import jwt_decode from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

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
    navigate('/login');
  }, [navigate, setAuthToken]);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwt_decode(token);
        if (decoded.exp * 1000 < Date.now()) {
          logout();
          return;
        }
        setAuthToken(token);
        const res = await apiClient.get('/auth/me');
        setUser(res.data);
      } catch (err) {
        logout(); 
      }
    }
    setLoading(false); 
  }, [logout, setAuthToken]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const register = async (userData) => {
    setError(null); 
    try {
      const res = await apiClient.post('/auth/register', userData);
      if (res.data && res.data.token) {
        setAuthToken(res.data.token);
        setUser(res.data); 
        return { success: true, data: res.data };
      } else {
        const errorMessage = 'Registration failed: Invalid response from server.';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed.';
      setError(errorMessage); 
      setAuthToken(null);
      return { success: false, error: errorMessage };
    }
  };

  const login = async (userData) => {
    setError(null); 
    try {
      const res = await apiClient.post('/auth/login', userData);
      if (res.data && res.data.token) {
        setAuthToken(res.data.token);
        setUser(res.data);
        return { success: true, data: res.data };
      } else {
        const errorMessage = 'Login failed: Invalid response from server.';
        setError(errorMessage); 
        return { success: false, error: errorMessage };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(errorMessage); 
      setAuthToken(null);
      return { success: false, error: errorMessage };
    }
  };
  
  const updateUserContext = (updatedUserData) => {
    setUser(prevUser => ({ ...prevUser, ...updatedUserData }));
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, error, setError, register, login, logout, loadUser, setAuthToken, updateUserContext }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};