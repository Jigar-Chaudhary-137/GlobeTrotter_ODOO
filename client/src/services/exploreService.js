import api from './api';

export const exploreService = {
  searchCities: async (query) => {
    const response = await api.get('/explore/cities', {
      params: { q: query }
    });
    return response.data;
  },

  searchActivities: async (city, category = '') => {
    const response = await api.get('/explore/activities', {
      params: { city, category }
    });
    return response.data;
  }
};
