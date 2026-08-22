import api from './api';

export const communityService = {
  getPublicTrips: async () => {
    const response = await api.get('/community');
    return response.data;
  },

  getPublicTripById: async (shareId) => {
    const response = await api.get(`/public/trips/${shareId}`);
    return response.data;
  }
};
