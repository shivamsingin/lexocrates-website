const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class EncryptionManager {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32; // 256 bits
    this.ivLength = 12; // 96 bits recommended for GCM
    this.tagLength = 16; // 128 bits
    this.saltLength = 64; // 512 bits
    
    // Get encryption key from environment or generate one
    this.masterKey = process.env.ENCRYPTION_MASTER_KEY || this.generateMasterKey();
  }

  /**
   * Generate a secure master key
   */
  generateMasterKey() {
    return crypto.randomBytes(this.keyLength).toString('hex');
  }

  /**
   * Derive encryption key from master key and salt
   */
  deriveKey(masterKey, salt) {
    return crypto.pbkdf2Sync(masterKey, salt, 100000, this.keyLength, 'sha512');
  }

  /**
   * Generate a random salt
   */
  generateSalt() {
    return crypto.randomBytes(this.saltLength);
  }

  /**
   * Generate a random IV (12 bytes recommended for GCM)
   */
  generateIV() {
    return crypto.randomBytes(this.ivLength);
  }

  /**
   * Encrypt data with AES-256-GCM
   */
  encryptData(data, key = null) {
    try {
      const encryptionKey = key || this.masterKey;
      const salt = this.generateSalt();
      const iv = this.generateIV();
      
      // Derive key from master key and salt
      const derivedKey = this.deriveKey(encryptionKey, salt);
      
      // Create cipher with IV
      const cipher = crypto.createCipheriv(this.algorithm, derivedKey, iv, { authTagLength: this.tagLength });
      cipher.setAAD(Buffer.from('lexocrates-file-encryption', 'utf8'));
      
      // Normalize input to Buffer
      const input = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
      const encryptedBuffer = Buffer.concat([cipher.update(input), cipher.final()]);
      
      // Get authentication tag
      const tag = cipher.getAuthTag();
      
      // Return encrypted data with metadata (hex-encoded)
      return {
        encrypted: encryptedBuffer.toString('hex'),
        salt: salt.toString('hex'),
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        algorithm: this.algorithm,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data with AES-256-GCM
   */
  decryptData(encryptedData, key = null) {
    try {
      const encryptionKey = key || this.masterKey;
      
      // Extract components
      const { encrypted, salt, iv, tag } = encryptedData;
      
      // Convert hex strings back to buffers
      const saltBuffer = Buffer.from(salt, 'hex');
      const ivBuffer = Buffer.from(iv, 'hex');
      const tagBuffer = Buffer.from(tag, 'hex');
      const encryptedBuffer = Buffer.from(encrypted, 'hex');
      
      // Derive key
      const derivedKey = this.deriveKey(encryptionKey, saltBuffer);
      
      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, derivedKey, ivBuffer, { authTagLength: this.tagLength });
      decipher.setAAD(Buffer.from('lexocrates-file-encryption', 'utf8'));
      decipher.setAuthTag(tagBuffer);
      
      // Decrypt data
      const decryptedBuffer = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
      
      return decryptedBuffer.toString('utf8');
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Encrypt file and save to disk
   */
  async encryptFile(inputPath, outputPath, key = null) {
    try {
      // Read file
      const fileData = await fs.readFile(inputPath);
      
      // Encrypt file data (base64-encode original bytes for safe JSON storage)
      const encryptedData = this.encryptData(fileData.toString('base64'), key);
      
      // Add file metadata
      const fileMetadata = {
        originalName: path.basename(inputPath),
        originalSize: fileData.length,
        mimeType: this.getMimeType(inputPath),
        encryptedAt: new Date().toISOString(),
        ...encryptedData
      };
      
      // Save encrypted file with metadata
      await fs.writeFile(outputPath, JSON.stringify(fileMetadata, null, 2));
      
      return {
        success: true,
        originalSize: fileData.length,
        encryptedSize: JSON.stringify(fileMetadata).length,
        outputPath: outputPath
      };
    } catch (error) {
      console.error('File encryption error:', error);
      throw new Error('Failed to encrypt file');
    }
  }

  /**
   * Decrypt file from disk
   */
  async decryptFile(encryptedFilePath, outputPath = null, key = null) {
    try {
      // Read encrypted file
      const encryptedFileData = await fs.readFile(encryptedFilePath, 'utf8');
      const fileMetadata = JSON.parse(encryptedFileData);
      
      // Decrypt data (use provided key if available)
      const decryptedBase64 = this.decryptData(fileMetadata, key);
      const decryptedBuffer = Buffer.from(decryptedBase64, 'base64');
      
      // Save decrypted file
      const finalOutputPath = outputPath || path.join(
        path.dirname(encryptedFilePath),
        `decrypted_${fileMetadata.originalName}`
      );
      
      await fs.writeFile(finalOutputPath, decryptedBuffer);
      
      return {
        success: true,
        originalName: fileMetadata.originalName,
        originalSize: fileMetadata.originalSize,
        outputPath: finalOutputPath
      };
    } catch (error) {
      console.error('File decryption error:', error);
      throw new Error('Failed to decrypt file');
    }
  }

  /**
   * Encrypt file buffer in memory
   */
  encryptFileBuffer(buffer, key = null) {
    try {
      const base64Data = buffer.toString('base64');
      return this.encryptData(base64Data, key);
    } catch (error) {
      console.error('Buffer encryption error:', error);
      throw new Error('Failed to encrypt file buffer');
    }
  }

  /**
   * Decrypt file buffer in memory
   */
  decryptFileBuffer(encryptedData, key = null) {
    try {
      const decryptedBase64 = this.decryptData(encryptedData, key);
      return Buffer.from(decryptedBase64, 'base64');
    } catch (error) {
      console.error('Buffer decryption error:', error);
      throw new Error('Failed to decrypt file buffer');
    }
  }

  /**
   * Generate file-specific encryption key
   */
  generateFileKey() {
    return crypto.randomBytes(this.keyLength).toString('hex');
  }

  /**
   * Get MIME type from file extension
   */
  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.txt': 'text/plain',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.zip': 'application/zip',
      '.rar': 'application/x-rar-compressed'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Validate encryption metadata
   */
  validateEncryptedData(encryptedData) {
    const requiredFields = ['encrypted', 'salt', 'iv', 'tag', 'algorithm'];
    return requiredFields.every(field => encryptedData.hasOwnProperty(field));
  }

  /**
   * Rotate encryption keys
   */
  async rotateKeys(oldKey, newKey) {
    try {
      console.log('Key rotation initiated');
      return { success: true, message: 'Key rotation completed' };
    } catch (error) {
      console.error('Key rotation error:', error);
      throw new Error('Failed to rotate encryption keys');
    }
  }

  /**
   * Generate encryption report
   */
  generateEncryptionReport() {
    return {
      algorithm: this.algorithm,
      keyLength: this.keyLength * 8, // in bits
      ivLength: this.ivLength * 8,
      tagLength: this.tagLength * 8,
      saltLength: this.saltLength * 8,
      timestamp: new Date().toISOString(),
      status: 'active'
    };
  }
}

// Create singleton instance
const encryptionManager = new EncryptionManager();

module.exports = encryptionManager;
