const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
require('dotenv').config();

// Import database connection
const dbConnection = require('../src/db/connection');

// Import handlers
const BlogHandler = require('../src/handlers/blogHandler');
const AuthHandler = require('../src/handlers/authHandler');
const seoAnalyzer = require('../src/utils/seoAnalyzer');

// Import middleware
const authMiddleware = require('../src/middleware/auth');

// Initialize express
const app = express();

// Connect to database
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'lexocrates_blog',
  port: process.env.DB_PORT || 3306
};

dbConnection.createPool(dbConfig);

// Initialize handlers
const blogHandler = new BlogHandler(dbConnection);
const authHandler = new AuthHandler(dbConnection);

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parser middleware (raise limits for rich content)
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
    cb(null, `${timestamp}_${safeName}`);
  }
});
const upload = multer({ storage });

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const isConnected = await dbConnection.testConnection();
    res.json({
      success: true,
      message: 'Server is running',
      database: isConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const result = await authHandler.login(req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const result = await authHandler.register(req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const result = await authHandler.getCurrentUser(req.user.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Blog routes (public)
app.get('/api/blog', async (req, res) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      status: req.query.status || 'published',
      category: req.query.category,
      tag: req.query.tag,
      search: req.query.search,
      author: req.query.author
    };

    const result = await blogHandler.getBlogs(options);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/blog/:slug', async (req, res) => {
  try {
    // If numeric, treat as id; else slug
    const identifier = req.params.slug;
    const blog = /^\d+$/.test(identifier)
      ? await blogHandler.getBlogById(parseInt(identifier))
      : await blogHandler.getBlogBySlug(identifier);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    res.json({
      success: true,
      blog
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Blog routes (protected - admin only)
app.post('/api/blog', authMiddleware, async (req, res) => {
  try {
    const result = await blogHandler.createBlog(req.body, req.user.id);
    res.json({
      success: true,
      message: 'Blog post created successfully',
      ...result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Image upload endpoint
app.post('/api/blog/upload-images', authMiddleware, upload.array('images'), async (req, res) => {
  try {
    const files = req.files || [];
    const images = files.map(f => ({ url: `/uploads/${f.filename}`, altText: '' }));
    res.json({ success: true, data: images });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// On-demand SEO analysis (no DB write)
app.post('/api/blog/analyze-seo', authMiddleware, async (req, res) => {
  try {
    const { title, content, meta_description, keywords = [] } = req.body || {};
    const analysis = await seoAnalyzer.analyzeContent({
      title: typeof title === 'string' ? title : String(title ?? ''),
      content: typeof content === 'string' ? content : String(content ?? ''),
      meta_description: typeof meta_description === 'string' ? meta_description : String(meta_description ?? ''),
      keywords: Array.isArray(keywords) ? keywords : []
    });
    res.json({ success: true, analysis });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.put('/api/blog/:id', authMiddleware, async (req, res) => {
  try {
    const result = await blogHandler.updateBlog(parseInt(req.params.id), req.body, req.user.id);
    res.json({
      success: true,
      message: 'Blog post updated successfully',
      ...result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

app.delete('/api/blog/:id', authMiddleware, async (req, res) => {
  try {
    const result = await blogHandler.deleteBlog(parseInt(req.params.id));
    res.json({
      success: true,
      message: 'Blog post deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// SEO analysis endpoint
app.get('/api/blog/:id/seo', authMiddleware, async (req, res) => {
  try {
    const analysis = await blogHandler.getSeoAnalysis(parseInt(req.params.id));
    
    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'SEO analysis not found'
      });
    }

    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Categories and tags endpoints
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await blogHandler.getCategories();
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/tags', async (req, res) => {
  try {
    const tags = await blogHandler.getTags();
    res.json({
      success: true,
      tags
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Minimal create/delete for categories/tags
app.post('/api/categories', authMiddleware, async (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
  try {
    const slugify = require('slugify');
    const connection = await dbConnection.getConnection();
    const slug = slugify(name, { lower: true, strict: true });
    const [existing] = await connection.execute('SELECT id FROM categories WHERE slug = ?', [slug]);
    if (existing) {
      connection.release();
      return res.json({ success: true, id: existing.id, name, slug });
    }
    const [result] = await connection.execute('INSERT INTO categories (name, slug) VALUES (?, ?)', [name, slug]);
    connection.release();
    res.json({ success: true, id: result.insertId, name, slug });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.delete('/api/categories/:id', authMiddleware, async (req, res) => {
  try {
    await dbConnection.query('DELETE FROM categories WHERE id = ?', [parseInt(req.params.id)]);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.post('/api/tags', authMiddleware, async (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
  try {
    const slugify = require('slugify');
    const connection = await dbConnection.getConnection();
    const slug = slugify(name, { lower: true, strict: true });
    const [existing] = await connection.execute('SELECT id FROM tags WHERE slug = ?', [slug]);
    if (existing) {
      connection.release();
      return res.json({ success: true, id: existing.id, name, slug });
    }
    const [result] = await connection.execute('INSERT INTO tags (name, slug) VALUES (?, ?)', [name, slug]);
    connection.release();
    res.json({ success: true, id: result.insertId, name, slug });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.delete('/api/tags/:id', authMiddleware, async (req, res) => {
  try {
    await dbConnection.query('DELETE FROM tags WHERE id = ?', [parseInt(req.params.id)]);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: err.errors
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }

  res.status(500).json({
    success: false,
    message: 'Server Error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`Database: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
    dbConnection.close();
  });
});

module.exports = app;
