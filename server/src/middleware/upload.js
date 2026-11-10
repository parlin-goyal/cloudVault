/**
 * Multer receives the uploaded file from React and keeps it in memory briefly
 * before it is sent to S3. Nothing is written to the server's disk.
 */
const multer = require('multer');
const env = require('../config/env');
const AppError = require('../utils/AppError');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxFileSizeMb * 1024 * 1024, files: 1 },
});

/** Accepts one file in the "file" field and converts Multer errors into friendly messages. */
function uploadSingleFile(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError(413, `File is too large. The maximum size is ${env.maxFileSizeMb} MB.`));
    }
    if (err instanceof multer.MulterError) {
      return next(new AppError(400, 'Please upload exactly one file in the "file" field.'));
    }
    next(err);
  });
}

module.exports = { uploadSingleFile };
