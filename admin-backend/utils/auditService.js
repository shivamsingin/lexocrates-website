const logger = require('./logger');
const AuditLog = require('../models/AuditLog');

/**
 * Comprehensive Audit Service
 * Provides centralized logging for all security, compliance, and operational events
 */
class AuditService {
  /**
   * Log authentication events
   */
  static async logAuthentication(eventType, userId, details = {}) {
    const auditData = {
      eventType,
      userId,
      action: `Authentication: ${eventType}`,
      description: this.getAuthDescription(eventType, details),
      ipAddress: details.ipAddress,
      userAgent: details.userAgent,
      success: details.success !== false,
      failureReason: details.reason,
      threatLevel: this.getAuthThreatLevel(eventType, details),
      metadata: {
        mfaUsed: details.mfaUsed,
        sessionId: details.sessionId,
        loginMethod: details.loginMethod,
        ...details
      }
    };

    await this.createAuditLog(auditData);
    logger.logAuthentication(eventType, userId, details);
  }

  /**
   * Log authorization events
   */
  static async logAuthorization(eventType, userId, details = {}) {
    const auditData = {
      eventType,
      userId,
      action: `Authorization: ${eventType}`,
      description: this.getAuthzDescription(eventType, details),
      ipAddress: details.ipAddress,
      userAgent: details.userAgent,
      success: details.success !== false,
      failureReason: details.reason,
      threatLevel: this.getAuthzThreatLevel(eventType, details),
      resourceType: details.resourceType,
      resourceId: details.resourceId,
      metadata: {
        requiredPermission: details.requiredPermission,
        userPermissions: details.userPermissions,
        targetResource: details.targetResource,
        ...details
      }
    };

    await this.createAuditLog(auditData);
    logger.logSecurityEvent(eventType, userId, details);
  }

  /**
   * Log file operations
   */
  static async logFileOperation(eventType, fileId, userId, details = {}) {
    const auditData = {
      eventType,
      userId,
      action: `File operation: ${eventType}`,
      description: this.getFileDescription(eventType, details),
      ipAddress: details.ipAddress,
      userAgent: details.userAgent,
      success: details.success !== false,
      failureReason: details.reason,
      resourceType: 'file',
      resourceId: fileId,
      duration: details.duration,
      metadata: {
        fileName: details.fileName,
        fileSize: details.fileSize,
        mimeType: details.mimeType,
        scanResult: details.scanResult,
        encryptionType: details.encryptionType,
        ...details
      }
    };

    await this.createAuditLog(auditData);
    logger.logFileAccess(eventType, fileId, userId, details);
  }

  /**
   * Log admin actions
   */
  static async logAdminAction(eventType, userId, details = {}) {
    const auditData = {
      eventType,
      userId,
      action: `Admin action: ${eventType}`,
      description: this.getAdminDescription(eventType, details),
      ipAddress: details.ipAddress,
      userAgent: details.userAgent,
      success: details.success !== false,
      failureReason: details.reason,
      threatLevel: 'medium', // Admin actions are always medium threat level
      resourceType: details.resourceType,
      resourceId: details.resourceId,
      oldValue: details.oldValue,
      newValue: details.newValue,
      changes: details.changes,
      metadata: {
        targetUser: details.targetUser,
        targetResource: details.targetResource,
        adminAction: true,
        ...details
      }
    };

    await this.createAuditLog(auditData);
    logger.logAdminAction(eventType, userId, details);
  }

  /**
   * Log security events
   */
  static async logSecurityEvent(eventType, details = {}) {
    const auditData = {
      eventType,
      userId: details.userId,
      action: `Security event: ${eventType}`,
      description: this.getSecurityDescription(eventType, details),
      ipAddress: details.ipAddress,
      userAgent: details.userAgent,
      success: details.success !== false,
      failureReason: details.reason,
      threatLevel: this.getSecurityThreatLevel(eventType, details),
      resourceType: details.resourceType,
      resourceId: details.resourceId,
      metadata: {
        pattern: details.pattern,
        threatType: details.threatType,
        malwareType: details.malwareType,
        ...details
      }
    };

    await this.createAuditLog(auditData);
    logger.logSecurityEvent(eventType, details.userId, details);
  }

  /**
   * Log compliance events
   */
  static async logComplianceEvent(eventType, details = {}) {
    const auditData = {
      eventType,
      userId: details.userId,
      action: `Compliance: ${eventType}`,
      description: this.getComplianceDescription(eventType, details),
      ipAddress: details.ipAddress,
      userAgent: details.userAgent,
      success: details.success !== false,
      failureReason: details.reason,
      threatLevel: 'low', // Compliance events are typically low threat
      resourceType: 'compliance',
      resourceId: details.clientId || details.policyId,
      regulation: details.regulation,
      complianceRequired: true,
      oldValue: details.oldValue,
      newValue: details.newValue,
      metadata: {
        clientId: details.clientId,
        policyId: details.policyId,
        complianceEvent: true,
        ...details
      }
    };

    await this.createAuditLog(auditData);
    logger.logCompliance(eventType, details);
  }

