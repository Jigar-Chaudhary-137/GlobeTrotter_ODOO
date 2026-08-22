const prisma = require('../config/db');
const { successResponse } = require('../utils/responseHandler');

const getAdminStats = async (req, res, next) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalTrips = await prisma.trip.count();
    const publicTrips = await prisma.trip.count({ where: { isPublic: true } });
    const privateTrips = totalTrips - publicTrips;
    const totalStops = await prisma.tripStop.count();
    const totalItineraryItems = await prisma.itineraryItem.count();

    // Query all users with trip count
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        city: true,
        country: true,
        profilePic: true,
        role: true,
        createdAt: true,
        _count: {
          select: { trips: true, communityLikes: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Query all platform trips with user details and stops
    const trips = await prisma.trip.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, profilePic: true },
        },
        stops: { orderBy: { order: 'asc' } },
        itineraryItems: true,
        expenses: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Popular destinations grouped by city and country
    const popularStops = await prisma.tripStop.groupBy({
      by: ['city', 'country'],
      _count: { city: true },
      orderBy: { _count: { city: 'desc' } },
      take: 10,
    });

    const popularDestinations = popularStops.map((stop) => ({
      name: `${stop.city}, ${stop.country}`,
      city: stop.city,
      country: stop.country,
      count: stop._count.city,
    }));

    // Popular activities grouped by title
    const popularActivityItems = await prisma.itineraryItem.groupBy({
      by: ['title', 'category'],
      _count: { title: true },
      _sum: { expense: true },
      orderBy: { _count: { title: 'desc' } },
      take: 10,
    });

    const popularActivities = popularActivityItems.map((item) => ({
      name: item.title,
      category: item.category,
      count: item._count.title,
      cost: item._sum.expense || 0,
    }));

    // Total expense budget across platform
    const expenseSum = await prisma.expense.aggregate({
      _sum: { amount: true },
    });
    const totalExpenses = expenseSum._sum.amount || 0;

    return successResponse(res, 200, 'Admin platform metrics retrieved', {
      stats: {
        totalUsers,
        totalTrips,
        publicTrips,
        privateTrips,
        totalStops,
        totalItineraryItems,
        totalExpenses,
      },
      users,
      trips,
      popularDestinations,
      popularActivities,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminStats,
};
