const AppError = require('../utils/AppError');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF protection.
 * Every state-changing request from our React app sends the header "X-Requested-With".
 * Ordinary HTML forms on other websites cannot add custom headers, so forged requests are rejected.
 * (This works together with the SameSite=Strict cookie.)
 */
function requireAjaxHeader(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  if (req.get('X-Requested-With') === 'XMLHttpRequest') return next();
  next(new AppError(403, 'Request blocked for security reasons.'));
}

module.exports = { requireAjaxHeader };
