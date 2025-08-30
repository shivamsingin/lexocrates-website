const csrf = require('csrf');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const hpp = require('hpp');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const sanitizeHtml = require('sanitize-html');
const xss = require('xss');

// CSRF Protection
class CSRFProtection {
  constructor() {
    this.tokens = new csrf();
  }

  // Generate CSRF token
  generateToken() {
    return this.tokens.create(process.env.CSRF_SECRET || 'csrf-secret');
  }

  // Verify CSRF token
  verifyToken(token) {
    return this.tokens.verify(process.env.CSRF_SECRET || 'csrf-secret', token);
  }

  // CSRF middleware
  middleware() {
    return (req, res, next) => {
      // Skip CSRF for API routes that use JWT
      if (req.path.startsWith('/api/') && req.headers.authorization) {
        return next();
      }

      // Generate token for forms
      if (req.method === 'GET') {
        const token = this.generateToken();
        res.locals.csrfToken = token;
        res.cookie('XSRF-TOKEN', token, {
          httpOnly: false, // Allow JavaScript access for AJAX requests
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });
      }

      // Verify token for POST/PUT/DELETE requests
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        const token = req.headers['x-csrf-token'] || req.body._csrf || req.query._csrf;
        
        if (!token || !this.verifyToken(token)) {
          return res.status(403).json({
            success: false,
            message: 'CSRF token validation failed'
          });
        }
      }

      next();
    };
  }
}

// Input Sanitization
class InputSanitizer {
  // Sanitize HTML content
  static sanitizeHtml(input, options = {}) {
    const defaultOptions = {
      allowedTags: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'strong', 'em', 'u', 's',
        'ul', 'ol', 'li', 'blockquote', 'code',
        'pre', 'a', 'img', 'table', 'thead', 'tbody',
        'tr', 'td', 'th', 'div', 'span'
      ],
      allowedAttributes: {
        'a': ['href', 'title', 'target'],
        'img': ['src', 'alt', 'title', 'width', 'height'],
        'code': ['class'],
        'pre': ['class'],
        'div': ['class', 'id'],
        'span': ['class', 'id'],
        'table': ['class', 'id'],
        'th': ['class', 'id'],
        'td': ['class', 'id']
      },
      allowedSchemes: ['http', 'https', 'mailto', 'tel'],
      allowedClasses: {
        'code': ['language-*', 'hljs', 'hljs-*'],
        'pre': ['language-*', 'hljs', 'hljs-*']
      }
    };

    return sanitizeHtml(input, { ...defaultOptions, ...options });
  }

  // Sanitize plain text
  static sanitizeText(input) {
    if (typeof input !== 'string') return input;
    
    return xss(input, {
      whiteList: {},
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed']
    });
  }

  // Sanitize object recursively
  static sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return typeof obj === 'string' ? this.sanitizeText(obj) : obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = this.sanitizeObject(value);
    }
    return sanitized;
  }

  // Middleware to sanitize request body
  static middleware() {
    return (req, res, next) => {
      if (req.body) {
        req.body = this.sanitizeObject(req.body);
      }
      if (req.query) {
        req.query = this.sanitizeObject(req.query);
      }
      if (req.params) {
        req.params = this.sanitizeObject(req.params);
      }
      next();
    };
  }
}

// Rate Limiting
class RateLimiter {
  // General API rate limiting
  static general() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        res.status(429).json({
          success: false,
          message: 'Too many requests from this IP, please try again later.',
          retryAfter: Math.ceil(15 * 60 / 1000)
        });
      }
    });
  }

  // Authentication rate limiting
  static auth() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // limit each IP to 5 requests per windowMs
      message: {
        success: false,
        message: 'Too many authentication attempts, please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        res.status(429).json({
          success: false,
          message: 'Too many authentication attempts, please try again later.',
          retryAfter: Math.ceil(15 * 60 / 1000)
        });
      }
    });
  }

  // File upload rate limiting
  static fileUpload() {
    return rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10, // limit each IP to 10 uploads per hour
      message: {
        success: false,
        message: 'Too many file uploads, please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false
    });
  }

  // Contact form rate limiting
  static contactForm() {
    return rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3, // limit each IP to 3 contact form submissions per hour
      message: {
        success: false,
        message: 'Too many contact form submissions, please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false
    });
  }
}

// Slow Down (for brute force protection)
class SlowDown {
  static auth() {
    return slowDown({
      windowMs: 15 * 60 * 1000, // 15 minutes
      delayAfter: 2, // allow 2 requests per 15 minutes, then...
      delayMs: () => 500 // begin adding 500ms of delay per request above limit
    });
  }
}

