import apiClient from './apiClient';

export const adminService = {
  async getAnalytics() {
    const response = await apiClient.get('/api/admin/analytics');
    return response.data;
  },

  async listUsers() {
    const response = await apiClient.get('/api/admin/users');
    return response.data;
  },
};

export default adminService;
