# Input & Form Protection Implementation

This document describes the comprehensive security implementation for input validation, form protection, and attack prevention in the Lexocrates admin panel.

## 🛡️ Security Features Implemented

### 1. CSRF (Cross-Site Request Forgery) Protection

**Implementation:**
- CSRF tokens generated for all forms
- Token verification on POST/PUT/DELETE requests
- Automatic token generation and validation
- Bypass for JWT-authenticated API routes

**Configuration:**
```javascript
// CSRF token generation
const token = csrfProtection.generateToken();

// CSRF token verification
const isValid = csrfProtection.verifyToken(token);
```

**Usage:**
```javascript
// Frontend form with CSRF token
<form method="POST" action="/api/contact/submit">
  <input type="hidden" name="_csrf" value="<%= csrfToken %>">
  <!-- form fields -->
</form>

// AJAX request with CSRF token
fetch('/api/contact/submit', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify(data)
});
```

### 2. Content Security Policy (CSP)

**Policy Configuration:**
```javascript
const cspPolicy = {
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    scriptSrc: ["'self'", "'unsafe-inline'", "https://www.google.com/recaptcha/"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "https://api.recaptcha.net"],
    frameSrc: ["'self'", "https://www.google.com/recaptcha/"],
    objectSrc: ["'none'"]
  }
};
```

**Security Benefits:**
- Prevents XSS attacks
- Controls resource loading
- Restricts inline scripts and styles
- Allows only trusted sources

### 3. Input Sanitization

**Text Sanitization:**
```javascript
// Remove all HTML tags and scripts
const sanitizedText = InputSanitizer.sanitizeText(userInput);
```

**HTML Sanitization:**
```javascript
// Allow safe HTML tags and attributes
const sanitizedHtml = InputSanitizer.sanitizeHtml(userInput, {
  allowedTags: ['h1', 'h2', 'p', 'strong', 'em', 'a'],
  allowedAttributes: {
    'a': ['href', 'title'],
    'img': ['src', 'alt']
  }
});
```

**Object Sanitization:**
```javascript
// Recursively sanitize all object properties
const sanitizedObject = InputSanitizer.sanitizeObject(userData);
```

**Allowed HTML Tags:**
- Headings: `h1`, `h2`, `h3`, `h4`, `h5`, `h6`
- Text: `p`, `br`, `strong`, `em`, `u`, `s`
- Lists: `ul`, `ol`, `li`
- Links: `a` (with href, title, target)
- Images: `img` (with src, alt, title, width, height)
- Code: `code`, `pre` (with class)
- Tables: `table`, `thead`, `tbody`, `tr`, `td`, `th`
- Containers: `div`, `span` (with class, id)

### 4. Input Validation

**Registration Validation:**
```javascript
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-Z\s]+$/),
  
  body('email')
    .isEmail()
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
];
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

**Blog Post Validation:**
```javascript
const blogValidation = [
  body('title')
    .trim()
    .isLength({ min: 10, max: 100 }),
  
  body('content')
    .trim()
    .isLength({ min: 100 }),
  
  body('metaDescription')
    .trim()
    .isLength({ min: 50, max: 160 })
];
```

### 5. CAPTCHA Protection

**Google reCAPTCHA v2 Integration:**
```javascript
// CAPTCHA verification
const isValid = await CAPTCHA.verify(token, secretKey);
```

**Implementation:**
- Required for contact forms
- Required for user registration
- Required for file uploads
- Server-side verification

**Frontend Integration:**
```html
<!-- reCAPTCHA widget -->
<div class="g-recaptcha" data-sitekey="your-site-key"></div>

<!-- Form submission with CAPTCHA token -->
<script>
grecaptcha.ready(function() {
  grecaptcha.execute('your-site-key', {action: 'submit'}).then(function(token) {
    // Include token in form submission
    document.getElementById('captchaToken').value = token;
  });
});
</script>
```

### 6. Rate Limiting

**Configuration:**
```javascript
// General API rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // 100 requests per IP
});

// Authentication rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // 5 requests per IP
});

// Contact form rate limiting
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3 // 3 submissions per IP
});
```

**Rate Limits:**
- **General API**: 100 requests per 15 minutes
- **Authentication**: 5 requests per 15 minutes
- **File Upload**: 10 uploads per hour
- **Contact Form**: 3 submissions per hour

### 7. File Upload Security

**Validation:**
```javascript
const fileValidation = [
  body('file')
    .custom((value, { req }) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!allowedTypes.includes(req.file.mimetype)) {
        throw new Error('Invalid file type');
      }
      
      if (req.file.size > maxSize) {
        throw new Error('File too large');
      }
      
      return true;
    })
];
```

**Security Measures:**
- File type validation
- File size limits (5MB)
- MIME type checking
- Virus scanning (recommended)
- Secure file storage

### 8. Security Headers

**Implemented Headers:**
```javascript
// Security headers configuration
app.use(helmet({
  contentSecurityPolicy: cspPolicy,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
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
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true
}));
```

**Headers Set:**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `Content-Security-Policy: [configured policy]`

## 🔧 Configuration

### Environment Variables

```bash
# CSRF Configuration
CSRF_SECRET=your-super-secret-csrf-key

