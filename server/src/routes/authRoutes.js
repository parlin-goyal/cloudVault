const express = require('express');
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter');
const { registerRules, loginRules } = require('../middleware/validate');

const router = express.Router();

router.post('/register', registerLimiter, registerRules, authController.register);
router.post('/login', loginLimiter, loginRules, authController.login);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.me);

module.exports = router;
