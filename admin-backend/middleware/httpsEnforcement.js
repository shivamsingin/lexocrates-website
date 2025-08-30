const https = require('https');
const fs = require('fs');
const path = require('path');

/**
 * HTTPS Enforcement Middleware
 * Handles HTTPS redirects, security checks, and HTTPS server setup
 */
class HTTPSEnforcement {
  
  /**
   * Middleware to force HTTPS redirects in production
   */
  static forceHTTPS() {
    return (req, res, next) => {
      // Only enforce HTTPS in production
      if (process.env.NODE_ENV !== 'production') {
        return next();
      }

      // Check if request is already HTTPS
      const isSecure = req.secure || 
                      req.headers['x-forwarded-proto'] === 'https' ||
                      req.headers['x-forwarded-ssl'] === 'on';

      if (!isSecure) {
        // Redirect to HTTPS
        const httpsUrl = `https://${req.headers.host}${req.url}`;
        return res.redirect(301, httpsUrl);
      }

      next();
    };
  }

  /**
   * Security headers specifically for HTTPS
   */
  static httpsSecurityHeaders() {
    return (req, res, next) => {
      // Only apply in production
      if (process.env.NODE_ENV === 'production') {
        // Additional security headers for HTTPS
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        
        // Remove server information
        res.removeHeader('X-Powered-By');
      }
      
      next();
    };
  }

  /**
   * Check if HTTPS is properly configured
   */
  static checkHTTPSStatus(req) {
    const isSecure = req.secure || 
                    req.headers['x-forwarded-proto'] === 'https' ||
                    req.headers['x-forwarded-ssl'] === 'on';
    
    return {
      isSecure,
      protocol: req.protocol,
      forwardedProto: req.headers['x-forwarded-proto'],
      forwardedSSL: req.headers['x-forwarded-ssl'],
      host: req.headers.host,
      userAgent: req.headers['user-agent']
    };
  }

  /**
   * Create HTTPS server options
   * Note: This is for reference - certificates should be managed externally
   */
  static getHTTPSOptions() {
    const certPath = process.env.SSL_CERT_PATH;
    const keyPath = process.env.SSL_KEY_PATH;
    
    if (!certPath || !keyPath) {
      console.warn('SSL certificate paths not configured. HTTPS server not available.');
      return null;
    }

    try {
      return {
        cert: fs.readFileSync(certPath),
        key: fs.readFileSync(keyPath),
        // Modern TLS configuration
        minVersion: 'TLSv1.2',
        maxVersion: 'TLSv1.3',
        ciphers: [
          'ECDHE-ECDSA-AES256-GCM-SHA384',
          'ECDHE-RSA-AES256-GCM-SHA384',
          'ECDHE-ECDSA-CHACHA20-POLY1305',
          'ECDHE-RSA-CHACHA20-POLY1305',
          'ECDHE-ECDSA-AES128-GCM-SHA256',
          'ECDHE-RSA-AES128-GCM-SHA256'
        ].join(':'),
        honorCipherOrder: true
      };
    } catch (error) {
      console.error('Error reading SSL certificates:', error.message);
      return null;
    }
  }

  /**
   * Validate HTTPS configuration
   */
  static validateHTTPSConfig() {
    const checks = {
      environment: process.env.NODE_ENV,
      trustProxy: process.env.NODE_ENV === 'production',
      sslCertPath: process.env.SSL_CERT_PATH,
      sslKeyPath: process.env.SSL_KEY_PATH,
      httpsPort: process.env.HTTPS_PORT || 443
    };

    // Check if certificate files exist
    if (checks.sslCertPath && checks.sslKeyPath) {
      checks.certExists = fs.existsSync(checks.sslCertPath);
      checks.keyExists = fs.existsSync(checks.sslKeyPath);
    }

    return checks;
  }

  /**
   * Log HTTPS status for debugging
   */
  static logHTTPSStatus(req) {
    const status = this.checkHTTPSStatus(req);
    console.log('HTTPS Status:', {
      timestamp: new Date().toISOString(),
      isSecure: status.isSecure,
      protocol: status.protocol,
      host: status.host,
      environment: process.env.NODE_ENV
    });
  }
}

module.exports = HTTPSEnforcement;

