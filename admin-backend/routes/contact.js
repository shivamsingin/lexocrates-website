const express = require('express');
const router = express.Router();
const { submitContactForm, getCaptchaKey } = require('../controllers/contactController');
const { 
  CSRFProtection, 
  RateLimiter, 
  ValidationRules, 
  CAPTCHA,
  InputSanitizer 
} = require('../middleware/security');

// Initialize CSRF protection
const csrfProtection = new CSRFProtection();

// Get CAPTCHA site key
router.get('/captcha-key', getCaptchaKey);

// Submit contact form with comprehensive security
router.post('/submit', 
  // Rate limiting
  RateLimiter.contactForm(),
  
  // Input sanitization
  InputSanitizer.middleware(),
  
  // Input validation
  ValidationRules.contactForm(),
  ValidationRules.handleValidationErrors,
  
  // CAPTCHA verification
  CAPTCHA.middleware(),
  
  // Submit form
  submitContactForm
);

module.exports = router;
