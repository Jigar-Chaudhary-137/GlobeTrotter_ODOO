const express = require('express');
const router = express.Router();
const { getPublicTripByShareId, copyPublicTrip } = require('../controllers/tripController');
const { authenticate } = require('../middleware/authMiddleware');

router.get('/trips/:shareId', getPublicTripByShareId);
router.post('/trips/:shareId/copy', authenticate, copyPublicTrip);

module.exports = router;
