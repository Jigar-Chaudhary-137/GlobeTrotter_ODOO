import api from './api';

export const tripService = {
  // Trip CRUDS
  getTrips: async () => {
    const response = await api.get('/trips');
    return response.data;
  },

  getTripById: async (id) => {
    const response = await api.get(`/trips/${id}`);
    return response.data;
  },

  createTrip: async (tripData) => {
    const response = await api.post('/trips', tripData);
    return response.data;
  },

  updateTrip: async (id, tripData) => {
    const response = await api.put(`/trips/${id}`, tripData);
    return response.data;
  },

  deleteTrip: async (id) => {
    const response = await api.delete(`/trips/${id}`);
    return response.data;
  },

  // Trip Stops (Multi-city destinations)
  addStop: async (tripId, stopData) => {
    const response = await api.post(`/trips/${tripId}/stops`, stopData);
    return response.data;
  },

  updateStop: async (tripId, stopId, stopData) => {
    const response = await api.put(`/trips/${tripId}/stops/${stopId}`, stopData);
    return response.data;
  },

  deleteStop: async (tripId, stopId) => {
    const response = await api.delete(`/trips/${tripId}/stops/${stopId}`);
    return response.data;
  },

  // Itinerary (Day-wise activities)
  addItineraryItem: async (tripId, itemData) => {
    const response = await api.post(`/trips/${tripId}/itinerary`, itemData);
    return response.data;
  },

  updateItineraryItem: async (tripId, itemId, itemData) => {
    const response = await api.put(`/trips/${tripId}/itinerary/${itemId}`, itemData);
    return response.data;
  },

  deleteItineraryItem: async (tripId, itemId) => {
    const response = await api.delete(`/trips/${tripId}/itinerary/${itemId}`);
    return response.data;
  },

  // Public operations
  publishTrip: async (tripId, isPublic = true) => {
    const response = await api.put(`/trips/${tripId}`, { isPublic });
    return response.data;
  },

  copyTrip: async (tripId) => {
    const response = await api.post(`/trips/${tripId}/copy`);
    return response.data;
  }
};
