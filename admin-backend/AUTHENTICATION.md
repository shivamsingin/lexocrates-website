# Enhanced Authentication & Access Control System

This document describes the comprehensive authentication and access control system implemented for the Lexocrates admin panel.

## 🏗️ Architecture Overview

The authentication system implements a multi-layered security approach with:

- **Role-Based Access Control (RBAC)** with granular permissions
- **Multi-Factor Authentication (MFA)** using TOTP
- **Secure Session Management** with HttpOnly cookies
- **Account Lockout Protection** against brute force attacks
- **Device Fingerprinting** and session tracking

## 🔐 Authentication Flow

### 1. User Registration
```
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "staff" // Optional: defaults to "client"
}
```

### 2. User Login
```
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "securePassword123",
  "mfaToken": "123456" // Required if MFA is enabled
}
```

### 3. MFA Setup (Optional)
```
POST /api/auth/mfa/setup
// Returns QR code and backup codes

POST /api/auth/mfa/enable
{
  "token": "123456"
}
```

## 👥 Role-Based Access Control (RBAC)

### Roles Hierarchy

1. **Client** - Basic access
   - Read blog posts
   - View analytics

2. **Staff** - Content management
   - All client permissions
   - Write and publish blog posts
   - Manage content
   - View reports

3. **Admin** - Full system access
   - All staff permissions
   - Manage users and permissions
   - System settings
   - Billing management
   - Delete content

### Permission System

```javascript
const permissions = {
  read_blog: 'Read blog posts and content',
  write_blog: 'Create and edit blog posts',
  publish_blog: 'Publish blog posts',
  delete_blog: 'Delete blog posts',
  manage_users: 'Manage user accounts and permissions',
  manage_settings: 'Manage system settings',
  view_analytics: 'View analytics and statistics',
  manage_content: 'Manage all content types',
  manage_billing: 'Manage billing and subscriptions',
  view_reports: 'View system reports'
};
```

### Using Permissions in Routes

```javascript
// Require specific permissions
router.get('/admin-dashboard', protect, authorize('manage_users', 'manage_settings'), handler);

// Require specific role
router.get('/users', protect, requireRole('admin'), handler);

// Check permissions in controllers
if (PermissionManager.userHasPermission(req.user, 'delete_blog')) {
  // Allow deletion
}
```

## 🔒 Multi-Factor Authentication (MFA)

### Setup Process

1. **Generate MFA Secret**
   ```javascript
   POST /api/auth/mfa/setup
   // Returns: { secret, qrCode, backupCodes }
   ```

2. **Scan QR Code** with authenticator app (Google Authenticator, Authy, etc.)

3. **Enable MFA**
   ```javascript
   POST /api/auth/mfa/enable
   { "token": "123456" }
   ```

### Login with MFA

```javascript
// Standard login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123",
  "mfaToken": "123456" // From authenticator app
}

// Using backup code
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123",
  "backupCode": "ABCD1234" // One-time use
}
```

### MFA Management

```javascript
// Disable MFA
POST /api/auth/mfa/disable
{ "token": "123456" }

// Get backup codes (if lost)
POST /api/auth/mfa/setup // Regenerates new codes
```

## 🍪 Session Management

### Secure Cookie Configuration

```javascript
const cookieOptions = {
  httpOnly: true,        // Prevents XSS attacks
  secure: true,          // HTTPS only in production
  sameSite: 'strict',    // CSRF protection
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  path: '/'
};
```

### Session Tracking

Each user session includes:
- **Session ID** - Unique identifier
- **Device Info** - User agent and IP
- **Activity Tracking** - Last activity timestamp
- **Expiration** - Automatic cleanup

### Session Management API

```javascript
// Get active sessions
GET /api/auth/sessions

// Revoke specific session
DELETE /api/auth/sessions/:sessionId

// Logout (revokes current session)
POST /api/auth/logout
```

## 🛡️ Security Features

### Account Protection

1. **Brute Force Protection**
   - 5 failed login attempts → 15-minute lockout
   - Configurable via environment variables

2. **Password Security**
   - Minimum 8 characters
   - bcrypt hashing with 12 rounds
   - Password change tracking

3. **Token Security**
   - JWT with short expiration (24h)
   - Refresh tokens with longer expiration (7d)
   - Automatic token invalidation on password change

### Rate Limiting

```javascript
// General API rate limiting
windowMs: 15 minutes
max: 100 requests per IP

// Authentication rate limiting
windowMs: 15 minutes
max: 5 requests per IP
```

### Security Headers

