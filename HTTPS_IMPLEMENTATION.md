# HTTPS Implementation Guide

## 🎯 Overview

This document outlines the complete HTTPS implementation for the Lexocrates admin backend, including HTTPS enforcement, security headers, and configuration management.

## ✅ Implemented Features

### 1. HTTPS Enforcement Middleware

**Location**: `admin-backend/middleware/httpsEnforcement.js`

**Features**:
- **Automatic HTTPS Redirects**: Forces HTTP to HTTPS redirects in production
- **Security Headers**: Additional HTTPS-specific security headers
- **Configuration Validation**: Validates HTTPS setup
- **Status Monitoring**: Real-time HTTPS status checking

### 2. HTTPS Server Setup

**Location**: `admin-backend/server.js`

**Features**:
- **Dual Server Support**: HTTP and HTTPS servers
- **TLS 1.2/1.3 Support**: Modern TLS configuration
- **Certificate Management**: External certificate support
- **Production Enforcement**: HTTPS-only in production

### 3. Security Headers

**Enhanced Security Headers**:
- `Strict-Transport-Security`: HSTS with 1-year max-age
- `X-Content-Type-Options`: nosniff
- `X-Frame-Options`: DENY
- `X-XSS-Protection`: 1; mode=block
- `Referrer-Policy`: strict-origin-when-cross-origin

## 🔧 Configuration

### Environment Variables

```bash
# HTTPS Configuration
NODE_ENV=production                    # Enable HTTPS enforcement
HTTPS_PORT=443                         # HTTPS server port
SSL_CERT_PATH=/path/to/certificate.crt # SSL certificate path (optional)
SSL_KEY_PATH=/path/to/private.key      # SSL private key path (optional)

# Security Configuration
COOKIE_SECURE=true                     # Secure cookies in production
CORS_ORIGIN=https://yourdomain.com     # HTTPS CORS origin
```

### Production vs Development

| Feature | Development | Production |
|---------|-------------|------------|
| HTTPS Redirects | ❌ Disabled | ✅ Enabled |
| HSTS Headers | ❌ Disabled | ✅ Enabled |
| Secure Cookies | ❌ Disabled | ✅ Enabled |
| Trust Proxy | ❌ Disabled | ✅ Enabled |

## 🚀 Usage

### Starting the Server

```bash
# Development (HTTP only)
NODE_ENV=development npm start

# Production (HTTP + HTTPS)
NODE_ENV=production npm start
```

### Testing HTTPS Configuration

```bash
# Run HTTPS test suite
node admin-backend/scripts/test-https.js

# Test specific endpoints
curl -I http://localhost:5001/api/health
curl -I https://localhost:443/api/health
```

### API Endpoints

#### HTTPS Status Check
```bash
GET /api/https-status
```

**Response**:
```json
{
  "success": true,
  "message": "HTTPS Status Check",
  "https": {
    "isSecure": true,
    "protocol": "https",
    "forwardedProto": "https",
    "host": "yourdomain.com",
    "environment": "production"
  },
  "configuration": {
    "environment": "production",
    "trustProxy": true,
    "sslCertPath": "/path/to/cert.crt",
    "sslKeyPath": "/path/to/key.key",
    "httpsPort": 443,
    "certExists": true,
    "keyExists": true
  },
  "recommendations": {
    "forceHTTPS": false,
    "enableHSTS": true,
    "secureCookies": true
  }
}
```

#### Security Headers Test
```bash
GET /api/security-test
```

## 🔒 Security Features

### 1. HTTPS Enforcement

**Automatic Redirects**:
- HTTP requests automatically redirected to HTTPS in production
- 301 permanent redirects for SEO
- Preserves original URL path and query parameters

**Trust Proxy Support**:
- Configured for reverse proxy environments (nginx, CloudFlare)
- Properly detects HTTPS behind proxy
- Supports `X-Forwarded-Proto` and `X-Forwarded-SSL` headers

### 2. TLS Configuration

**Modern TLS Settings**:
- **Minimum Version**: TLS 1.2
- **Maximum Version**: TLS 1.3
- **Cipher Suites**: Modern, secure cipher preferences
- **Certificate Validation**: Proper certificate chain validation

