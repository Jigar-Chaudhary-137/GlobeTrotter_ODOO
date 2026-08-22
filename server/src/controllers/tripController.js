const prisma = require('../config/db');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { v4: uuidv4 } = require('crypto');

// Helper to check trip ownership
const checkTripOwnership = async (tripId, userId) => {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
  });
  if (!trip) return { error: 'Trip not found', code: 404 };
  if (trip.userId !== userId) return { error: 'Unauthorized to modify this trip', code: 403 };
  return { trip };
};

// GET /api/trips
const getTrips = async (req, res, next) => {
  try {
    const trips = await prisma.trip.findMany({
      where: { userId: req.user.id },
      include: {
        stops: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { itineraryItems: true, expenses: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(res, 200, 'Trips retrieved successfully', trips);
  } catch (error) {
    next(error);
  }
};

// GET /api/trips/:id
const getTripById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, profilePic: true, city: true, country: true },
        },
        stops: {
          orderBy: { order: 'asc' },
          include: {
            itineraryItems: {
              orderBy: [{ dayNumber: 'asc' }, { time: 'asc' }],
            },
          },
        },
        itineraryItems: {
          orderBy: [{ dayNumber: 'asc' }, { time: 'asc' }],
        },
        expenses: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { communityLikes: true },
        },
      },
    });

    if (!trip) {
      return errorResponse(res, 404, 'Trip not found');
    }

    // Allow access if public or owned by requester
    if (!trip.isPublic && trip.userId !== req.user?.id) {
      return errorResponse(res, 403, 'Access denied to private trip');
    }

    return successResponse(res, 200, 'Trip details retrieved', trip);
  } catch (error) {
    next(error);
  }
};

// POST /api/trips
const createTrip = async (req, res, next) => {
  try {
    const { title, description, coverImage, startDate, endDate, totalBudget, status, isPublic } = req.body;

    const trip = await prisma.trip.create({
      data: {
        userId: req.user.id,
        title: title.trim(),
        description: description || null,
        coverImage: coverImage || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        totalBudget: totalBudget ? parseFloat(totalBudget) : 0,
        status: status || 'PLANNED',
        isPublic: Boolean(isPublic),
      },
      include: {
        stops: true,
        itineraryItems: true,
        expenses: true,
      },
    });

    return successResponse(res, 201, 'Trip created successfully', trip);
  } catch (error) {
    next(error);
  }
};

// PUT /api/trips/:id
const updateTrip = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { ownershipError, code } = await checkTripOwnership(id, req.user.id);
    if (ownershipError) return errorResponse(res, code, ownershipError);

    const { title, description, coverImage, startDate, endDate, totalBudget, status, isPublic } = req.body;

    const updatedTrip = await prisma.trip.update({
      where: { id },
      data: {
        ...(title && { title: title.trim() }),
        ...(description !== undefined && { description }),
        ...(coverImage !== undefined && { coverImage }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(totalBudget !== undefined && { totalBudget: parseFloat(totalBudget) }),
        ...(status && { status }),
        ...(isPublic !== undefined && { isPublic: Boolean(isPublic) }),
      },
      include: {
        stops: { orderBy: { order: 'asc' } },
        itineraryItems: true,
        expenses: true,
      },
    });

    return successResponse(res, 200, 'Trip updated successfully', updatedTrip);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/trips/:id
const deleteTrip = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { ownershipError, code } = await checkTripOwnership(id, req.user.id);
    if (ownershipError) return errorResponse(res, code, ownershipError);

    await prisma.trip.delete({
      where: { id },
    });

    return successResponse(res, 200, 'Trip deleted successfully');
  } catch (error) {
    next(error);
  }
};

// POST /api/trips/:id/publish
const publishTrip = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { trip, error: ownershipError, code } = await checkTripOwnership(id, req.user.id);
    if (ownershipError) return errorResponse(res, code, ownershipError);

    const updatedTrip = await prisma.trip.update({
      where: { id },
      data: {
        isPublic: !trip.isPublic,
      },
    });

    return successResponse(
      res,
      200,
      `Trip ${updatedTrip.isPublic ? 'published' : 'unpublished'} successfully`,
      updatedTrip
    );
  } catch (error) {
    next(error);
  }
};

