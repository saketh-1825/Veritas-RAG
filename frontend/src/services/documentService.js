import apiClient from './apiClient';

export const documentService = {
  async listDocuments() {
    const response = await apiClient.get('/api/documents');
    return response.data;
  },

  async uploadDocument(file, chunkSize = 1000, chunkOverlap = 200) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('chunk_size', String(chunkSize));
    formData.append('chunk_overlap', String(chunkOverlap));

    const response = await apiClient.post('/api/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getDocument(id) {
    const response = await apiClient.get(`/api/documents/${id}`);
    return response.data;
  },

  async deleteDocument(id) {
    const response = await apiClient.delete(`/api/documents/${id}`);
    return response.data;
  },

  async reprocessDocument(id, chunkSize = 1000, chunkOverlap = 200) {
    const response = await apiClient.post(`/api/documents/${id}/reprocess`, {
      chunk_size: chunkSize,
      chunk_overlap: chunkOverlap,
    });
    return response.data;
  },
};

export default documentService;