// Content Security Policy
class CSP {
  static getPolicy() {
    const isProduction = process.env.NODE_ENV === 'production';
    
    return {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'", // Required for dynamic styles
          "https://fonts.googleapis.com",
          "https://cdnjs.cloudflare.com",
          "https://cdn.jsdelivr.net"
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
          "https://cdnjs.cloudflare.com",
          "https://cdn.jsdelivr.net"
        ],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'", // Required for inline scripts
          "'unsafe-eval'", // Required for some libraries
          "https://cdnjs.cloudflare.com",
          "https://cdn.jsdelivr.net",
          "https://www.google.com/recaptcha/",
          "https://www.gstatic.com/recaptcha/"
        ],
        imgSrc: [
          "'self'",
          "data:",
          "https:",
          "blob:"
        ],
        connectSrc: [
          "'self'",
          "https://api.recaptcha.net",
          "https://www.google.com/recaptcha/"
        ],
        frameSrc: [
          "'self'",
          "https://www.google.com/recaptcha/",
          "https://recaptcha.google.com/"
        ],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        manifestSrc: ["'self'"],
        workerSrc: ["'self'", "blob:"],
        childSrc: ["'self'", "blob:"],
        formAction: ["'self'"],
        baseUri: ["'self'"],
        upgradeInsecureRequests: isProduction ? [] : null
      },
      reportOnly: false,
      setAllHeaders: true
    };
  }
}

// Input Validation Rules
class ValidationRules {
  // User registration validation
  static register() {
    return [
      body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Name can only contain letters and spaces'),
      
      body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
      
      body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
      
      body('role')
        .optional()
        .isIn(['client', 'staff', 'admin'])
        .withMessage('Invalid role specified')
    ];
  }

  // User login validation
  static login() {
    return [
      body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
      
      body('password')
        .notEmpty()
        .withMessage('Password is required')
    ];
  }

  // Blog post validation
  static blogPost() {
    return [
      body('title')
        .trim()
        .isLength({ min: 10, max: 100 })
        .withMessage('Title must be between 10 and 100 characters'),
      
      body('content')
        .trim()
        .isLength({ min: 100 })
        .withMessage('Content must be at least 100 characters long'),
      
      body('metaDescription')
        .trim()
        .isLength({ min: 50, max: 160 })
        .withMessage('Meta description must be between 50 and 160 characters'),
      
      body('category')
        .trim()
        .notEmpty()
        .withMessage('Category is required'),
      
      body('tags')
        .optional()
        .isArray()
        .withMessage('Tags must be an array'),
      
      body('tags.*')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 2, max: 20 })
        .withMessage('Each tag must be between 2 and 20 characters')
    ];
  }

  // Contact form validation
  static contactForm() {
    return [
      body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Name can only contain letters and spaces'),
      
      body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
      
      body('subject')
        .trim()
        .isLength({ min: 5, max: 100 })
        .withMessage('Subject must be between 5 and 100 characters'),
      
      body('message')
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage('Message must be between 10 and 1000 characters'),
      
      body('captchaToken')
        .notEmpty()
        .withMessage('CAPTCHA verification is required')
    ];
  }

  // File upload validation
  static fileUpload() {
    return [
      body('file')
        .custom((value, { req }) => {
          if (!req.file) {
            throw new Error('File is required');
          }
          
          const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
          if (!allowedTypes.includes(req.file.mimetype)) {
            throw new Error('Only JPEG, PNG, GIF, and WebP images are allowed');
          }
          
          const maxSize = 5 * 1024 * 1024; // 5MB
          if (req.file.size > maxSize) {
            throw new Error('File size must be less than 5MB');
          }
          
          return true;
        })
    ];
  }

  // Validation result handler
  static handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(error => ({
          field: error.path,
          message: error.msg,
          value: error.value
        }))
      });
    }
    next();
  }
}

// CAPTCHA Verification
class CAPTCHA {
  static async verify(token, secretKey) {
    try {
      const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `secret=${secretKey}&response=${token}`
      });

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('CAPTCHA verification error:', error);
      return false;
    }
  }

  static middleware() {
    return async (req, res, next) => {
      const captchaToken = req.body.captchaToken || req.headers['x-captcha-token'];
      
      if (!captchaToken) {
        return res.status(400).json({
          success: false,
          message: 'CAPTCHA token is required'
        });
      }

      const isValid = await this.verify(captchaToken, process.env.RECAPTCHA_SECRET_KEY);
      
      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: 'CAPTCHA verification failed'
        });
      }

      next();
    };
  }
}

// Security Headers
class SecurityHeaders {
  static middleware() {
    return helmet({
      contentSecurityPolicy: CSP.getPolicy(),
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
      crossOriginResourcePolicy: { policy: "cross-origin" },
      dnsPrefetchControl: { allow: false },
      frameguard: { action: "deny" },
      hidePoweredBy: true,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      },
      ieNoOpen: true,
      noSniff: true,
      permittedCrossDomainPolicies: { permittedPolicies: "none" },
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      xssFilter: true
    });
  }
}

module.exports = {
  CSRFProtection,
  InputSanitizer,
  RateLimiter,
  SlowDown,
  CSP,
  ValidationRules,
  CAPTCHA,
  SecurityHeaders
};
