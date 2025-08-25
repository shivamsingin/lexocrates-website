const express = require('express');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();

// Simple MySQL connection
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'lexocrates',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'lexocrates_blog',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

app.get('/test', async (req, res) => {
  try {
    // Simple query
    const [rows] = await pool.execute('SELECT id, title, slug FROM blogs WHERE status = ? LIMIT 5', ['published']);
    
    res.json({
      success: true,
      blogs: rows,
      count: rows.length
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      code: error.code
    });
  }
});

app.get('/test2', async (req, res) => {
  try {
    // Even simpler query
    const [rows] = await pool.execute('SELECT COUNT(*) as total FROM blogs');
    
    res.json({
      success: true,
      total: rows[0].total
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      code: error.code
    });
  }
});

const PORT = 5002;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Test endpoint: http://localhost:${PORT}/test`);
  console.log(`Test2 endpoint: http://localhost:${PORT}/test2`);
});
