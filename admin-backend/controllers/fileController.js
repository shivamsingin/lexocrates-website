const secureFileHandler = require('../middleware/secureFileHandler');
const encryptionManager = require('../utils/encryption');
const malwareScanner = require('../utils/malwareScanner');
const path = require('path');
const fs = require('fs').promises;
const mongoose = require('mongoose');
const crypto = require('crypto');
let FileModel;
try {
  FileModel = require('../models/File');
} catch (_) {
  FileModel = null;
}
let FileAuditLog;
try { FileAuditLog = require('../models/FileAuditLog'); } catch (_) { FileAuditLog = null; }

// Simple in-memory file store for local testing
const inMemoryFiles = new Map();

// @desc    Upload files securely
// @route   POST /api/files/upload
// @access  Private
const uploadFiles = async (req, res) => {
  try {
    if (!req.processedFiles || req.processedFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files were successfully processed'
      });
    }

    // Ensure rejectedFiles exists to avoid undefined access
    if (!Array.isArray(req.rejectedFiles)) {
      req.rejectedFiles = [];
    }

    // Store uploaded file metadata in-memory so we can fetch/download it later in this session
    for (const file of req.processedFiles) {
      inMemoryFiles.set(file.id, file);
    }

    const response = {
      success: true,
      message: 'Files uploaded and processed successfully',
      data: {
        uploaded: req.processedFiles.map(file => ({
          id: file.id,
          originalName: file.originalName,
          fileSize: file.fileSize,
          mimeType: file.mimeType,
          uploadDate: file.uploadDate,
          scanResult: {
            isClean: file.scanResult.isClean,
            assessment: file.scanResult.assessment
          }
        })),
        rejected: req.rejectedFiles.map(file => ({
          originalName: file.originalName,
          reason: file.reason,
          threats: file.threats || [],
          warnings: file.warnings || []
        }))
      }
    };

    // Add summary statistics
    response.data.summary = {
      totalUploaded: req.processedFiles.length,
      totalRejected: req.rejectedFiles.length,
      totalFiles: req.processedFiles.length + req.rejectedFiles.length
    };

    res.status(200).json(response);

    // Audit uploads
    try {
      if (FileAuditLog && mongoose.connection && mongoose.connection.readyState === 1) {
        const userId = req.user?.id;
        const entries = req.processedFiles.map(f => ({ fileId: f.id, userId, action: 'upload' }));
        if (entries.length) {
          await FileAuditLog.insertMany(entries);
        }
      }
    } catch (e) {
      console.error('Audit log (upload) failed:', e.message);
    }
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing file upload'
    });
  }
};

// @desc    Download file securely
// @route   GET /api/files/download/:fileId
// @access  Private
const downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Missing download token'
      });
    }

    // RBAC: ensure user has permission to download files unless it's their own
    const isOwner = true; // Checked later after metadata fetch; pre-check minimal

    // Validate download token (one-time)
    if (!await secureFileHandler.validateDownloadToken(token, fileId)) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired download token'
      });
    }

    // Get file metadata (DB when available, else memory)
    const fileMetadata = await getFileMetadata(fileId);
    if (!fileMetadata) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check user access and permissions
    if (!secureFileHandler.hasFileAccess(fileMetadata, req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to file'
      });
    }

    // Additional role-based check: require permission for downloads unless owner
    const { PermissionManager } = require('../utils/permissions');
    const isFileOwner = fileMetadata.uploadedBy === (req.user.id?.toString?.() || req.user.id);
    const hasDownloadPermission = PermissionManager.userHasAnyPermission(req.user, ['manage_files', 'manage_content']);
    if (!isFileOwner && !hasDownloadPermission) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to download this file'
      });
    }

    // Retrieve and decrypt file
    const fileData = await secureFileHandler.retrieveFile(fileMetadata, req.user.id);

    // Set response headers
    res.setHeader('Content-Type', fileData.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileData.originalName}"`);
    res.setHeader('Content-Length', fileData.size);
    res.setHeader('X-File-ID', fileId);
    res.setHeader('X-Original-Name', fileData.originalName);

    // Stream file to response
    const fsNative = require('fs');
    if (!fsNative.existsSync(fileData.filePath)) {
      return res.status(410).json({
        success: false,
        message: 'File no longer available'
      });
    }

    const fileStream = fsNative.createReadStream(fileData.filePath);
    fileStream.on('error', (err) => {
      console.error('Stream error while sending file:', err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Error streaming file' });
      } else {
        res.end();
      }
    });

    fileStream.pipe(res);

    // Clean up temporary file after streaming
    const cleanupTemp = async () => {
      try {
        await fs.unlink(fileData.filePath);
      } catch (error) {
        if (error && error.code !== 'ENOENT') {
          console.error('Error cleaning up temp file:', error);
        }
      }
    };

    fileStream.on('end', cleanupTemp);
    res.on('close', cleanupTemp);

    // Audit download
    try {
      if (FileAuditLog && mongoose.connection && mongoose.connection.readyState === 1) {
        await FileAuditLog.create({ fileId: fileId, userId: req.user?.id, action: 'download' });
      }
    } catch (e) {
      console.error('Audit log (download) failed:', e.message);
    }

  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading file'
    });
  }
};

