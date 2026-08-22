const prisma = require('../config/db');
const { successResponse, errorResponse } = require('../utils/responseHandler');

// GET /api/profile
const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        city: true,
        country: true,
        bio: true,
        profilePic: true,
        role: true,
        createdAt: true,
        _count: {
          select: { trips: true, savedDestinations: true, communityLikes: true },
        },
      },
    });

    if (!user) return errorResponse(res, 404, 'User profile not found');

    const recentTrips = await prisma.trip.findMany({
      where: { userId: req.user.id },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        stops: true,
      },
    });

    const savedDestinations = await prisma.savedDestination.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(res, 200, 'Profile data retrieved', {
      user,
      recentTrips,
      savedDestinations,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, city, country, bio, profilePic } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(city !== undefined && { city }),
        ...(country !== undefined && { country }),
        ...(bio !== undefined && { bio }),
        ...(profilePic !== undefined && { profilePic }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        city: true,
        country: true,
        bio: true,
        profilePic: true,
        role: true,
      },
    });

    return successResponse(res, 200, 'Profile updated successfully', updatedUser);
  } catch (error) {
    next(error);
  }
};

// GET /api/profile/saved-destinations
const getSavedDestinations = async (req, res, next) => {
  try {
    const saved = await prisma.savedDestination.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    return successResponse(res, 200, 'Saved destinations retrieved', saved);
  } catch (error) {
    next(error);
  }
};

// POST /api/profile/saved-destinations
const addSavedDestination = async (req, res, next) => {
  try {
    const { cityName, countryName, description, imageUrl } = req.body;

    if (!cityName || !countryName) {
      return errorResponse(res, 400, 'City and country names are required');
    }

    const saved = await prisma.savedDestination.create({
      data: {
        userId: req.user.id,
        cityName: cityName.trim(),
        countryName: countryName.trim(),
        description: description || null,
        imageUrl: imageUrl || null,
      },
    });

    return successResponse(res, 201, 'Destination saved successfully', saved);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/profile/saved-destinations/:id
const deleteSavedDestination = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.savedDestination.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!existing) {
      return errorResponse(res, 404, 'Saved destination not found');
    }

    await prisma.savedDestination.delete({
      where: { id },
    });

    return successResponse(res, 200, 'Saved destination removed');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getSavedDestinations,
  addSavedDestination,
  deleteSavedDestination,
};
