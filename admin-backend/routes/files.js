const express = require('express');
const router = express.Router();
const { 
  uploadFiles, 
  uploadEncryptedFiles,
  downloadFile, 
  downloadEncryptedFile,
  getFileInfo, 
  getEncryptedFileInfo,
  listFiles, 
  deleteFile, 
  scanFile, 
  getFileStats, 
  getEncryptionReport, 
  cleanupExpiredFiles 
} = require('../controllers/fileController');
const { RateLimiter, InputSanitizer } = require('../middleware/security');
const secureFileHandler = require('../middleware/secureFileHandler');
const { protect } = require('../middleware/auth');

// Apply authentication to all routes
router.use(protect);

// File upload routes
router.post('/upload',
  RateLimiter.fileUpload(),
  InputSanitizer.middleware(),
  secureFileHandler.uploadMiddleware(),
  uploadFiles
);

// Encrypted file upload route (client-side encrypted)
router.post('/upload-encrypted',
  RateLimiter.fileUpload(),
  InputSanitizer.middleware(),
  secureFileHandler.singleFileUploadMiddleware(),
  uploadEncryptedFiles
);

// File scan route
router.post('/scan',
  RateLimiter.fileUpload(),
  InputSanitizer.middleware(),
  secureFileHandler.singleFileUploadMiddleware(),
  scanFile
);

// File download route
router.get('/download/:fileId',
  RateLimiter.general(),
  downloadFile
);

// Encrypted file download route (returns encrypted data for client decryption)
router.get('/download-encrypted/:fileId',
  RateLimiter.general(),
  downloadEncryptedFile
);

// File information routes
router.get('/:fileId',
  RateLimiter.general(),
  getFileInfo
);

// Encrypted file information route (returns decryption keys)
router.get('/encrypted/:fileId',
  RateLimiter.general(),
  getEncryptedFileInfo
);

// File listing route
router.get('/',
  RateLimiter.general(),
  listFiles
);

// File deletion route
router.delete('/:fileId',
  RateLimiter.general(),
  deleteFile
);

// Admin routes
router.get('/stats',
  RateLimiter.general(),
  getFileStats
);

router.get('/encryption-report',
  RateLimiter.general(),
  getEncryptionReport
);

router.post('/cleanup',
  RateLimiter.general(),
  cleanupExpiredFiles
);

module.exports = router;
