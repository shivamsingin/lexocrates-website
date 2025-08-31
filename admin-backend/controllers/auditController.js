const AuditService = require('../utils/auditService');
const logger = require('../utils/logger');

// @desc    Get audit logs with filtering
// @route   GET /api/audit/logs
// @access  Private/Admin
const getAuditLogs = async (req, res) => {
  try {
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
      sort = 'timestamp'
    } = req.query;

    // Validate limit
    const parsedLimit = Math.min(parseInt(limit), 1000); // Max 1000 records per request
    const parsedSkip = Math.max(parseInt(skip), 0);

    // Build sort object
    const sortObj = {};
    if (sort === 'timestamp') {
      sortObj.timestamp = -1;
    } else if (sort === 'timestamp_asc') {
      sortObj.timestamp = 1;
    } else if (sort === 'threatLevel') {
      sortObj.threatLevel = -1;
    } else {
      sortObj.timestamp = -1;
    }

    const filters = {
      eventType,
      userId,
      resourceType,
      resourceId,
      threatLevel,
      success: success === 'true' ? true : success === 'false' ? false : undefined
    };

    const options = {
      startDate,
      endDate,
      limit: parsedLimit,
      skip: parsedSkip,
      sort: sortObj
    };

    const auditLogs = await AuditService.getAuditLogs(filters, options);

    // Log audit trail access
    await AuditService.logComplianceEvent('audit_trail_accessed', {
      userId: req.user.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      filters: filters,
      resultCount: auditLogs.length,
      requestId: req.requestId
    });

    res.json({
      success: true,
      data: auditLogs,
      pagination: {
        limit: parsedLimit,
        skip: parsedSkip,
        total: auditLogs.length
      }
    });

  } catch (error) {
    logger.logError(error, {
      context: 'getAuditLogs',
      userId: req.user?.id,
      requestId: req.requestId
    });

    res.status(500).json({
      success: false,
      message: 'Error retrieving audit logs'
    });
  }
};

// @desc    Get audit statistics
// @route   GET /api/audit/stats
// @access  Private/Admin
const getAuditStats = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const parsedDays = Math.min(parseInt(days), 365); // Max 1 year

    const stats = await AuditService.getAuditStats(parsedDays);

    // Log audit stats access
    await AuditService.logComplianceEvent('audit_trail_accessed', {
      userId: req.user.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      statsRequested: true,
      days: parsedDays,
      requestId: req.requestId
    });

    res.json({
      success: true,
      data: stats,
      period: `${parsedDays} days`
    });

  } catch (error) {
    logger.logError(error, {
      context: 'getAuditStats',
      userId: req.user?.id,
      requestId: req.requestId
    });

    res.status(500).json({
      success: false,
      message: 'Error retrieving audit statistics'
    });
  }
};

// @desc    Get security events
// @route   GET /api/audit/security
// @access  Private/Admin
const getSecurityEvents = async (req, res) => {
  try {
    const { days = 30, threatLevel } = req.query;
    const parsedDays = Math.min(parseInt(days), 90); // Max 90 days for security events

    const AuditLog = require('../models/AuditLog');
    let query = {
      eventType: {
        $in: [
          'suspicious_activity', 'malware_detected', 'access_denied',
          'rate_limit_exceeded', 'login_failed', 'encryption_error',
          'decryption_error', 'integrity_check_failed'
        ]
      }
    };

    if (threatLevel) {
      query.threatLevel = threatLevel;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parsedDays);
    query.timestamp = { $gte: cutoffDate };

    const securityEvents = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(1000)
      .populate('userId', 'name email role');

    // Log security events access
    await AuditService.logComplianceEvent('audit_trail_accessed', {
      userId: req.user.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      securityEventsRequested: true,
      days: parsedDays,
      threatLevel: threatLevel,
      eventCount: securityEvents.length,
      requestId: req.requestId
    });

    res.json({
      success: true,
      data: securityEvents,
      period: `${parsedDays} days`,
      threatLevel: threatLevel || 'all'
    });

  } catch (error) {
    logger.logError(error, {
      context: 'getSecurityEvents',
      userId: req.user?.id,
      requestId: req.requestId
    });

    res.status(500).json({
      success: false,
      message: 'Error retrieving security events'
    });
  }
};

// @desc    Get compliance events
// @route   GET /api/audit/compliance
// @access  Private/Admin
const getComplianceEvents = async (req, res) => {
  try {
    const { days = 365, regulation } = req.query;
    const parsedDays = Math.min(parseInt(days), 2555); // Max 7 years for compliance

    const AuditLog = require('../models/AuditLog');
    let query = {
      eventType: {
        $in: [
          'policy_updated', 'compliance_check', 'data_export',
          'data_deletion', 'audit_trail_accessed', 'privacy_settings_changed'
        ]
      }
    };

    if (regulation) {
      query.regulation = regulation;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parsedDays);
    query.timestamp = { $gte: cutoffDate };

    const complianceEvents = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(1000)
      .populate('userId', 'name email role');

    // Log compliance events access
    await AuditService.logComplianceEvent('audit_trail_accessed', {
      userId: req.user.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      complianceEventsRequested: true,
      days: parsedDays,
      regulation: regulation,
      eventCount: complianceEvents.length,
      requestId: req.requestId
    });

    res.json({
      success: true,
      data: complianceEvents,
      period: `${parsedDays} days`,
      regulation: regulation || 'all'
    });

  } catch (error) {
    logger.logError(error, {
      context: 'getComplianceEvents',
      userId: req.user?.id,
      requestId: req.requestId
    });

    res.status(500).json({
      success: false,
      message: 'Error retrieving compliance events'
    });
  }
};

