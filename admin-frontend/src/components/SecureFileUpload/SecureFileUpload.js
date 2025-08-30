import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Lock, Shield, AlertCircle, CheckCircle, X } from 'lucide-react';
import clientEncryption from '../../utils/clientEncryption';
import axios from 'axios';

const SecureFileUpload = ({ onUploadComplete, onError, maxFiles = 10, maxSize = 50 * 1024 * 1024 }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadStatus, setUploadStatus] = useState({});
  const [encryptionStatus, setEncryptionStatus] = useState('idle');

  // Check if Web Crypto API is supported
  const cryptoSupported = clientEncryption.isSupported();

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!cryptoSupported) {
      onError('Web Crypto API is not supported in this browser. Please use a modern browser.');
      return;
    }

    if (acceptedFiles.length > maxFiles) {
      onError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setUploading(true);
    setEncryptionStatus('encrypting');

    try {
      const results = [];

      for (const file of acceptedFiles) {
        const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        setUploadStatus(prev => ({
          ...prev,
          [fileId]: { status: 'encrypting', file: file.name, progress: 0 }
        }));

        try {
          // Step 1: Client-side encryption
          console.log(`🔐 Starting encryption for: ${file.name}`);
          const encryptedFile = await clientEncryption.encryptFile(file);
          
          setUploadStatus(prev => ({
            ...prev,
            [fileId]: { status: 'encrypted', file: file.name, progress: 50 }
          }));

          // Step 2: Prepare encrypted data for upload
          const formData = new FormData();
          
          // Convert encrypted data to Blob for upload
          const encryptedBlob = new Blob([encryptedFile.encryptedData], { 
            type: 'application/octet-stream' 
          });
          
          formData.append('encryptedFile', encryptedBlob, `${file.name}.enc`);
          formData.append('encryptionKey', new Blob([encryptedFile.key]), 'key.bin');
          formData.append('iv', new Blob([encryptedFile.iv]), 'iv.bin');
          formData.append('metadata', JSON.stringify({
            originalName: encryptedFile.originalName,
            mimeType: encryptedFile.mimeType,
            originalSize: encryptedFile.metadata.originalSize,
            encryptedSize: encryptedFile.metadata.encryptedSize,
            algorithm: encryptedFile.metadata.algorithm,
            keyLength: encryptedFile.metadata.keyLength,
            ivLength: encryptedFile.metadata.ivLength,
            tagLength: encryptedFile.metadata.tagLength,
            timestamp: encryptedFile.metadata.timestamp
          }));

          setUploadStatus(prev => ({
            ...prev,
            [fileId]: { status: 'uploading', file: file.name, progress: 75 }
          }));

          // Step 3: Upload encrypted file
          const response = await axios.post('/api/files/upload-encrypted', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            onUploadProgress: (progressEvent) => {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(prev => ({
                ...prev,
                [fileId]: progress
              }));
            }
          });

          setUploadStatus(prev => ({
            ...prev,
            [fileId]: { status: 'success', file: file.name, progress: 100 }
          }));

          results.push({
            fileId: response.data.fileId,
            originalName: file.name,
            encryptedName: `${file.name}.enc`,
            size: file.size,
            encryptedSize: encryptedFile.metadata.encryptedSize,
            status: 'success'
          });

          console.log(`✅ File uploaded successfully: ${file.name}`);

        } catch (error) {
          console.error(`❌ Error processing file ${file.name}:`, error);
          
          setUploadStatus(prev => ({
            ...prev,
            [fileId]: { 
              status: 'error', 
              file: file.name, 
              error: error.message 
            }
          }));

          results.push({
            originalName: file.name,
            status: 'error',
            error: error.message
          });
        }
      }

      setEncryptionStatus('completed');
      
      if (onUploadComplete) {
        onUploadComplete(results);
      }

    } catch (error) {
      console.error('Upload error:', error);
      setEncryptionStatus('error');
      if (onError) {
        onError(error.message);
      }
    } finally {
      setUploading(false);
    }
  }, [cryptoSupported, maxFiles, onUploadComplete, onError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: maxFiles,
    maxSize: maxSize,
    disabled: uploading || !cryptoSupported
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'encrypting':
        return <Lock className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'encrypted':
        return <Shield className="h-4 w-4 text-green-500" />;
      case 'uploading':
        return <Upload className="h-4 w-4 text-yellow-500 animate-pulse" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'encrypting':
        return 'Encrypting...';
      case 'encrypted':
        return 'Encrypted';
      case 'uploading':
        return 'Uploading...';
      case 'success':
        return 'Uploaded';
      case 'error':
        return 'Failed';
      default:
        return '';
    }
  };

  if (!cryptoSupported) {
    return (
      <div className="p-6 border-2 border-dashed border-red-300 bg-red-50 rounded-lg">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Web Crypto API Not Supported
          </h3>
          <p className="text-red-600">
            Your browser doesn't support the Web Crypto API required for client-side encryption. 
            Please use a modern browser like Chrome, Firefox, Safari, or Edge.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-400 bg-blue-50'
            : uploading
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
            : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
        }`}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          <div className="flex justify-center">
            {uploading ? (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            ) : (
              <Upload className="h-12 w-12 text-gray-400" />
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {uploading ? 'Processing Files...' : 'Secure File Upload'}
            </h3>
            <p className="text-gray-600">
              {uploading 
                ? 'Files are being encrypted and uploaded securely'
                : 'Drag & drop files here, or click to select files'
              }
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Files are encrypted on your device before upload - server cannot access contents
            </p>
          </div>

          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <Lock className="h-4 w-4" />
            <span>End-to-End Encrypted</span>
            <Shield className="h-4 w-4" />
            <span>Zero-Knowledge Storage</span>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {Object.keys(uploadStatus).length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Upload Progress</h4>
          {Object.entries(uploadStatus).map(([fileId, status]) => (
            <div key={fileId} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              {getStatusIcon(status.status)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {status.file}
                </p>
                <p className="text-xs text-gray-500">
                  {getStatusText(status.status)}
                  {status.error && `: ${status.error}`}
                </p>
              </div>
              {status.progress > 0 && status.progress < 100 && (
                <div className="w-16">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${status.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Encryption Status */}
      {encryptionStatus !== 'idle' && (
        <div className={`p-4 rounded-lg ${
          encryptionStatus === 'completed' 
            ? 'bg-green-50 border border-green-200' 
            : encryptionStatus === 'error'
            ? 'bg-red-50 border border-red-200'
            : 'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex items-center space-x-2">
            {encryptionStatus === 'completed' ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : encryptionStatus === 'error' ? (
              <X className="h-5 w-5 text-red-500" />
            ) : (
              <Lock className="h-5 w-5 text-blue-500 animate-pulse" />
            )}
            <span className={`font-medium ${
              encryptionStatus === 'completed' 
                ? 'text-green-800' 
                : encryptionStatus === 'error'
                ? 'text-red-800'
                : 'text-blue-800'
            }`}>
              {encryptionStatus === 'completed' 
                ? 'All files encrypted and uploaded successfully' 
                : encryptionStatus === 'error'
                ? 'Encryption/upload failed'
                : 'Encrypting files...'
              }
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecureFileUpload;


