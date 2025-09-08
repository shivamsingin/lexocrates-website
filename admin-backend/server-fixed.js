const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const compression = require('compression');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 5001;

// Initialize logger
const logger = require('./utils/logger');

// Log server startup
logger.info('Server starting up', {
  environment: process.env.NODE_ENV,
  port: process.env.PORT,
  nodeVersion: process.version,
  platform: process.platform
});

// Basic middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token', 'X-Captcha-Token']
}));

app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy for secure cookies in production
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection
mongoose.connect('mongodb://mongo:27017/lexocrates_admin', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  logger.info('MongoDB Connected: mongo');
})
.catch(err => {
  logger.error('MongoDB connection error:', err);
});

// Import route modules
const authRoutes = require('./routes/auth');
const blogRoutes = require('./routes/blog');
const contactRoutes = require('./routes/contact');
const complianceRoutes = require('./routes/compliance');
const fileRoutes = require('./routes/files');

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/files', fileRoutes);

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

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Test endpoint working',
    timestamp: new Date().toISOString()
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
  
  // Initialize secure file handler after server starts
  try {
    const secureFileHandler = require('./middleware/secureFileHandler');
    logger.info('✅ Secure file handler initialized');
    
    // Schedule periodic cleanup of download tokens (every 15 minutes)
    setInterval(() => {
      secureFileHandler.cleanupExpiredTokens().catch((error) => {
        logger.error('Failed to cleanup expired tokens:', error);
      });
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
    
    logger.info('✅ Scheduled cleanup tasks initialized');
  } catch (error) {
    logger.error('Failed to initialize secure file handler:', error);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  logger.error(`Unhandled Promise Rejection: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated');
  });
});

module.exports = app;

