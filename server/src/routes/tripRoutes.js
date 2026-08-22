const express = require('express');
const router = express.Router();
const {
  getTrips,
  getTripById,
  createTrip,
  updateTrip,
  deleteTrip,
  publishTrip,
  addStop,
  updateStop,
  deleteStop,
  addItineraryItem,
  updateItineraryItem,
  deleteItineraryItem,
  getTripExpenses,
  addExpense,
  deleteExpense,
} = require('../controllers/tripController');
const { validateTripInput, validateStopInput, validateItineraryInput } = require('../validators/tripValidator');
const { authenticate, optionalAuthenticate } = require('../middleware/authMiddleware');

// All trip manipulation requires auth except optional reading public trip
router.use(authenticate);

// Trip routes
router.get('/', getTrips);
router.post('/', validateTripInput, createTrip);
router.get('/:id', getTripById);
router.put('/:id', updateTrip);
router.delete('/:id', deleteTrip);
router.post('/:id/publish', publishTrip);

// Stop routes
router.post('/:tripId/stops', validateStopInput, addStop);
router.put('/:tripId/stops/:stopId', updateStop);
router.delete('/:tripId/stops/:stopId', deleteStop);

// Itinerary routes
router.post('/:tripId/itinerary', validateItineraryInput, addItineraryItem);
router.put('/:tripId/itinerary/:itemId', updateItineraryItem);
router.delete('/:tripId/itinerary/:itemId', deleteItineraryItem);

// Expense routes
router.get('/:tripId/expenses', getTripExpenses);
router.post('/:tripId/expenses', addExpense);
router.delete('/:tripId/expenses/:expenseId', deleteExpense);

module.exports = router;
