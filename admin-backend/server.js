const express = require('express');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const cookieParser = require('cookie-parser');
const https = require('https');
require('dotenv').config();

// Import database connection
const connectDB = require('./config/database');

// Import security middleware
const { 
  SecurityHeaders, 
  RateLimiter, 
  InputSanitizer,
  CSRFProtection 
} = require('./middleware/security');

// Import HTTPS enforcement middleware
const HTTPSEnforcement = require('./middleware/httpsEnforcement');

// Import routes
const authRoutes = require('./routes/auth');
const blogRoutes = require('./routes/blog');
const contactRoutes = require('./routes/contact');
const complianceRoutes = require('./routes/compliance');
const fileRoutes = require('./routes/files');
const csrfRoutes = require('./routes/csrf');
const secureFileHandler = require('./middleware/secureFileHandler');

// Initialize express
const app = express();

// Connect to database
connectDB();

// Security headers middleware (must be first)
app.use(SecurityHeaders.middleware());

// HTTPS enforcement middleware (must be early in the chain)
app.use(HTTPSEnforcement.forceHTTPS());
app.use(HTTPSEnforcement.httpsSecurityHeaders());

// Cookie parser middleware
app.use(cookieParser());

// Trust proxy for secure cookies in production
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token', 'X-Captcha-Token']
}));

// Compression middleware
app.use(compression());

// Import logging middleware
const {
  requestLogger,
  securityLogger,
  authLogger,
  fileOperationLogger,
  adminActionLogger,
  errorLogger,
  performanceLogger
} = require('./middleware/logging');

// Initialize logger
const logger = require('./utils/logger');

// Log server startup
logger.info('Server starting up', {
  environment: process.env.NODE_ENV,
  port: process.env.PORT,
  nodeVersion: process.version,
  platform: process.platform
});

// Comprehensive logging middleware
app.use(requestLogger);
app.use(securityLogger);
app.use(authLogger);
app.use(fileOperationLogger);
app.use(adminActionLogger);
app.use(performanceLogger);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global rate limiting
app.use('/api/', RateLimiter.general());

// Input sanitization middleware
app.use(InputSanitizer.middleware());

// CSRF protection (for non-API routes)
const csrfProtection = new CSRFProtection();
app.use(csrfProtection.middleware());

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/audit', require('./routes/audit'));
app.use('/api', csrfRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
    security: {
      csp: 'enabled',
      csrf: 'enabled',
      rateLimiting: 'enabled',
      inputSanitization: 'enabled'
    }
  });
});

// Security test endpoint
app.get('/api/security-test', (req, res) => {
  res.json({
    success: true,
    message: 'Security headers test',
    headers: {
      'X-Content-Type-Options': req.get('X-Content-Type-Options'),
      'X-Frame-Options': req.get('X-Frame-Options'),
      'X-XSS-Protection': req.get('X-XSS-Protection'),
      'Referrer-Policy': req.get('Referrer-Policy'),
      'Content-Security-Policy': req.get('Content-Security-Policy')
    }
  });
});

// HTTPS status endpoint
app.get('/api/https-status', (req, res) => {
  const httpsStatus = HTTPSEnforcement.checkHTTPSStatus(req);
  const configValidation = HTTPSEnforcement.validateHTTPSConfig();
  
  res.json({
    success: true,
    message: 'HTTPS Status Check',
    https: {
      isSecure: httpsStatus.isSecure,
      protocol: httpsStatus.protocol,
      forwardedProto: httpsStatus.forwardedProto,
      host: httpsStatus.host,
      environment: process.env.NODE_ENV
    },
    configuration: configValidation,
    recommendations: {
      forceHTTPS: process.env.NODE_ENV === 'production' && !httpsStatus.isSecure,
      enableHSTS: process.env.NODE_ENV === 'production',
      secureCookies: process.env.NODE_ENV === 'production'
    }
  });
});

// Error handling middleware
app.use(errorLogger);
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: messages
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate field value entered'
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // Security-related errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'File too large'
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Unexpected file field'
    });
  }

  res.status(500).json({
    success: false,
    message: 'Server Error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
const PORT = process.env.PORT || 5001;
const HTTPS_PORT = process.env.HTTPS_PORT || 443;

// Create HTTP server
const server = app.listen(PORT, () => {
  logger.info(`🚀 HTTP Server running in ${process.env.NODE_ENV} mode on port ${PORT}`, {
    environment: process.env.NODE_ENV,
    port: PORT,
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000'
  });
  
  logger.info('Security features enabled', {
    csp: 'enabled',
    csrf: 'enabled',
    rateLimiting: 'enabled',
    inputSanitization: 'enabled',
    securityHeaders: 'enabled',
    captcha: 'enabled',
    httpsEnforcement: 'enabled',
    hsts: 'enabled',
    comprehensiveLogging: 'enabled'
  });
  
  // Log HTTPS configuration status
  const httpsConfig = HTTPSEnforcement.validateHTTPSConfig();
  logger.info('HTTPS Configuration', httpsConfig);
  
  // Schedule periodic cleanup of download tokens (every 15 minutes)
  setInterval(() => {
    secureFileHandler.cleanupExpiredTokens().catch(() => {});
  }, 15 * 60 * 1000);
  
  // Schedule periodic cleanup of expired audit logs (daily)
  setInterval(async () => {
    try {
      const AuditService = require('./utils/auditService');
      const archivedCount = await AuditService.cleanupExpiredLogs();
      logger.info(`Scheduled audit log cleanup completed`, { archivedCount });
    } catch (error) {
      logger.error('Scheduled audit log cleanup failed', { error: error.message });
    }
  }, 24 * 60 * 60 * 1000); // Daily
});

// Create HTTPS server if certificates are available
const httpsOptions = HTTPSEnforcement.getHTTPSOptions();
if (httpsOptions && process.env.NODE_ENV === 'production') {
  const httpsServer = https.createServer(httpsOptions, app);
  httpsServer.listen(HTTPS_PORT, () => {
    console.log(`🔒 HTTPS Server running on port ${HTTPS_PORT}`);
    console.log('  ✅ TLS 1.2/1.3 enabled');
    console.log('  ✅ Modern cipher suites');
    console.log('  ✅ Certificate validation');
  });
  
  // Handle HTTPS server errors
  httpsServer.on('error', (error) => {
    console.error('HTTPS Server Error:', error.message);
  });
} else if (process.env.NODE_ENV === 'production') {
  console.log('⚠️  HTTPS server not started - SSL certificates not configured');
  console.log('   💡 Configure SSL_CERT_PATH and SSL_KEY_PATH environment variables');
  console.log('   💡 Or use a reverse proxy (nginx, CloudFlare) for HTTPS termination');
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = app;
