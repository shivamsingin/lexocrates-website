const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/authController');
const { 
  protect, 
  authorize, 
  requireRole, 
  requireMFA, 
  loginRateLimit 
} = require('../middleware/auth');
const { 
  RateLimiter, 
  SlowDown, 
  ValidationRules, 
  InputSanitizer,
  CSRFProtection 
} = require('../middleware/security');

// Initialize CSRF protection
const csrfProtection = new CSRFProtection();

// Public routes with enhanced security
router.post('/register', 
  RateLimiter.auth(),
  SlowDown.auth(),
  InputSanitizer.middleware(),
  ValidationRules.register(),
  ValidationRules.handleValidationErrors,
  register
);

router.post('/login', 
  loginRateLimit,
  RateLimiter.auth(),
  SlowDown.auth(),
  InputSanitizer.middleware(),
  ValidationRules.login(),
  ValidationRules.handleValidationErrors,
  login
);

router.post('/logout', logout);
router.post('/refresh', refreshToken);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', 
  protect, 
  InputSanitizer.middleware(),
  updateProfile
);

// MFA routes
router.post('/mfa/setup', protect, setupMFA);
router.post('/mfa/enable', 
  protect, 
  InputSanitizer.middleware(),
  enableMFA
);
router.post('/mfa/disable', 
  protect, 
  InputSanitizer.middleware(),
  disableMFA
);

// Session management
router.get('/sessions', protect, getUserSessions);
router.delete('/sessions/:sessionId', protect, revokeSession);

// Admin routes
router.get('/users', protect, requireRole('admin'), getUsers);
router.put('/users/:id', 
  protect, 
  requireRole('admin'),
  InputSanitizer.middleware(),
  updateUser
);
router.delete('/users/:id', protect, requireRole('admin'), deleteUser);

// Permission-based routes examples
router.get('/admin-dashboard', protect, authorize('manage_users', 'manage_settings'), (req, res) => {
  res.json({ message: 'Admin dashboard access granted' });
});

router.get('/content-management', protect, authorize('manage_content', 'write_blog'), (req, res) => {
  res.json({ message: 'Content management access granted' });
});

router.get('/analytics', protect, authorize('view_analytics'), (req, res) => {
  res.json({ message: 'Analytics access granted' });
});

module.exports = router;