```javascript
// Helmet.js configuration
contentSecurityPolicy: {
  defaultSrc: ["'self'"],
  styleSrc: ["'self'", "'unsafe-inline'"],
  // ... other directives
}

// Additional headers
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

## 🔧 Configuration

### Environment Variables

```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRE=24h

# Security Configuration
BCRYPT_ROUNDS=12
PASSWORD_MIN_LENGTH=8
LOGIN_MAX_ATTEMPTS=5
LOGIN_LOCKOUT_DURATION=15

# Cookie Configuration
COOKIE_DOMAIN=yourdomain.com
COOKIE_SECURE=true # in production

# MFA Configuration
MFA_ISSUER=Lexocrates
MFA_WINDOW=2
```

### Database Schema

```javascript
const userSchema = {
  email: String,
  password: String,
  name: String,
  role: ['client', 'staff', 'admin'],
  permissions: [String],
  mfaEnabled: Boolean,
  mfaSecret: String,
  mfaBackupCodes: [Object],
  sessions: [Object],
  failedLoginAttempts: Number,
  accountLocked: Boolean,
  lockExpiresAt: Date
};
```

## 🚀 API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | User login | Public |
| POST | `/api/auth/logout` | User logout | Private |
| POST | `/api/auth/refresh` | Refresh token | Public |
| GET | `/api/auth/me` | Get current user | Private |
| PUT | `/api/auth/profile` | Update profile | Private |

### MFA Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/auth/mfa/setup` | Setup MFA | Private |
| POST | `/api/auth/mfa/enable` | Enable MFA | Private |
| POST | `/api/auth/mfa/disable` | Disable MFA | Private |

### Session Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/auth/sessions` | Get user sessions | Private |
| DELETE | `/api/auth/sessions/:id` | Revoke session | Private |

### User Management (Admin Only)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/auth/users` | Get all users | Admin |
| PUT | `/api/auth/users/:id` | Update user | Admin |
| DELETE | `/api/auth/users/:id` | Delete user | Admin |

## 🔍 Usage Examples

### Frontend Integration

```javascript
// Login with MFA
const login = async (credentials) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Important for cookies
    body: JSON.stringify(credentials)
  });
  
  if (response.status === 403 && response.data.requiresMFA) {
    // Prompt for MFA token
    const mfaToken = await promptForMFAToken();
    return login({ ...credentials, mfaToken });
  }
  
  return response.json();
};

// Check permissions
const canDeletePost = (user) => {
  return user.effectivePermissions.includes('delete_blog');
};
```

### Middleware Usage

```javascript
// Protect route with specific permissions
router.get('/admin/users', 
  protect, 
  authorize('manage_users'), 
  userController.getUsers
);

// Require specific role
router.post('/admin/settings', 
  protect, 
  requireRole('admin'), 
  settingsController.updateSettings
);

// Require MFA for sensitive operations
router.post('/admin/delete-user', 
  protect, 
  requireMFA, 
  requireRole('admin'), 
  userController.deleteUser
);
```

## 🧪 Testing

### Test Authentication Flow

```javascript
// 1. Register user
const user = await register({
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
  role: 'staff'
});

// 2. Login
const loginResult = await login({
  email: 'test@example.com',
  password: 'password123'
});

// 3. Setup MFA
const mfaSetup = await setupMFA(loginResult.token);

// 4. Enable MFA
await enableMFA({
  token: '123456', // From authenticator app
  authToken: loginResult.token
});

// 5. Login with MFA
const mfaLogin = await login({
  email: 'test@example.com',
  password: 'password123',
  mfaToken: '123456'
});
```

## 🔒 Security Best Practices

1. **Always use HTTPS in production**
2. **Rotate JWT secrets regularly**
3. **Implement proper error handling**
4. **Log security events**
5. **Regular security audits**
6. **Keep dependencies updated**
7. **Use environment variables for secrets**
8. **Implement proper CORS policies**

## 🚨 Security Considerations

### Known Vulnerabilities

- **XSS Protection**: HttpOnly cookies prevent XSS attacks
- **CSRF Protection**: SameSite=Strict cookies
- **Brute Force**: Rate limiting and account lockout
- **Session Hijacking**: Secure session management
- **Token Theft**: Short-lived JWT tokens

### Monitoring

Monitor for:
- Failed login attempts
- Account lockouts
- Suspicious session activity
- MFA bypass attempts
- Permission escalation attempts

## 📚 Additional Resources

- [JWT Security Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [MFA Implementation Guide](https://www.nist.gov/publications/multi-factor-authentication)
- [Session Management Security](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/06-Session_Management_Testing/)
