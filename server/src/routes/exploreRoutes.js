/**
 * Explore Routes for GlobeTrotter
 * Combines Member 2 and Member 3 route endpoints
 */

const express = require('express');
const router = express.Router();
const {
  getDestinationsHandler,
  getActivitiesHandler,
  getRecommendationsHandler,
  getPlaceDetailsHandler,
  searchCities,
  searchActivities
} = require('../controllers/exploreController');

// Destination & City Search
router.get('/cities', getDestinationsHandler || searchCities);

// Points of Interest & Activity Search
router.get('/activities', getActivitiesHandler || searchActivities);

// Categorized Recommendations
router.get('/recommendations', getRecommendationsHandler);

// Place / Activity Details API
router.get('/place/:id', getPlaceDetailsHandler);

module.exports = router;