# CAPTCHA Configuration
RECAPTCHA_SITE_KEY=your-recaptcha-site-key
RECAPTCHA_SECRET_KEY=your-recaptcha-secret-key

# Security Headers
CSP_REPORT_URI=https://your-domain.com/csp-report
HSTS_MAX_AGE=31536000
HSTS_INCLUDE_SUBDOMAINS=true
HSTS_PRELOAD=true
```

### Dependencies

```json
{
  "csrf": "^4.1.2",
  "express-rate-limit": "^6.10.0",
  "express-validator": "^7.0.1",
  "sanitize-html": "^2.10.0",
  "xss": "^1.0.14",
  "helmet": "^7.0.0",
  "express-slow-down": "^1.6.0"
}
```

## 🚀 API Endpoints

### Contact Form (with CAPTCHA)

```javascript
// Get CAPTCHA site key
GET /api/contact/captcha-key

// Submit contact form
POST /api/contact/submit
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Inquiry",
  "message": "Hello, I have a question...",
  "captchaToken": "recaptcha-token"
}
```

### Security Test Endpoint

```javascript
// Test security headers
GET /api/security-test
```

## 🧪 Testing

### Security Test Script

```bash
# Run security tests
node test-security.js
```

**Tests Include:**
- Input sanitization
- HTML sanitization
- Object sanitization
- Validation rules
- CAPTCHA verification
- Password validation
- File upload validation
- Rate limiting configuration
- Security headers
- CSRF protection

### Manual Testing

**XSS Prevention:**
```javascript
// Test malicious input
const maliciousInput = '<script>alert("XSS")</script>';
const sanitized = InputSanitizer.sanitizeText(maliciousInput);
// Result: "alert("XSS")" (script tags removed)
```

**CSRF Protection:**
```javascript
// Test without CSRF token
fetch('/api/contact/submit', {
  method: 'POST',
  body: JSON.stringify(data)
});
// Result: 403 Forbidden - CSRF token validation failed
```

**Rate Limiting:**
```javascript
// Test rate limiting
for (let i = 0; i < 10; i++) {
  fetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });
}
// Result: 429 Too Many Requests after 5 attempts
```

## 🔒 Security Best Practices

### 1. Input Validation
- Always validate on both client and server
- Use whitelist approach for allowed values
- Sanitize all user inputs
- Validate file uploads

### 2. CSRF Protection
- Use CSRF tokens for all state-changing operations
- Verify tokens on server-side
- Use secure cookie settings
- Implement proper session management

### 3. XSS Prevention
- Sanitize all user inputs
- Use Content Security Policy
- Escape output in templates
- Validate and sanitize HTML content

### 4. Rate Limiting
- Implement rate limiting for all endpoints
- Use different limits for different operations
- Monitor and log rate limit violations
- Implement progressive delays

### 5. File Upload Security
- Validate file types and sizes
- Scan files for malware
- Store files securely
- Use secure file serving

### 6. CAPTCHA Implementation
- Use CAPTCHA for public forms
- Verify CAPTCHA on server-side
- Implement fallback mechanisms
- Monitor CAPTCHA effectiveness

## 📊 Security Monitoring

### Logging
- Log all security events
- Monitor rate limit violations
- Track failed authentication attempts
- Log file upload attempts

### Alerts
- Set up alerts for security violations
- Monitor unusual traffic patterns
- Alert on multiple failed login attempts
- Track CAPTCHA failures

### Reporting
- Generate security reports
- Monitor CSP violations
- Track rate limiting effectiveness
- Analyze attack patterns

## 🚨 Security Considerations

### Known Vulnerabilities Addressed
- **XSS**: Input sanitization + CSP
- **CSRF**: CSRF tokens + secure cookies
- **SQL Injection**: Input validation + parameterized queries
- **File Upload Attacks**: File validation + secure storage
- **Brute Force**: Rate limiting + account lockout
- **Clickjacking**: X-Frame-Options header
- **MIME Sniffing**: X-Content-Type-Options header

### Ongoing Security Measures
- Regular security audits
- Dependency updates
- Security header monitoring
- CAPTCHA effectiveness analysis
- Rate limiting optimization

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [CSRF Protection](https://owasp.org/www-community/attacks/csrf)
- [XSS Prevention](https://owasp.org/www-project-cheat-sheets/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [reCAPTCHA Documentation](https://developers.google.com/recaptcha)