// --- TRIP STOPS ---

// POST /api/trips/:tripId/stops
const addStop = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const { error: ownershipError, code } = await checkTripOwnership(tripId, req.user.id);
    if (ownershipError) return errorResponse(res, code, ownershipError);

    const { city, country, arrivalDate, departureDate, order, notes, latitude, longitude } = req.body;

    const stopCount = await prisma.tripStop.count({ where: { tripId } });

    const stop = await prisma.tripStop.create({
      data: {
        tripId,
        city: city.trim(),
        country: country.trim(),
        arrivalDate: arrivalDate ? new Date(arrivalDate) : null,
        departureDate: departureDate ? new Date(departureDate) : null,
        order: order !== undefined ? parseInt(order) : stopCount + 1,
        notes: notes || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      },
    });

    return successResponse(res, 201, 'Trip stop added successfully', stop);
  } catch (error) {
    next(error);
  }
};

// PUT /api/trips/:tripId/stops/:stopId
const updateStop = async (req, res, next) => {
  try {
    const { tripId, stopId } = req.params;
    const { error: ownershipError, code } = await checkTripOwnership(tripId, req.user.id);
    if (ownershipError) return errorResponse(res, code, ownershipError);

    const { city, country, arrivalDate, departureDate, order, notes } = req.body;

    const updatedStop = await prisma.tripStop.update({
      where: { id: stopId },
      data: {
        ...(city && { city: city.trim() }),
        ...(country && { country: country.trim() }),
        ...(arrivalDate !== undefined && { arrivalDate: arrivalDate ? new Date(arrivalDate) : null }),
        ...(departureDate !== undefined && { departureDate: departureDate ? new Date(departureDate) : null }),
        ...(order !== undefined && { order: parseInt(order) }),
        ...(notes !== undefined && { notes }),
      },
    });

    return successResponse(res, 200, 'Trip stop updated successfully', updatedStop);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/trips/:tripId/stops/:stopId
const deleteStop = async (req, res, next) => {
  try {
    const { tripId, stopId } = req.params;
    const { error: ownershipError, code } = await checkTripOwnership(tripId, req.user.id);
    if (ownershipError) return errorResponse(res, code, ownershipError);

    await prisma.tripStop.delete({
      where: { id: stopId },
    });

    return successResponse(res, 200, 'Trip stop deleted successfully');
  } catch (error) {
    next(error);
  }
};

// --- ITINERARY ITEMS ---

// POST /api/trips/:tripId/itinerary
const addItineraryItem = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const { error: ownershipError, code } = await checkTripOwnership(tripId, req.user.id);
    if (ownershipError) return errorResponse(res, code, ownershipError);

    const { tripStopId, dayNumber, date, time, title, description, category, expense, location } = req.body;

    const item = await prisma.itineraryItem.create({
      data: {
        tripId,
        tripStopId: tripStopId || null,
        dayNumber: dayNumber ? parseInt(dayNumber) : 1,
        date: date ? new Date(date) : null,
        time: time || '09:00',
        title: title.trim(),
        description: description || null,
        category: category || 'ACTIVITIES',
        expense: expense ? parseFloat(expense) : 0,
        location: location || null,
      },
    });

    return successResponse(res, 201, 'Itinerary item added successfully', item);
  } catch (error) {
    next(error);
  }
};

