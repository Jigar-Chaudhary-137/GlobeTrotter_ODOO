/**
 * Destination & City Search Service for GlobeTrotter
 * Priority 1 Implementation — Member 3
 */

const axios = require('axios');
const { normalizeDestination } = require('../../utils/dataNormalizer');

/**
 * Searches for destinations/cities worldwide.
 * Primary API: Geoapify Geocoding API
 * Fallback API: OpenStreetMap Nominatim API
 * 
 * @param {string} query Search text (e.g., "Paris", "Dubai", "Tokyo")
 * @param {number} [limit=10] Maximum results
 * @returns {Promise<Array>} Normalized array of destination objects
 */
async function searchDestinations(query, limit = 10) {
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return [];
  }

  const cleanQuery = query.trim();
  const apiKey = process.env.GEOAPIFY_API_KEY;

  // Attempt Primary API: Geoapify Geocoding
  if (apiKey) {
    try {
      const response = await axios.get('https://api.geoapify.com/v1/geocode/search', {
        params: {
          text: cleanQuery,
          type: 'city',
          limit: limit,
          apiKey: apiKey
        },
        timeout: 5000
      });

      if (response.data && response.data.features && response.data.features.length > 0) {
        return response.data.features
          .map(normalizeDestination)
          .filter(Boolean);
      }
    } catch (err) {
      console.warn(`[Geoapify Destination Search Warning]: ${err.message}. Falling back to OpenStreetMap Nominatim.`);
    }
  }

  // Fallback API: OpenStreetMap Nominatim (Keyless, Public)
  try {
    const fallbackResponse = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: cleanQuery,
        format: 'json',
        addressdetails: 1,
        limit: limit
      },
      headers: {
        'User-Agent': 'GlobeTrotter-TravelApp/1.0'
      },
      timeout: 5000
    });

    if (Array.isArray(fallbackResponse.data) && fallbackResponse.data.length > 0) {
      return fallbackResponse.data
        .map(normalizeDestination)
        .filter(Boolean);
    }
  } catch (fallbackErr) {
    console.error(`[Nominatim Destination Search Error]: ${fallbackErr.message}`);
  }

  return [];
}

module.exports = {
  searchDestinations
};
