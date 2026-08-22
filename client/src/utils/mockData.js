export const MOCK_CITIES = [
  {
    id: 'paris',
    name: 'Paris',
    country: 'France',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
    description: 'The City of Light is a global center for art, fashion, gastronomy, and culture.',
    lat: 48.8566,
    lon: 2.3522
  },
  {
    id: 'london',
    name: 'London',
    country: 'United Kingdom',
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
    description: 'A 21st-century city with history stretching back to Roman times.',
    lat: 51.5074,
    lon: -0.1278
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    country: 'Japan',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&w=800&q=80',
    description: 'Japan’s busy capital mixes ultra-modern skyscrapers with historic temples.',
    lat: 35.6762,
    lon: 139.6503
  },
  {
    id: 'dubai',
    name: 'Dubai',
    country: 'United Arab Emirates',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
    description: 'Known for luxury shopping, ultramodern architecture and a lively nightlife scene.',
    lat: 25.2048,
    lon: 55.2708
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    country: 'India',
    image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80',
    description: 'A financial powerhouse, fashion epicentre and a city with a heart of gold.',
    lat: 19.0760,
    lon: 72.8777
  },
  {
    id: 'new-york',
    name: 'New York',
    country: 'United States',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80',
    description: 'Home to the Empire State Building, Times Square, and Central Park.',
    lat: 40.7128,
    lon: -74.0060
  }
];

export const MOCK_ACTIVITIES = {
  paris: [
    { id: 'p1', name: 'Eiffel Tower Tour', category: 'Attractions', cost: 35, time: '09:00', duration: '2h', rating: 4.8 },
    { id: 'p2', name: 'Louvre Museum Guided Visit', category: 'Culture/Museums', cost: 45, time: '13:00', duration: '3h', rating: 4.7 },
    { id: 'p3', name: 'Seine River Dinner Cruise', category: 'Entertainment', cost: 85, time: '19:30', duration: '2.5h', rating: 4.6 },
    { id: 'p4', name: 'Notre-Dame Cathedral Walk', category: 'Attractions', cost: 0, time: '16:30', duration: '1h', rating: 4.5 },
    { id: 'p5', name: 'Lunch at Cafe de Flore', category: 'Food/Restaurants', cost: 25, time: '12:00', duration: '1h', rating: 4.2 }
  ],
  london: [
    { id: 'l1', name: 'London Eye Flight', category: 'Attractions', cost: 40, time: '10:00', duration: '1h', rating: 4.6 },
    { id: 'l2', name: 'British Museum Exploration', category: 'Culture/Museums', cost: 0, time: '11:30', duration: '2.5h', rating: 4.8 },
    { id: 'l3', name: 'Afternoon Tea at The Ritz', category: 'Food/Restaurants', cost: 75, time: '15:00', duration: '1.5h', rating: 4.7 },
    { id: 'l4', name: 'Westminster Abbey Guided Tour', category: 'Attractions', cost: 30, time: '09:00', duration: '2h', rating: 4.5 }
  ],
  tokyo: [
    { id: 't1', name: 'Shibuya Crossing & Hachiko', category: 'Attractions', cost: 0, time: '18:00', duration: '1h', rating: 4.5 },
    { id: 't2', name: 'Senso-ji Temple Visit', category: 'Culture/Museums', cost: 0, time: '09:30', duration: '1.5h', rating: 4.7 },
    { id: 't3', name: 'Sushi Making Workshop', category: 'Food/Restaurants', cost: 60, time: '12:00', duration: '2h', rating: 4.9 },
    { id: 't4', name: 'Robot Restaurant Show', category: 'Entertainment', cost: 70, time: '20:00', duration: '2h', rating: 4.3 }
  ],
  dubai: [
    { id: 'd1', name: 'Burj Khalifa Observation Deck', category: 'Attractions', cost: 50, time: '16:00', duration: '2h', rating: 4.7 },
    { id: 'd2', name: 'Desert Safari with BBQ Dinner', category: 'Entertainment', cost: 80, time: '15:30', duration: '6h', rating: 4.8 },
    { id: 'd3', name: 'Dubai Mall & Fountain Show', category: 'Attractions', cost: 0, time: '19:30', duration: '2h', rating: 4.6 }
  ],
  mumbai: [
    { id: 'm1', name: 'Gateway of India Walk', category: 'Attractions', cost: 0, time: '09:00', duration: '1h', rating: 4.6 },
    { id: 'm2', name: 'Chhatrapati Shivaji Museum', category: 'Culture/Museums', cost: 10, time: '11:00', duration: '2h', rating: 4.5 },
    { id: 'm3', name: 'Street Food Tour at Chowpatty', category: 'Food/Restaurants', cost: 15, time: '18:30', duration: '2h', rating: 4.7 }
  ],
  'new-york': [
    { id: 'ny1', name: 'Empire State Building Entry', category: 'Attractions', cost: 44, time: '09:00', duration: '1.5h', rating: 4.7 },
    { id: 'ny2', name: 'Metropolitan Museum of Art', category: 'Culture/Museums', cost: 25, time: '11:30', duration: '3h', rating: 4.8 },
    { id: 'ny3', name: 'Broadway Show Ticket', category: 'Entertainment', cost: 120, time: '19:00', duration: '2.5h', rating: 4.6 },
    { id: 'ny4', name: 'Central Park Biking Tour', category: 'Entertainment', cost: 30, time: '15:00', duration: '2h', rating: 4.4 }
  ]
};

