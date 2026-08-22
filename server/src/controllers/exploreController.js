/**
 * Explore Controller for GlobeTrotter
 * Member 3 Responsibility — Pure Dynamic Travel API Flow
 */

const { searchDestinations } = require('../services/travel/destinationService');
const { searchActivities: searchActivitiesService } = require('../services/travel/activityService');
const { getRecommendedPlaces } = require('../services/travel/recommendationService');

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
        message: 'Please provide a search query',
        count: 0,
        data: []
      });
    }

    // Dynamic search via primary Geoapify / secondary Nominatim live APIs
    const destinations = await searchDestinations(cleanQuery, limit);

    if (destinations && destinations.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'Destinations found',
        count: destinations.length,
        data: destinations
      });
    }

    return res.status(200).json({
      success: true,
      message: 'No destinations found',
      count: 0,
      data: []
    });
  } catch (error) {
    console.error('[Explore Controller Destination Error]:', error.message);
    return res.status(503).json({
      success: false,
      message: 'Travel data is temporarily unavailable',
      data: []
    });
  }
}

/**
 * GET /api/explore/activities
 * Query parameters: city, lat, lng, category, limit
 */
async function getActivitiesHandler(req, res, next) {
  try {
    const { city, lat, lng, category, limit } = req.query;

    if (!city && lat === undefined && lng === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either a city name or latitude and longitude coordinates.'
      });
    }

    // Validate coordinates if provided
    let parsedLat;
    let parsedLng;
    if (lat !== undefined || lng !== undefined) {
      parsedLat = parseFloat(lat);
      parsedLng = parseFloat(lng);
      if (isNaN(parsedLat) || isNaN(parsedLng) || parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) {
        return res.status(400).json({
          success: false,
          message: 'Invalid latitude or longitude coordinates provided.'
        });
      }
    }

    // Dynamic search via primary Geoapify / secondary Nominatim live APIs
    const activities = await searchActivitiesService({
      city: city ? String(city).trim() : undefined,
      lat: parsedLat,
      lng: parsedLng,
      category: category ? String(category).trim() : 'all',
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

    return res.status(200).json({
      success: true,
      message: 'No activities found for the specified location',
      count: 0,
      data: []
    });
  } catch (error) {
    console.error('[Explore Controller Activity Error]:', error.message);
    return res.status(503).json({
      success: false,
      message: 'Travel data is temporarily unavailable',
      data: []
    });
  }
}

/**
 * GET /api/explore/recommendations
 * Query parameters: city, lat, lng
 */
async function getRecommendationsHandler(req, res, next) {
  try {
    const { city, lat, lng } = req.query;

    if (!city && lat === undefined && lng === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a city name or latitude and longitude for recommendations.'
      });
    }

    // Validate coordinates if provided
    let parsedLat;
    let parsedLng;
    if (lat !== undefined || lng !== undefined) {
      parsedLat = parseFloat(lat);
      parsedLng = parseFloat(lng);
      if (isNaN(parsedLat) || isNaN(parsedLng) || parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) {
        return res.status(400).json({
          success: false,
          message: 'Invalid latitude or longitude coordinates provided.'
        });
      }
    }

    const recommendations = await getRecommendedPlaces({
      city: city ? String(city).trim() : undefined,
      lat: parsedLat,
      lng: parsedLng
    });

    if (!recommendations) {
      return res.status(503).json({
        success: false,
        message: 'Travel recommendations temporarily unavailable',
        data: null
      });
    }

    return res.status(200).json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('[Explore Controller Recommendation Error]:', error.message);
    return res.status(503).json({
      success: false,
      message: 'Travel recommendations temporarily unavailable',
      data: null
    });
  }
}

module.exports = {
  getDestinationsHandler,
  getActivitiesHandler,
  getRecommendationsHandler,
  searchCities: getDestinationsHandler,
  searchActivities: getActivitiesHandler,
};
