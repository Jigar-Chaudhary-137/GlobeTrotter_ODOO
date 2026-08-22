/**
 * Weather Controller for GlobeTrotter
 * Member 3 Responsibility
 */

const { getWeatherForecast } = require('../services/weather/weatherService');

/**
 * GET /api/weather
 * Query parameters: city, lat, lng
 */
async function getWeatherHandler(req, res, next) {
  try {
    const { city, lat, lng } = req.query;

    if (!city && (!lat || !lng)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either a city name or latitude/longitude coordinates for weather data.'
      });
    }

    const weatherData = await getWeatherForecast({
      city,
      lat: lat ? parseFloat(lat) : undefined,
      lng: lng ? parseFloat(lng) : undefined
    });

    if (!weatherData) {
      return res.status(503).json({
        success: false,
        message: 'Weather data is temporarily unavailable'
      });
    }

    return res.status(200).json({
      success: true,
      data: weatherData
    });
  } catch (error) {
    console.error('[Weather Controller Error]:', error.message);
    return res.status(503).json({
      success: false,
      message: 'Weather data is temporarily unavailable'
    });
  }
}

module.exports = {
  getWeatherHandler
};
