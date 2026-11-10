const bcrypt = require('bcryptjs');
const UserModel = require('../models/userModel');
const AppError = require('../utils/AppError');
const { issueAuthCookie, clearAuthCookie } = require('../middleware/auth');

const BCRYPT_ROUNDS = 12;

// A real hash used when the username does not exist, so the response time is the same
// whether the username exists or not (prevents username discovery by timing).
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', BCRYPT_ROUNDS);

/** POST /api/auth/register */
async function register(req, res) {
  const username = req.body.username.trim();
  const { password } = req.body;

  if (UserModel.findByUsernameWithPassword(username)) {
    throw new AppError(409, 'That username is already taken.');
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  let user;
  try {
    user = UserModel.create(username, passwordHash);
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') throw new AppError(409, 'That username is already taken.');
    throw err;
  }

  issueAuthCookie(res, user);
  res.status(201).json({ user, message: 'Account created successfully.' });
}

/** POST /api/auth/login */
async function login(req, res) {
  const username = req.body.username.trim();
  const { password } = req.body;

  const row = UserModel.findByUsernameWithPassword(username);
  const passwordOk = await bcrypt.compare(password, row ? row.password_hash : DUMMY_HASH);

  if (!row || !passwordOk) {
    // Same message for both cases, so attackers cannot tell which usernames exist.
    throw new AppError(401, 'Invalid username or password.');
  }

  const user = UserModel.toPublicUser(row);
  issueAuthCookie(res, user);
  res.json({ user, message: 'Logged in successfully.' });
}

/** POST /api/auth/logout */
function logout(req, res) {
  clearAuthCookie(res);
  res.json({ message: 'Logged out successfully.' });
}

/** GET /api/auth/me — returns the logged-in user (used by React on page load). */
function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { register, login, logout, me };
