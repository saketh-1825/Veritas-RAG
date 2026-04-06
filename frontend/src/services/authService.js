import apiClient from './apiClient';

export const authService = {
  async login(email, password) {
    const response = await apiClient.post('/api/auth/login', { email, password });
    return response.data;
  },

  async register(email, username, password) {
    const response = await apiClient.post('/api/auth/register', { email, username, password });
    return response.data;
  },

  async getMe() {
    const token = localStorage.getItem('rag_token');
    if (!token) return null;
    const response = await apiClient.get('/api/auth/me');
    return response.data;
  },

  logout() {
    localStorage.removeItem('rag_token');
  },
};

export default authService;
