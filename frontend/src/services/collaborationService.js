import api from './api';

export const sendCollaborationRequest = async (projectId, data = { message: '' }) => {
  const response = await api.post(`/collaborations/request/${projectId}`, data);
  return response.data; 
};

export const getReceivedCollaborationRequests = async () => {
  const response = await api.get('/collaborations/requests/received');
  return response.data; 
};

export const getSentCollaborationRequests = async () => {
  const response = await api.get('/collaborations/requests/sent');
  return response.data; 
};

export const respondToCollaborationRequest = async (requestId, status) =>{
  const response = await api.put(`/collaborations/request/${requestId}/respond`, { status });
  return response.data; 
};


export const sendInvitation = async (projectId, userIdToInvite, data = { message: '' }) => {
  const response = await api.post(`/collaborations/invite/${projectId}/${userIdToInvite}`, data);
  return response.data;
};

export const getReceivedInvitations = async () => {

  const response = await api.get('/collaborations/invitations/received');
  return response.data; 
};

export const getSentInvitations = async () => {
  const response = await api.get('/collaborations/invitations/sent');
  return response.data; 
};

export const respondToInvitation = async (invitationId, status) => {
  const response = await api.put(`/collaborations/invitation/${invitationId}/respond`, { status });
  return response.data; 
};