const env = require('../config/env');

function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Invalid JSON body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid request body.' });
  }

  const statusCode = err.statusCode || err.status || 500;

  if (statusCode >= 500) {
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, err);
  }

  res.status(statusCode).json({
    message: err.isOperational ? err.message : 'Something went wrong on the server. Please try again.',
    ...(env.isProduction || err.isOperational ? {} : { detail: err.message }),
  });
}

module.exports = { notFound, errorHandler };
