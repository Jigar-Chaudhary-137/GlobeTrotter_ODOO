import api from './api';

export const adminService = {
  getAdminStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data?.data || response.data;
  },
};
