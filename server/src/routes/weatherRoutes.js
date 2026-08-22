/**
 * Weather Routes for GlobeTrotter
 * Member 3 Responsibility
 */

const express = require('express');
const router = express.Router();
const { getWeatherHandler } = require('../controllers/weatherController');

// Weather Forecast Lookup
router.get('/', getWeatherHandler);

module.exports = router;
