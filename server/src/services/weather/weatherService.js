/**
 * Weather Service for GlobeTrotter
 * Priority 6 Implementation — Member 3
 * Uses Open-Meteo API (Keyless, Free, High Reliability)
 */

const axios = require('axios');
const { normalizeWeather } = require('../../utils/dataNormalizer');
const { searchDestinations } = require('../travel/destinationService');

/**
 * Fetches current weather and 7-day forecast for a city or coordinates.
 * Non-blocking: returns clean fallback object on error without throwing.
 * 
 * @param {Object} params
 * @param {string} [params.city] City name
 * @param {number} [params.lat] Latitude
 * @param {number} [params.lng] Longitude
 * @returns {Promise<Object>} Normalized weather data
 */
async function getWeatherForecast({ city, lat, lng }) {
  let targetLat = Number(lat);
  let targetLng = Number(lng);
  let cityName = city || 'Location';

  // Resolve coordinates from city name if missing
  if ((isNaN(targetLat) || isNaN(targetLng) || targetLat === 0) && city) {
    try {
      const destinations = await searchDestinations(city, 1);
      if (destinations.length > 0) {
        targetLat = destinations[0].lat;
        targetLng = destinations[0].lng;
        cityName = destinations[0].name;
      }
    } catch (resolveErr) {
      console.warn(`[Weather Service City Resolution Warning]: ${resolveErr.message}`);
    }
  }

  // If coordinates still unresolvable, return clean empty weather object
  if (isNaN(targetLat) || isNaN(targetLng) || (targetLat === 0 && targetLng === 0)) {
    return normalizeWeather(null, cityName);
  }

  try {
    const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude: targetLat,
        longitude: targetLng,
        current_weather: true,
        daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode',
        timezone: 'auto'
      },
      timeout: 4000 // Fast 4-second timeout to ensure non-blocking performance
    });

    return normalizeWeather(response.data, cityName);
  } catch (err) {
    console.warn(`[Weather Service Warning]: Open-Meteo request failed (${err.message}). Returning fallback weather structure.`);
    return normalizeWeather(null, cityName);
  }
}

module.exports = {
  getWeatherForecast
};
