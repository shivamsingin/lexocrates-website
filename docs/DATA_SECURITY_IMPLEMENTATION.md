# Data Security & File Handling Implementation

## Overview

This document outlines the comprehensive data security and file handling system implemented for Lexocrates, including AES-256 encryption, malware scanning, and end-to-end encryption for file transfers.

## Features Implemented

### 1. File Encryption at Rest
- **AES-256-GCM Encryption**: Military-grade encryption for all stored files
- **Key Derivation**: PBKDF2 with 100,000 iterations for key generation
- **File-Specific Keys**: Each file gets its own encryption key
- **Metadata Protection**: File metadata encrypted alongside content

### 2. Malware Scanning
- **Multi-Layer Scanning**: File extension, headers, content, and deep scanning
- **Threat Detection**: Identifies malicious patterns and known threats
- **Real-time Scanning**: Immediate threat assessment on upload
- **Comprehensive Reporting**: Detailed scan results and recommendations

### 3. End-to-End Encryption
- **Secure File Transfers**: Encrypted transmission and storage
- **Access Control**: Role-based file access permissions
- **Secure Download URLs**: Time-limited, token-based downloads
- **Audit Trail**: Complete file access logging

## File Structure

```
admin-backend/
├── utils/
│   ├── encryption.js              # AES-256 encryption manager
│   └── malwareScanner.js          # Malware scanning utility
├── middleware/
│   └── secureFileHandler.js       # Secure file handling middleware
├── controllers/
│   └── fileController.js          # File operations controller
├── routes/
│   └── files.js                   # File API routes
├── uploads/                       # File storage directories
│   ├── temp/                      # Temporary uploads
│   ├── processed/                 # Processed files
│   └── rejected/                  # Rejected files
├── encrypted/                     # Encrypted file storage
└── temp/                          # Temporary decrypted files
```

## Security Architecture

### Encryption Flow

```
1. File Upload → 2. Malware Scan → 3. Encryption → 4. Secure Storage
     ↓                ↓                ↓              ↓
   Validation    Threat Detection   AES-256-GCM    Encrypted File
   & Sanitize    & Assessment       Encryption     + Metadata
```

### File Processing Pipeline

```
Upload → Validate → Scan → Encrypt → Store → Log
  ↓        ↓        ↓       ↓        ↓      ↓
Multer  Security  Malware  AES-256  Secure  Audit
Config  Checks    Scanner  GCM      Storage Trail
```

## API Endpoints

### File Upload & Management

#### 1. Upload Files
```http
POST /api/files/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

{
  "files": [File1, File2, ...],
  "clientId": "optional_client_id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Files uploaded and processed successfully",
  "data": {
    "uploaded": [
      {
        "id": "file_id",
        "originalName": "document.pdf",
        "fileSize": 1048576,
        "mimeType": "application/pdf",
        "uploadDate": "2024-08-26T10:30:00Z",
        "scanResult": {
          "isClean": true,
          "assessment": "CLEAN"
        }
      }
    ],
    "rejected": [
      {
        "originalName": "malicious.exe",
        "reason": "Security threats detected",
        "threats": ["File extension '.exe' is not allowed"]
      }
    ],
    "summary": {
      "totalUploaded": 1,
      "totalRejected": 1,
      "totalFiles": 2
    }
  }
}
```

#### 2. Download File
```http
GET /api/files/download/:fileId?token=<download_token>
Authorization: Bearer <token>
```

**Response:** File stream with headers:
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="document.pdf"
Content-Length: 1048576
X-File-ID: file_id
X-Original-Name: document.pdf
```

#### 3. Get File Information
```http
GET /api/files/:fileId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "file_id",
    "originalName": "document.pdf",
    "fileSize": 1048576,
    "mimeType": "application/pdf",
    "uploadDate": "2024-08-26T10:30:00Z",
    "uploadedBy": "user123",
    "clientId": "client456",
    "status": "encrypted",
    "scanResult": {
      "isClean": true,
      "assessment": "CLEAN",
      "threats": [],
      "warnings": []
    },
    "downloadUrl": "/api/files/download/file_id?token=abc123",
    "downloadExpires": "2024-08-26T11:30:00Z"
  }
}
```

#### 4. List Files
```http
GET /api/files?page=1&limit=10&sortBy=uploadDate&sortOrder=desc
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "id": "file1",
        "originalName": "document1.pdf",
        "fileSize": 1048576,
        "mimeType": "application/pdf",
        "uploadDate": "2024-08-26T10:30:00Z",
        "status": "encrypted",
        "scanResult": {
          "isClean": true,
          "assessment": "CLEAN"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

#### 5. Delete File
```http
DELETE /api/files/:fileId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

### Security & Scanning

#### 6. Scan File for Malware
```http
POST /api/files/scan
Content-Type: multipart/form-data
Authorization: Bearer <token>

{
  "file": File
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fileName": "test.pdf",
    "fileSize": 1048576,
    "scanResult": {
      "isClean": true,
      "assessment": "CLEAN",
      "threats": [],
      "warnings": [],
      "recommendation": "ACCEPT_FILE"
    },
    "fileHash": {
      "md5": "d41d8cd98f00b204e9800998ecf8427e",
      "sha1": "da39a3ee5e6b4b0d3255bfef95601890afd80709",
      "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    }
  }
}
```

### Admin Endpoints

#### 7. Get File Statistics
```http
GET /api/files/stats
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalFiles": 100,
    "totalSize": 1073741824,
    "encryptedFiles": 100,
    "rejectedFiles": 5,
    "lastUpload": "2024-08-26T10:30:00Z"
  }
}
```

#### 8. Get Encryption Report
```http
GET /api/files/encryption-report
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "algorithm": "aes-256-gcm",
    "keyLength": 256,
    "ivLength": 128,
    "tagLength": 128,
    "saltLength": 512,
    "timestamp": "2024-08-26T10:30:00Z",
    "status": "active"
  }
}
```

#### 9. Cleanup Expired Files
```http
POST /api/files/cleanup
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Expired files cleaned up successfully"
}
```

## Encryption Implementation

### AES-256-GCM Encryption

```javascript
// Encryption process
const encryptedData = encryptionManager.encryptData(fileContent, fileKey);

