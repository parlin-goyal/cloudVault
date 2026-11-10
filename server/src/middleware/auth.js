/**
 * JWT authentication.
 * The token is stored in an HttpOnly cookie, so browser JavaScript cannot read or steal it.
 */
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const UserModel = require('../models/userModel');
const AppError = require('../utils/AppError');

const COOKIE_NAME = 'cloudvault_token';

const cookieOptions = {
  httpOnly: true,
  secure: env.cookieSecure, // true once HTTPS is enabled
  sameSite: 'strict', // cookie is never sent with requests from other websites
  path: '/',
};

function parseDurationMs(value) {
  const match = /^(\d+)([smhd])$/.exec(String(value));
  if (!match) return 24 * 60 * 60 * 1000;
  const units = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return Number(match[1]) * units[match[2]];
}

/** Creates a signed token for the user and stores it in the response cookie. */
function issueAuthCookie(res, user) {
  const token = jwt.sign({ sub: String(user.id), username: user.username }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
  res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: parseDurationMs(env.jwtExpiresIn) });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, cookieOptions);
}

/** Blocks the request unless it carries a valid token for an existing user. */
function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies[COOKIE_NAME];
  if (!token) return next(new AppError(401, 'Please log in to continue.'));

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    clearAuthCookie(res);
    return next(new AppError(401, 'Your session has expired. Please log in again.'));
  }

  const user = UserModel.findById(Number(payload.sub));
  if (!user) {
    clearAuthCookie(res);
    return next(new AppError(401, 'Account not found. Please log in again.'));
  }

  req.user = user;
  next();
}

module.exports = { issueAuthCookie, clearAuthCookie, requireAuth };
