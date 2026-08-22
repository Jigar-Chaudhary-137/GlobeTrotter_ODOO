const validateTripInput = (req, res, next) => {
  const { title, totalBudget } = req.body;
  const errors = [];

  if (!title || title.trim().length === 0) {
    errors.push('Trip title is required');
  }

  if (totalBudget !== undefined && (isNaN(Number(totalBudget)) || Number(totalBudget) < 0)) {
    errors.push('Total budget must be a non-negative number');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

const validateStopInput = (req, res, next) => {
  const { city, country } = req.body;
  const errors = [];

  if (!city || city.trim().length === 0) {
    errors.push('City name is required');
  }

  if (!country || country.trim().length === 0) {
    errors.push('Country name is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

const validateItineraryInput = (req, res, next) => {
  const { title } = req.body;
  const errors = [];

  if (!title || title.trim().length === 0) {
    errors.push('Activity title is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

module.exports = {
  validateTripInput,
  validateStopInput,
  validateItineraryInput,
};
