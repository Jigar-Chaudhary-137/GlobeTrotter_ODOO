const { successResponse, errorResponse } = require('../utils/responseHandler');

// Popular destinations catalog for instant high-speed lookup
const POPULAR_DESTINATIONS = [
  {
    id: 'paris',
    name: 'Paris',
    country: 'France',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
    description: 'The City of Light, famous for the Eiffel Tower, world-class cuisine, and art museums.',
    category: 'Cultural',
    rating: 4.9,
    attractionsCount: 142,
  },
  {
    id: 'london',
    name: 'London',
    country: 'United Kingdom',
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
    description: 'Iconic capital blending royal history, modern arts, vibrant theater, and historic landmarks.',
    category: 'Historical',
    rating: 4.8,
    attractionsCount: 185,
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    country: 'Japan',
    image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
    description: 'A dazzling metropolis combining futuristic skyscrapers, historic temples, and legendary food.',
    category: 'Metropolitan',
    rating: 4.95,
    attractionsCount: 210,
  },
  {
    id: 'dubai',
    name: 'Dubai',
    country: 'United Arab Emirates',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
    description: 'Luxury destination known for ultramodern architecture, desert safaris, and shopping mega-malls.',
    category: 'Luxury',
    rating: 4.85,
    attractionsCount: 110,
  },
  {
    id: 'newyork',
    name: 'New York',
    country: 'United States',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80',
    description: 'The Big Apple featuring Times Square, Central Park, Broadway, and diverse global culture.',
    category: 'Urban',
    rating: 4.8,
    attractionsCount: 250,
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    country: 'India',
    image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80',
    description: 'Financial hub of India home to Bollywood, Gateway of India, colonial architecture, and street food.',
    category: 'Cultural',
    rating: 4.7,
    attractionsCount: 95,
  },
];

const CURATED_ACTIVITIES = {
  paris: [
    { id: 'p1', title: 'Eiffel Tower Summit Tour', category: 'Attractions', time: '09:00', duration: '2.5 hrs', estimatedExpense: 35, rating: 4.9, image: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=500&q=80' },
    { id: 'p2', title: 'Louvre Museum Guided Walk', category: 'Museums', time: '13:00', duration: '3 hrs', estimatedExpense: 25, rating: 4.95, image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=500&q=80' },
    { id: 'p3', title: 'Seine River Evening Cruise', category: 'Entertainment', time: '19:30', duration: '1.5 hrs', estimatedExpense: 40, rating: 4.8, image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=500&q=80' },
  ],
  london: [
    { id: 'l1', title: 'Tower of London & Crown Jewels', category: 'Historical', time: '10:00', duration: '2 hrs', estimatedExpense: 30, rating: 4.8, image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=500&q=80' },
    { id: 'l2', title: 'British Museum Highlight Tour', category: 'Museums', time: '14:00', duration: '2.5 hrs', estimatedExpense: 0, rating: 4.9, image: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=500&q=80' },
  ],
  tokyo: [
    { id: 't1', title: 'Senso-ji Temple & Asakusa Walk', category: 'Cultural', time: '09:30', duration: '2 hrs', estimatedExpense: 10, rating: 4.9, image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=500&q=80' },
    { id: 't2', title: 'Shibuya Crossing & Harajuku', category: 'Shopping', time: '15:00', duration: '3 hrs', estimatedExpense: 50, rating: 4.85, image: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=500&q=80' },
  ],
};

// GET /api/explore/cities
const searchCities = async (req, res, next) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length === 0) {
      return successResponse(res, 200, 'Popular destinations retrieved', POPULAR_DESTINATIONS);
    }

    const term = query.toLowerCase().trim();
    const filtered = POPULAR_DESTINATIONS.filter(
      (dest) => dest.name.toLowerCase().includes(term) || dest.country.toLowerCase().includes(term)
    );

    // Dynamic result construct if query not in hardcoded set
    if (filtered.length === 0) {
      const dynamicCity = {
        id: term.replace(/\s+/g, '-'),
        name: term.charAt(0).toUpperCase() + term.slice(1),
        country: 'Global Destination',
        image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80',
        description: `Explore attractions, dining, and activities in ${term}.`,
        category: 'Travel Destination',
        rating: 4.7,
        attractionsCount: 50,
      };
      return successResponse(res, 200, 'Search result generated', [dynamicCity]);
    }

    return successResponse(res, 200, 'Matching cities found', filtered);
  } catch (error) {
    next(error);
  }
};

// GET /api/explore/activities
const searchActivities = async (req, res, next) => {
  try {
    const { city, category } = req.query;
    const cityKey = (city || 'paris').toLowerCase();

    let activities = CURATED_ACTIVITIES[cityKey] || [
      { id: 'g1', title: `${city || 'City'} Landmark Tour`, category: 'Attractions', time: '10:00', duration: '2 hrs', estimatedExpense: 20, rating: 4.7, image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=500&q=80' },
      { id: 'g2', title: `Local Culinary Experience`, category: 'Restaurants', time: '13:00', duration: '1.5 hrs', estimatedExpense: 35, rating: 4.8, image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=500&q=80' },
    ];

    if (category && category !== 'All') {
      activities = activities.filter((act) => act.category.toLowerCase() === category.toLowerCase());
    }

    return successResponse(res, 200, 'Activities retrieved successfully', activities);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchCities,
  searchActivities,
};
