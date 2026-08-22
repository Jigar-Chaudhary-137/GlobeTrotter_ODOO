import api from './api';

const mapItineraryItem = (item) => {
  if (!item) return null;
  return {
    id: item.id,
    stopId: item.tripStopId,
    dayNumber: item.dayNumber,
    date: item.date ? (typeof item.date === 'string' ? item.date.substring(0, 10) : new Date(item.date).toISOString().substring(0, 10)) : null,
    time: item.time,
    activityName: item.title,
    category: item.category ? (item.category.charAt(0).toUpperCase() + item.category.slice(1).toLowerCase()) : 'Activities',
    cost: item.expense,
    notes: item.description,
    location: item.location
  };
};

const mapTripResponse = (trip) => {
  if (!trip) return null;
  return {
    ...trip,
    name: trip.name || trip.title,
    budget: trip.budget || trip.totalBudget,
    itinerary: trip.itinerary || (trip.itineraryItems ? trip.itineraryItems.map(mapItineraryItem) : []),
    stops: trip.stops ? trip.stops.map(s => ({
      ...s,
      arrivalDate: s.arrivalDate ? s.arrivalDate.substring(0, 10) : '',
      departureDate: s.departureDate ? s.departureDate.substring(0, 10) : ''
    })) : []
  };
};

export const tripService = {
  // Trip CRUDS
  getTrips: async () => {
    const response = await api.get('/trips');
    const trips = response.data?.data || response.data || [];
    return trips.map(mapTripResponse);
  },

  getTripById: async (id) => {
    const response = await api.get(`/trips/${id}`);
    const trip = response.data?.data || response.data || response;
    return mapTripResponse(trip);
  },

  createTrip: async (tripData) => {
    const payload = {
      ...tripData,
      title: tripData.title || tripData.name,
      totalBudget: tripData.totalBudget !== undefined ? tripData.totalBudget : tripData.budget,
    };
    const response = await api.post('/trips', payload);
    const createdTrip = response.data?.data || response.data?.trip || response.data;
    return {
      ...response.data,
      trip: mapTripResponse(createdTrip) || createdTrip,
    };
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

  // Expenses
  getTripExpenses: async (tripId) => {
    const response = await api.get(`/trips/${tripId}/expenses`);
    return response.data;
  },

  addExpense: async (tripId, expenseData) => {
    const response = await api.post(`/trips/${tripId}/expenses`, expenseData);
    return response.data;
  },

  deleteExpense: async (tripId, expenseId) => {
    const response = await api.delete(`/trips/${tripId}/expenses/${expenseId}`);
    return response.data;
  },

  // Public operations
  publishTrip: async (tripId, isPublic = true) => {
    const response = await api.post(`/trips/${tripId}/publish`);
    return response.data;
  },

  copyTrip: async (shareId) => {
    const response = await api.post(`/public/trips/${shareId}/copy`);
    return response.data;
  }
};
