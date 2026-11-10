const express = require('express');
const fileController = require('../controllers/fileController');
const { requireAuth } = require('../middleware/auth');
const { uploadSingleFile } = require('../middleware/upload');
const { fileIdRule, listFilesRules } = require('../middleware/validate');

const router = express.Router();

// All file routes require a logged-in user.
router.use(requireAuth);

router.get('/', listFilesRules, fileController.listFiles);
router.post('/', uploadSingleFile, fileController.uploadFile);
router.get('/:id/download', fileIdRule, fileController.getDownloadLink);
router.delete('/:id', fileIdRule, fileController.deleteFile);

module.exports = router;