**Supported Ciphers**:
```
ECDHE-ECDSA-AES256-GCM-SHA384
ECDHE-RSA-AES256-GCM-SHA384
ECDHE-ECDSA-CHACHA20-POLY1305
ECDHE-RSA-CHACHA20-POLY1305
ECDHE-ECDSA-AES128-GCM-SHA256
ECDHE-RSA-AES128-GCM-SHA256
```

### 3. Security Headers

**HSTS (HTTP Strict Transport Security)**:
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

**Additional Headers**:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

## 🧪 Testing

### Test Suite

The HTTPS test suite (`admin-backend/scripts/test-https.js`) validates:

1. **Environment Configuration**
   - Production vs development settings
   - Trust proxy configuration
   - Secure cookie settings

2. **HTTPS Functionality**
   - HTTPS redirects
   - Security headers
   - HTTPS status endpoint

3. **SSL Certificate Configuration**
   - Certificate file existence
   - Private key file existence
   - Configuration validation

### Running Tests

```bash
# Run all HTTPS tests
node admin-backend/scripts/test-https.js

# Test with custom base URL
BASE_URL=https://yourdomain.com node admin-backend/scripts/test-https.js
```

### Manual Testing

```bash
# Test HTTPS redirect
curl -I http://yourdomain.com/api/health

# Test security headers
curl -I https://yourdomain.com/api/security-test

# Test HTTPS status
curl https://yourdomain.com/api/https-status
```

## 🔧 Deployment Options

### Option 1: Direct HTTPS Server

**Configure SSL certificates**:
```bash
# Set environment variables
SSL_CERT_PATH=/etc/ssl/certs/yourdomain.crt
SSL_KEY_PATH=/etc/ssl/private/yourdomain.key
HTTPS_PORT=443
NODE_ENV=production
```

**Start server**:
```bash
npm start
```

### Option 2: Reverse Proxy (Recommended)

**Using nginx**:
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/ssl/certs/yourdomain.crt;
    ssl_certificate_key /etc/ssl/private/yourdomain.key;
    
    location / {
        proxy_pass http://localhost:5001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Using CloudFlare**:
- Enable "Always Use HTTPS" in CloudFlare dashboard
- Configure SSL/TLS mode to "Full (strict)"
- Set up page rules for HTTPS enforcement

## 📊 Monitoring

### Logs

The server logs HTTPS-related information:

```
🚀 HTTP Server running in production mode on port 5001
🔒 HTTPS Server running on port 443
  ✅ TLS 1.2/1.3 enabled
  ✅ Modern cipher suites
  ✅ Certificate validation
```

### Health Checks

Monitor HTTPS status via API:

```bash
# Check HTTPS status
curl https://yourdomain.com/api/https-status

# Check security headers
curl https://yourdomain.com/api/security-test
```

## 🚨 Troubleshooting

### Common Issues

1. **HTTPS Redirects Not Working**
   - Check `NODE_ENV=production`
   - Verify trust proxy configuration
   - Check reverse proxy headers

2. **SSL Certificate Errors**
   - Verify certificate file paths
   - Check file permissions
   - Validate certificate format

3. **Security Headers Missing**
   - Check middleware order
   - Verify helmet.js configuration
   - Test in production environment

### Debug Commands

```bash
# Check HTTPS configuration
curl -v https://yourdomain.com/api/https-status

# Test SSL certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Check security headers
curl -I https://yourdomain.com/api/security-test
```

## 📋 Checklist

### Pre-Deployment
- [ ] Set `NODE_ENV=production`
- [ ] Configure `COOKIE_SECURE=true`
- [ ] Set up SSL certificates (if using direct HTTPS)
- [ ] Configure reverse proxy (if using proxy)
- [ ] Test HTTPS redirects
- [ ] Verify security headers
- [ ] Run HTTPS test suite

### Post-Deployment
- [ ] Verify HTTPS enforcement
- [ ] Check HSTS headers
- [ ] Test secure cookies
- [ ] Monitor HTTPS status
- [ ] Validate SSL certificate
- [ ] Test all API endpoints

## 🔗 Related Documentation

- [Security Implementation](./admin-backend/SECURITY_IMPLEMENTATION.md)
- [Authentication Implementation](./AUTHENTICATION_IMPLEMENTATION_SUMMARY.md)
- [Deployment Guide](./DEPLOYMENT.md)

---

**Implementation Status**: ✅ Complete  
**Last Updated**: December 2024  
**Version**: 1.0.0

