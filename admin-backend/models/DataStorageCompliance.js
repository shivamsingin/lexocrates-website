const mongoose = require('mongoose');

const dataStorageComplianceSchema = new mongoose.Schema({
  clientId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Data storage preferences
  preferredRegion: {
    type: String,
    required: true,
    enum: ['US', 'UK', 'EU', 'CA'],
    default: 'US'
  },
  
  backupRegion: {
    type: String,
    required: true,
    enum: ['US', 'UK', 'EU', 'CA'],
    default: 'UK'
  },
  
  // Compliance requirements
  complianceRequirements: {
    gdpr: {
      type: Boolean,
      default: false
    },
    ccpa: {
      type: Boolean,
      default: false
    },
    hipaa: {
      type: Boolean,
      default: false
    },
    sox: {
      type: Boolean,
      default: false
    },
    pci: {
      type: Boolean,
      default: false
    }
  },
  
  // Data processing agreement
  dataProcessingAgreement: {
    status: {
      type: String,
      enum: ['Active', 'Pending', 'Expired', 'Terminated'],
      default: 'Pending'
    },
    effectiveDate: {
      type: Date,
      required: true
    },
    expirationDate: {
      type: Date,
      required: true
    },
    version: {
      type: String,
      default: '1.0'
    },
    documentUrl: String
  },
  
  // Security certifications
  securityCertifications: [{
    type: String,
    enum: ['SOC 2 Type II', 'ISO 27001', 'GDPR', 'CCPA', 'HIPAA', 'PCI DSS']
  }],
  
  // Audit information
  auditTrail: {
    lastAudit: {
      type: Date,
      default: Date.now
    },
    nextAudit: {
      type: Date,
      required: true
    },
    complianceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 100
    },
    auditReports: [{
      date: Date,
      score: Number,
      findings: [String],
      recommendations: [String],
      reportUrl: String
    }]
  },
  
  // Data retention policies
  dataRetention: {
    policy: {
      type: String,
      required: true,
      default: '7 years after service termination'
    },
    nextReview: {
      type: Date,
      required: true
    },
    retentionPeriod: {
      type: Number, // in days
      default: 2555 // 7 years
    },
    autoDelete: {
      type: Boolean,
      default: true
    }
  },
  
  // Data transfer mechanisms
  dataTransferMechanisms: [{
    type: String,
    enum: ['SCCs', 'Adequacy Decision', 'Binding Corporate Rules', 'Consent', 'Legitimate Interest']
  }],
  
  // Regional compliance status
  regionalCompliance: {
    us: {
      compliant: {
        type: Boolean,
        default: true
      },
      certifications: [String],
      lastVerified: Date
    },
    uk: {
      compliant: {
        type: Boolean,
        default: true
      },
      certifications: [String],
      lastVerified: Date
    },
    eu: {
      compliant: {
        type: Boolean,
        default: true
      },
      certifications: [String],
      lastVerified: Date
    },
    ca: {
      compliant: {
        type: Boolean,
        default: true
      },
      certifications: [String],
      lastVerified: Date
    }
  },
  
  // Change history
  changeHistory: [{
    field: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    reason: String
  }],
  
  // Status and metadata
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Suspended', 'Pending Review'],
    default: 'Active'
  },
  
  notes: [{
    content: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
dataStorageComplianceSchema.index({ clientId: 1 });
dataStorageComplianceSchema.index({ preferredRegion: 1 });
dataStorageComplianceSchema.index({ 'dataProcessingAgreement.status': 1 });
dataStorageComplianceSchema.index({ 'auditTrail.nextAudit': 1 });
dataStorageComplianceSchema.index({ status: 1 });

// Pre-save middleware to update change history
dataStorageComplianceSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.updatedAt = new Date();
  }
  next();
});

// Instance methods
dataStorageComplianceSchema.methods.addChangeRecord = function(field, oldValue, newValue, userId, reason) {
  this.changeHistory.push({
    field,
    oldValue,
    newValue,
    changedBy: userId,
    reason
  });
  return this.save();
};

dataStorageComplianceSchema.methods.addNote = function(content, userId) {
  this.notes.push({
    content,
    addedBy: userId
  });
  return this.save();
};

dataStorageComplianceSchema.methods.isCompliant = function() {
  const now = new Date();
  
  // Check if DPA is active and not expired
  if (this.dataProcessingAgreement.status !== 'Active' || 
      this.dataProcessingAgreement.expirationDate < now) {
    return false;
  }
  
  // Check if audit is not overdue
  if (this.auditTrail.nextAudit < now) {
    return false;
  }
  
  // Check if compliance score is acceptable
  if (this.auditTrail.complianceScore < 80) {
    return false;
  }
  
  return true;
};

dataStorageComplianceSchema.methods.getComplianceStatus = function() {
  const isCompliant = this.isCompliant();
  const issues = [];
  
  if (this.dataProcessingAgreement.status !== 'Active') {
    issues.push('Data Processing Agreement is not active');
  }
  
  if (this.dataProcessingAgreement.expirationDate < new Date()) {
    issues.push('Data Processing Agreement has expired');
  }
  
  if (this.auditTrail.nextAudit < new Date()) {
    issues.push('Audit is overdue');
  }
  
  if (this.auditTrail.complianceScore < 80) {
    issues.push('Compliance score is below acceptable threshold');
  }
  
  return {
    isCompliant,
    issues,
    score: this.auditTrail.complianceScore,
    nextAudit: this.auditTrail.nextAudit,
    dpaExpiration: this.dataProcessingAgreement.expirationDate
  };
};

// Static methods
dataStorageComplianceSchema.statics.findByRegion = function(region) {
  return this.find({ preferredRegion: region });
};

dataStorageComplianceSchema.statics.findNonCompliant = function() {
  const now = new Date();
  return this.find({
    $or: [
      { 'dataProcessingAgreement.status': { $ne: 'Active' } },
      { 'dataProcessingAgreement.expirationDate': { $lt: now } },
      { 'auditTrail.nextAudit': { $lt: now } },
      { 'auditTrail.complianceScore': { $lt: 80 } }
    ]
  });
};

dataStorageComplianceSchema.statics.findExpiringSoon = function(days = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    $or: [
      { 'dataProcessingAgreement.expirationDate': { $lte: futureDate } },
      { 'auditTrail.nextAudit': { $lte: futureDate } },
      { 'dataRetention.nextReview': { $lte: futureDate } }
    ]
  });
};

// Virtual for days until next audit
dataStorageComplianceSchema.virtual('daysUntilNextAudit').get(function() {
  const now = new Date();
  const nextAudit = this.auditTrail.nextAudit;
  const diffTime = nextAudit - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for days until DPA expiration
dataStorageComplianceSchema.virtual('daysUntilDpaExpiration').get(function() {
  const now = new Date();
  const expiration = this.dataProcessingAgreement.expirationDate;
  const diffTime = expiration - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Ensure virtuals are included in JSON output
dataStorageComplianceSchema.set('toJSON', { virtuals: true });
dataStorageComplianceSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('DataStorageCompliance', dataStorageComplianceSchema);