// PUT /api/trips/:tripId/itinerary/:itemId
const updateItineraryItem = async (req, res, next) => {
  try {
    const { tripId, itemId } = req.params;
    const { error: ownershipError, code } = await checkTripOwnership(tripId, req.user.id);
    if (ownershipError) return errorResponse(res, code, ownershipError);

    const { tripStopId, dayNumber, date, time, title, description, category, expense, location } = req.body;

    const updatedItem = await prisma.itineraryItem.update({
      where: { id: itemId },
      data: {
        ...(tripStopId !== undefined && { tripStopId: tripStopId || null }),
        ...(dayNumber !== undefined && { dayNumber: parseInt(dayNumber) }),
        ...(date !== undefined && { date: date ? new Date(date) : null }),
        ...(time !== undefined && { time }),
        ...(title && { title: title.trim() }),
        ...(description !== undefined && { description }),
        ...(category && { category }),
        ...(expense !== undefined && { expense: parseFloat(expense) }),
        ...(location !== undefined && { location }),
      },
    });

    return successResponse(res, 200, 'Itinerary item updated successfully', updatedItem);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/trips/:tripId/itinerary/:itemId
const deleteItineraryItem = async (req, res, next) => {
  try {
    const { tripId, itemId } = req.params;
    const { error: ownershipError, code } = await checkTripOwnership(tripId, req.user.id);
    if (ownershipError) return errorResponse(res, code, ownershipError);

    await prisma.itineraryItem.delete({
      where: { id: itemId },
    });

    return successResponse(res, 200, 'Itinerary item deleted successfully');
  } catch (error) {
    next(error);
  }
};

// --- EXPENSES & BUDGET CALCULATIONS ---

// GET /api/trips/:tripId/expenses
const getTripExpenses = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        stops: true,
        itineraryItems: true,
        expenses: true,
      },
    });

    if (!trip) return errorResponse(res, 404, 'Trip not found');

    // Aggregate expenses from Itinerary items + direct Expense entries
    const categoryTotals = {
      TRANSPORT: 0,
      ACCOMMODATION: 0,
      ACTIVITIES: 0,
      MEALS: 0,
      OTHER: 0,
    };

    let totalExpense = 0;
    const dayExpenseMap = {};
    const cityExpenseMap = {};

    // Process itinerary item expenses
    trip.itineraryItems.forEach((item) => {
      const amt = item.expense || 0;
      const cat = item.category || 'ACTIVITIES';
      if (categoryTotals[cat] !== undefined) categoryTotals[cat] += amt;
      else categoryTotals.OTHER += amt;

      totalExpense += amt;

      const dayKey = `Day ${item.dayNumber}`;
      dayExpenseMap[dayKey] = (dayExpenseMap[dayKey] || 0) + amt;

      if (item.tripStopId) {
        const stop = trip.stops.find((s) => s.id === item.tripStopId);
        if (stop) {
          cityExpenseMap[stop.city] = (cityExpenseMap[stop.city] || 0) + amt;
        }
      }
    });

    // Process standalone Expense entries
    trip.expenses.forEach((exp) => {
      const amt = exp.amount || 0;
      const cat = exp.category || 'OTHER';
      if (categoryTotals[cat] !== undefined) categoryTotals[cat] += amt;
      else categoryTotals.OTHER += amt;

      totalExpense += amt;
    });

    const isOverBudget = trip.totalBudget > 0 && totalExpense > trip.totalBudget;

    return successResponse(res, 200, 'Trip expenses aggregated successfully', {
      totalBudget: trip.totalBudget,
      totalExpense,
      remainingBudget: trip.totalBudget > 0 ? trip.totalBudget - totalExpense : 0,
      isOverBudget,
      categoryBreakdown: categoryTotals,
      costPerDay: Object.keys(dayExpenseMap).map((day) => ({ day, cost: dayExpenseMap[day] })),
      costPerCity: Object.keys(cityExpenseMap).map((city) => ({ city, cost: cityExpenseMap[city] })),
      expensesList: trip.expenses,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/trips/:tripId/expenses
const addExpense = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const { error: ownershipError, code } = await checkTripOwnership(tripId, req.user.id);
    if (ownershipError) return errorResponse(res, code, ownershipError);

    const { category, amount, description, date, currency } = req.body;

    if (!category || !amount || !description) {
      return errorResponse(res, 400, 'Category, amount, and description are required');
    }

    const expense = await prisma.expense.create({
      data: {
        tripId,
        category,
        amount: parseFloat(amount),
        description: description.trim(),
        currency: currency || 'USD',
        date: date ? new Date(date) : new Date(),
      },
    });

    return successResponse(res, 201, 'Expense record created', expense);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/trips/:tripId/expenses/:expenseId
const deleteExpense = async (req, res, next) => {
  try {
    const { tripId, expenseId } = req.params;
    const { error: ownershipError, code } = await checkTripOwnership(tripId, req.user.id);
    if (ownershipError) return errorResponse(res, code, ownershipError);

    await prisma.expense.delete({
      where: { id: expenseId },
    });

    return successResponse(res, 200, 'Expense record deleted');
  } catch (error) {
    next(error);
  }
};

// --- PUBLIC TRIPS & COPYING ---

// GET /api/public/trips/:shareId
const getPublicTripByShareId = async (req, res, next) => {
  try {
    const { shareId } = req.params;
    const trip = await prisma.trip.findFirst({
      where: { shareId, isPublic: true },
      include: {
        user: {
          select: { id: true, name: true, profilePic: true, city: true, country: true },
        },
        stops: {
          orderBy: { order: 'asc' },
        },
        itineraryItems: {
          orderBy: [{ dayNumber: 'asc' }, { time: 'asc' }],
        },
        expenses: true,
        _count: {
          select: { communityLikes: true },
        },
      },
    });

    if (!trip) {
      return errorResponse(res, 404, 'Public trip not found or link is private');
    }

    return successResponse(res, 200, 'Public trip fetched successfully', trip);
  } catch (error) {
    next(error);
  }
};

// POST /api/public/trips/:shareId/copy
const copyPublicTrip = async (req, res, next) => {
  try {
    const { shareId } = req.params;
    const originalTrip = await prisma.trip.findFirst({
      where: { shareId, isPublic: true },
      include: {
        stops: { orderBy: { order: 'asc' } },
        itineraryItems: true,
        expenses: true,
      },
    });

    if (!originalTrip) {
      return errorResponse(res, 404, 'Original public trip not found or not published');
    }

    // Create a new copy owned by req.user
    const newTrip = await prisma.trip.create({
      data: {
        userId: req.user.id,
        title: `${originalTrip.title} (Copy)`,
        description: originalTrip.description,
        coverImage: originalTrip.coverImage,
        startDate: originalTrip.startDate,
        endDate: originalTrip.endDate,
        totalBudget: originalTrip.totalBudget,
        status: 'PLANNED',
        isPublic: false,
      },
    });

    // Map old stop IDs to new stop IDs for itinerary items
    const stopIdMap = {};

    for (const stop of originalTrip.stops) {
      const newStop = await prisma.tripStop.create({
        data: {
          tripId: newTrip.id,
          city: stop.city,
          country: stop.country,
          arrivalDate: stop.arrivalDate,
          departureDate: stop.departureDate,
          order: stop.order,
          notes: stop.notes,
          latitude: stop.latitude,
          longitude: stop.longitude,
        },
      });
      stopIdMap[stop.id] = newStop.id;
    }

    // Clone itinerary items
    for (const item of originalTrip.itineraryItems) {
      await prisma.itineraryItem.create({
        data: {
          tripId: newTrip.id,
          tripStopId: item.tripStopId ? stopIdMap[item.tripStopId] || null : null,
          dayNumber: item.dayNumber,
          date: item.date,
          time: item.time,
          title: item.title,
          description: item.description,
          category: item.category,
          expense: item.expense,
          location: item.location,
        },
      });
    }

    // Clone standalone expenses
    for (const exp of originalTrip.expenses) {
      await prisma.expense.create({
        data: {
          tripId: newTrip.id,
          category: exp.category,
          amount: exp.amount,
          currency: exp.currency,
          description: exp.description,
          date: exp.date,
        },
      });
    }

    const completeNewTrip = await prisma.trip.findUnique({
      where: { id: newTrip.id },
      include: {
        stops: true,
        itineraryItems: true,
        expenses: true,
      },
    });

    return successResponse(res, 201, 'Trip copied successfully to your account!', completeNewTrip);
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
  getPublicTripByShareId,
  copyPublicTrip,
};
