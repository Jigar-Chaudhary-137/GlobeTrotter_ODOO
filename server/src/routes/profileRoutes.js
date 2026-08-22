const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getSavedDestinations,
  addSavedDestination,
  deleteSavedDestination,
} = require('../controllers/profileController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/', getProfile);
router.put('/', updateProfile);
router.get('/saved-destinations', getSavedDestinations);
router.post('/saved-destinations', addSavedDestination);
router.delete('/saved-destinations/:id', deleteSavedDestination);

module.exports = router;
