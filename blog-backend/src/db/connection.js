const mysql = require('mysql2/promise');

class DatabaseConnection {
  constructor() {
    this.pool = null;
    this.connection = null;
  }

  // Create connection pool for Express/Shared hosting
  createPool(config) {
    this.pool = mysql.createPool({
      host: config.host || 'localhost',
      user: config.user || 'root',
      password: config.password || '',
      database: config.database || 'lexocrates_blog',
      port: config.port || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    return this.pool;
  }

  // Get connection from pool
  async getConnection() {
    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }
    return await this.pool.getConnection();
  }

  // Execute query with pool
  async query(sql, params = []) {
    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }
    
    try {
      // Use text protocol to avoid prepared statement edge cases
      const [rows] = await this.pool.query(sql, params);
      return rows;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  // Execute transaction
  async transaction(callback) {
    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }

    const connection = await this.pool.getConnection();
    await connection.beginTransaction();

    try {
      const result = await callback(connection);
      await connection.commit();
      connection.release();
      return result;
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  }

  // Close pool
  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  // Test connection
  async testConnection() {
    try {
      await this.query('SELECT 1 as test');
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }
}

// Singleton instance
const dbConnection = new DatabaseConnection();

module.exports = dbConnection;
