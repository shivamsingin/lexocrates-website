const logger = require('../utils/logger');

/**
 * HTTP Request Logging Middleware
 * Logs all HTTP requests with performance metrics and security information
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  const requestId = generateRequestId();
  
  // Add request ID to request object for tracking
  req.requestId = requestId;
  
  // Log request start
  logger.http(`Request started: ${req.method} ${req.originalUrl}`, {
    requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    referer: req.get('Referer'),
    userId: req.user?.id,
    userRole: req.user?.role,
    timestamp: new Date().toISOString()
  });

  // Capture response data
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    
    // Log request completion
    logger.http(`Request completed: ${req.method} ${req.originalUrl}`, {
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      userRole: req.user?.role,
      contentLength: data ? data.length : 0,
      timestamp: new Date().toISOString()
    });

    // Log performance metrics for slow requests
    if (duration > 1000) {
      logger.warn(`Slow request detected: ${req.method} ${req.originalUrl}`, {
        requestId,
        method: req.method,
        url: req.originalUrl,
        duration: `${duration}ms`,
        threshold: '1000ms',
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });
    }

    // Log security events for error responses
    if (res.statusCode >= 400) {
      logger.security(`HTTP error response: ${res.statusCode}`, {
        requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id,
        userRole: req.user?.role,
        timestamp: new Date().toISOString()
      });
    }

    originalSend.call(this, data);
  };

  next();
};

/**
 * Security Event Logging Middleware
 * Logs security-related events and potential threats
 */
const securityLogger = (req, res, next) => {
  // Log suspicious requests
  const suspiciousPatterns = [
    /\.\./, // Directory traversal
    /<script/i, // XSS attempts
    /union.*select/i, // SQL injection
    /eval\(/i, // Code injection
    /document\.cookie/i // Cookie theft attempts
  ];

  const requestBody = JSON.stringify(req.body || {});
  const requestUrl = req.originalUrl;
  const userAgent = req.get('User-Agent') || '';

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(requestBody) || pattern.test(requestUrl) || pattern.test(userAgent)) {
      logger.security(`Suspicious request pattern detected`, {
        requestId: req.requestId,
        pattern: pattern.toString(),
        method: req.method,
        url: req.originalUrl,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id,
        userRole: req.user?.role,
        threatLevel: 'medium',
        timestamp: new Date().toISOString()
      });
      break;
    }
  }

  // Log rate limit violations
  if (req.rateLimit && req.rateLimit.remaining === 0) {
    logger.security(`Rate limit exceeded`, {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      limit: req.rateLimit.limit,
      windowMs: req.rateLimit.windowMs,
      threatLevel: 'low',
      timestamp: new Date().toISOString()
    });
  }

  next();
};

/**
 * Authentication Event Logging Middleware
 * Logs authentication and authorization events
 */
const authLogger = (req, res, next) => {
  // Log successful authentication
  if (req.user && req.authEvent === 'login_success') {
    logger.logAuthentication('login_success', req.user.id, {
      requestId: req.requestId,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      mfaUsed: req.mfaUsed || false,
      sessionId: req.sessionId,
      timestamp: new Date().toISOString()
    });
  }

  // Log failed authentication attempts
  if (req.authEvent === 'login_failed') {
    logger.logAuthentication('login_failed', req.authUserId, {
      requestId: req.requestId,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      reason: req.authFailureReason,
      timestamp: new Date().toISOString()
    });
  }

  // Log authorization failures
  if (req.authEvent === 'access_denied') {
    logger.logAuthentication('access_denied', req.user?.id, {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      requiredPermission: req.requiredPermission,
      userPermissions: req.user?.permissions,
      timestamp: new Date().toISOString()
    });
  }

  next();
};

/**
 * File Operation Logging Middleware
 * Logs file-related operations for audit purposes
 */
const fileOperationLogger = (req, res, next) => {
  // Log file uploads
  if (req.file || req.files) {
    const files = req.files || [req.file];
    files.forEach(file => {
      logger.logFileAccess('upload', file.id || 'temp', req.user?.id, {
        requestId: req.requestId,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        scanResult: file.scanResult,
        timestamp: new Date().toISOString()
      });
    });
  }

  // Log file downloads
  if (req.fileDownload) {
    logger.logFileAccess('download', req.fileDownload.fileId, req.user?.id, {
      requestId: req.requestId,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      fileName: req.fileDownload.fileName,
      fileSize: req.fileDownload.fileSize,
      timestamp: new Date().toISOString()
    });
  }

  next();
};

/**
 * Admin Action Logging Middleware
 * Logs administrative actions for compliance
 */
const adminActionLogger = (req, res, next) => {
  // Log user management actions
  if (req.adminAction) {
    logger.logAdminAction(req.adminAction.type, req.user?.id, {
      requestId: req.requestId,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      targetUser: req.adminAction.targetUser,
      targetResource: req.adminAction.targetResource,
      changes: req.adminAction.changes,
      timestamp: new Date().toISOString()
    });
  }

  // Log system configuration changes
  if (req.configChange) {
    logger.logAdminAction('config_change', req.user?.id, {
      requestId: req.requestId,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      configKey: req.configChange.key,
      oldValue: req.configChange.oldValue,
      newValue: req.configChange.newValue,
      timestamp: new Date().toISOString()
    });
  }

  next();
};

/**
 * Error Logging Middleware
 * Logs errors with detailed context
 */
const errorLogger = (err, req, res, next) => {
  logger.logError(err, {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    userRole: req.user?.role,
    body: req.body,
    params: req.params,
    query: req.query,
    timestamp: new Date().toISOString()
  });

  next(err);
};

/**
 * Generate unique request ID for tracking
 */
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Performance Monitoring Middleware
 * Logs performance metrics for optimization
 */
const performanceLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Log performance metrics
    logger.logPerformance(`${req.method} ${req.originalUrl}`, duration, {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      userId: req.user?.id,
      userRole: req.user?.role,
      timestamp: new Date().toISOString()
    });

    // Alert on very slow requests
    if (duration > 5000) {
      logger.warn(`Very slow request detected: ${req.method} ${req.originalUrl}`, {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        duration: `${duration}ms`,
        threshold: '5000ms',
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });
    }
  });

  next();
};

module.exports = {
  requestLogger,
  securityLogger,
  authLogger,
  fileOperationLogger,
  adminActionLogger,
  errorLogger,
  performanceLogger
};









