const jwt = require('jsonwebtoken');
const User = require('../models/User');
const SessionManager = require('../utils/sessionManager');
const { PermissionManager } = require('../utils/permissions');

// Protect routes - require authentication
const protect = async (req, res, next) => {
  try {
    let token;
    let sessionId;

    // Check for JWT token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check for session cookie
    if (req.cookies && req.cookies.sessionId) {
      sessionId = req.cookies.sessionId;
    }

    if (!token && !sessionId) {
      return res.status(401).json({ 
        message: 'Not authorized, no token or session found',
        requiresAuth: true
      });
    }

    let user;

    // Verify JWT token if present
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        user = await User.findById(decoded.id).select('-password');
      } catch (error) {
        console.error('JWT verification error:', error);
        return res.status(401).json({ 
          message: 'Invalid token',
          requiresAuth: true
        });
      }
    }

    // Verify session if present
    if (sessionId && !user) {
      user = await User.findOne({
        'sessions.sessionId': sessionId,
        'sessions.expiresAt': { $gt: new Date() }
      }).select('-password');

      if (user) {
        // Update session activity
        const session = user.sessions.find(s => s.sessionId === sessionId);
        if (session) {
          session.lastActivity = new Date();
          await user.save();
        }
      }
    }

    if (!user) {
      return res.status(401).json({ 
        message: 'User not found or session expired',
        requiresAuth: true
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        message: 'User account is deactivated',
        requiresAuth: true
      });
    }

    if (user.accountLocked && user.lockExpiresAt > new Date()) {
      return res.status(423).json({ 
        message: 'Account is temporarily locked due to multiple failed login attempts',
        lockExpiresAt: user.lockExpiresAt
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Authentication error' });
  }
};

// Authorize roles and permissions
const authorize = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Check if user has required permissions
    if (requiredPermissions.length > 0) {
      const hasPermission = PermissionManager.userHasAnyPermission(req.user, requiredPermissions);
      
      if (!hasPermission) {
        return res.status(403).json({ 
          message: `Access denied. Required permissions: ${requiredPermissions.join(', ')}`,
          requiredPermissions,
          userPermissions: PermissionManager.getUserEffectivePermissions(req.user)
        });
      }
    }

    next();
  };
};

// Require specific role
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${roles.join(', ')}`,
        requiredRoles: roles,
        userRole: req.user.role
      });
    }

    next();
  };
};

// MFA verification middleware
const requireMFA = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Check if MFA is enabled for this user
    if (!req.user.mfaEnabled) {
      return next(); // MFA not enabled, proceed
    }

    // Check if MFA has been verified in this session
    const mfaVerified = req.session && req.session.mfaVerified;
    
    if (!mfaVerified) {
      return res.status(403).json({ 
        message: 'MFA verification required',
        requiresMFA: true,
        mfaEnabled: true
      });
    }

    next();
  } catch (error) {
    console.error('MFA middleware error:', error);
    return res.status(500).json({ message: 'MFA verification error' });
  }
};

// Rate limiting for login attempts
const loginRateLimit = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const key = `login_attempts:${ip}`;
  
  // This would typically use Redis or a similar store
  // For now, we'll implement a simple in-memory solution
  if (!req.app.locals.loginAttempts) {
    req.app.locals.loginAttempts = new Map();
  }

  const attempts = req.app.locals.loginAttempts.get(key) || { count: 0, resetTime: Date.now() + 15 * 60 * 1000 };

  // Reset if time has passed
  if (Date.now() > attempts.resetTime) {
    attempts.count = 0;
    attempts.resetTime = Date.now() + 15 * 60 * 1000;
  }

  // Check if limit exceeded
  if (attempts.count >= 5) {
    return res.status(429).json({ 
      message: 'Too many login attempts. Please try again in 15 minutes.',
      retryAfter: Math.ceil((attempts.resetTime - Date.now()) / 1000)
    });
  }

  // Increment attempt count
  attempts.count++;
  req.app.locals.loginAttempts.set(key, attempts);

  // Add attempt tracking to request
  req.loginAttempts = attempts;
  next();
};

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Generate refresh token
const generateRefreshToken = (id) => {
  return jwt.sign({ id, type: 'refresh' }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

// Check if token was issued before password change
const changedPasswordAfter = (JWTTimestamp, passwordChangedAt) => {
  if (passwordChangedAt) {
    const changedTimestamp = parseInt(passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

module.exports = {
  protect,
  authorize,
  requireRole,
  requireMFA,
  loginRateLimit,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  changedPasswordAfter
};
