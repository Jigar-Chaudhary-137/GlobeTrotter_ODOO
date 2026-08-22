/**
 * Activity & Places Search Service for GlobeTrotter
 * Priority 2 Implementation — Member 3
 */

const axios = require('axios');
const { normalizeActivity } = require('../../utils/dataNormalizer');
const { sortActivitiesByDistance } = require('../../utils/travelUtils');
const { searchDestinations } = require('./destinationService');

// Map internal GlobeTrotter category strings to Geoapify category categories
const GEOAPIFY_CATEGORY_MAP = {
  attractions: 'tourism.sights,building.historic,heritage',
  dining: 'catering.restaurant,catering.cafe',
  culture: 'entertainment.museum,building.historic,heritage',
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
 * @param {string} [params.category="all"] Category filter (attractions, dining, culture, outdoors, entertainment)
 * @param {number} [params.limit=20] Max results
 * @returns {Promise<Array>} Normalized array of activity objects
 */
async function searchActivities({ city, lat, lng, category = 'all', limit = 20 }) {
  let searchLat = Number(lat);
  let searchLng = Number(lng);
  let cityName = city ? String(city).trim() : '';

  // Resolve coordinates if missing
  if ((isNaN(searchLat) || isNaN(searchLng) || searchLat === 0) && cityName) {
    const destinations = await searchDestinations(cityName, 1);
    if (destinations.length > 0) {
      searchLat = destinations[0].lat;
      searchLng = destinations[0].lng;
    }
  }

  const apiKey = process.env.GEOAPIFY_API_KEY;
  const categories = GEOAPIFY_CATEGORY_MAP[category.toLowerCase()] || GEOAPIFY_CATEGORY_MAP.all;

  // Primary API: Geoapify Places API
  if (apiKey && !isNaN(searchLat) && !isNaN(searchLng) && searchLat !== 0) {
    try {
      const response = await axios.get('https://api.geoapify.com/v2/places', {
        params: {
          categories: categories,
          filter: `circle:${searchLng},${searchLat},10000`, // 10km radius
          bias: `proximity:${searchLng},${searchLat}`,
          limit: limit,
          apiKey: apiKey
        },
        timeout: 5000
      });

      if (response.data && response.data.features && response.data.features.length > 0) {
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
      const cleanCategory = category === 'all' ? 'attractions' : category;
      let searchQueries = [];

      if (cleanCity) {
        searchQueries.push(`${cleanCategory} in ${cleanCity}`);
        searchQueries.push(`${cleanCity} attractions`);
        searchQueries.push(`${cleanCity} tourism`);
      } else {
        searchQueries.push(cleanCategory);
      }

      for (const queryTerm of searchQueries) {
        const fallbackResponse = await axios.get('https://nominatim.openstreetmap.org/search', {
          params: {
            q: queryTerm,
            format: 'json',
            addressdetails: 1,
            limit: limit
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
      console.error(`[Nominatim Places Search Error]: ${fallbackErr.message}`);
    }
  }

  return [];
}

module.exports = {
  searchActivities
};
