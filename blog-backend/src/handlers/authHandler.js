const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AuthHandler {
  constructor(db) {
    this.db = db;
  }

  // Login user
  async login({ email, password, otp }) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Get user from database
    const [user] = await this.db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Enforce MFA if user has MFA enabled
    if (user.mfa_enabled) {
      const speakeasy = require('speakeasy');
      if (!otp) {
        throw new Error('MFA code required');
      }
      const verified = speakeasy.totp.verify({
        secret: user.mfa_secret,
        encoding: 'base32',
        token: otp,
        window: 1
      });
      if (!verified) {
        throw new Error('Invalid MFA code');
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    return {
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    };
  }

  // Register user
  async register({ email, password, name }) {
    if (!email || !password || !name) {
      throw new Error('Email, password, and name are required');
    }

    // Check if user already exists
    const [existingUser] = await this.db.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [result] = await this.db.query(`
      INSERT INTO users (email, password, name, role)
      VALUES (?, ?, ?, ?)
    `, [email, hashedPassword, name, 'admin']);

    return {
      success: true,
      message: 'User created successfully',
      userId: result.insertId
    };
  }

  // Get current user
  async getCurrentUser(userId) {
    const [user] = await this.db.query(
      'SELECT id, email, name, role, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      throw new Error('User not found');
    }

    return {
      success: true,
      user
    };
  }

  // Setup MFA (TOTP)
  async setupMfa(userId) {
    const speakeasy = require('speakeasy');
    const secret = speakeasy.generateSecret({ length: 20, name: 'Lexocrates' });
    await this.db.query('UPDATE users SET mfa_secret = ?, mfa_enabled = 0 WHERE id = ?', [secret.base32, userId]);
    return { otpauth_url: secret.otpauth_url, base32: secret.base32 };
  }

  // Verify MFA setup
  async verifyMfa(userId, token) {
    const speakeasy = require('speakeasy');
    const [user] = await this.db.query('SELECT mfa_secret FROM users WHERE id = ?', [userId]);
    if (!user?.mfa_secret) throw new Error('MFA not initialized');
    const verified = speakeasy.totp.verify({ secret: user.mfa_secret, encoding: 'base32', token, window: 1 });
    if (!verified) throw new Error('Invalid MFA code');
    await this.db.query('UPDATE users SET mfa_enabled = 1 WHERE id = ?', [userId]);
    return { success: true };
  }
}

module.exports = AuthHandler;