export const MOCK_TRIPS = [
  {
    id: 'trip-1',
    name: 'Summer European Tour',
    startDate: '2026-07-10',
    endDate: '2026-07-20',
    budget: 3500,
    isPublic: true,
    user: {
      name: 'Sarah Connor',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&h=80&q=80'
    },
    stops: [
      { id: 'stop-1', city: 'Paris', country: 'France', arrivalDate: '2026-07-10', departureDate: '2026-07-15', durationDays: 5, order: 0 },
      { id: 'stop-2', city: 'London', country: 'United Kingdom', arrivalDate: '2026-07-15', departureDate: '2026-07-20', durationDays: 5, order: 1 }
    ],
    itinerary: [
      { id: 'item-1', stopId: 'stop-1', date: '2026-07-10', time: '09:00', activityName: 'Eiffel Tower Tour', category: 'Attractions', cost: 35, notes: 'Pre-booked online ticket' },
      { id: 'item-2', stopId: 'stop-1', date: '2026-07-10', time: '13:00', activityName: 'Louvre Museum', category: 'Culture/Museums', cost: 45, notes: 'Focus on Mona Lisa and wing of victory' },
      { id: 'item-3', stopId: 'stop-1', date: '2026-07-11', time: '19:30', activityName: 'Seine River Cruise', category: 'Entertainment', cost: 85, notes: 'Includes 3-course French dinner' },
      { id: 'item-4', stopId: 'stop-2', date: '2026-07-16', time: '10:00', activityName: 'London Eye', category: 'Attractions', cost: 40, notes: 'Amazing views of the Thames' },
      { id: 'item-5', stopId: 'stop-2', date: '2026-07-17', time: '15:00', activityName: 'Afternoon Tea at Ritz', category: 'Food/Restaurants', cost: 75, notes: 'Formal attire required' }
    ],
    expenses: [
      { id: 'exp-1', category: 'Transport', amount: 450, description: 'Eurostar Paris to London' },
      { id: 'exp-2', category: 'Accommodation', amount: 1200, description: 'Airbnb & Hotel bookings' },
      { id: 'exp-3', category: 'Activities', amount: 280, description: 'Pre-booked attraction tickets' },
      { id: 'exp-4', category: 'Meals', amount: 400, description: 'Estimated dinners and breakfasts' },
      { id: 'exp-5', category: 'Other', amount: 150, description: 'Souvenirs and emergency cash' }
    ]
  },
  {
    id: 'trip-2',
    name: 'Asian Modernity Discovery',
    startDate: '2026-09-01',
    endDate: '2026-09-10',
    budget: 2000,
    isPublic: false,
    user: {
      name: 'Alex Mercer',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&h=80&q=80'
    },
    stops: [
      { id: 'stop-3', city: 'Tokyo', country: 'Japan', arrivalDate: '2026-09-01', departureDate: '2026-09-06', durationDays: 5, order: 0 },
      { id: 'stop-4', city: 'Mumbai', country: 'India', arrivalDate: '2026-09-06', departureDate: '2026-09-10', durationDays: 4, order: 1 }
    ],
    itinerary: [
      { id: 'item-6', stopId: 'stop-3', date: '2026-09-02', time: '18:00', activityName: 'Shibuya Crossing Walk', category: 'Attractions', cost: 0, notes: 'Free activity' },
      { id: 'item-7', stopId: 'stop-3', date: '2026-09-03', time: '12:00', activityName: 'Sushi Masterclass', category: 'Food/Restaurants', cost: 60, notes: 'Learn to roll Maki' },
      { id: 'item-8', stopId: 'stop-4', date: '2026-09-07', time: '11:00', activityName: 'Gateway of India & Caves', category: 'Culture/Museums', cost: 15, notes: 'Ferry ride involved' }
    ],
    expenses: [
      { id: 'exp-6', category: 'Transport', amount: 800, description: 'Flights Tokyo to Mumbai' },
      { id: 'exp-7', category: 'Accommodation', amount: 650, description: 'Hotels in Tokyo and Mumbai' },
      { id: 'exp-8', category: 'Activities', amount: 75, description: 'Sushi making and museum entry' },
      { id: 'exp-9', category: 'Meals', amount: 200, description: 'Local ramen and street food' }
    ]
  }
];

export const MOCK_COMMUNITY_TRIPS = [
  {
    id: 'pub-1',
    name: 'Best of Paris and London in 10 Days',
    description: 'A comprehensive checklist tour designed for first-time European travelers. Covers major historical landmarks, museums, and food tours.',
    startDate: '2026-05-15',
    endDate: '2026-05-25',
    budget: 3000,
    user: {
      name: 'Elena Rostova',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&h=80&q=80',
      location: 'Prague, Czechia'
    },
    stops: [
      { city: 'Paris', country: 'France', durationDays: 5 },
      { city: 'London', country: 'United Kingdom', durationDays: 5 }
    ],
    itineraryCount: 8,
    estimatedCost: 2800,
    likes: 124
  },
  {
    id: 'pub-2',
    name: 'Arabian Night and Exotic Spices',
    description: 'Explore the high-tech skyline of Dubai and transition to the culture and history of Mumbai.',
    startDate: '2026-10-05',
    endDate: '2026-10-14',
    budget: 2500,
    user: {
      name: 'Raj Patel',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&h=80&q=80',
      location: 'San Jose, USA'
    },
    stops: [
      { city: 'Dubai', country: 'UAE', durationDays: 4 },
      { city: 'Mumbai', country: 'India', durationDays: 5 }
    ],
    itineraryCount: 5,
    estimatedCost: 1950,
    likes: 87
  }
];
