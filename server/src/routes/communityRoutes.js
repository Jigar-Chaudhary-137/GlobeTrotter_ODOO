const express = require('express');
const router = express.Router();
const { getCommunityTrips, toggleLikeTrip } = require('../controllers/communityController');
const { authenticate, optionalAuthenticate } = require('../middleware/authMiddleware');

router.get('/', optionalAuthenticate, getCommunityTrips);
router.post('/:id/like', authenticate, toggleLikeTrip);

module.exports = router;