// @desc    Get file information
// @route   GET /api/files/:fileId
// @access  Private
const getFileInfo = async (req, res) => {
  try {
    const { fileId } = req.params;

    // Get file metadata (DB when available, else memory)
    const fileMetadata = await getFileMetadata(fileId);
    if (!fileMetadata) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check user access
    if (!secureFileHandler.hasFileAccess(fileMetadata, req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to file'
      });
    }

    // Generate secure download URL
    const downloadUrl = secureFileHandler.generateSecureDownloadUrl(fileMetadata, req.user.id);

    const response = {
      success: true,
      data: {
        id: fileMetadata.id,
        originalName: fileMetadata.originalName,
        fileSize: fileMetadata.fileSize,
        mimeType: fileMetadata.mimeType,
        uploadDate: fileMetadata.uploadDate,
        uploadedBy: fileMetadata.uploadedBy,
        clientId: fileMetadata.clientId,
        status: fileMetadata.status,
        scanResult: {
          isClean: fileMetadata.scanResult.isClean,
          assessment: fileMetadata.scanResult.assessment,
          threats: fileMetadata.scanResult.threats,
          warnings: fileMetadata.scanResult.warnings
        },
        downloadUrl: downloadUrl.url,
        downloadExpires: downloadUrl.expiresAt
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get file info error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving file information'
    });
  }
};

// @desc    List user's files
// @route   GET /api/files
// @access  Private
const listFiles = async (req, res) => {
  try {
    const { sortBy = 'uploadDate', sortOrder = 'desc' } = req.query;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    
    // Prefer DB when available
    let files = [];
    let total = 0;
    if (FileModel && mongoose.connection && mongoose.connection.readyState === 1) {
      const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
      const query = { uploadedBy: req.user.id };
      total = await FileModel.countDocuments(query);
      const docs = await FileModel.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
      files = docs.map(doc => ({
        id: doc._id.toString(),
        originalName: doc.originalName,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        uploadDate: doc.uploadDate.toISOString(),
        status: doc.status,
        scanResult: {
          isClean: doc.scanResult?.isClean,
          assessment: doc.scanResult?.assessment
        }
      }));
    } else {
      // In-memory list filtered by uploader
      const all = Array.from(inMemoryFiles.values()).filter(f => f.uploadedBy === req.user.id);
      total = all.length;
      const pageSlice = all
                     .sort((a, b) => {
                       const aVal = a[sortBy];
                       const bVal = b[sortBy];
                       if (aVal === bVal) return 0;
                       if (sortOrder === 'asc') return aVal > bVal ? 1 : -1;
                       return aVal < bVal ? 1 : -1;
                     })
                     .slice((page - 1) * limit, (page - 1) * limit + limit);
      files = pageSlice.map(file => ({
        id: file.id,
        originalName: file.originalName,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
        uploadDate: file.uploadDate,
        status: file.status,
        scanResult: {
          isClean: file.scanResult.isClean,
          assessment: file.scanResult.assessment
        }
      }));
    }

    const response = {
      success: true,
      data: {
        files,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving files'
    });
  }
};

// @desc    Delete file
// @route   DELETE /api/files/:fileId
// @access  Private
const deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    // Get file metadata (DB when available, else memory)
    const fileMetadata = await getFileMetadata(fileId);
    if (!fileMetadata) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check user access
    if (!secureFileHandler.hasFileAccess(fileMetadata, req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to file'
      });
    }

    // Delete encrypted file
    try {
      await fs.unlink(fileMetadata.encryptedFilePath);
    } catch (e) {
      if (e && e.code !== 'ENOENT') {
        throw e;
      }
    }

    // Remove metadata from database or memory
    await deleteFileMetadata(fileId);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });

    // Audit delete
    try {
      if (FileAuditLog && mongoose.connection && mongoose.connection.readyState === 1) {
        await FileAuditLog.create({ fileId: fileId, userId: req.user?.id, action: 'delete' });
      }
    } catch (e) {
      console.error('Audit log (delete) failed:', e.message);
    }
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting file'
    });
  }
};

