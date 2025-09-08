/**
 * Client-Side Decryption Utility
 * Downloads and decrypts files that were encrypted on the client-side
 * Provides true end-to-end encryption with zero-knowledge server
 */

import clientEncryption from './clientEncryption';
import axios from 'axios';

class ClientDecryption {
  constructor() {
    this.algorithm = 'AES-GCM';
    this.keyLength = 256;
  }

  /**
   * Download and decrypt a file
   */
  async downloadAndDecryptFile(fileId) {
    try {
      console.log(`🔓 Starting download and decryption for file: ${fileId}`);

      // Step 1: Get file metadata and decryption keys
      const fileInfo = await this.getFileInfo(fileId);
      
      if (!fileInfo.clientEncrypted) {
        throw new Error('File is not client-encrypted');
      }

      // Step 2: Download encrypted file data
      const encryptedData = await this.downloadEncryptedFile(fileId, fileInfo.downloadUrl);

      // Step 3: Decrypt the file
      const decryptedBlob = await this.decryptFile(
        encryptedData,
        fileInfo.encryptionKey,
        fileInfo.iv,
        fileInfo.originalName
      );

      // Step 4: Create download link
      clientEncryption.createDownloadLink(decryptedBlob, fileInfo.originalName);

      console.log(`✅ File downloaded and decrypted successfully: ${fileInfo.originalName}`);

      return {
        success: true,
        fileName: fileInfo.originalName,
        fileSize: fileInfo.fileSize,
        decryptedSize: decryptedBlob.size
      };

    } catch (error) {
      console.error('Download and decryption error:', error);
      throw new Error(`Failed to download and decrypt file: ${error.message}`);
    }
  }

  /**
   * Get file information and decryption keys
   */
  async getFileInfo(fileId) {
    try {
      const response = await axios.get(`/api/files/encrypted/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get file information');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error getting file info:', error);
      throw new Error(`Failed to get file information: ${error.message}`);
    }
  }

  /**
   * Download encrypted file data
   */
  async downloadEncryptedFile(fileId, downloadUrl) {
    try {
      const response = await axios.get(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        responseType: 'arraybuffer'
      });

      return new Uint8Array(response.data);
    } catch (error) {
      console.error('Error downloading encrypted file:', error);
      throw new Error(`Failed to download encrypted file: ${error.message}`);
    }
  }

  /**
   * Decrypt file data
   */
  async decryptFile(encryptedData, keyBase64, ivBase64, originalName) {
    try {
      // Convert base64 strings back to Uint8Array
      const key = this.base64ToUint8Array(keyBase64);
      const iv = this.base64ToUint8Array(ivBase64);

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
          tagLength: 128 // 16 bytes in bits
        },
        cryptoKey,
        encryptedData
      );

      // Create a blob from the decrypted data
      const blob = new Blob([decryptedData], { 
        type: clientEncryption.getMimeType(originalName) 
      });

      return blob;
    } catch (error) {
      console.error('Error decrypting file:', error);
      throw new Error(`Failed to decrypt file: ${error.message}`);
    }
  }

  /**
   * Convert base64 string to Uint8Array
   */
  base64ToUint8Array(base64String) {
    const binaryString = atob(base64String);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * List all encrypted files
   */
  async listEncryptedFiles(page = 1, limit = 10) {
    try {
      const response = await axios.get(`/api/files?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to list files');
      }

      // Filter for client-encrypted files
      const encryptedFiles = response.data.data.files.filter(file => file.clientEncrypted);

      return {
        files: encryptedFiles,
        pagination: response.data.data.pagination
      };
    } catch (error) {
      console.error('Error listing encrypted files:', error);
      throw new Error(`Failed to list encrypted files: ${error.message}`);
    }
  }

  /**
   * Get file statistics
   */
  async getFileStats() {
    try {
      const response = await axios.get('/api/files/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get file statistics');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error getting file stats:', error);
      throw new Error(`Failed to get file statistics: ${error.message}`);
    }
  }

  /**
   * Validate Web Crypto API support
   */
  isSupported() {
    return clientEncryption.isSupported();
  }

  /**
   * Get decryption status and capabilities
   */
  getStatus() {
    return {
      supported: this.isSupported(),
      algorithm: this.algorithm,
      keyLength: this.keyLength
    };
  }
}

// Create singleton instance
const clientDecryption = new ClientDecryption();

export default clientDecryption;









