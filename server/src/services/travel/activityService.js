/**
 * Activity & Places Search Service for GlobeTrotter
 * Priority 2 Implementation — Member 3
 */

const axios = require('axios');
const { normalizeActivity, normalizePlaceDetails } = require('../../utils/dataNormalizer');
const { sortActivitiesByDistance } = require('../../utils/travelUtils');
const { searchDestinations } = require('./destinationService');

// Map internal GlobeTrotter category strings to Geoapify Places categories
const GEOAPIFY_CATEGORY_MAP = {
  attractions: 'tourism.sights,building.historic,heritage',
  culture: 'entertainment.museum,building.historic,heritage',
  museums: 'entertainment.museum,building.historic,heritage',
  dining: 'catering.restaurant,catering.cafe',
  outdoors: 'leisure.park,natural',
  entertainment: 'entertainment,leisure',
  shopping: 'commercial.shopping_mall,commercial.marketplace',
  all: 'tourism.sights,catering.restaurant,entertainment.museum,leisure.park,entertainment'
};

/**
 * Searches activities / attractions in a city or around coordinates.
 * Primary API: Geoapify Places API
 * Fallback API: OpenStreetMap Nominatim API
 * 
 * @param {Object} params
 * @param {string} [params.city] City name (e.g. "Paris", "London", "Tokyo")
 * @param {number} [params.lat] Latitude
 * @param {number} [params.lng] Longitude
 * @param {string} [params.category="all"] Category filter
 * @param {number} [params.limit=20] Max results
 * @returns {Promise<Array>} Normalized array of activity objects
 */
async function searchActivities({ city, lat, lng, category = 'all', limit = 20 }) {
  let searchLat = Number(lat);
  let searchLng = Number(lng);
  let cityName = city ? String(city).trim() : '';

  // Resolve coordinates if missing
  if ((isNaN(searchLat) || isNaN(searchLng) || searchLat === 0) && cityName) {
    try {
      const destinations = await searchDestinations(cityName, 1);
      if (destinations.length > 0) {
        searchLat = destinations[0].lat;
        searchLng = destinations[0].lng;
      }
    } catch (resolveErr) {
      console.warn(`[Activity Service Coordinates Resolution Warning]: ${resolveErr.message}`);
    }
  }

  const maxLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
  const apiKey = process.env.GEOAPIFY_API_KEY;
  const cleanCatKey = (category || 'all').toLowerCase().trim();
  const categories = GEOAPIFY_CATEGORY_MAP[cleanCatKey] || GEOAPIFY_CATEGORY_MAP.all;

  // Primary API: Geoapify Places API
  if (apiKey && !isNaN(searchLat) && !isNaN(searchLng) && searchLat !== 0) {
    try {
      const response = await axios.get('https://api.geoapify.com/v2/places', {
        params: {
          categories: categories,
          filter: `circle:${searchLng},${searchLat},10000`, // 10km radius
          bias: `proximity:${searchLng},${searchLat}`,
          limit: maxLimit,
          apiKey: apiKey
        },
        timeout: 5000
      });

      if (response.data && Array.isArray(response.data.features) && response.data.features.length > 0) {
        const activities = response.data.features
          .map((item) => normalizeActivity(item, searchLat, searchLng))
          .filter(Boolean);

        return sortActivitiesByDistance(activities, searchLat, searchLng);
      }
    } catch (err) {
      console.warn(`[Geoapify Places Search Warning]: ${err.message}. Trying Nominatim fallback.`);
    }
  }

  // Fallback API: Nominatim Search
  const cleanCity = cityName.split(',')[0].replace(/^Greater\s+/i, '').trim();

  if (cleanCity || (!isNaN(searchLat) && searchLat !== 0)) {
    try {
      const queryCat = cleanCatKey === 'all' ? 'attractions' : cleanCatKey;
      let searchQueries = [];

      if (cleanCity) {
        searchQueries.push(`${queryCat} in ${cleanCity}`);
        searchQueries.push(`${cleanCity} attractions`);
      } else {
        searchQueries.push(queryCat);
      }

      for (const queryTerm of searchQueries) {
        const fallbackResponse = await axios.get('https://nominatim.openstreetmap.org/search', {
          params: {
            q: queryTerm,
            format: 'json',
            addressdetails: 1,
            limit: maxLimit
          },
          headers: {
            'User-Agent': 'GlobeTrotter-TravelApp/1.0'
          },
          timeout: 4000
        });

        if (Array.isArray(fallbackResponse.data) && fallbackResponse.data.length > 0) {
          const activities = fallbackResponse.data
            .map((item) => normalizeActivity(item, searchLat, searchLng))
            .filter(Boolean);

          return sortActivitiesByDistance(activities, searchLat, searchLng);
        }
      }
    } catch (fallbackErr) {
      console.warn(`[Nominatim Places Search Warning]: ${fallbackErr.message}`);
    }
  }

  return [];
}

/**
 * Retrieves detailed place information for a specific place ID.
 * Primary API: Geoapify Place Details API
 * Secondary Fallback: Nominatim Details API
 * 
 * @param {string} placeId Unique place identifier
 * @returns {Promise<Object|null>} Normalized place details or null
 */
async function getPlaceDetails(placeId) {
  if (!placeId || typeof placeId !== 'string' || placeId.trim().length === 0) {
    return null;
  }

  const cleanId = placeId.trim();
  const apiKey = process.env.GEOAPIFY_API_KEY;

  // Primary API: Geoapify Place Details
  if (apiKey) {
    try {
      const response = await axios.get('https://api.geoapify.com/v2/place-details', {
        params: {
          id: cleanId,
          apiKey: apiKey
        },
        timeout: 5000
      });

      if (response.data && Array.isArray(response.data.features) && response.data.features.length > 0) {
        return normalizePlaceDetails(response.data.features[0]);
      }
    } catch (err) {
      console.warn(`[Geoapify Place Details Warning]: ${err.message}. Trying secondary fallback.`);
    }
  }

  // Secondary Fallback: Nominatim Details API
  try {
    const fallbackResponse = await axios.get('https://nominatim.openstreetmap.org/details', {
      params: {
        place_id: cleanId,
        format: 'json'
      },
      headers: {
        'User-Agent': 'GlobeTrotter-TravelApp/1.0'
      },
      timeout: 4000
    });

    if (fallbackResponse.data) {
      return normalizePlaceDetails(fallbackResponse.data);
    }
  } catch (fallbackErr) {
    console.warn(`[Nominatim Place Details Warning]: ${fallbackErr.message}`);
  }

  return null;
}

module.exports = {
  searchActivities,
  getPlaceDetails
};
