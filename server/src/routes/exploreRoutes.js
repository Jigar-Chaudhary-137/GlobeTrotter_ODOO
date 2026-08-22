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
  searchCities,
  searchActivities
} = require('../controllers/exploreController');

// Destination & City Search
router.get('/cities', getDestinationsHandler || searchCities);

// Points of Interest & Activity Search
router.get('/activities', getActivitiesHandler || searchActivities);

// Simple Recommendations
router.get('/recommendations', getRecommendationsHandler);

module.exports = router;