// @desc    Get user activity
// @route   GET /api/audit/user/:userId
// @access  Private/Admin
const getUserActivity = async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 30, eventType } = req.query;
    const parsedDays = Math.min(parseInt(days), 365);

    const AuditLog = require('../models/AuditLog');
    let query = { userId };

    if (eventType) {
      query.eventType = eventType;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parsedDays);
    query.timestamp = { $gte: cutoffDate };

    const userActivity = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(500)
      .populate('userId', 'name email role');

    // Log user activity access
    await AuditService.logComplianceEvent('audit_trail_accessed', {
      userId: req.user.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      targetUserId: userId,
      days: parsedDays,
      eventType: eventType,
      eventCount: userActivity.length,
      requestId: req.requestId
    });

    res.json({
      success: true,
      data: userActivity,
      targetUser: userId,
      period: `${parsedDays} days`,
      eventType: eventType || 'all'
    });

  } catch (error) {
    logger.logError(error, {
      context: 'getUserActivity',
      userId: req.user?.id,
      targetUserId: req.params.userId,
      requestId: req.requestId
    });

    res.status(500).json({
      success: false,
      message: 'Error retrieving user activity'
    });
  }
};

// @desc    Export audit logs
// @route   POST /api/audit/export
// @access  Private/Admin
const exportAuditLogs = async (req, res) => {
  try {
    const {
      eventType,
      userId,
      resourceType,
      resourceId,
      threatLevel,
      success,
      startDate,
      endDate,
      format = 'json'
    } = req.body;

    // Validate export request
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required for export'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    // Limit export to 90 days for security
    if (daysDiff > 90) {
      return res.status(400).json({
        success: false,
        message: 'Export period cannot exceed 90 days'
      });
    }

    const filters = {
      eventType,
      userId,
      resourceType,
      resourceId,
      threatLevel,
      success: success === true ? true : success === false ? false : undefined
    };

    const options = {
      startDate: start,
      endDate: end,
      limit: 10000, // Max 10k records for export
      sort: { timestamp: -1 }
    };

    const auditLogs = await AuditService.getAuditLogs(filters, options);

    // Log export request
    await AuditService.logComplianceEvent('data_export', {
      userId: req.user.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      exportFormat: format,
      filters: filters,
      startDate: start,
      endDate: end,
      recordCount: auditLogs.length,
      requestId: req.requestId
    });

    if (format === 'csv') {
      // Generate CSV
      const csv = generateCSV(auditLogs);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="audit_logs_${startDate}_${endDate}.csv"`);
      res.send(csv);
    } else {
      // Return JSON
      res.json({
        success: true,
        data: auditLogs,
        export: {
          format: 'json',
          startDate: start,
          endDate: end,
          recordCount: auditLogs.length,
          filters: filters
        }
      });
    }

  } catch (error) {
    logger.logError(error, {
      context: 'exportAuditLogs',
      userId: req.user?.id,
      requestId: req.requestId
    });

    res.status(500).json({
      success: false,
      message: 'Error exporting audit logs'
    });
  }
};

// @desc    Clean up expired audit logs
// @route   POST /api/audit/cleanup
// @access  Private/Admin
const cleanupAuditLogs = async (req, res) => {
  try {
    const archivedCount = await AuditService.cleanupExpiredLogs();

    // Log cleanup operation
    await AuditService.logAdminAction('audit_cleanup', req.user.id, {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      archivedCount: archivedCount,
      requestId: req.requestId
    });

    res.json({
      success: true,
      message: `Successfully archived ${archivedCount} expired audit logs`,
      archivedCount: archivedCount
    });

  } catch (error) {
    logger.logError(error, {
      context: 'cleanupAuditLogs',
      userId: req.user?.id,
      requestId: req.requestId
    });

    res.status(500).json({
      success: false,
      message: 'Error cleaning up audit logs'
    });
  }
};

// Helper function to generate CSV
function generateCSV(auditLogs) {
  const headers = [
    'Timestamp',
    'Event Type',
    'Action',
    'Description',
    'User ID',
    'User Name',
    'User Email',
    'IP Address',
    'User Agent',
    'Success',
    'Threat Level',
    'Resource Type',
    'Resource ID',
    'Failure Reason'
  ];

  const csvRows = [headers.join(',')];

  auditLogs.forEach(log => {
    const row = [
      log.timestamp,
      log.eventType,
      log.action,
      `"${log.description.replace(/"/g, '""')}"`,
      log.userId?._id || '',
      log.userId?.name || '',
      log.userId?.email || '',
      log.ipAddress || '',
      `"${(log.userAgent || '').replace(/"/g, '""')}"`,
      log.success,
      log.threatLevel,
      log.resourceType || '',
      log.resourceId || '',
      `"${(log.failureReason || '').replace(/"/g, '""')}"`
    ];
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
}

module.exports = {
  getAuditLogs,
  getAuditStats,
  getSecurityEvents,
  getComplianceEvents,
  getUserActivity,
  exportAuditLogs,
  cleanupAuditLogs
};



