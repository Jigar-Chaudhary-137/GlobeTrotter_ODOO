/**
 * Travel Data Normalization Utility for GlobeTrotter
 * Member 3 Responsibility
 */

const { calculateHaversineDistance } = require('./travelUtils');

/**
 * Normalizes raw destination geocoding data from Geoapify or Nominatim.
 * @param {Object} item 
 * @returns {Object} Clean normalized destination object
 */
function normalizeDestination(item) {
  if (!item) return null;

  // Handle Geoapify structure vs Nominatim structure
  const properties = item.properties || item;
  
  const name = properties.city || properties.name || properties.display_name?.split(',')[0] || 'Unknown Destination';
  const country = properties.country || properties.address?.country || '';
  const state = properties.state || properties.county || properties.address?.state || '';
  const formattedName = properties.formatted || properties.display_name || `${name}${country ? `, ${country}` : ''}`;

  const lat = Number(properties.lat || properties.latitude || item.lat);
  const lng = Number(properties.lon || properties.longitude || item.lon);

  const bbox = properties.bbox || (item.boundingbox ? {
    lat1: Number(item.boundingbox[0]),
    lat2: Number(item.boundingbox[1]),
    lon1: Number(item.boundingbox[2]),
    lon2: Number(item.boundingbox[3])
  } : null);

  const placeId = properties.place_id || properties.osm_id || `dest_${Math.random().toString(36).substr(2, 9)}`;

  return {
    id: String(placeId),
    name: name.trim(),
    state: state.trim(),
    country: country.trim(),
    formattedName: formattedName.trim(),
    lat: isNaN(lat) ? 0 : lat,
    lng: isNaN(lng) ? 0 : lng,
    bbox: bbox || null,
    timezone: properties.timezone?.name || 'UTC'
  };
}

/**
 * Normalizes raw activity / place data from Geoapify Places API.
 * @param {Object} item 
 * @param {number} [refLat] 
 * @param {number} [refLng] 
 * @returns {Object} Clean normalized activity object
 */
function normalizeActivity(item, refLat, refLng) {
  if (!item) return null;

  const properties = item.properties || item;
  const name = properties.name || properties.title || properties.display_name?.split(',')[0] || 'Popular Attraction';
  
  const lat = Number(properties.lat || properties.latitude || item.lat);
  const lng = Number(properties.lon || properties.longitude || item.lon);

  // Extract category
  let category = 'attraction';
  if (properties.categories && Array.isArray(properties.categories)) {
    const cats = properties.categories.join(' ');
    if (cats.includes('catering') || cats.includes('restaurant')) category = 'dining';
    else if (cats.includes('entertainment') || cats.includes('leisure')) category = 'entertainment';
    else if (cats.includes('park') || cats.includes('nature')) category = 'outdoors';
    else if (cats.includes('museum') || cats.includes('historic') || cats.includes('heritage')) category = 'culture';
  } else if (properties.category) {
    category = String(properties.category).toLowerCase();
  }

  const address = properties.address_line2 || properties.formatted || properties.display_name || '';
  const placeId = properties.place_id || properties.osm_id || `act_${Math.random().toString(36).substr(2, 9)}`;

  let distanceKm = 0;
  if (refLat !== undefined && refLng !== undefined && !isNaN(lat) && !isNaN(lng)) {
    distanceKm = calculateHaversineDistance(refLat, refLng, lat, lng);
  }

  return {
    id: String(placeId),
    name: name.trim(),
    category: category,
    address: address.trim(),
    lat: isNaN(lat) ? 0 : lat,
    lng: isNaN(lng) ? 0 : lng,
    distanceKm: distanceKm,
    rating: properties.rank?.popularity ? Math.min(5, Math.max(3, Math.round(properties.rank.popularity * 5))) : 4.5,
    description: properties.description || `${name} in ${properties.city || 'destination'}`
  };
}

/**
 * Normalizes Open-Meteo weather response.
 * @param {Object} weatherData 
 * @param {string} cityName 
 * @returns {Object} Clean normalized weather object
 */
function normalizeWeather(weatherData, cityName = 'Requested Location') {
  if (!weatherData || !weatherData.current_weather) {
    return {
      city: cityName,
      currentTemp: null,
      tempUnit: '°C',
      condition: 'Unavailable',
      humidity: null,
      windSpeed: null,
      dailyForecast: []
    };
  }

  const current = weatherData.current_weather;
  const daily = weatherData.daily || {};

  // Weather code map according to WMO Weather interpretation codes
  const getWeatherCondition = (code) => {
    if (code === 0) return 'Clear Sky';
    if (code >= 1 && code <= 3) return 'Partly Cloudy';
    if (code >= 45 && code <= 48) return 'Foggy';
    if (code >= 51 && code <= 67) return 'Rainy';
    if (code >= 71 && code <= 77) return 'Snowy';
    if (code >= 80 && code <= 82) return 'Rain Showers';
    if (code >= 95 && code <= 99) return 'Thunderstorm';
    return 'Cloudy';
  };

  const dailyForecast = (daily.time || []).map((dateStr, idx) => ({
    date: dateStr,
    maxTemp: daily.temperature_2m_max ? daily.temperature_2m_max[idx] : null,
    minTemp: daily.temperature_2m_min ? daily.temperature_2m_min[idx] : null,
    rainProbability: daily.precipitation_probability_max ? daily.precipitation_probability_max[idx] : 0,
    condition: daily.weathercode ? getWeatherCondition(daily.weathercode[idx]) : 'Clear'
  }));

  return {
    city: cityName,
    lat: weatherData.latitude || 0,
    lng: weatherData.longitude || 0,
    currentTemp: current.temperature,
    tempUnit: '°C',
    condition: getWeatherCondition(current.weathercode),
    windSpeed: current.windspeed,
    dailyForecast: dailyForecast
  };
}

module.exports = {
  normalizeDestination,
  normalizeActivity,
  normalizeWeather
};
