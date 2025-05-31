import api from './api';

// === Collaboration Requests (User wants to join a project) ===
export const sendCollaborationRequest = async (projectId, data = { message: '' }) => {
  // data can include an optional message from the requester
  const response = await api.post(`/collaborations/request/${projectId}`, data);
  return response.data; // The created collaboration request object
};

export const getReceivedCollaborationRequests = async () => {
  // Fetches requests for projects owned by the current user
  const response = await api.get('/collaborations/requests/received');
  return response.data; // Array of collaboration request objects
};

export const getSentCollaborationRequests = async () => {
  // Fetches requests sent by the current user
  const response = await api.get('/collaborations/requests/sent');
  return response.data; // Array of collaboration request objects
};

export const respondToCollaborationRequest = async (requestId, status) => {
  // status should be 'Accepted' or 'Rejected'
  const response = await api.put(`/collaborations/request/${requestId}/respond`, { status });
  return response.data; // Updated collaboration request object
};

// === Invitations (Project owner invites a user) ===
export const sendInvitation = async (projectId, userIdToInvite, data = { message: '' }) => {
  // data can include an optional message from the inviter
  const response = await api.post(`/collaborations/invite/${projectId}/${userIdToInvite}`, data);
  return response.data; // The created invitation object
};

export const getReceivedInvitations = async () => {
  // Fetches invitations received by the current user
  const response = await api.get('/collaborations/invitations/received');
  return response.data; // Array of invitation objects
};

export const getSentInvitations = async () => {
  // Fetches invitations sent by the current user (or for their projects)
  const response = await api.get('/collaborations/invitations/sent');
  return response.data; // Array of invitation objects
};

export const respondToInvitation = async (invitationId, status) => {
  // status should be 'Accepted' or 'Declined'
  const response = await api.put(`/collaborations/invitation/${invitationId}/respond`, { status });
  return response.data; // Updated invitation object
};