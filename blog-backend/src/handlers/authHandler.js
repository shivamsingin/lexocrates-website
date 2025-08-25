const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AuthHandler {
  constructor(db) {
    this.db = db;
  }

  // Login user
  async login({ email, password }) {
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
}

module.exports = AuthHandler;
