/**
 * Travel & Weather Data Normalization Utility for GlobeTrotter
 * Member 3 Responsibility
 */

const { calculateHaversineDistance } = require('./travelUtils');

/**
 * Normalizes raw category string to standard simple category set:
 * attractions, culture, dining, outdoors, entertainment, shopping
 */
function normalizeCategoryString(inputCat) {
  if (!inputCat) return 'attractions';
  const c = String(inputCat).toLowerCase();
  if (c.includes('museum') || c.includes('culture') || c.includes('historic') || c.includes('heritage') || c.includes('art')) {
    return 'culture';
  }
  if (c.includes('restaurant') || c.includes('dining') || c.includes('catering') || c.includes('cafe') || c.includes('food')) {
    return 'dining';
  }
  if (c.includes('park') || c.includes('outdoor') || c.includes('nature') || c.includes('garden') || c.includes('beach')) {
    return 'outdoors';
  }
  if (c.includes('shopping') || c.includes('mall') || c.includes('market') || c.includes('commercial')) {
    return 'shopping';
  }
  if (c.includes('entertainment') || c.includes('leisure') || c.includes('cinema') || c.includes('theater')) {
    return 'entertainment';
  }
  return 'attractions';
}

/**
 * Normalizes raw destination geocoding data from Geoapify or Nominatim.
 * @param {Object} item 
 * @returns {Object} Clean normalized destination object
 */
function normalizeDestination(item) {
  if (!item) return null;

  const properties = item.properties || item;
  
  const name = properties.city || properties.name || (properties.display_name ? properties.display_name.split(',')[0] : 'Unknown Destination');
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

  const placeId = properties.place_id || properties.osm_id || `dest_${Math.random().toString(36).substring(2, 9)}`;

  return {
    id: String(placeId),
    name: String(name).trim(),
    state: String(state).trim(),
    country: String(country).trim(),
    formattedName: String(formattedName).trim(),
    lat: isNaN(lat) ? 0 : lat,
    lng: isNaN(lng) ? 0 : lng,
    bbox: bbox || null,
    timezone: properties.timezone?.name || 'UTC'
  };
}

/**
 * Normalizes raw activity / place data from Geoapify Places API or Nominatim.
 * @param {Object} item 
 * @param {number} [refLat] 
 * @param {number} [refLng] 
 * @returns {Object} Clean normalized activity object
 */
function normalizeActivity(item, refLat, refLng) {
  if (!item) return null;

  const properties = item.properties || item;
  const name = properties.name || properties.title || (properties.display_name ? properties.display_name.split(',')[0] : 'Popular Attraction');
  
  const lat = Number(properties.lat || properties.latitude || item.lat);
  const lng = Number(properties.lon || properties.longitude || item.lon);

  // Extract category
  let categoryRaw = 'attractions';
  if (properties.categories && Array.isArray(properties.categories)) {
    categoryRaw = properties.categories.join(' ');
  } else if (properties.category) {
    categoryRaw = String(properties.category);
  } else if (properties.type) {
    categoryRaw = String(properties.type);
  }

  const category = normalizeCategoryString(categoryRaw);

  const address = properties.address_line2 || properties.formatted || properties.display_name || '';
  const placeId = properties.place_id || properties.osm_id || `act_${Math.random().toString(36).substring(2, 9)}`;

  let distanceKm = 0;
  if (refLat !== undefined && refLng !== undefined && !isNaN(refLat) && !isNaN(refLng) && !isNaN(lat) && !isNaN(lng)) {
    distanceKm = calculateHaversineDistance(refLat, refLng, lat, lng);
  }

  // Derive priceCategory
  let priceCategory = '$';
  if (category === 'outdoors') priceCategory = 'Free';
  else if (category === 'dining') priceCategory = '$$';
  else if (category === 'shopping') priceCategory = '$$';
  else if (category === 'culture' || category === 'attractions') priceCategory = '$';

  if (properties.price_level !== undefined) {
    if (properties.price_level === 0) priceCategory = 'Free';
    else if (properties.price_level === 1) priceCategory = '$';
    else if (properties.price_level === 2) priceCategory = '$$';
    else if (properties.price_level >= 3) priceCategory = '$$$';
  }

  return {
    id: String(placeId),
    name: String(name).trim(),
    category: category,
    address: String(address).trim(),
    lat: isNaN(lat) ? 0 : lat,
    lng: isNaN(lng) ? 0 : lng,
    description: properties.description || `${name} in ${properties.city || 'destination'}`,
    rating: properties.rank?.popularity ? Math.min(5, Math.max(3.5, Number((properties.rank.popularity * 5).toFixed(1)))) : 4.5,
    priceCategory: priceCategory,
    distanceKm: Number(distanceKm.toFixed(2))
  };
}

/**
 * Normalizes place details from Geoapify Place Details API or Nominatim Details API.
 * @param {Object} item 
 * @returns {Object} Clean normalized place details object
 */
