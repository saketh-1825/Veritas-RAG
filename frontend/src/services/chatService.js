import apiClient from './apiClient';

export const chatService = {
  async sendMessage(message, documentId = null, topK = 4) {
    const payload = {
      message,
      document_id: documentId || null,
      top_k: topK,
    };
    const response = await apiClient.post('/api/chat', payload);
    return response.data;
  },
};

export default chatService;
