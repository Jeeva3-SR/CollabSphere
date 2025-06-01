import api from './api';

export const getChatRoomForProject = async (projectId) => {
    const response = await api.get(`/chat/room/${projectId}`);
    return response.data; 
};

export const getMessagesForChatRoom = async (chatRoomId, params = {}) => {
    const response = await api.get(`/chat/messages/${chatRoomId}`, { params });
    return response.data; 
};

export const postChatMessage = async (chatRoomId, messageData) => { 
    const response = await api.post(`/chat/messages/${chatRoomId}`, messageData);
    return response.data; 
};