const express = require('express');
const router = express.Router();
const {
  getPrivacyPolicy,
  getCookiePolicy,
  getSecurityStatement,
  getAllPolicies,
  getDataStorageCompliance,
  getClientComplianceStatus,
  updateClientDataStorage,
  getComplianceAuditLog
} = require('../controllers/complianceController');

const { protect, authorize } = require('../middleware/auth');
const { InputSanitizer } = require('../middleware/security');

// Public routes - accessible to everyone
router.get('/privacy-policy', getPrivacyPolicy);
router.get('/cookie-policy', getCookiePolicy);
router.get('/security-statement', getSecurityStatement);
router.get('/policies', getAllPolicies);
router.get('/data-storage', getDataStorageCompliance);

// Protected routes - require authentication
router.get('/client/:clientId', protect, getClientComplianceStatus);
router.put('/client/:clientId/storage', 
  protect, 
  InputSanitizer.middleware(),
  updateClientDataStorage
);

// Admin routes - require admin privileges
router.get('/audit-log', 
  protect, 
  authorize(['manage_compliance', 'view_audit_logs']), 
  getComplianceAuditLog
);

module.exports = router;
