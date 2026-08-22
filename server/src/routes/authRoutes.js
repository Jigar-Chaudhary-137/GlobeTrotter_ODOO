const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { validateRegisterInput, validateLoginInput } = require('../validators/authValidator');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/register', validateRegisterInput, register);
router.post('/login', validateLoginInput, login);
router.get('/me', authenticate, getMe);

module.exports = router;
