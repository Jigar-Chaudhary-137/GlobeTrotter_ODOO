const express = require('express');
const router = express.Router();
const { getAdminStats } = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

router.use(authenticate, requireAdmin);
router.get('/stats', getAdminStats);

module.exports = router;
