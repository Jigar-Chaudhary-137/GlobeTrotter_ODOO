/**
 * Explore Controller for GlobeTrotter
 * Combines Member 2 popular/curated catalog with Member 3 live Geoapify/OpenMeteo services
 */

const { searchDestinations } = require('../services/travel/destinationService');
const { searchActivities: searchActivitiesService } = require('../services/travel/activityService');
const { getRecommendedPlaces } = require('../services/travel/recommendationService');
const { successResponse, errorResponse } = require('../utils/responseHandler');

// Member 2: Popular destinations catalog for instant fallback lookup
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

// Member 2: Curated activities catalog for fallback lookup
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

/**
 * GET /api/explore/cities
 * Query parameters: q, query, city, limit
 */
async function getDestinationsHandler(req, res, next) {
  try {
    const rawQuery = req.query.q || req.query.query || req.query.city || '';
    const limit = parseInt(req.query.limit, 10) || 10;
    const cleanQuery = rawQuery.trim();

    if (!cleanQuery) {
      return res.status(200).json({
        success: true,
        message: 'Popular destinations retrieved',
        count: POPULAR_DESTINATIONS.length,
        data: POPULAR_DESTINATIONS
      });
    }

    // Attempt live service search (Member 3)
    const destinations = await searchDestinations(cleanQuery, limit);

    if (destinations && destinations.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'Matching cities found',
        count: destinations.length,
        data: destinations
      });
    }

    // Fallback to static popular catalog filter (Member 2)
    const term = cleanQuery.toLowerCase();
    const filtered = POPULAR_DESTINATIONS.filter(
      (dest) => dest.name.toLowerCase().includes(term) || dest.country.toLowerCase().includes(term)
    );

    if (filtered.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'Matching cities found',
        count: filtered.length,
        data: filtered
      });
    }

    // Dynamic construct if query not found
    const dynamicCity = {
      id: term.replace(/\s+/g, '-'),
      name: cleanQuery.charAt(0).toUpperCase() + cleanQuery.slice(1),
      country: 'Global Destination',
      image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80',
      description: `Explore attractions, dining, and activities in ${cleanQuery}.`,
      category: 'Travel Destination',
      rating: 4.7,
      attractionsCount: 50,
    };

    return res.status(200).json({
      success: true,
      message: 'Search result generated',
      count: 1,
      data: [dynamicCity]
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/explore/activities
 * Query parameters: city, lat, lng, category, limit
 */
async function getActivitiesHandler(req, res, next) {
  try {
    const { city, lat, lng, category, limit } = req.query;

    if (!city && (!lat || !lng)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either a city name or latitude and longitude coordinates.'
      });
    }

    // Attempt live service search (Member 3)
    const activities = await searchActivitiesService({
      city,
      lat: lat ? parseFloat(lat) : undefined,
      lng: lng ? parseFloat(lng) : undefined,
      category: category || 'all',
      limit: parseInt(limit, 10) || 20
    });

    if (activities && activities.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'Activities retrieved successfully',
        count: activities.length,
        data: activities
      });
    }

    // Fallback to static curated catalog (Member 2)
    const cityKey = (city || 'paris').toLowerCase();
    let catalog = CURATED_ACTIVITIES[cityKey] || [
      { id: 'g1', title: `${city || 'City'} Landmark Tour`, category: 'Attractions', time: '10:00', duration: '2 hrs', estimatedExpense: 20, rating: 4.7, image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=500&q=80' },
      { id: 'g2', title: `Local Culinary Experience`, category: 'Restaurants', time: '13:00', duration: '1.5 hrs', estimatedExpense: 35, rating: 4.8, image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=500&q=80' },
    ];

    if (category && category !== 'All' && category !== 'all') {
      catalog = catalog.filter((act) => act.category.toLowerCase() === category.toLowerCase());
    }

    return res.status(200).json({
      success: true,
      message: 'Activities retrieved successfully',
      count: catalog.length,
      data: catalog
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/explore/recommendations
 * Query parameters: city, lat, lng
 */
async function getRecommendationsHandler(req, res, next) {
  try {
    const { city, lat, lng } = req.query;

    if (!city && (!lat || !lng)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a city name or latitude and longitude for recommendations.'
      });
    }

    const recommendations = await getRecommendedPlaces({
      city,
      lat: lat ? parseFloat(lat) : undefined,
      lng: lng ? parseFloat(lng) : undefined
    });

    return res.status(200).json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDestinationsHandler,
  getActivitiesHandler,
  getRecommendationsHandler,
  searchCities: getDestinationsHandler,
  searchActivities: getActivitiesHandler,
};

