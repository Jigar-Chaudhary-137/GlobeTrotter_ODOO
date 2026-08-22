/**
 * Simple Recommendation Service for GlobeTrotter
 * Member 3 Responsibility
 * Generates recommendations strictly from dynamic travel activity data
 */

const { searchActivities } = require('./activityService');
const { searchDestinations } = require('./destinationService');

/**
 * Returns simple categorized recommendations for a destination.
 * Categorizes live activity results into Attractions, Culture, Dining, and Outdoors.
 * 
 * @param {Object} params
 * @param {string} params.city Destination city
 * @param {number} [params.lat] Latitude
 * @param {number} [params.lng] Longitude
 * @returns {Promise<Object>} Categorized recommendation suggestions object
 */
async function getRecommendedPlaces({ city, lat, lng }) {
  if (!city && (isNaN(Number(lat)) || isNaN(Number(lng)))) {
    return {
      city: city || 'Unknown Destination',
      summary: 'No location specified',
      recommendations: {
        attractions: [],
        culture: [],
        dining: [],
        outdoors: []
      }
    };
  }

  // Resolve coordinates if missing
  let destLat = Number(lat);
  let destLng = Number(lng);
  let cityName = city || 'Destination';

  if ((isNaN(destLat) || isNaN(destLng) || destLat === 0) && city) {
    try {
      const destinations = await searchDestinations(city, 1);
      if (destinations && destinations.length > 0) {
        destLat = destinations[0].lat;
        destLng = destinations[0].lng;
        cityName = destinations[0].name;
      }
    } catch (err) {
      console.warn(`[Recommendation Resolution Warning]: ${err.message}`);
    }
  }

  // Fetch activities dynamically from live API
  const allActivities = await searchActivities({
    city: cityName,
    lat: destLat,
    lng: destLng,
    category: 'all',
    limit: 30
  });

  if (!Array.isArray(allActivities)) {
    return {
      city: cityName,
      coordinates: { lat: destLat || 0, lng: destLng || 0 },
      totalFound: 0,
      recommendations: {
        attractions: [],
        culture: [],
        dining: [],
        outdoors: []
      }
    };
  }

  // Group live retrieved activities into categories
  const attractions = allActivities.filter(a => a.category === 'attractions' || a.category === 'entertainment').slice(0, 5);
  const culture = allActivities.filter(a => a.category === 'culture').slice(0, 5);
  const dining = allActivities.filter(a => a.category === 'dining').slice(0, 5);
  const outdoors = allActivities.filter(a => a.category === 'outdoors').slice(0, 5);

  return {
    city: cityName,
    coordinates: { lat: destLat || 0, lng: destLng || 0 },
    totalFound: allActivities.length,
    recommendations: {
      attractions,
      culture,
      dining,
      outdoors
    }
  };
}

module.exports = {
  getRecommendedPlaces
};
