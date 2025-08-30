const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const encryptionManager = require('../utils/encryption');
const mongoose = require('mongoose');
let FileModel;
try {
  FileModel = require('../models/File');
} catch (_) {
  FileModel = null;
}
let FileAuditLog;
try {
  FileAuditLog = require('../models/FileAuditLog');
} catch (_) {
  FileAuditLog = null;
}
const malwareScanner = require('../utils/malwareScanner');
const { ValidationRules } = require('./security');
let DownloadTokenModel;
try {
  DownloadTokenModel = require('../models/DownloadToken');
} catch (_) {
  DownloadTokenModel = null;
}

class SecureFileHandler {
  constructor() {
    this.allowedFileTypes = [
      // Documents
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf',
      // Images
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.svg',
      // Archives (with restrictions)
      '.zip', '.rar', '.7z',
      // Legal documents
      '.odt', '.ods', '.odp', '.pages', '.numbers', '.key'
    ];

    this.maxFileSize = 50 * 1024 * 1024; // 50MB
    this.maxFiles = 10;
    this.uploadDirectory = process.env.UPLOAD_DIRECTORY || 'uploads';
    this.encryptedDirectory = process.env.ENCRYPTED_DIRECTORY || 'encrypted';
    this.tempDirectory = process.env.TEMP_DIRECTORY || 'temp';

    // Initialize directories
    this.initializeDirectories();
  }

  /**
   * Initialize required directories
   */
  async initializeDirectories() {
    try {
      const directories = [
        this.uploadDirectory,
        this.encryptedDirectory,
        this.tempDirectory,
        path.join(this.uploadDirectory, 'temp'),
        path.join(this.uploadDirectory, 'processed'),
        path.join(this.uploadDirectory, 'rejected')
      ];

      for (const dir of directories) {
        await fs.mkdir(dir, { recursive: true });
      }

      console.log('✅ Secure file handler directories initialized');
    } catch (error) {
      console.error('❌ Failed to initialize file handler directories:', error);
    }
  }

  /**
   * Configure multer for secure file uploads
   */
  configureMulter() {
    const storage = multer.diskStorage({
      destination: async (req, file, cb) => {
        try {
          const tempDir = path.join(this.uploadDirectory, 'temp');
          await fs.mkdir(tempDir, { recursive: true });
          cb(null, tempDir);
        } catch (error) {
          cb(error);
        }
      },
      filename: (req, file, cb) => {
        // Generate secure filename with timestamp and random string
        const timestamp = Date.now();
        const randomString = crypto.randomBytes(8).toString('hex');
        const extension = path.extname(file.originalname);
        const secureFilename = `${timestamp}_${randomString}${extension}`;
        cb(null, secureFilename);
      }
    });

    const fileFilter = (req, file, cb) => {
      // Check file extension
      const extension = path.extname(file.originalname).toLowerCase();
      if (!this.allowedFileTypes.includes(extension)) {
        return cb(new Error(`File type '${extension}' is not allowed`), false);
      }

      // Check file size
      if (file.size > this.maxFileSize) {
        return cb(new Error(`File size exceeds maximum allowed size of ${this.maxFileSize} bytes`), false);
      }

      // Additional validation
      this.validateFile(file, cb);
    };

    return multer({
      storage: storage,
      fileFilter: fileFilter,
      limits: {
        fileSize: this.maxFileSize,
        files: this.maxFiles
      }
    });
  }