  /**
   * Log system events
   */
  static async logSystemEvent(eventType, details = {}) {
    const auditData = {
      eventType,
      userId: null, // System events don't have a user
      action: `System event: ${eventType}`,
      description: this.getSystemDescription(eventType, details),
      success: details.success !== false,
      failureReason: details.reason,
      threatLevel: this.getSystemThreatLevel(eventType, details),
      resourceType: 'system',
      resourceId: details.systemId,
      duration: details.duration,
      metadata: {
        systemEvent: true,
        component: details.component,
        version: details.version,
        ...details
      }
    };

    await this.createAuditLog(auditData);
    logger.info(`System event: ${eventType}`, details);
  }

  /**
   * Log performance events
   */
  static async logPerformanceEvent(operation, duration, details = {}) {
    const auditData = {
      eventType: 'performance_metric',
      userId: details.userId,
      action: `Performance: ${operation}`,
      description: `Operation ${operation} completed in ${duration}ms`,
      success: duration < (details.threshold || 5000),
      duration,
      metadata: {
        operation,
        threshold: details.threshold,
        performanceEvent: true,
        ...details
      }
    };

    await this.createAuditLog(auditData);
    logger.logPerformance(operation, duration, details);
  }

  /**
   * Create audit log entry
   */
  static async createAuditLog(auditData) {
    try {
      const auditLog = new AuditLog({
        ...auditData,
        requestId: auditData.requestId,
        timestamp: new Date()
      });

      await auditLog.save();
      return auditLog;
    } catch (error) {
      logger.error('Failed to create audit log entry', {
        error: error.message,
        auditData
      });
      throw error;
    }
  }

  /**
   * Get authentication event descriptions
   */
  static getAuthDescription(eventType, details) {
    const descriptions = {
      'login_success': `User ${details.userId || 'unknown'} successfully logged in`,
      'login_failed': `Failed login attempt for user ${details.email || 'unknown'}`,
      'logout': `User ${details.userId || 'unknown'} logged out`,
      'password_change': `Password changed for user ${details.userId || 'unknown'}`,
      'password_reset': `Password reset for user ${details.userId || 'unknown'}`,
      'mfa_enabled': `MFA enabled for user ${details.userId || 'unknown'}`,
      'mfa_disabled': `MFA disabled for user ${details.userId || 'unknown'}`,
      'mfa_used': `MFA used for login by user ${details.userId || 'unknown'}`,
      'session_created': `New session created for user ${details.userId || 'unknown'}`,
      'session_destroyed': `Session destroyed for user ${details.userId || 'unknown'}`
    };

    return descriptions[eventType] || `Authentication event: ${eventType}`;
  }

  /**
   * Get authorization event descriptions
   */
  static getAuthzDescription(eventType, details) {
    const descriptions = {
      'access_granted': `Access granted to ${details.resourceType || 'resource'} for user ${details.userId || 'unknown'}`,
      'access_denied': `Access denied to ${details.resourceType || 'resource'} for user ${details.userId || 'unknown'}`,
      'permission_changed': `Permissions changed for user ${details.userId || 'unknown'}`,
      'role_changed': `Role changed for user ${details.userId || 'unknown'}`
    };

    return descriptions[eventType] || `Authorization event: ${eventType}`;
  }

  /**
   * Get file operation descriptions
   */
  static getFileDescription(eventType, details) {
    const descriptions = {
      'file_upload': `File ${details.fileName || 'unknown'} uploaded by user ${details.userId || 'unknown'}`,
      'file_download': `File ${details.fileName || 'unknown'} downloaded by user ${details.userId || 'unknown'}`,
      'file_delete': `File ${details.fileName || 'unknown'} deleted by user ${details.userId || 'unknown'}`,
      'file_scan': `File ${details.fileName || 'unknown'} scanned for malware`,
      'file_encrypted': `File ${details.fileName || 'unknown'} encrypted`
    };

    return descriptions[eventType] || `File operation: ${eventType}`;
  }

  /**
   * Get admin action descriptions
   */
  static getAdminDescription(eventType, details) {
    const descriptions = {
      'user_created': `User ${details.targetUser || 'unknown'} created by admin ${details.userId || 'unknown'}`,
      'user_updated': `User ${details.targetUser || 'unknown'} updated by admin ${details.userId || 'unknown'}`,
      'user_deleted': `User ${details.targetUser || 'unknown'} deleted by admin ${details.userId || 'unknown'}`,
      'system_config_changed': `System configuration changed by admin ${details.userId || 'unknown'}`,
      'backup_created': `Backup created by admin ${details.userId || 'unknown'}`,
      'backup_restored': `Backup restored by admin ${details.userId || 'unknown'}`
    };

    return descriptions[eventType] || `Admin action: ${eventType}`;
  }

