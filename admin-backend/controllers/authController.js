const User = require('../models/User');
const { 
  generateToken, 
  generateRefreshToken, 
  verifyRefreshToken,
  changedPasswordAfter,
  loginRateLimit 
} = require('../middleware/auth');
const SessionManager = require('../utils/sessionManager');
const MFAService = require('../utils/mfa');
const { PermissionManager } = require('../utils/permissions');
const crypto = require('crypto');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Validate role
    if (role && !PermissionManager.isValidRole(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    // Set default permissions based on role
    const defaultRole = role || 'client';
    const permissions = PermissionManager.getPermissionsForRole(defaultRole);

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: defaultRole,
      permissions
    });

    if (user) {
      // Generate session data
      const sessionId = SessionManager.generateSessionId();
      const refreshToken = generateRefreshToken(user._id);
      const deviceInfo = SessionManager.getDeviceInfo(req);

      // Add session to user
      user.sessions.push({
        sessionId,
        deviceInfo: deviceInfo.userAgent,
        ipAddress: deviceInfo.ipAddress,
        lastActivity: new Date(),
        expiresAt: SessionManager.getSessionExpiry()
      });

      await user.save();

      // Set secure cookies
      const isSecure = process.env.NODE_ENV === 'production';
      SessionManager.setSessionCookies(res, sessionId, refreshToken, isSecure);

      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
          mfaEnabled: user.mfaEnabled,
          token: generateToken(user._id)
        }
      });
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password, mfaToken, backupCode } = req.body;

    // Check for user
    const user = await User.findOne({ email }).select('+mfaSecret +mfaBackupCodes');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Check if account is locked
    if (user.accountLocked && user.lockExpiresAt > new Date()) {
      return res.status(423).json({ 
        message: 'Account is temporarily locked due to multiple failed login attempts',
        lockExpiresAt: user.lockExpiresAt
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Increment failed login attempts
      user.failedLoginAttempts += 1;
      
      // Lock account after 5 failed attempts
      if (user.failedLoginAttempts >= 5) {
        user.accountLocked = true;
        user.lockExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      }
      
      await user.save();
      
      return res.status(401).json({ 
        message: 'Invalid credentials',
        failedAttempts: user.failedLoginAttempts,
        accountLocked: user.accountLocked
      });
    }

    // Reset failed login attempts on successful login
    user.failedLoginAttempts = 0;
    user.accountLocked = false;
    user.lockExpiresAt = null;

    // Handle MFA if enabled
    if (user.mfaEnabled) {
      if (!mfaToken && !backupCode) {
        return res.status(403).json({ 
          message: 'MFA token or backup code required',
          requiresMFA: true,
          mfaEnabled: true
        });
      }

      let mfaValid = false;

      if (mfaToken) {
        mfaValid = MFAService.verifyToken(mfaToken, user.mfaSecret);
      } else if (backupCode) {
        mfaValid = MFAService.verifyBackupCode(backupCode, user.mfaBackupCodes);
        if (mfaValid) {
          await user.save(); // Save to mark backup code as used
        }
      }

      if (!mfaValid) {
        return res.status(401).json({ 
          message: 'Invalid MFA token or backup code',
          requiresMFA: true
        });
      }
    }

    // Update last login
    user.lastLogin = new Date();

    // Generate session data
    const sessionId = SessionManager.generateSessionId();
    const refreshToken = generateRefreshToken(user._id);
    const deviceInfo = SessionManager.getDeviceInfo(req);

    // Clean expired sessions
    user.sessions = SessionManager.cleanExpiredSessions(user.sessions);

    // Add new session
    user.sessions.push({
      sessionId,
      deviceInfo: deviceInfo.userAgent,
      ipAddress: deviceInfo.ipAddress,
      lastActivity: new Date(),
      expiresAt: SessionManager.getSessionExpiry()
    });

    await user.save();

    // Set secure cookies
    const isSecure = process.env.NODE_ENV === 'production';
    SessionManager.setSessionCookies(res, sessionId, refreshToken, isSecure);

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        mfaEnabled: user.mfaEnabled,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    const { sessionId } = req.cookies;

    if (sessionId && req.user) {
      // Remove session from user
      req.user.sessions = req.user.sessions.filter(s => s.sessionId !== sessionId);
      await req.user.save();
    }

    // Clear cookies
    SessionManager.clearSessionCookies(res);

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: refreshTokenCookie } = req.cookies;

    if (!refreshTokenCookie) {
      return res.status(401).json({ message: 'No refresh token provided' });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshTokenCookie);
    
    // Get user
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Check if token was issued before password change
    if (changedPasswordAfter(decoded.iat, user.passwordChangedAt)) {
      return res.status(401).json({ message: 'Password changed, please login again' });
    }

    // Generate new tokens
    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    // Set new cookies
    const isSecure = process.env.NODE_ENV === 'production';
    SessionManager.setSessionCookies(res, req.cookies.sessionId, newRefreshToken, isSecure);

    res.json({
      success: true,
      data: {
        token: newToken
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

// @desc    Setup MFA
// @route   POST /api/auth/mfa/setup
// @access  Private
const setupMFA = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+mfaSecret +mfaBackupCodes');

    if (user.mfaEnabled) {
      return res.status(400).json({ message: 'MFA is already enabled' });
    }

    // Generate MFA secret
    const secret = MFAService.generateSecret(user.email);
    const backupCodes = MFAService.generateBackupCodes();

    // Save secret and backup codes
    user.mfaSecret = secret.base32;
    user.mfaBackupCodes = backupCodes;
    await user.save();

    // Generate QR code
    const qrCode = await MFAService.generateQRCode(secret.otpauthURL);

    res.json({
      success: true,
      data: {
        secret: secret.base32,
        qrCode,
        backupCodes: backupCodes.map(bc => bc.code)
      }
    });
  } catch (error) {
    console.error('MFA setup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Enable MFA
// @route   POST /api/auth/mfa/enable
// @access  Private
const enableMFA = async (req, res) => {
  try {
    const { token } = req.body;

    const user = await User.findById(req.user._id).select('+mfaSecret');

    if (!user.mfaSecret) {
      return res.status(400).json({ message: 'MFA not set up. Please set up MFA first.' });
    }

    // Verify token
    const isValid = MFAService.verifyToken(token, user.mfaSecret);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid MFA token' });
    }

    // Enable MFA
    user.mfaEnabled = true;
    await user.save();

    res.json({
      success: true,
      message: 'MFA enabled successfully'
    });
  } catch (error) {
    console.error('MFA enable error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Disable MFA
// @route   POST /api/auth/mfa/disable
// @access  Private
const disableMFA = async (req, res) => {
  try {
    const { token } = req.body;

    const user = await User.findById(req.user._id).select('+mfaSecret');

    if (!user.mfaEnabled) {
      return res.status(400).json({ message: 'MFA is not enabled' });
    }

    // Verify token
    const isValid = MFAService.verifyToken(token, user.mfaSecret);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid MFA token' });
    }

    // Disable MFA
    user.mfaEnabled = false;
    user.mfaSecret = undefined;
    user.mfaBackupCodes = [];
    await user.save();

    res.json({
      success: true,
      message: 'MFA disabled successfully'
    });
  } catch (error) {
    console.error('MFA disable error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const effectivePermissions = PermissionManager.getUserEffectivePermissions(user);

    res.json({
      success: true,
      data: {
        ...user.toJSON(),
        effectivePermissions
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update basic info
    if (name) user.name = name;
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      user.email = email;
    }

    // Update password if provided
    if (currentPassword && newPassword) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      user.password = newPassword;
    }

    const updatedUser = await user.save();
    const effectivePermissions = PermissionManager.getUserEffectivePermissions(updatedUser);

    res.json({
      success: true,
      data: {
        ...updatedUser.toJSON(),
        effectivePermissions
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all users (admin only)
// @route   GET /api/auth/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password -mfaSecret -mfaBackupCodes');
    
    const usersWithPermissions = users.map(user => ({
      ...user.toJSON(),
      effectivePermissions: PermissionManager.getUserEffectivePermissions(user)
    }));

    res.json({
      success: true,
      count: users.length,
      data: usersWithPermissions
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user (admin only)
// @route   PUT /api/auth/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const { name, email, role, isActive, permissions } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from modifying themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot modify your own account through this endpoint' });
    }

    if (name) user.name = name;
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      user.email = email;
    }
    if (role && PermissionManager.isValidRole(role)) {
      user.role = role;
      // Update permissions based on new role
      user.permissions = PermissionManager.getPermissionsForRole(role);
    }
    if (typeof isActive === 'boolean') user.isActive = isActive;
    if (permissions && Array.isArray(permissions)) {
      // Validate permissions
      const validPermissions = permissions.filter(p => PermissionManager.isValidPermission(p));
      user.permissions = validPermissions;
    }

    const updatedUser = await user.save();
    const effectivePermissions = PermissionManager.getUserEffectivePermissions(updatedUser);

    res.json({
      success: true,
      data: {
        ...updatedUser.toJSON(),
        effectivePermissions
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete user (admin only)
// @route   DELETE /api/auth/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await user.remove();

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user sessions
// @route   GET /api/auth/sessions
// @access  Private
const getUserSessions = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const activeSessions = SessionManager.cleanExpiredSessions(user.sessions);

    res.json({
      success: true,
      data: activeSessions
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Revoke session
// @route   DELETE /api/auth/sessions/:sessionId
// @access  Private
const revokeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const user = await User.findById(req.user._id);
    user.sessions = user.sessions.filter(s => s.sessionId !== sessionId);
    await user.save();

    res.json({
      success: true,
      message: 'Session revoked successfully'
    });
  } catch (error) {
    console.error('Revoke session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  setupMFA,
  enableMFA,
  disableMFA,
  getMe,
  updateProfile,
  getUsers,
  updateUser,
  deleteUser,
  getUserSessions,
  revokeSession
};
