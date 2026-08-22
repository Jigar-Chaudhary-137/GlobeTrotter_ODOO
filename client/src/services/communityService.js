import api from './api';

export const communityService = {
  getPublicTrips: async () => {
    const response = await api.get('/community');
    return response.data;
  },

  getPublicTripById: async (shareId) => {
    const response = await api.get(`/public/trips/${shareId}`);
    return response.data;
  },

  toggleLike: async (tripId) => {
    const response = await api.post(`/community/${tripId}/like`);
    return response.data;
  }
};
