const prisma = require('../config/db');
const { successResponse, errorResponse } = require('../utils/responseHandler');

// GET /api/community
const getCommunityTrips = async (req, res, next) => {
  try {
    const { search, category, sort } = req.query;

    const where = {
      isPublic: true,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { stops: { some: { city: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const publicTrips = await prisma.trip.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, profilePic: true, city: true, country: true },
        },
        stops: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { communityLikes: true, itineraryItems: true },
        },
      },
      orderBy: sort === 'popular' ? { communityLikes: { _count: 'desc' } } : { createdAt: 'desc' },
      take: 30,
    });

    // Check if logged in user has liked any of these
    let likedTripIds = new Set();
    if (req.user) {
      const userLikes = await prisma.communityLike.findMany({
        where: { userId: req.user.id },
        select: { tripId: true },
      });
      likedTripIds = new Set(userLikes.map((l) => l.tripId));
    }

    const formattedTrips = publicTrips.map((trip) => ({
      ...trip,
      likeCount: trip._count.communityLikes,
      itemCount: trip._count.itineraryItems,
      isLiked: likedTripIds.has(trip.id),
    }));

    return successResponse(res, 200, 'Community public trips retrieved', formattedTrips);
  } catch (error) {
    next(error);
  }
};

// POST /api/community/:id/like
const toggleLikeTrip = async (req, res, next) => {
  try {
    const { id: tripId } = req.params;
    const userId = req.user.id;

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
    });

    if (!trip || !trip.isPublic) {
      return errorResponse(res, 404, 'Public trip not found');
    }

    const existingLike = await prisma.communityLike.findUnique({
      where: {
        userId_tripId: { userId, tripId },
      },
    });

    if (existingLike) {
      await prisma.communityLike.delete({
        where: { id: existingLike.id },
      });
      return successResponse(res, 200, 'Unliked trip successfully', { liked: false });
    } else {
      await prisma.communityLike.create({
        data: { userId, tripId },
      });
      return successResponse(res, 200, 'Liked trip successfully', { liked: true });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCommunityTrips,
  toggleLikeTrip,
};
