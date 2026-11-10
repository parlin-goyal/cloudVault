const { rateLimit } = require('express-rate-limit');

const limitHandler = (message) => (req, res) => res.status(429).json({ message });

/** Slows down password guessing: 10 failed attempts per IP every 15 minutes. */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: limitHandler('Too many login attempts. Please wait 15 minutes and try again.'),
});

/** Prevents mass account creation: 10 accounts per IP per hour. */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: limitHandler('Too many accounts created from this network. Please try again later.'),
});

/** General API limit: 300 requests per IP every 15 minutes. */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: limitHandler('Too many requests. Please slow down and try again shortly.'),
});

module.exports = { loginLimiter, registerLimiter, apiLimiter };
