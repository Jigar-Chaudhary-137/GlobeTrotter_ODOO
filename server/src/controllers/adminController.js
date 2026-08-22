const prisma = require('../config/db');
const { successResponse } = require('../utils/responseHandler');

const getAdminStats = async (req, res, next) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalTrips = await prisma.trip.count();
    const publicTrips = await prisma.trip.count({ where: { isPublic: true } });
    const totalStops = await prisma.tripStop.count();
    const totalItineraryItems = await prisma.itineraryItem.count();

    // Group stops by city to find popular destinations
    const popularStops = await prisma.tripStop.groupBy({
      by: ['city', 'country'],
      _count: { city: true },
      orderBy: { _count: { city: 'desc' } },
      take: 5,
    });

    const popularDestinations = popularStops.map((stop) => ({
      city: stop.city,
      country: stop.country,
      count: stop._count.city,
    }));

    return successResponse(res, 200, 'Admin platform metrics retrieved', {
      totalUsers,
      totalTrips,
      publicTrips,
      totalStops,
      totalItineraryItems,
      popularDestinations,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminStats,
};