// @desc    Scan file for malware
// @route   POST /api/files/scan
// @access  Private
const scanFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided for scanning'
      });
    }

    // Scan file for malware
    const scanResult = await malwareScanner.scanFile(req.file.path, req.file.buffer);

    // Clean up uploaded file
    await fs.unlink(req.file.path);

    res.json({
      success: true,
      data: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        scanResult: {
          isClean: scanResult.isClean,
          assessment: scanResult.assessment,
          threats: scanResult.threats,
          warnings: scanResult.warnings,
          recommendation: scanResult.recommendation
        },
        fileHash: scanResult.fileHash
      }
    });
  } catch (error) {
    console.error('File scan error:', error);
    res.status(500).json({
      success: false,
      message: 'Error scanning file'
    });
  }
};

// @desc    Get file statistics
// @route   GET /api/files/stats
// @access  Private/Admin
const getFileStats = async (req, res) => {
  try {
    let stats;
    if (FileModel && mongoose.connection && mongoose.connection.readyState === 1) {
      const totalFiles = await FileModel.countDocuments({});
      const sizeAgg = await FileModel.aggregate([
        { $group: { _id: null, total: { $sum: '$fileSize' } } }
      ]);
      const encryptedCount = await FileModel.countDocuments({ status: 'encrypted' });
      const rejectedCount = await FileModel.countDocuments({ status: 'rejected' });
      const last = await FileModel.findOne({}).sort({ uploadDate: -1 }).lean();
      stats = {
        totalFiles,
        totalSize: sizeAgg[0]?.total || 0,
        encryptedFiles: encryptedCount,
        rejectedFiles: rejectedCount,
        lastUpload: last?.uploadDate?.toISOString() || null
      };
    } else {
      stats = {
        totalFiles: inMemoryFiles.size,
        totalSize: Array.from(inMemoryFiles.values()).reduce((a,b)=>a + (b.fileSize||0), 0),
        encryptedFiles: inMemoryFiles.size,
        rejectedFiles: 0,
        lastUpload: Array.from(inMemoryFiles.values()).sort((a,b)=> (a.uploadDate < b.uploadDate) ? 1 : -1)[0]?.uploadDate || null
      };
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get file stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving file statistics'
    });
  }
};

// @desc    Generate encryption report
// @route   GET /api/files/encryption-report
// @access  Private/Admin
const getEncryptionReport = async (req, res) => {
  try {
    const report = encryptionManager.generateEncryptionReport();

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Get encryption report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating encryption report'
    });
  }
};

// @desc    Clean up expired files
// @route   POST /api/files/cleanup
// @access  Private/Admin
const cleanupExpiredFiles = async (req, res) => {
  try {
    await secureFileHandler.cleanupExpiredFiles();

    res.json({
      success: true,
      message: 'Expired files cleaned up successfully'
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cleaning up expired files'
    });
  }
};

