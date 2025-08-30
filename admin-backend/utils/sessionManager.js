const crypto = require('crypto');

class SessionManager {
  // Generate session ID
  static generateSessionId() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Create session cookie options
  static getCookieOptions(isSecure = true) {
    const options = {
      httpOnly: true,
      secure: isSecure, // true in production, false in development
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/'
    };

    // Add domain in production
    if (process.env.NODE_ENV === 'production' && process.env.COOKIE_DOMAIN) {
      options.domain = process.env.COOKIE_DOMAIN;
    }

    return options;
  }

  // Create refresh token cookie options
  static getRefreshCookieOptions(isSecure = true) {
    const options = {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/auth/refresh'
    };

    if (process.env.NODE_ENV === 'production' && process.env.COOKIE_DOMAIN) {
      options.domain = process.env.COOKIE_DOMAIN;
    }

    return options;
  }

  // Generate device fingerprint
  static generateDeviceFingerprint(req) {
    const userAgent = req.headers['user-agent'] || '';
    const ip = req.ip || req.connection.remoteAddress;
    const acceptLanguage = req.headers['accept-language'] || '';
    
    const fingerprint = crypto
      .createHash('sha256')
      .update(`${userAgent}${ip}${acceptLanguage}`)
      .digest('hex');
    
    return fingerprint.substring(0, 16);
  }

  // Get device info
  static getDeviceInfo(req) {
    const userAgent = req.headers['user-agent'] || '';
    const ip = req.ip || req.connection.remoteAddress;
    
    // Simple device detection
    let deviceType = 'Unknown';
    if (userAgent.includes('Mobile')) {
      deviceType = 'Mobile';
    } else if (userAgent.includes('Tablet')) {
      deviceType = 'Tablet';
    } else if (userAgent.includes('Windows') || userAgent.includes('Mac') || userAgent.includes('Linux')) {
      deviceType = 'Desktop';
    }

    return {
      userAgent: userAgent.substring(0, 200), // Limit length
      ipAddress: ip,
      deviceType,
      fingerprint: this.generateDeviceFingerprint(req)
    };
  }

  // Clean expired sessions
  static cleanExpiredSessions(sessions) {
    const now = new Date();
    return sessions.filter(session => session.expiresAt > now);
  }

  // Check if session is valid
  static isSessionValid(session) {
    return session && session.expiresAt > new Date();
  }

  // Update session activity
  static updateSessionActivity(session) {
    session.lastActivity = new Date();
    return session;
  }

  // Generate session expiry time
  static getSessionExpiry() {
    return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  }

  // Generate refresh token expiry time
  static getRefreshTokenExpiry() {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  }

  // Clear session cookies
  static clearSessionCookies(res) {
    res.clearCookie('sessionId', this.getCookieOptions());
    res.clearCookie('refreshToken', this.getRefreshCookieOptions());
  }

  // Set session cookies
  static setSessionCookies(res, sessionId, refreshToken, isSecure = true) {
    res.cookie('sessionId', sessionId, this.getCookieOptions(isSecure));
    res.cookie('refreshToken', refreshToken, this.getRefreshCookieOptions(isSecure));
  }
}

module.exports = SessionManager;
