const { errorResponse } = require('../utils/responseHandler');

const errorHandler = (err, req, res, next) => {
  console.error('Unhandled Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const errors = process.env.NODE_ENV === 'development' ? err.stack : null;

  return errorResponse(res, statusCode, message, errors);
};

const notFoundHandler = (req, res, next) => {
  return errorResponse(res, 404, `Route not found: ${req.originalUrl}`);
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