// Result structure
{
  encrypted: "encrypted_hex_string",
  salt: "random_salt_hex",
  iv: "random_iv_hex", 
  tag: "authentication_tag_hex",
  algorithm: "aes-256-gcm",
  timestamp: "2024-08-26T10:30:00Z"
}
```

### Key Management

- **Master Key**: Environment variable `ENCRYPTION_MASTER_KEY`
- **File Keys**: Generated per file using crypto.randomBytes(32)
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Salt**: 512-bit random salt per encryption operation

### Security Features

- **Authenticated Encryption**: GCM mode provides both confidentiality and integrity
- **Random IV**: Each encryption uses a unique initialization vector
- **Key Separation**: Each file has its own encryption key
- **Metadata Protection**: File metadata encrypted alongside content

## Malware Scanning

### Scanning Layers

#### 1. File Extension Check
```javascript
const dangerousExtensions = [
  '.exe', '.bat', '.cmd', '.com', '.scr', '.pif', '.vbs', '.js',
  '.jar', '.msi', '.dll', '.sys', '.ps1', '.py', '.php', '.asp'
];
```

#### 2. File Header Analysis
```javascript
const suspiciousHeaders = [
  '4D5A',    // MZ (PE executable)
  '7F454C46', // ELF
  'FEEDFACE', // Mach-O
  '2321',    // #! (script)
  '3C68746D6C', // <html
  '3C736372697074' // <script
];
```

#### 3. Content Pattern Detection
```javascript
const suspiciousPatterns = [
  /<script\b[^>]*>/i,
  /javascript:/i,
  /eval\s*\(/i,
  /document\.write/i,
  /cmd\.exe/i,
  /powershell/i
];
```

#### 4. Deep Scanning
- **Archive Analysis**: Check for embedded executables in ZIP/RAR files
- **Office Document Scanning**: Detect macros and embedded objects
- **PDF Analysis**: Check for embedded JavaScript
- **Hash Comparison**: Compare against known malicious file hashes

### Scan Results

```javascript
{
  isClean: true,
  assessment: "CLEAN", // CLEAN, SUSPICIOUS, MALICIOUS
  threats: [],
  warnings: ["File contains embedded objects"],
  recommendation: "ACCEPT_FILE", // ACCEPT_FILE, REVIEW_MANUALLY, REJECT_FILE
  fileHash: {
    md5: "...",
    sha1: "...", 
    sha256: "..."
  }
}
```

## File Security Features

### Upload Security

- **File Type Validation**: Only allowed file types accepted
- **Size Limits**: Configurable maximum file size (default: 50MB)
- **Path Traversal Protection**: Prevents directory traversal attacks
- **Filename Sanitization**: Removes dangerous characters
- **Null Byte Protection**: Detects null byte injection attempts

### Storage Security

- **Encrypted Storage**: All files encrypted before storage
- **Secure Filenames**: Random, non-predictable filenames
- **Directory Isolation**: Separate directories for different file states
- **Access Control**: Role-based access to files
- **Audit Logging**: Complete file access trail

### Download Security

- **Token-Based Access**: Time-limited download tokens
- **Access Verification**: User permission checks
- **Secure Headers**: Proper content disposition and security headers
- **Temporary Decryption**: Files decrypted only for download
- **Automatic Cleanup**: Temporary files removed after download

## Configuration

### Environment Variables

```bash
# Encryption Settings
ENCRYPTION_MASTER_KEY=your_encryption_master_key_here_256_bits

# File Storage
UPLOAD_DIRECTORY=uploads
ENCRYPTED_DIRECTORY=encrypted
TEMP_DIRECTORY=temp

# File Limits
MAX_FILE_SIZE=52428800
MAX_FILES_PER_UPLOAD=10
FILE_SCAN_TIMEOUT=30000

# Allowed File Types
ALLOWED_FILE_TYPES=.pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.zip
```

### Security Settings

```javascript
// File handler configuration
{
  maxFileSize: 50 * 1024 * 1024, // 50MB
  maxFiles: 10,
  scanTimeout: 30000, // 30 seconds
  allowedFileTypes: ['.pdf', '.doc', '.docx', ...]
}
```

## Usage Examples

### Frontend Integration

```javascript
// Upload files
const formData = new FormData();
formData.append('files', file1);
formData.append('files', file2);
formData.append('clientId', 'client123');

const response = await fetch('/api/files/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
console.log('Uploaded:', result.data.uploaded);
console.log('Rejected:', result.data.rejected);

// Download file
const fileInfo = await fetch(`/api/files/${fileId}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});

const { downloadUrl } = await fileInfo.json();
window.open(downloadUrl, '_blank');

// List files
const files = await fetch('/api/files?page=1&limit=10', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const fileList = await files.json();
console.log('Files:', fileList.data.files);
```

### Backend Integration

```javascript
// Process uploaded files
const result = await secureFileHandler.processUploadedFiles(
  req.files,
  req.user.id,
  req.body.clientId
);

console.log('Processed:', result.processedFiles);
console.log('Rejected:', result.rejectedFiles);

// Retrieve file
const fileData = await secureFileHandler.retrieveFile(
  fileMetadata,
  userId
);

// Generate download URL
const downloadUrl = secureFileHandler.generateSecureDownloadUrl(
  fileMetadata,
  userId
);
```

## Security Best Practices

### Encryption

- **Key Rotation**: Regularly rotate encryption keys
- **Key Storage**: Use hardware security modules (HSM) in production
- **Algorithm Updates**: Stay current with encryption standards
- **Key Backup**: Secure backup of encryption keys

### Malware Protection

- **Signature Updates**: Keep malware signatures current
- **Behavioral Analysis**: Implement behavioral detection
- **Sandboxing**: Use sandbox environments for suspicious files
- **Real-time Scanning**: Continuous monitoring of file activities

### Access Control

- **Principle of Least Privilege**: Minimal required access
- **Role-Based Access**: Granular permission system
- **Session Management**: Secure session handling
- **Audit Logging**: Complete access trail

### File Management

- **Secure Deletion**: Proper file deletion with overwriting
- **Backup Encryption**: Encrypt all backups
- **Version Control**: Track file versions and changes
- **Retention Policies**: Implement data retention policies

## Monitoring & Alerting

### Security Monitoring

- **Failed Uploads**: Monitor rejected file attempts
- **Malware Detection**: Alert on malicious file detection
- **Access Violations**: Monitor unauthorized access attempts
- **Encryption Errors**: Track encryption/decryption failures

### Performance Monitoring

- **Upload Times**: Monitor file processing performance
- **Scan Performance**: Track malware scan duration
- **Storage Usage**: Monitor encrypted storage utilization
- **System Resources**: Track CPU and memory usage

### Audit Logging

```javascript
// File access log
{
  fileId: "file123",
  userId: "user456",
  action: "download",
  timestamp: "2024-08-26T10:30:00Z",
  ipAddress: "192.168.1.100",
  userAgent: "Mozilla/5.0...",
  success: true
}
```

## Testing

### Security Testing

```javascript
// Test encryption
const testData = "sensitive information";
const encrypted = encryptionManager.encryptData(testData);
const decrypted = encryptionManager.decryptData(encrypted);
assert(testData === decrypted);

// Test malware scanning
const scanResult = await malwareScanner.scanFile(testFilePath);
assert(scanResult.isClean === true);
assert(scanResult.assessment === "CLEAN");
```

### Integration Testing

```bash
# Test file upload
curl -X POST http://localhost:5001/api/files/upload \
  -H "Authorization: Bearer <token>" \
  -F "files=@test.pdf"

# Test file download
curl -X GET "http://localhost:5001/api/files/download/fileId?token=abc123" \
  -H "Authorization: Bearer <token>" \
  --output downloaded_file.pdf
```

## Deployment Considerations

### Production Setup

1. **Key Management**: Use AWS KMS or Azure Key Vault
2. **Storage**: Use encrypted cloud storage (S3, Azure Blob)
3. **Monitoring**: Implement comprehensive logging and alerting
4. **Backup**: Secure backup of encrypted files and keys
5. **Compliance**: Ensure GDPR, HIPAA, SOX compliance

### Performance Optimization

- **Streaming**: Use streaming for large file uploads/downloads
- **Caching**: Cache frequently accessed file metadata
- **Compression**: Compress files before encryption
- **CDN**: Use CDN for file delivery

### Security Hardening

- **Network Security**: Use VPN and firewalls
- **Access Control**: Implement IP whitelisting
- **Monitoring**: Real-time security monitoring
- **Incident Response**: Plan for security incidents

## Conclusion

The data security and file handling implementation provides:

- **Military-Grade Encryption**: AES-256-GCM for all stored files
- **Comprehensive Malware Protection**: Multi-layer scanning and detection
- **End-to-End Security**: Encrypted transmission and storage
- **Access Control**: Role-based permissions and audit trails
- **Compliance Ready**: Meets regulatory requirements
- **Scalable Architecture**: Handles enterprise-level file volumes

This implementation ensures Lexocrates maintains the highest standards of data security while providing efficient and user-friendly file management capabilities.