  /**
   * Validate uploaded file
   */
  validateFile(file, cb) {
    try {
      // Check for null bytes in filename (potential path traversal)
      if (file.originalname.includes('\0')) {
        return cb(new Error('Invalid filename detected'), false);
      }

      // Check for path traversal attempts
      const normalizedPath = path.normalize(file.originalname);
      if (normalizedPath.includes('..') || normalizedPath.startsWith('/')) {
        return cb(new Error('Path traversal attempt detected'), false);
      }

      // Check filename length
      if (file.originalname.length > 255) {
        return cb(new Error('Filename too long'), false);
      }

      // Check for suspicious characters
      const suspiciousChars = /[<>:"|?*\x00-\x1f]/;
      if (suspiciousChars.test(file.originalname)) {
        return cb(new Error('Filename contains invalid characters'), false);
      }

      cb(null, true);
    } catch (error) {
      cb(error, false);
    }
  }

  /**
   * Process uploaded files with security checks
   */
  async processUploadedFiles(files, userId, clientId = null) {
    const processedFiles = [];
    const rejectedFiles = [];

    for (const file of files) {
      try {
        console.log(`🔍 Processing file: ${file.originalname}`);

        // Step 1: Malware scan
        const scanResult = await malwareScanner.scanFile(file.path, file.buffer);
        
        if (!scanResult.isClean) {
          console.log(`❌ File rejected due to security threats: ${file.originalname}`);
          await this.moveToRejected(file.path, scanResult);
          rejectedFiles.push({
            originalName: file.originalname,
            reason: 'Security threats detected',
            threats: scanResult.threats,
            warnings: scanResult.warnings
          });
          continue;
        }

        // Step 2: Encrypt file
        const encryptionResult = await this.encryptFile(file.path, userId, clientId);
        
        // Step 3: Store file metadata
        const fileMetadata = await this.storeFileMetadata(file, encryptionResult, scanResult, userId, clientId);

        // Step 4: Clean up temporary file
        await this.cleanupTempFile(file.path);

        processedFiles.push(fileMetadata);
        console.log(`✅ File processed successfully: ${file.originalname}`);

      } catch (error) {
        console.error(`❌ Error processing file ${file.originalname}:`, error);
        await this.moveToRejected(file.path, { error: error.message });
        rejectedFiles.push({
          originalName: file.originalname,
          reason: 'Processing error',
          error: error.message
        });
      }
    }

    return { processedFiles, rejectedFiles };
  }

  /**
   * Encrypt file and store securely
   */
  async encryptFile(filePath, userId, clientId = null) {
    try {
      // Generate file-specific encryption key
      const fileKey = encryptionManager.generateFileKey();
      
      // Create encrypted file path
      const fileName = path.basename(filePath);
      const encryptedFileName = `${crypto.randomBytes(16).toString('hex')}_${fileName}.enc`;
      const encryptedFilePath = path.join(this.encryptedDirectory, encryptedFileName);

      // Encrypt file
      const encryptionResult = await encryptionManager.encryptFile(filePath, encryptedFilePath, fileKey);

      // Store encryption key securely (in production, use a key management service)
      const keyMetadata = {
        fileKey: fileKey,
        encryptedAt: new Date().toISOString(),
        userId: userId,
        clientId: clientId
      };

      return {
        encryptedFilePath: encryptedFilePath,
        encryptedFileName: encryptedFileName,
        keyMetadata: keyMetadata,
        originalSize: encryptionResult.originalSize,
        encryptedSize: encryptionResult.encryptedSize
      };
    } catch (error) {
      console.error('File encryption error:', error);
      throw new Error('Failed to encrypt file');
    }
  }

  /**
   * Store file metadata in database
   */
  async storeFileMetadata(file, encryptionResult, scanResult, userId, clientId = null) {
    const base = {
      originalName: file.originalname,
      encryptedFileName: encryptionResult.encryptedFileName,
      encryptedFilePath: encryptionResult.encryptedFilePath,
      fileSize: encryptionResult.originalSize,
      encryptedSize: encryptionResult.encryptedSize,
      mimeType: file.mimetype,
      uploadDate: new Date(),
      uploadedBy: userId,
      clientId: clientId,
      scanResult: {
        isClean: scanResult.isClean,
        assessment: scanResult.assessment,
        threats: scanResult.threats,
        warnings: scanResult.warnings,
        fileHash: scanResult.fileHash
      },
      encryptionMetadata: {
        ...encryptionResult.keyMetadata,
        encryptedAt: new Date()
      },
      status: 'encrypted'
    };

    try {
      if (FileModel && mongoose.connection && mongoose.connection.readyState === 1) {
        const doc = await FileModel.create(base);
        return {
          id: doc._id.toString(),
          originalName: doc.originalName,
          encryptedFileName: doc.encryptedFileName,
          encryptedFilePath: doc.encryptedFilePath,
          fileSize: doc.fileSize,
          encryptedSize: doc.encryptedSize,
          mimeType: doc.mimeType,
          uploadDate: doc.uploadDate.toISOString(),
          uploadedBy: doc.uploadedBy?.toString?.() || doc.uploadedBy,
          clientId: doc.clientId,
          scanResult: doc.scanResult,
          encryptionMetadata: doc.encryptionMetadata,
          status: doc.status
        };
      }
    } catch (err) {
      console.error('Failed to store file metadata in DB, falling back to memory:', err.message);
    }

    // Fallback to in-memory-like object when DB is unavailable
    return {
      id: crypto.randomBytes(16).toString('hex'),
      ...base,
      uploadDate: base.uploadDate.toISOString()
    };
  }

  /**
   * Retrieve and decrypt file
   */
  async retrieveFile(fileMetadata, userId) {
    try {
      // Verify user has access to this file
      if (!this.hasFileAccess(fileMetadata, userId)) {
        throw new Error('Access denied to file');
      }

      // Create temporary decrypted file
      const tempDecryptedPath = path.join(this.tempDirectory, `decrypted_${fileMetadata.originalName}`);
      
      // Decrypt file
      const decryptionResult = await encryptionManager.decryptFile(
        fileMetadata.encryptedFilePath,
        tempDecryptedPath,
        fileMetadata.encryptionMetadata?.fileKey
      );

      // Log access
      await this.logFileAccess(fileMetadata.id, userId, 'download');

      return {
        filePath: tempDecryptedPath,
        originalName: fileMetadata.originalName,
        mimeType: fileMetadata.mimeType,
        size: fileMetadata.fileSize
      };
    } catch (error) {
      console.error('File retrieval error:', error);
      throw new Error('Failed to retrieve file');
    }
  }

  /**
   * Check if user has access to file
   */
  hasFileAccess(fileMetadata, userId) {
    // In production, implement proper access control
    return fileMetadata.uploadedBy === userId || 
           fileMetadata.clientId === userId ||
           this.isAdmin(userId);
  }

  /**
   * Check if user is admin (simplified)
   */
  isAdmin(userId) {
    // In production, check user role from database
    return false;
  }

  /**
   * Log file access
   */
  async logFileAccess(fileId, userId, action) {
    const accessLog = {
      fileId: fileId,
      userId: userId,
      action: action,
      ipAddress: '127.0.0.1'
    };

    if (FileAuditLog && mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        await FileAuditLog.create(accessLog);
        return;
      } catch (err) {
        console.error('Failed to persist file audit log:', err.message);
      }
    }
    console.log('File access logged (memory):', accessLog);
  }

