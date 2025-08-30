const express = require('express');
const router = express.Router();
const { CSRFProtection } = require('../middleware/security');

// Initialize CSRF protection
const csrfProtection = new CSRFProtection();

/**
 * @desc    Get CSRF token
 * @route   GET /api/csrf-token
 * @access  Public
 */
router.get('/csrf-token', (req, res) => {
  try {
    const token = csrfProtection.generateToken();
    
    // Set token in cookie for automatic inclusion
    res.cookie('XSRF-TOKEN', token, {
      httpOnly: false, // Allow JavaScript access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({
      success: true,
      token: token,
      message: 'CSRF token generated successfully'
    });
  } catch (error) {
    console.error('CSRF token generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate CSRF token'
    });
  }
});

/**
 * @desc    Validate CSRF token
 * @route   POST /api/csrf-validate
 * @access  Public
 */
router.post('/csrf-validate', (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'CSRF token is required'
      });
    }

    const isValid = csrfProtection.verifyToken(token);
    
    res.json({
      success: true,
      valid: isValid,
      message: isValid ? 'CSRF token is valid' : 'CSRF token is invalid'
    });
  } catch (error) {
    console.error('CSRF token validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate CSRF token'
    });
  }
});

module.exports = router;

