const express = require('express');
const router = express.Router();

// Import middleware
const { protect, authorize } = require('../middleware/auth');
const { RateLimiter } = require('../middleware/rateLimiter');
const { InputSanitizer } = require('../middleware/inputSanitizer');

// Import controllers
const {
  getAuditLogs,
  getAuditStats,
  getSecurityEvents,
  getComplianceEvents,
  getUserActivity,
  exportAuditLogs,
  cleanupAuditLogs
} = require('../controllers/auditController');

// All routes require authentication and admin privileges
router.use(protect);
router.use(authorize(['manage_users', 'view_audit_logs']));

// Get audit logs with filtering
router.get('/logs',
  RateLimiter.general(),
  InputSanitizer.middleware(),
  getAuditLogs
);

// Get audit statistics
router.get('/stats',
  RateLimiter.general(),
  InputSanitizer.middleware(),
  getAuditStats
);

// Get security events
router.get('/security',
  RateLimiter.general(),
  InputSanitizer.middleware(),
  getSecurityEvents
);

// Get compliance events
router.get('/compliance',
  RateLimiter.general(),
  InputSanitizer.middleware(),
  getComplianceEvents
);

// Get user activity (requires additional authorization)
router.get('/user/:userId',
  RateLimiter.general(),
  InputSanitizer.middleware(),
  authorize(['manage_users']), // Additional permission required
  getUserActivity
);

// Export audit logs (requires additional authorization)
router.post('/export',
  RateLimiter.general(),
  InputSanitizer.middleware(),
  authorize(['manage_users']), // Additional permission required
  exportAuditLogs
);

// Clean up expired audit logs (requires additional authorization)
router.post('/cleanup',
  RateLimiter.general(),
  InputSanitizer.middleware(),
  authorize(['manage_settings']), // Additional permission required
  cleanupAuditLogs
);

module.exports = router;


