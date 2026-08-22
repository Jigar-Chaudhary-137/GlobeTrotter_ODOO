const express = require('express');
const router = express.Router();
const { searchCities, searchActivities } = require('../controllers/exploreController');

router.get('/cities', searchCities);
router.get('/activities', searchActivities);

module.exports = router;
