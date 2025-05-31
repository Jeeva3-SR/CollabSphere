import api from './api';

export const getChatRoomForProject = async (projectId) => {
    const response = await api.get(`/chat/room/${projectId}`);
    return response.data; // { _id, projectId, name, members: [user objects] }
};

export const getMessagesForChatRoom = async (chatRoomId, params = {}) => { // params for pagination
    const response = await api.get(`/chat/messages/${chatRoomId}`, { params });
    return response.data; // Array of messages, newest first from backend ideally
};

export const postChatMessage = async (chatRoomId, messageData) => { // messageData: { text: "..." }
    const response = await api.post(`/chat/messages/${chatRoomId}`, messageData);
    return response.data; // The newly created message object
};