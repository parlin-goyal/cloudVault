const FileModel = require('../models/fileModel');
const s3Service = require('../services/s3Service');
const AppError = require('../utils/AppError');

/** Browsers send file names as UTF-8, but the multipart parser may read them as Latin-1. */
function decodeFileName(name) {
  const decoded = Buffer.from(name, 'latin1').toString('utf8');
  return decoded.includes('�') ? name : decoded;
}

/** GET /api/files?search=  — lists the user's files and storage usage. */
function listFiles(req, res) {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const files = FileModel.listByUser(req.user.id, search);
  const stats = FileModel.statsByUser(req.user.id);
  res.json({ files, stats });
}

/** POST /api/files  — uploads one file (multipart field "file") to S3. */
async function uploadFile(req, res) {
  if (!req.file) throw new AppError(400, 'Please choose a file to upload.');
  if (req.file.size === 0) throw new AppError(400, 'The selected file is empty.');

  const originalName = decodeFileName(req.file.originalname).slice(0, 255);
  const s3Key = s3Service.buildObjectKey(req.user.id, originalName);

  try {
    await s3Service.uploadFile(s3Key, req.file.buffer, req.file.mimetype);
  } catch (err) {
    console.error('S3 upload failed:', err.name, err.message);
    throw new AppError(502, 'Upload to cloud storage failed. Please try again.');
  }

  const file = FileModel.create({
    userId: req.user.id,
    originalName,
    s3Key,
    size: req.file.size,
    mimeType: req.file.mimetype,
  });

  res.status(201).json({ file, message: `"${originalName}" uploaded successfully.` });
}

/** GET /api/files/:id/download  — returns a short-lived signed S3 URL for the file. */
async function getDownloadLink(req, res) {
  const file = FileModel.findOwned(Number(req.params.id), req.user.id);
  if (!file) throw new AppError(404, 'File not found.');

  try {
    const url = await s3Service.getDownloadUrl(file.s3_key, file.original_name);
    res.json({ url });
  } catch (err) {
    console.error('Could not create download link:', err.name, err.message);
    throw new AppError(502, 'Could not create a download link. Please try again.');
  }
}

/** DELETE /api/files/:id  — deletes the file from S3 and the database. */
async function deleteFile(req, res) {
  const file = FileModel.findOwned(Number(req.params.id), req.user.id);
  if (!file) throw new AppError(404, 'File not found.');

  try {
    await s3Service.deleteFile(file.s3_key);
  } catch (err) {
    console.error('S3 delete failed:', err.name, err.message);
    throw new AppError(502, 'Could not delete the file from cloud storage. Please try again.');
  }

  FileModel.deleteOwned(file.id, req.user.id);
  res.json({ message: `"${file.original_name}" deleted successfully.` });
}

module.exports = { listFiles, uploadFile, getDownloadLink, deleteFile };