  /**
   * Get security event descriptions
   */
  static getSecurityDescription(eventType, details) {
    const descriptions = {
      'suspicious_activity': `Suspicious activity detected: ${details.pattern || 'unknown pattern'}`,
      'rate_limit_exceeded': `Rate limit exceeded for IP ${details.ipAddress || 'unknown'}`,
      'malware_detected': `Malware detected in file ${details.fileName || 'unknown'}`,
      'encryption_error': `Encryption error occurred`,
      'decryption_error': `Decryption error occurred`,
      'integrity_check_failed': `Integrity check failed for resource ${details.resourceId || 'unknown'}`
    };

    return descriptions[eventType] || `Security event: ${eventType}`;
  }

  /**
   * Get compliance event descriptions
   */
  static getComplianceDescription(eventType, details) {
    const descriptions = {
      'policy_updated': `Policy ${details.policyId || 'unknown'} updated`,
      'compliance_check': `Compliance check performed for ${details.regulation || 'unknown regulation'}`,
      'data_export': `Data export requested for client ${details.clientId || 'unknown'}`,
      'data_deletion': `Data deletion requested for client ${details.clientId || 'unknown'}`,
      'audit_trail_accessed': `Audit trail accessed by user ${details.userId || 'unknown'}`,
      'privacy_settings_changed': `Privacy settings changed for client ${details.clientId || 'unknown'}`
    };

    return descriptions[eventType] || `Compliance event: ${eventType}`;
  }

  /**
   * Get system event descriptions
   */
  static getSystemDescription(eventType, details) {
    const descriptions = {
      'server_startup': `Server started successfully`,
      'server_shutdown': `Server shutdown initiated`,
      'maintenance_mode': `Maintenance mode ${details.enabled ? 'enabled' : 'disabled'}`,
      'backup_scheduled': `Backup scheduled for ${details.schedule || 'unknown time'}`,
      'certificate_expired': `SSL certificate expired`,
      'disk_space_low': `Low disk space detected: ${details.availableSpace || 'unknown'} available`
    };

    return descriptions[eventType] || `System event: ${eventType}`;
  }

  /**
   * Get threat levels for authentication events
   */
  static getAuthThreatLevel(eventType, details) {
    const threatLevels = {
      'login_success': 'low',
      'login_failed': details.attempts > 5 ? 'high' : 'medium',
      'logout': 'low',
      'password_change': 'medium',
      'password_reset': 'medium',
      'mfa_enabled': 'low',
      'mfa_disabled': 'high',
      'mfa_used': 'low',
      'session_created': 'low',
      'session_destroyed': 'low'
    };

    return threatLevels[eventType] || 'low';
  }

  /**
   * Get threat levels for authorization events
   */
  static getAuthzThreatLevel(eventType, details) {
    const threatLevels = {
      'access_granted': 'low',
      'access_denied': 'medium',
      'permission_changed': 'high',
      'role_changed': 'high'
    };

    return threatLevels[eventType] || 'low';
  }

  /**
   * Get threat levels for security events
   */
  static getSecurityThreatLevel(eventType, details) {
    const threatLevels = {
      'suspicious_activity': 'medium',
      'rate_limit_exceeded': 'low',
      'malware_detected': 'high',
      'encryption_error': 'high',
      'decryption_error': 'high',
      'integrity_check_failed': 'high'
    };

    return threatLevels[eventType] || 'medium';
  }

  /**
   * Get threat levels for system events
   */
  static getSystemThreatLevel(eventType, details) {
    const threatLevels = {
      'server_startup': 'low',
      'server_shutdown': 'medium',
      'maintenance_mode': 'low',
      'backup_scheduled': 'low',
      'certificate_expired': 'high',
      'disk_space_low': 'medium'
    };

    return threatLevels[eventType] || 'low';
  }

  /**
   * Get audit logs with filtering
   */
  static async getAuditLogs(filters = {}, options = {}) {
    const {
      eventType,
      userId,
      resourceType,
      resourceId,
      threatLevel,
      success,
      startDate,
      endDate,
      limit = 100,
      skip = 0,
      sort = { timestamp: -1 }
    } = options;

    const query = {};

    if (eventType) query.eventType = eventType;
    if (userId) query.userId = userId;
    if (resourceType) query.resourceType = resourceType;
    if (resourceId) query.resourceId = resourceId;
    if (threatLevel) query.threatLevel = threatLevel;
    if (success !== undefined) query.success = success;

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    return await AuditLog.find(query)
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .populate('userId', 'name email role');
  }

  /**
   * Get audit statistics
   */
  static async getAuditStats(days = 30) {
    return await AuditLog.getEventStats(days);
  }

  /**
   * Clean up expired audit logs
   */
  static async cleanupExpiredLogs() {
    const expiredLogs = await AuditLog.find({
      $expr: {
        $lt: [
          { $add: ['$timestamp', { $multiply: ['$retentionPeriod', 24 * 60 * 60 * 1000] }] },
          new Date()
        ]
      }
    });

    for (const log of expiredLogs) {
      await log.archive();
    }

    logger.info(`Archived ${expiredLogs.length} expired audit logs`);
    return expiredLogs.length;
  }
}

module.exports = AuditService;



