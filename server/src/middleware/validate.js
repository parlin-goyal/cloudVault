const { body, param, query, validationResult } = require('express-validator');

/** Sends a 400 response with the first validation error, if any. */
function handleValidation(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const errors = result.array();
  res.status(400).json({ message: errors[0].msg, errors: errors.map((e) => ({ field: e.path, message: e.msg })) });
}

const usernameRule = body('username')
  .isString()
  .withMessage('Username is required.')
  .bail()
  .trim()
  .matches(/^[a-zA-Z0-9_.-]{3,30}$/)
  .withMessage('Username must be 3–30 characters: letters, numbers, dots, dashes or underscores.');

const registerRules = [
  usernameRule,
  body('password')
    .isString()
    .withMessage('Password is required.')
    .bail()
    .isLength({ min: 8, max: 72 })
    .withMessage('Password must be between 8 and 72 characters.'),
  handleValidation,
];

const loginRules = [
  body('username').isString().withMessage('Username is required.').bail().trim().notEmpty().withMessage('Username is required.'),
  body('password').isString().withMessage('Password is required.').bail().notEmpty().withMessage('Password is required.'),
  handleValidation,
];

const fileIdRule = [param('id').isInt({ min: 1 }).withMessage('Invalid file ID.').toInt(), handleValidation];

const listFilesRules = [
  query('search').optional().isString().trim().isLength({ max: 100 }).withMessage('Search text is too long.'),
  handleValidation,
];

module.exports = { registerRules, loginRules, fileIdRule, listFilesRules };
