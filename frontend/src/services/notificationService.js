import api from './api';

export const getNotifications = async () => {
  const response = await api.get('/notifications');
  return response.data; 
};

export const markNotificationsAsRead = async (notificationIds = []) => {
  const response = await api.put('/notifications/read', { notificationIds });
  return response.data; 
};
