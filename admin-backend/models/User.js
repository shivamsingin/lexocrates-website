const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  role: {
    type: String,
    enum: ['client', 'staff', 'admin'],
    default: 'client'
  },
  permissions: [{
    type: String,
    enum: [
      'read_blog', 'write_blog', 'publish_blog', 'delete_blog',
      'manage_users', 'manage_settings', 'view_analytics',
      'manage_content', 'manage_billing', 'view_reports'
    ]
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  avatar: {
    type: String
  },
  // MFA Configuration
  mfaEnabled: {
    type: Boolean,
    default: false
  },
  mfaSecret: {
    type: String,
    select: false
  },
  mfaBackupCodes: [{
    code: {
      type: String,
      select: false
    },
    used: {
      type: Boolean,
      default: false
    }
  }],
  // Session Management
  sessions: [{
    sessionId: String,
    deviceInfo: String,
    ipAddress: String,
    lastActivity: Date,
    expiresAt: Date
  }],
  // Security Settings
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  accountLocked: {
    type: Boolean,
    default: false
  },
  lockExpiresAt: {
    type: Date
  },
  passwordChangedAt: {
    type: Date
  },
  passwordResetToken: String,
  passwordResetExpires: Date
}, {
  timestamps: true
});

// Index for performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    this.passwordChangedAt = Date.now() - 1000; // Ensure token was issued after password change
    next();
  } catch (error) {
    next(error);
  }
});

// Generate MFA secret
userSchema.methods.generateMFASecret = function() {
  return crypto.randomBytes(20).toString('hex');
};

// Generate backup codes
userSchema.methods.generateBackupCodes = function() {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    codes.push({
      code: crypto.randomBytes(4).toString('hex').toUpperCase(),
      used: false
    });
  }
  return codes;
};

// Check if user has permission
userSchema.methods.hasPermission = function(permission) {
  return this.permissions.includes(permission);
};

// Check if user has any of the given permissions
userSchema.methods.hasAnyPermission = function(permissions) {
  return permissions.some(permission => this.permissions.includes(permission));
};

// Check if user has all of the given permissions
userSchema.methods.hasAllPermissions = function(permissions) {
  return permissions.every(permission => this.permissions.includes(permission));
};

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Remove password from JSON response
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.mfaSecret;
  delete user.mfaBackupCodes;
  delete user.passwordResetToken;
  return user;
};

module.exports = mongoose.model('User', userSchema);
