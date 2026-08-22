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

    if (!city && lat === undefined && lng === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either a city name or latitude/longitude coordinates for weather data.'
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

    const weatherData = await getWeatherForecast({
      city: city ? String(city).trim() : undefined,
      lat: parsedLat,
      lng: parsedLng
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
