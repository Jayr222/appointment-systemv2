import api from './authService';

export const messageService = {
  // Send a message
  sendMessage: async (data) => {
    const response = await api.post('/messages', data);
    return response.data;
  },

  // Get all conversations
  getConversations: async () => {
    const response = await api.get('/messages/conversations');
    return response.data;
  },

  // Get conversation with a specific user
  getConversation: async (userId) => {
    const response = await api.get(`/messages/conversation/${userId}`);
    return response.data;
  },

  // Get unread message count
  getUnreadCount: async () => {
    const response = await api.get('/messages/unread-count');
    return response.data;
  },

  // Mark messages as read
  markAsRead: async (messageIds) => {
    const response = await api.put('/messages/mark-read', { messageIds });
    return response.data;
  },

  // Get patients list (for doctors)
  getPatients: async () => {
    const response = await api.get('/messages/patients');
    return response.data;
  },

  // Get doctors list (for patients)
  getDoctors: async () => {
    const response = await api.get('/messages/doctors');
    return response.data;
  }
};

export default messageService;

