const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AuthHandler {
  constructor(dbConnection) {
    this.db = dbConnection;
  }

  async login(email, password) {
    try {
      const sql = 'SELECT * FROM users WHERE email = ?';
      const users = await this.db.query(sql, [email]);
      
      if (users.length === 0) {
        throw new Error('Invalid credentials');
      }
      
      const user = users[0];
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }
      
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );
      
      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        token
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(userData) {
    try {
      const { name, email, password, role = 'user' } = userData;
      
      // Check if user already exists
      const existingUsers = await this.db.query('SELECT id FROM users WHERE email = ?', [email]);
      if (existingUsers.length > 0) {
        throw new Error('User already exists');
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Insert user
      const sql = 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)';
      const result = await this.db.query(sql, [name, email, hashedPassword, role]);
      
      return {
        id: result.insertId,
        name,
        email,
        role
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const users = await this.db.query('SELECT id, email, name, role FROM users WHERE id = ?', [decoded.userId]);
      
      if (users.length === 0) {
        throw new Error('User not found');
      }
      
      return users[0];
    } catch (error) {
      console.error('Token verification error:', error);
      throw error;
    }
  }
}

module.exports = AuthHandler;