  /**
   * Move file to rejected directory
   */
  async moveToRejected(filePath, reason) {
    try {
      const fileName = path.basename(filePath);
      const rejectedPath = path.join(this.uploadDirectory, 'rejected', fileName);
      await fs.rename(filePath, rejectedPath);
      
      // Log rejection
      console.log(`File moved to rejected: ${fileName}`, reason);
    } catch (error) {
      console.error('Error moving file to rejected:', error);
    }
  }

  /**
   * Clean up temporary file
   */
  async cleanupTempFile(filePath) {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error cleaning up temp file:', error);
    }
  }

  /**
   * Generate secure download URL
   */
  generateSecureDownloadUrl(fileMetadata, userId) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    // Persist token if DB available; otherwise, store in-memory
    this.storeDownloadToken(token, fileMetadata.id, userId, expiresAt).catch(err => {
      console.error('Failed to store download token:', err.message);
    });

    return {
      url: `/api/files/download/${fileMetadata.id}?token=${token}`,
      expiresAt: expiresAt.toISOString(),
      token: token
    };
  }

  /**
   * Validate download token
   */
  validateDownloadToken(token, fileId) {
    return this.validateAndConsumeToken(token, fileId);
  }

  async storeDownloadToken(token, fileId, userId, expiresAt) {
    if (DownloadTokenModel && mongoose.connection && mongoose.connection.readyState === 1) {
      await DownloadTokenModel.create({ token, fileId, userId, expiresAt });
    } else {
      if (!this._memoryTokens) this._memoryTokens = new Map();
      this._memoryTokens.set(token, { fileId, userId, expiresAt, usedAt: null });
    }
  }

  async validateAndConsumeToken(token, fileId) {
    try {
      if (DownloadTokenModel && mongoose.connection && mongoose.connection.readyState === 1) {
        const doc = await DownloadTokenModel.findOne({ token, fileId }).lean();
        if (!doc) return false;
        if (doc.usedAt) return false;
        if (new Date(doc.expiresAt).getTime() < Date.now()) return false;
        // Mark as used
        await DownloadTokenModel.updateOne({ _id: doc._id }, { $set: { usedAt: new Date() } });
        return true;
      } else {
        const mem = this._memoryTokens && this._memoryTokens.get(token);
        if (!mem) return false;
        if (mem.fileId !== fileId) return false;
        if (mem.usedAt) return false;
        if (mem.expiresAt.getTime() < Date.now()) return false;
        mem.usedAt = new Date();
        this._memoryTokens.set(token, mem);
        return true;
      }
    } catch (err) {
      console.error('Error validating download token:', err.message);
      return false;
    }
  }

  /**
   * Cleanup expired or used tokens (DB and in-memory)
   */
  async cleanupExpiredTokens() {
    try {
      if (DownloadTokenModel && mongoose.connection && mongoose.connection.readyState === 1) {
        // Remove tokens that are used or expired (TTL will handle expired, but keep explicit cleanup)
        await DownloadTokenModel.deleteMany({ $or: [ { usedAt: { $ne: null } }, { expiresAt: { $lt: new Date() } } ] });
      }
    } catch (err) {
      console.error('Error cleaning up DB download tokens:', err.message);
    }

    try {
      if (this._memoryTokens) {
        const now = Date.now();
        for (const [tok, rec] of this._memoryTokens.entries()) {
          if (rec.usedAt || rec.expiresAt.getTime() < now) {
            this._memoryTokens.delete(tok);
          }
        }
      }
    } catch (err) {
      console.error('Error cleaning up in-memory tokens:', err.message);
    }
  }

  /**
   * Get file statistics
   */
  async getFileStatistics() {
    try {
      const stats = {
        totalFiles: 0,
        totalSize: 0,
        encryptedFiles: 0,
        rejectedFiles: 0,
        lastUpload: null
      };

      // In production, get from database
      return stats;
    } catch (error) {
      console.error('Error getting file statistics:', error);
      return null;
    }
  }

  /**
   * Clean up expired temporary files
   */
  async cleanupExpiredFiles() {
    try {
      const tempDir = path.join(this.uploadDirectory, 'temp');
      const files = await fs.readdir(tempDir);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          console.log(`Cleaned up expired temp file: ${file}`);
        }
      }
    } catch (error) {
      console.error('Error cleaning up expired files:', error);
    }
  }

  /**
   * Middleware for secure file uploads
   */
  uploadMiddleware() {
    const upload = this.configureMulter();
    
    return (req, res, next) => {
      upload.array('files', this.maxFiles)(req, res, async (err) => {
        if (err) {
          return res.status(400).json({
            success: false,
            message: err.message
          });
        }

        if (!req.files || req.files.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'No files uploaded'
          });
        }

        try {
          // Process files with security checks
          const result = await this.processUploadedFiles(
            req.files,
            req.user?.id || 'anonymous',
            req.body.clientId
          );

          req.processedFiles = result.processedFiles;
          req.rejectedFiles = result.rejectedFiles;

          next();
        } catch (error) {
          console.error('File processing error:', error);
          res.status(500).json({
            success: false,
            message: 'Error processing uploaded files'
          });
        }
      });
    };
  }

  /**
   * Middleware for single file upload
   */
  singleFileUploadMiddleware() {
    const upload = this.configureMulter();
    
    return (req, res, next) => {
      upload.single('file')(req, res, async (err) => {
        if (err) {
          return res.status(400).json({
            success: false,
            message: err.message
          });
        }

        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: 'No file uploaded'
          });
        }

        try {
          // Process single file
          const result = await this.processUploadedFiles(
            [req.file],
            req.user?.id || 'anonymous',
            req.body.clientId
          );

          req.processedFiles = result.processedFiles;
          req.rejectedFiles = result.rejectedFiles;

          next();
        } catch (error) {
          console.error('File processing error:', error);
          res.status(500).json({
            success: false,
            message: 'Error processing uploaded file'
          });
        }
      });
    };
  }
}

// Create singleton instance
const secureFileHandler = new SecureFileHandler();

module.exports = secureFileHandler;
