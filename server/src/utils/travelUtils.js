/**
 * Travel Calculation Utilities for GlobeTrotter
 * Member 3 Responsibility
 */

/**
 * Calculates straight-line distance between two geographic coordinates using the Haversine formula.
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @param {'km' | 'miles'} unit 
 * @returns {number} Distance rounded to 2 decimal places
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2, unit = 'km') {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
    return 0;
  }

  const p1 = Number(lat1);
  const p2 = Number(lon1);
  const q1 = Number(lat2);
  const q2 = Number(lon2);

  if (isNaN(p1) || isNaN(p2) || isNaN(q1) || isNaN(q2)) {
    return 0;
  }

  const R = unit === 'miles' ? 3958.8 : 6371; // Earth radius in miles or km
  const dLat = ((q1 - p1) * Math.PI) / 180;
  const dLon = ((q2 - p2) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1 * Math.PI) / 180) *
      Math.cos((q1 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100;
}

/**
 * Formats latitude and longitude coordinates into a human-readable string.
 * @param {number} lat 
 * @param {number} lng 
 * @returns {string} e.g. "48.8566° N, 2.3522° E"
 */
function formatCoordinates(lat, lng) {
  if (lat === undefined || lng === undefined || isNaN(Number(lat)) || isNaN(Number(lng))) {
    return '0.0000°, 0.0000°';
  }

  const latitude = Number(lat);
  const longitude = Number(lng);

  const latDir = latitude >= 0 ? 'N' : 'S';
  const lngDir = longitude >= 0 ? 'E' : 'W';

  return `${Math.abs(latitude).toFixed(4)}° ${latDir}, ${Math.abs(longitude).toFixed(4)}° ${lngDir}`;
}

/**
 * Sorts an array of activity objects by straight-line distance from a reference coordinate.
 * @param {Array} activities 
 * @param {number} refLat 
 * @param {number} refLng 
 * @returns {Array} Sorted activities with added `distanceKm` property
 */
function sortActivitiesByDistance(activities, refLat, refLng) {
  if (!Array.isArray(activities) || refLat === undefined || refLng === undefined) {
    return activities || [];
  }

  return activities
    .map((activity) => {
      const dist = calculateHaversineDistance(
        refLat,
        refLng,
        activity.lat || activity.latitude,
        activity.lng || activity.longitude
      );
      return {
        ...activity,
        distanceKm: dist
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

module.exports = {
  calculateHaversineDistance,
  formatCoordinates,
  sortActivitiesByDistance
};
