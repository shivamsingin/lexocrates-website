/**
 * Client-Side Encryption Utility
 * Provides end-to-end encryption where client controls encryption keys
 * Server cannot access file contents - true zero-knowledge storage
 */

class ClientEncryption {
  constructor() {
    this.algorithm = 'AES-GCM';
    this.keyLength = 256;
    this.ivLength = 12; // 96 bits for GCM
    this.tagLength = 16; // 128 bits
  }

  /**
   * Generate a random encryption key
   */
  async generateKey() {
    try {
      const key = await crypto.subtle.generateKey(
        {
          name: this.algorithm,
          length: this.keyLength
        },
        true, // extractable
        ['encrypt', 'decrypt']
      );
      return key;
    } catch (error) {
      console.error('Error generating encryption key:', error);
      throw new Error('Failed to generate encryption key');
    }
  }

  /**
   * Generate a random IV (Initialization Vector)
   */
  generateIV() {
    return crypto.getRandomValues(new Uint8Array(this.ivLength));
  }

  /**
   * Encrypt a file with client-side encryption
   */
  async encryptFile(file) {
    try {
      console.log(`🔐 Encrypting file: ${file.name} (${file.size} bytes)`);

      // Generate encryption key and IV
      const key = await this.generateKey();
      const iv = this.generateIV();

      // Read file as ArrayBuffer
      const fileBuffer = await file.arrayBuffer();

      // Encrypt the file
      const encryptedData = await crypto.subtle.encrypt(
        {
          name: this.algorithm,
          iv: iv,
          tagLength: this.tagLength * 8 // in bits
        },
        key,
        fileBuffer
      );

      // Export the key for storage/transmission
      const exportedKey = await crypto.subtle.exportKey('raw', key);

      // Create encryption metadata
      const encryptionMetadata = {
        algorithm: this.algorithm,
        keyLength: this.keyLength,
        ivLength: this.ivLength,
        tagLength: this.tagLength,
        originalSize: file.size,
        encryptedSize: encryptedData.byteLength,
        timestamp: new Date().toISOString()
      };

      console.log(`✅ File encrypted successfully: ${file.name}`);

      return {
        encryptedData: new Uint8Array(encryptedData),
        key: new Uint8Array(exportedKey),
        iv: iv,
        metadata: encryptionMetadata,
        originalName: file.name,
        mimeType: file.type
      };
    } catch (error) {
      console.error('Error encrypting file:', error);
      throw new Error(`Failed to encrypt file: ${error.message}`);
    }
  }

  /**
   * Decrypt a file (for download)
   */
  async decryptFile(encryptedData, key, iv, originalName) {
    try {
      console.log(`🔓 Decrypting file: ${originalName}`);

      // Import the key
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        {
          name: this.algorithm,
          length: this.keyLength
        },
        false,
        ['decrypt']
      );

      // Decrypt the data
      const decryptedData = await crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv: iv,
          tagLength: this.tagLength * 8
        },
        cryptoKey,
        encryptedData
      );

      // Create a blob from the decrypted data
      const blob = new Blob([decryptedData], { type: this.getMimeType(originalName) });

      console.log(`✅ File decrypted successfully: ${originalName}`);

      return blob;
    } catch (error) {
      console.error('Error decrypting file:', error);
      throw new Error(`Failed to decrypt file: ${error.message}`);
    }
  }

  /**
   * Encrypt multiple files
   */
  async encryptFiles(files) {
    const encryptedFiles = [];
    
    for (const file of files) {
      try {
        const encryptedFile = await this.encryptFile(file);
        encryptedFiles.push(encryptedFile);
      } catch (error) {
        console.error(`Failed to encrypt file ${file.name}:`, error);
        throw error;
      }
    }

    return encryptedFiles;
  }

  /**
   * Get MIME type from filename
   */
  getMimeType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const mimeTypes = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'txt': 'text/plain',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Create a download link for decrypted file
   */
  createDownloadLink(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Validate Web Crypto API support
   */
  isSupported() {
    return typeof crypto !== 'undefined' && 
           crypto.subtle && 
           crypto.getRandomValues &&
           typeof crypto.subtle.generateKey === 'function';
  }

  /**
   * Get encryption status and capabilities
   */
  getStatus() {
    return {
      supported: this.isSupported(),
      algorithm: this.algorithm,
      keyLength: this.keyLength,
      ivLength: this.ivLength,
      tagLength: this.tagLength
    };
  }
}

// Create singleton instance
const clientEncryption = new ClientEncryption();

export default clientEncryption;