// @desc    Upload encrypted files (client-side encrypted)
// @route   POST /api/files/upload-encrypted
// @access  Private
const uploadEncryptedFiles = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No encrypted file provided'
      });
    }

    // Extract encryption metadata
    const metadata = JSON.parse(req.body.metadata);
    const encryptionKey = req.files.encryptionKey?.[0];
    const iv = req.files.iv?.[0];

    if (!encryptionKey || !iv) {
      return res.status(400).json({
        success: false,
        message: 'Missing encryption key or IV'
      });
    }

    // Generate unique file ID
    const fileId = crypto.randomBytes(16).toString('hex');
    
    // Create encrypted file path
    const encryptedFileName = `${fileId}_${metadata.originalName}.enc`;
    const encryptedFilePath = path.join(process.env.ENCRYPTED_DIRECTORY || 'encrypted', encryptedFileName);

    // Store encrypted file (server cannot decrypt - zero knowledge)
    await fs.writeFile(encryptedFilePath, req.file.buffer);

    // Store encryption metadata separately (encrypted with server key for key management)
    const keyMetadata = {
      fileId: fileId,
      originalName: metadata.originalName,
      mimeType: metadata.mimeType,
      originalSize: metadata.originalSize,
      encryptedSize: metadata.encryptedSize,
      algorithm: metadata.algorithm,
      keyLength: metadata.keyLength,
      ivLength: metadata.ivLength,
      tagLength: metadata.tagLength,
      uploadDate: new Date().toISOString(),
      uploadedBy: req.user.id,
      // Store encrypted key and IV (encrypted with server master key)
      encryptedKey: encryptionManager.encryptData(encryptionKey.buffer.toString('base64')),
      encryptedIV: encryptionManager.encryptData(iv.buffer.toString('base64'))
    };

    // Store metadata in database or memory
    const fileMetadata = await storeEncryptedFileMetadata(keyMetadata);

    // Store in memory for session access
    inMemoryFiles.set(fileId, {
      id: fileId,
      originalName: metadata.originalName,
      encryptedFileName: encryptedFileName,
      encryptedFilePath: encryptedFilePath,
      fileSize: metadata.originalSize,
      encryptedSize: metadata.encryptedSize,
      mimeType: metadata.mimeType,
      uploadDate: new Date().toISOString(),
      uploadedBy: req.user.id,
      status: 'encrypted',
      clientEncrypted: true,
      keyMetadata: keyMetadata
    });

    // Audit upload
    try {
      if (FileAuditLog && mongoose.connection && mongoose.connection.readyState === 1) {
        await FileAuditLog.create({ 
          fileId: fileId, 
          userId: req.user?.id, 
          action: 'upload_encrypted' 
        });
      }
    } catch (e) {
      console.error('Audit log (encrypted upload) failed:', e.message);
    }

    res.status(200).json({
      success: true,
      message: 'Encrypted file uploaded successfully',
      data: {
        fileId: fileId,
        originalName: metadata.originalName,
        encryptedName: encryptedFileName,
        originalSize: metadata.originalSize,
        encryptedSize: metadata.encryptedSize,
        uploadDate: new Date().toISOString(),
        clientEncrypted: true
      }
    });

  } catch (error) {
    console.error('Encrypted file upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing encrypted file upload'
    });
  }
};

// @desc    Download encrypted file (returns encrypted data for client decryption)
// @route   GET /api/files/download-encrypted/:fileId
// @access  Private
const downloadEncryptedFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Missing download token'
      });
    }

    // Validate download token
    if (!await secureFileHandler.validateDownloadToken(token, fileId)) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired download token'
      });
    }

    // Get file metadata
    const fileMetadata = await getFileMetadata(fileId);
    if (!fileMetadata) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check user access
    if (!secureFileHandler.hasFileAccess(fileMetadata, req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to file'
      });
    }

    // Verify this is a client-encrypted file
    if (!fileMetadata.clientEncrypted) {
      return res.status(400).json({
        success: false,
        message: 'File is not client-encrypted'
      });
    }

    // Read encrypted file
    const encryptedData = await fs.readFile(fileMetadata.encryptedFilePath);

    // Return encrypted data for client-side decryption
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileMetadata.originalName}.enc"`);
    res.setHeader('Content-Length', encryptedData.length);
    res.setHeader('X-File-ID', fileId);
    res.setHeader('X-Original-Name', fileMetadata.originalName);
    res.setHeader('X-Client-Encrypted', 'true');

    res.send(encryptedData);

    // Audit download
    try {
      if (FileAuditLog && mongoose.connection && mongoose.connection.readyState === 1) {
        await FileAuditLog.create({ fileId: fileId, userId: req.user?.id, action: 'download_encrypted' });
      }
    } catch (e) {
      console.error('Audit log (encrypted download) failed:', e.message);
    }

  } catch (error) {
    console.error('Encrypted file download error:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading encrypted file'
    });
  }
};

// @desc    Get encrypted file metadata (for client-side decryption)
// @route   GET /api/files/encrypted/:fileId
// @access  Private
const getEncryptedFileInfo = async (req, res) => {
  try {
    const { fileId } = req.params;

    // Get file metadata
    const fileMetadata = await getFileMetadata(fileId);
    if (!fileMetadata) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check user access
    if (!secureFileHandler.hasFileAccess(fileMetadata, req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to file'
      });
    }

    // Verify this is a client-encrypted file
    if (!fileMetadata.clientEncrypted) {
      return res.status(400).json({
        success: false,
        message: 'File is not client-encrypted'
      });
    }

    // Decrypt key and IV for client
    const decryptedKey = encryptionManager.decryptData(fileMetadata.keyMetadata.encryptedKey);
    const decryptedIV = encryptionManager.decryptData(fileMetadata.keyMetadata.encryptedIV);

    // Generate secure download URL
    const downloadUrl = secureFileHandler.generateSecureDownloadUrl(fileMetadata, req.user.id);

    const response = {
      success: true,
      data: {
        id: fileMetadata.id,
        originalName: fileMetadata.originalName,
        fileSize: fileMetadata.fileSize,
        encryptedSize: fileMetadata.encryptedSize,
        mimeType: fileMetadata.mimeType,
        uploadDate: fileMetadata.uploadDate,
        uploadedBy: fileMetadata.uploadedBy,
        clientEncrypted: true,
        // Return encrypted key and IV for client-side decryption
        encryptionKey: decryptedKey, // Base64 encoded
        iv: decryptedIV, // Base64 encoded
        algorithm: fileMetadata.keyMetadata.algorithm,
        keyLength: fileMetadata.keyMetadata.keyLength,
        ivLength: fileMetadata.keyMetadata.ivLength,
        tagLength: fileMetadata.keyMetadata.tagLength,
        downloadUrl: downloadUrl.url,
        downloadExpires: downloadUrl.expiresAt
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get encrypted file info error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving encrypted file information'
    });
  }
};