function normalizePlaceDetails(item) {
  if (!item) return null;

  const properties = item.properties || item;
  const name = properties.name || properties.title || (properties.display_name ? properties.display_name.split(',')[0] : 'Popular Place');

  const lat = Number(properties.lat || properties.latitude || item.lat);
  const lng = Number(properties.lon || properties.longitude || item.lon);

  // Extract category
  let categoryRaw = 'attractions';
  if (properties.categories && Array.isArray(properties.categories)) {
    categoryRaw = properties.categories.join(' ');
  } else if (properties.category) {
    categoryRaw = String(properties.category);
  } else if (properties.type) {
    categoryRaw = String(properties.type);
  }
  const category = normalizeCategoryString(categoryRaw);

  const address = properties.address_line2 || properties.formatted || properties.display_name || properties.address?.formatted || '';
  const city = properties.city || properties.address?.city || properties.address?.town || null;
  const country = properties.country || properties.address?.country || null;
  const placeId = properties.place_id || properties.osm_id || item.place_id || `place_${Math.random().toString(36).substring(2, 9)}`;

  // Optional contact / metadata
  const website = properties.website || properties.contact?.website || properties.url || null;
  const phone = properties.phone || properties.contact?.phone || null;
  const openingHours = properties.opening_hours || properties.opening_hours_raw || properties.datasource?.raw?.opening_hours || null;

  // Price category
  let priceCategory = '$';
  if (category === 'outdoors') priceCategory = 'Free';
  else if (category === 'dining' || category === 'shopping') priceCategory = '$$';

  if (properties.price_level !== undefined) {
    if (properties.price_level === 0) priceCategory = 'Free';
    else if (properties.price_level === 1) priceCategory = '$';
    else if (properties.price_level === 2) priceCategory = '$$';
    else if (properties.price_level >= 3) priceCategory = '$$$';
  }

  return {
    id: String(placeId),
    name: String(name).trim(),
    category: category,
    address: String(address).trim(),
    city: city ? String(city).trim() : null,
    country: country ? String(country).trim() : null,
    lat: isNaN(lat) ? 0 : lat,
    lng: isNaN(lng) ? 0 : lng,
    description: properties.description || `${name}${city ? ` in ${city}` : ''}`,
    rating: properties.rank?.popularity ? Math.min(5, Math.max(3.5, Number((properties.rank.popularity * 5).toFixed(1)))) : 4.5,
    priceCategory: priceCategory,
    website: website ? String(website).trim() : null,
    phone: phone ? String(phone).trim() : null,
    openingHours: openingHours ? String(openingHours).trim() : null,
    distanceKm: properties.distanceKm !== undefined ? Number(properties.distanceKm) : 0
  };
}

/**
 * Normalizes Open-Meteo weather response.
 * @param {Object} weatherData 
 * @param {string} cityName 
 * @param {number} [fallbackLat]
 * @param {number} [fallbackLng]
 * @returns {Object} Clean normalized weather object
 */
function normalizeWeather(weatherData, cityName = 'Requested Location', fallbackLat = 0, fallbackLng = 0) {
  if (!weatherData || !weatherData.current_weather) {
    return {
      city: cityName,
      coordinates: {
        lat: fallbackLat || 0,
        lng: fallbackLng || 0
      },
      current: {
        temperature: null,
        condition: 'Unavailable',
        windSpeed: null
      },
      currentTemp: null,
      condition: 'Unavailable',
      windSpeed: null,
      dailyForecast: []
    };
  }

  const current = weatherData.current_weather;
  const daily = weatherData.daily || {};

  // Weather code map according to WMO Weather interpretation codes
  const getWeatherCondition = (code) => {
    if (code === 0) return 'Clear';
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
    maxTemp: daily.temperature_2m_max ? Math.round(daily.temperature_2m_max[idx]) : null,
    minTemp: daily.temperature_2m_min ? Math.round(daily.temperature_2m_min[idx]) : null,
    precipitationProbability: daily.precipitation_probability_max ? daily.precipitation_probability_max[idx] : 0,
    condition: daily.weathercode ? getWeatherCondition(daily.weathercode[idx]) : 'Clear'
  }));

  const resLat = weatherData.latitude !== undefined ? weatherData.latitude : fallbackLat;
  const resLng = weatherData.longitude !== undefined ? weatherData.longitude : fallbackLng;

  return {
    city: cityName,
    coordinates: {
      lat: Number(resLat),
      lng: Number(resLng)
    },
    current: {
      temperature: Math.round(current.temperature),
      condition: getWeatherCondition(current.weathercode),
      windSpeed: Math.round(current.windspeed)
    },
    currentTemp: Math.round(current.temperature),
    condition: getWeatherCondition(current.weathercode),
    windSpeed: Math.round(current.windspeed),
    dailyForecast: dailyForecast
  };
}

module.exports = {
  normalizeCategoryString,
  normalizeDestination,
  normalizeActivity,
  normalizePlaceDetails,
  normalizeWeather
};
