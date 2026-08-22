const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { generateToken } = require('../utils/jwt');
const { successResponse, errorResponse } = require('../utils/responseHandler');

const register = async (req, res, next) => {
  try {
    const { name, email, password, city, country } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return errorResponse(res, 409, 'An account with this email address already exists.');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        city: city || null,
        country: country || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        city: true,
        country: true,
        profilePic: true,
        createdAt: true,
      },
    });

    const token = generateToken({ userId: user.id, email: user.email, role: user.role });

    return successResponse(res, 201, 'User registered successfully', {
      user,
      token,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return errorResponse(res, 401, 'Invalid email or password.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return errorResponse(res, 401, 'Invalid email or password.');
    }

    const token = generateToken({ userId: user.id, email: user.email, role: user.role });

    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      city: user.city,
      country: user.country,
      bio: user.bio,
      profilePic: user.profilePic,
    };

    return successResponse(res, 200, 'Logged in successfully', {
      user: userResponse,
      token,
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    return successResponse(res, 200, 'User profile retrieved', {
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
};