// Helper functions (in production, these would interact with database)

/**
 * Get file metadata from database
 */
async function getFileMetadata(fileId) {
  if (FileModel && mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const doc = await FileModel.findById(fileId).lean();
      if (!doc) return null;
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
    } catch (err) {
      console.error('Error fetching file from DB:', err.message);
      return null;
    }
  }
  // In-memory store lookup
  return inMemoryFiles.get(fileId) || null;
}

/**
 * Get user files with pagination
 */
async function getUserFiles(userId, options) {
  if (FileModel && mongoose.connection && mongoose.connection.readyState === 1) {
    const { page = 1, limit = 10, sortBy = 'uploadDate', sortOrder = 'desc' } = options || {};
    const query = { uploadedBy: userId };
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const docs = await FileModel.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    return docs.map(doc => ({
      id: doc._id.toString(),
      originalName: doc.originalName,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      uploadDate: doc.uploadDate.toISOString(),
      status: doc.status,
      scanResult: doc.scanResult
    }));
  }
  // In-memory
  return Array.from(inMemoryFiles.values()).filter(f => f.uploadedBy === userId);
}

/**
 * Delete file metadata from database
 */
async function deleteFileMetadata(fileId) {
  if (FileModel && mongoose.connection && mongoose.connection.readyState === 1) {
    await FileModel.deleteOne({ _id: fileId });
    return;
  }
  inMemoryFiles.delete(fileId);
}

/**
 * Store encrypted file metadata in database or memory
 */
async function storeEncryptedFileMetadata(keyMetadata) {
  if (FileModel && mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const doc = await FileModel.create({
        originalName: keyMetadata.originalName,
        encryptedFileName: `${keyMetadata.fileId}_${keyMetadata.originalName}.enc`,
        encryptedFilePath: path.join(process.env.ENCRYPTED_DIRECTORY || 'encrypted', `${keyMetadata.fileId}_${keyMetadata.originalName}.enc`),
        fileSize: keyMetadata.originalSize,
        encryptedSize: keyMetadata.encryptedSize,
        mimeType: keyMetadata.mimeType,
        uploadDate: new Date(keyMetadata.uploadDate),
        uploadedBy: keyMetadata.uploadedBy,
        clientEncrypted: true,
        encryptionMetadata: {
          algorithm: keyMetadata.algorithm,
          keyLength: keyMetadata.keyLength,
          ivLength: keyMetadata.ivLength,
          tagLength: keyMetadata.tagLength,
          encryptedKey: keyMetadata.encryptedKey,
          encryptedIV: keyMetadata.encryptedIV,
          encryptedAt: keyMetadata.uploadDate
        },
        status: 'encrypted'
      });
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
        clientEncrypted: doc.clientEncrypted,
        keyMetadata: doc.encryptionMetadata,
        status: doc.status
      };
    } catch (err) {
      console.error('Error storing encrypted file metadata in DB:', err.message);
    }
  }
  
  // Fallback to in-memory storage
  return {
    id: keyMetadata.fileId,
    originalName: keyMetadata.originalName,
    encryptedFileName: `${keyMetadata.fileId}_${keyMetadata.originalName}.enc`,
    encryptedFilePath: path.join(process.env.ENCRYPTED_DIRECTORY || 'encrypted', `${keyMetadata.fileId}_${keyMetadata.originalName}.enc`),
    fileSize: keyMetadata.originalSize,
    encryptedSize: keyMetadata.encryptedSize,
    mimeType: keyMetadata.mimeType,
    uploadDate: keyMetadata.uploadDate,
    uploadedBy: keyMetadata.uploadedBy,
    clientEncrypted: true,
    keyMetadata: keyMetadata,
    status: 'encrypted'
  };
}

module.exports = {
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
};
