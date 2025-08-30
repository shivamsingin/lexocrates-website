const mysql = require('mysql2/promise');

class DatabaseConnection {
  constructor() {
    this.pool = null;
  }

  createPool(config) {
    this.pool = mysql.createPool({
      host: config.host,
      user: config.user,
      password: config.password,
      database: config.database,
      port: config.port,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      acquireTimeout: 60000,
      timeout: 60000,
      reconnect: true
    });

    // Test the connection
    this.testConnection();
  }

  async testConnection() {
    try {
      const connection = await this.pool.getConnection();
      console.log('✅ MySQL Database Connected');
      connection.release();
      return true;
    } catch (error) {
      console.error('❌ MySQL Database Connection Error:', error.message);
      return false;
    }
  }

  async query(sql, params = []) {
    try {
      const [rows] = await this.pool.execute(sql, params);
      return rows;
    } catch (error) {
      console.error('Database Query Error:', error);
      throw error;
    }
  }

  async getConnection() {
    return await this.pool.getConnection();
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
    }
  }
}

module.exports = new DatabaseConnection();
