/**
 * An error with an HTTP status code and a message that is safe to show to the user.
 */
class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

module.exports = AppError;
