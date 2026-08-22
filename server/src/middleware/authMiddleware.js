const { verifyToken } = require('../utils/jwt');
const { errorResponse } = require('../utils/responseHandler');
const prisma = require('../config/db');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 401, 'Access denied. Authorization token missing.');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        city: true,
        country: true,
        profilePic: true,
      },
    });

    if (!user) {
      return errorResponse(res, 401, 'Invalid session. User no longer exists.');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return errorResponse(res, 401, 'Invalid or expired token.');
    }
    return errorResponse(res, 500, 'Authentication error.', error.message);
  }
};

const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, name: true, email: true, role: true },
      });
      if (user) {
        req.user = user;
      }
    }
  } catch (_) {
    // Ignore errors for optional auth
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return errorResponse(res, 403, 'Forbidden. Admin privileges required.');
  }
  next();
};

module.exports = {
  authenticate,
  optionalAuthenticate,
  requireAdmin,
};
