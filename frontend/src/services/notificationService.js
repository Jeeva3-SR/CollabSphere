import api from './api';

export const getNotifications = async () => {
  const response = await api.get('/notifications');
  return response.data; // Array of notification objects for the logged-in user
};

export const markNotificationsAsRead = async (notificationIds = []) => {
  // If notificationIds is an empty array, the backend should mark ALL unread notifications as read for the user.
  // If it contains IDs, only those specific notifications are marked.
  const response = await api.put('/notifications/read', { notificationIds });
  return response.data; // Usually a confirmation { message, modifiedCount }
};

// Note: Creating notifications is typically a backend-driven process triggered by actions
// (e.g., a new request, an accepted invitation). The frontend receives them via Socket.IO.
// There usually isn't a direct frontend service to *create* a generic notification.