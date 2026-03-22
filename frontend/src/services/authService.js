import apiClient from './apiClient';

export const authService = {
  async login(email, password) {
    try {
      const response = await apiClient.post('/api/auth/login', { email, password });
      return response.data;
    } catch (err) {
      // If network unreachable, allow graceful simulation for demo
      if (!err.response && localStorage.getItem('veritas_offline_fallback') === 'true') {
        const mockUser = {
          id: 'user-mock-1',
          email,
          username: email.split('@')[0] || 'demo_user',
          role: email.toLowerCase().includes('admin') ? 'admin' : 'user',
          is_active: true,
        };
        return {
          access_token: `mock_token_${Date.now()}`,
          token_type: 'bearer',
          user: mockUser,
        };
      }
      throw err;
    }
  },

  async register(email, username, password) {
    try {
      const response = await apiClient.post('/api/auth/register', { email, username, password });
      return response.data;
    } catch (err) {
      if (!err.response && localStorage.getItem('veritas_offline_fallback') === 'true') {
        const mockUser = {
          id: 'user-mock-2',
          email,
          username,
          role: email.toLowerCase().includes('admin') ? 'admin' : 'user',
          is_active: true,
        };
        return {
          access_token: `mock_token_${Date.now()}`,
          token_type: 'bearer',
          user: mockUser,
        };
      }
      throw err;
    }
  },

  async getMe() {
    const token = localStorage.getItem('rag_token');
    if (!token) return null;
    if (token.startsWith('mock_')) {
      return {
        username: 'veritas_analyst',
        email: 'analyst@veritas.ai',
        role: 'admin',
        is_active: true,
      };
    }
    const response = await apiClient.get('/api/auth/me');
    return response.data;
  },

  logout() {
    localStorage.removeItem('rag_token');
  },
};

export default authService;
