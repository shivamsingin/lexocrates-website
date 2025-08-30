const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom log levels for security and compliance
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  security: 5,    // Custom level for security events
  audit: 6        // Custom level for audit events
};

// Custom colors for log levels
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
  security: 'cyan',
  audit: 'blue'
};

winston.addColors(logColors);

// Custom format for structured logging
const structuredFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level.toUpperCase()}]: ${message} ${metaStr}`;
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level.toUpperCase()}]: ${message} ${metaStr}`;
  })
);

// Create transports
const transports = [];

// Console transport (development)
if (process.env.NODE_ENV === 'development') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: 'debug'
    })
  );
}

// File transports with rotation
const fileTransports = [
  // Error logs
  new DailyRotateFile({
    filename: path.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    format: structuredFormat,
    maxSize: '20m',
    maxFiles: '14d',
    zippedArchive: true
  }),
  
  // Combined logs
  new DailyRotateFile({
    filename: path.join(logsDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    format: structuredFormat,
    maxSize: '20m',
    maxFiles: '30d',
    zippedArchive: true
  }),
  
  // Security logs
  new DailyRotateFile({
    filename: path.join(logsDir, 'security-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'security',
    format: structuredFormat,
    maxSize: '20m',
    maxFiles: '90d', // Keep security logs longer
    zippedArchive: true
  }),
  
  // Audit logs
  new DailyRotateFile({
    filename: path.join(logsDir, 'audit-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'audit',
    format: structuredFormat,
    maxSize: '20m',
    maxFiles: '365d', // Keep audit logs for compliance
    zippedArchive: true
  }),
  
  // HTTP request logs
  new DailyRotateFile({
    filename: path.join(logsDir, 'http-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'http',
    format: structuredFormat,
    maxSize: '20m',
    maxFiles: '30d',
    zippedArchive: true
  })
];

transports.push(...fileTransports);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: logLevels,
  format: structuredFormat,
  transports: transports,
  exitOnError: false
});

// Add custom methods for security and audit logging
logger.security = (message, meta = {}) => {
  logger.log('security', message, {
    ...meta,
    category: 'security',
    timestamp: new Date().toISOString()
  });
};

logger.audit = (message, meta = {}) => {
  logger.log('audit', message, {
    ...meta,
    category: 'audit',
    timestamp: new Date().toISOString()
  });
};

// Helper methods for common logging patterns
logger.logSecurityEvent = (eventType, userId, details = {}) => {
  logger.security(`Security event: ${eventType}`, {
    eventType,
    userId,
    ipAddress: details.ipAddress,
    userAgent: details.userAgent,
    success: details.success,
    reason: details.reason,
    ...details
  });
};

logger.logAuditEvent = (action, userId, resource, details = {}) => {
  logger.audit(`Audit event: ${action}`, {
    action,
    userId,
    resource,
    resourceType: details.resourceType,
    oldValue: details.oldValue,
    newValue: details.newValue,
    ipAddress: details.ipAddress,
    userAgent: details.userAgent,
    ...details
  });
};

logger.logAdminAction = (action, userId, details = {}) => {
  logger.audit(`Admin action: ${action}`, {
    action,
    userId,
    adminAction: true,
    ipAddress: details.ipAddress,
    userAgent: details.userAgent,
    targetUser: details.targetUser,
    targetResource: details.targetResource,
    changes: details.changes,
    ...details
  });
};

logger.logFileAccess = (action, fileId, userId, details = {}) => {
  logger.audit(`File access: ${action}`, {
    action,
    fileId,
    userId,
    fileOperation: true,
    ipAddress: details.ipAddress,
    userAgent: details.userAgent,
    fileSize: details.fileSize,
    fileName: details.fileName,
    success: details.success,
    ...details
  });
};

logger.logAuthentication = (eventType, userId, details = {}) => {
  logger.security(`Authentication: ${eventType}`, {
    eventType,
    userId,
    authEvent: true,
    ipAddress: details.ipAddress,
    userAgent: details.userAgent,
    success: details.success,
    reason: details.reason,
    mfaUsed: details.mfaUsed,
    sessionId: details.sessionId,
    ...details
  });
};

logger.logCompliance = (action, details = {}) => {
  logger.audit(`Compliance: ${action}`, {
    action,
    complianceEvent: true,
    regulation: details.regulation,
    clientId: details.clientId,
    oldValue: details.oldValue,
    newValue: details.newValue,
    userId: details.userId,
    ipAddress: details.ipAddress,
    ...details
  });
};

logger.logPerformance = (operation, duration, details = {}) => {
  logger.info(`Performance: ${operation}`, {
    operation,
    duration: `${duration}ms`,
    performanceEvent: true,
    ...details
  });
};

logger.logError = (error, context = {}) => {
  logger.error(`Error: ${error.message}`, {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    },
    context,
    errorEvent: true
  });
};

// Handle uncaught exceptions and unhandled rejections
logger.exceptions.handle(
  new DailyRotateFile({
    filename: path.join(logsDir, 'exceptions-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    format: structuredFormat,
    maxSize: '20m',
    maxFiles: '30d',
    zippedArchive: true
  })
);

logger.rejections.handle(
  new DailyRotateFile({
    filename: path.join(logsDir, 'rejections-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    format: structuredFormat,
    maxSize: '20m',
    maxFiles: '30d',
    zippedArchive: true
  })
);

module.exports = logger;


