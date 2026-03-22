import apiClient from './apiClient';

const MOCK_DOCS_CACHE = [
  {
    id: 'doc-001',
    filename: 'veritas_architecture_v1.pdf',
    size: 524288,
    processing_status: 'processed',
    chunk_count: 24,
    created_at: '2026-03-05T10:00:00Z',
  },
  {
    id: 'doc-002',
    filename: 'enterprise_security_compliance.txt',
    size: 148576,
    processing_status: 'processed',
    chunk_count: 8,
    created_at: '2026-03-06T12:30:00Z',
  },
];

export const documentService = {
  async listDocuments() {
    try {
      const response = await apiClient.get('/api/documents');
      return response.data;
    } catch (err) {
      if (!err.response) {
        return MOCK_DOCS_CACHE;
      }
      throw err;
    }
  },

  async uploadDocument(file, chunkSize = 1000, chunkOverlap = 200) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('chunk_size', String(chunkSize));
    formData.append('chunk_overlap', String(chunkOverlap));

    try {
      const response = await apiClient.post('/api/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (err) {
      if (!err.response) {
        const simulated = {
          id: `doc-${Date.now().toString().slice(-4)}`,
          filename: file.name,
          size: file.size,
          processing_status: 'processed',
          chunk_count: Math.max(4, Math.floor(file.size / 15000)),
          created_at: new Date().toISOString(),
        };
        MOCK_DOCS_CACHE.unshift(simulated);
        return simulated;
      }
      throw err;
    }
  },

  async getDocument(id) {
    const response = await apiClient.get(`/api/documents/${id}`);
    return response.data;
  },

  async deleteDocument(id) {
    try {
      const response = await apiClient.delete(`/api/documents/${id}`);
      return response.data;
    } catch (err) {
      if (!err.response) {
        const idx = MOCK_DOCS_CACHE.findIndex(d => d.id === id);
        if (idx !== -1) MOCK_DOCS_CACHE.splice(idx, 1);
        return { message: 'Document deleted (offline simulation)', id };
      }
      throw err;
    }
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
