/**
 * Simple Recommendation Service for GlobeTrotter
 * Priority 5 Implementation — Member 3
 */

const { searchActivities } = require('./activityService');
const { searchDestinations } = require('./destinationService');

/**
 * Returns simple categorized recommendations for a destination.
 * Categorizes results into Attractions, Culture, Dining, and Outdoors.
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
    const destinations = await searchDestinations(city, 1);
    if (destinations.length > 0) {
      destLat = destinations[0].lat;
      destLng = destinations[0].lng;
    }
  }

  // Fetch activities using the user's city search term
  const allActivities = await searchActivities({
    city: cityName,
    lat: destLat,
    lng: destLng,
    category: 'all',
    limit: 30
  });

  // Group by categories
  const attractions = allActivities.filter(a => a.category === 'attraction' || a.category === 'entertainment').slice(0, 5);
  const culture = allActivities.filter(a => a.category === 'culture').slice(0, 5);
  const dining = allActivities.filter(a => a.category === 'dining').slice(0, 5);
  const outdoors = allActivities.filter(a => a.category === 'outdoors').slice(0, 5);

  // Distribute remaining items if specific categories are sparse
  const unclassified = allActivities.filter(a => 
    !attractions.includes(a) && !culture.includes(a) && !dining.includes(a) && !outdoors.includes(a)
  );

  if (attractions.length < 3 && unclassified.length > 0) {
    attractions.push(...unclassified.splice(0, 3 - attractions.length));
  }

  return {
    city: cityName,
    coordinates: { lat: destLat, lng: destLng },
    totalFound: allActivities.length,
    recommendations: {
      attractions: attractions,
      culture: culture,
      dining: dining,
      outdoors: outdoors
    }
  };
}

module.exports = {
  getRecommendedPlaces
};
