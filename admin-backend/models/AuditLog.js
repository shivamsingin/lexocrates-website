const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  // Basic event information
  eventType: {
    type: String,
    required: true,
    enum: [
      // Authentication events
      'login_success', 'login_failed', 'logout', 'password_change', 'password_reset',
      'mfa_enabled', 'mfa_disabled', 'mfa_used', 'session_created', 'session_destroyed',
      
      // Authorization events
      'access_granted', 'access_denied', 'permission_changed', 'role_changed',
      
      // File operations
      'file_upload', 'file_download', 'file_delete', 'file_scan', 'file_encrypted',
      
      // Admin actions
      'user_created', 'user_updated', 'user_deleted', 'user_activated', 'user_deactivated',
      'system_config_changed', 'backup_created', 'backup_restored',
      
      // Security events
      'suspicious_activity', 'rate_limit_exceeded', 'malware_detected', 'encryption_error',
      'decryption_error', 'integrity_check_failed',
      
      // Compliance events
      'policy_updated', 'compliance_check', 'data_export', 'data_deletion',
      'audit_trail_accessed', 'privacy_settings_changed',
      
      // System events
      'server_startup', 'server_shutdown', 'maintenance_mode', 'backup_scheduled',
      'certificate_expired', 'disk_space_low'
    ],
    index: true
  },
  
  // User information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Some events may not have a user (system events)
    index: true
  },
  
  // Target resource information
  resourceType: {
    type: String,
    enum: ['user', 'file', 'blog', 'system', 'compliance', 'security'],
    required: false
  },
  
  resourceId: {
    type: String,
    required: false,
    index: true
  },
  
  // Event details
  action: {
    type: String,
    required: true,
    index: true
  },
  
  description: {
    type: String,
    required: true
  },
  
  // Request information
  requestId: {
    type: String,
    required: false,
    index: true
  },
  
  ipAddress: {
    type: String,
    required: false,
    index: true
  },
  
  userAgent: {
    type: String,
    required: false
  },
  
  // Security context
  threatLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  
  success: {
    type: Boolean,
    default: true
  },
  
  failureReason: {
    type: String,
    required: false
  },
  
  // Changes made (for audit trail)
  oldValue: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  
  newValue: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  
  changes: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  
  // Performance metrics
  duration: {
    type: Number, // milliseconds
    required: false
  },
  
  // Compliance information
  regulation: {
    type: String,
    enum: ['GDPR', 'CCPA', 'HIPAA', 'SOX', 'PCI-DSS'],
    required: false
  },
  
  complianceRequired: {
    type: Boolean,
    default: false
  },
  
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  
  // Timestamps
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  
  // Retention and archival
  retentionPeriod: {
    type: Number, // days
    default: 365 // 1 year default
  },
  
  archived: {
    type: Boolean,
    default: false,
    index: true
  },
  
  archivedAt: {
    type: Date,
    required: false
  }
}, {
  timestamps: true,
  collection: 'audit_logs'
});

// Indexes for efficient querying
AuditLogSchema.index({ eventType: 1, timestamp: -1 });
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ ipAddress: 1, timestamp: -1 });
AuditLogSchema.index({ resourceType: 1, resourceId: 1 });
AuditLogSchema.index({ threatLevel: 1, timestamp: -1 });
AuditLogSchema.index({ success: 1, timestamp: -1 });
AuditLogSchema.index({ regulation: 1, timestamp: -1 });

// Compound indexes for common queries
AuditLogSchema.index({ eventType: 1, userId: 1, timestamp: -1 });
AuditLogSchema.index({ eventType: 1, success: 1, timestamp: -1 });
AuditLogSchema.index({ threatLevel: 1, success: 1, timestamp: -1 });

// Text index for search functionality
AuditLogSchema.index({
  action: 'text',
  description: 'text',
  failureReason: 'text'
});

// Virtual for formatted timestamp
AuditLogSchema.virtual('formattedTimestamp').get(function() {
  return this.timestamp.toISOString();
});

// Virtual for age in days
AuditLogSchema.virtual('ageInDays').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.timestamp);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to set retention period based on event type
AuditLogSchema.pre('save', function(next) {
  // Set retention period based on event type
  const retentionPeriods = {
    // Security events - keep longer
    'suspicious_activity': 730, // 2 years
    'malware_detected': 730,
    'access_denied': 730,
    'rate_limit_exceeded': 730,
    
    // Compliance events - keep longest
    'policy_updated': 2555, // 7 years
    'compliance_check': 2555,
    'data_export': 2555,
    'data_deletion': 2555,
    'audit_trail_accessed': 2555,
    
    // Authentication events - keep medium
    'login_failed': 365, // 1 year
    'password_change': 365,
    'mfa_enabled': 365,
    'mfa_disabled': 365,
    
    // File operations - keep medium
    'file_upload': 365,
    'file_download': 365,
    'file_delete': 365,
    
    // Admin actions - keep longer
    'user_created': 730,
    'user_deleted': 730,
    'system_config_changed': 730,
    
    // System events - keep shorter
    'server_startup': 90, // 3 months
    'server_shutdown': 90,
    'maintenance_mode': 90
  };
  
  this.retentionPeriod = retentionPeriods[this.eventType] || 365;
  next();
});

// Static methods for common queries
AuditLogSchema.statics.findByEventType = function(eventType, limit = 100) {
  return this.find({ eventType })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('userId', 'name email role');
};

AuditLogSchema.statics.findByUser = function(userId, limit = 100) {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('userId', 'name email role');
};

AuditLogSchema.statics.findSecurityEvents = function(days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.find({
    eventType: {
      $in: [
        'suspicious_activity', 'malware_detected', 'access_denied',
        'rate_limit_exceeded', 'login_failed', 'encryption_error'
      ]
    },
    timestamp: { $gte: cutoffDate }
  })
  .sort({ timestamp: -1 })
  .populate('userId', 'name email role');
};

AuditLogSchema.statics.findComplianceEvents = function(days = 365) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.find({
    eventType: {
      $in: [
        'policy_updated', 'compliance_check', 'data_export',
        'data_deletion', 'audit_trail_accessed'
      ]
    },
    timestamp: { $gte: cutoffDate }
  })
  .sort({ timestamp: -1 })
  .populate('userId', 'name email role');
};

AuditLogSchema.statics.findFailedEvents = function(days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.find({
    success: false,
    timestamp: { $gte: cutoffDate }
  })
  .sort({ timestamp: -1 })
  .populate('userId', 'name email role');
};

AuditLogSchema.statics.getEventStats = function(days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: cutoffDate }
      }
    },
    {
      $group: {
        _id: '$eventType',
        count: { $sum: 1 },
        successCount: {
          $sum: { $cond: ['$success', 1, 0] }
        },
        failureCount: {
          $sum: { $cond: ['$success', 0, 1] }
        }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// Instance methods
AuditLogSchema.methods.isRetentionExpired = function() {
  const now = new Date();
  const expiryDate = new Date(this.timestamp);
  expiryDate.setDate(expiryDate.getDate() + this.retentionPeriod);
  return now > expiryDate;
};

AuditLogSchema.methods.archive = function() {
  this.archived = true;
  this.archivedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('AuditLog', AuditLogSchema);



