require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const tripRoutes = require('./routes/tripRoutes');
const exploreRoutes = require('./routes/exploreRoutes');
const communityRoutes = require('./routes/communityRoutes');
const publicRoutes = require('./routes/publicRoutes');
const profileRoutes = require('./routes/profileRoutes');
const adminRoutes = require('./routes/adminRoutes');
const weatherRoutes = require('./routes/weatherRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check API
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    app: 'GlobeTrotter Backend API',
    timestamp: new Date().toISOString(),
  });
});

// API Routes (Member 2 & Member 3)
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/explore', exploreRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/weather', weatherRoutes);

// Error Handling Middlewares
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`GlobeTrotter Backend API:  http://localhost:${PORT}`);
  console.log(`GlobeTrotter Frontend App: http://localhost:5173`);
  console.log(`API Health Check:          http://localhost:${PORT}/api/health`);
  console.log(`=================================`);
});

module.exports = app;

