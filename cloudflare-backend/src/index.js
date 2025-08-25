import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { rateLimit } from './middleware/rateLimit.js';
import authRoutes from './routes/auth.js';
import blogRoutes from './routes/blog.js';
import { createTables } from './database/schema.js';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', secureHeaders());
app.use('*', cors({
  origin: (origin, c) => {
    // Allow explicit list from env ALLOWED_ORIGINS (comma-separated), else fallback defaults
    const allowed = (c.env?.ALLOWED_ORIGINS || '')
      .split(',')
      .map(o => o.trim())
      .filter(Boolean);
    const defaults = ['https://shivamsingin.github.io', 'http://localhost:3000'];
    const allowlist = allowed.length ? allowed : defaults;
    return !origin || allowlist.includes(origin);
  },
  credentials: true
}));

// Rate limiting
app.use('/api/*', rateLimit);

// Database initialization
app.use('*', async (c, next) => {
  await createTables(c.env.DB);
  await next();
});

// Health check
app.get('/api/health', (c) => {
  return c.json({
    success: true,
    message: 'Cloudflare Workers API is running',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT || 'development'
  });
});

// API routes
app.route('/api/auth', authRoutes);
app.route('/api/blog', blogRoutes);

// Protected routes
app.use('/api/blog/*', async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return c.json({ success: false, message: 'No token provided' }, 401);
  }
  
  try {
    const payload = jwt.verify(token, c.env.JWT_SECRET);
    c.set('user', payload);
    await next();
  } catch (error) {
    return c.json({ success: false, message: 'Invalid token' }, 401);
  }
});

// 404 handler
app.notFound((c) => {
  return c.json({
    success: false,
    message: 'Route not found'
  }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({
    success: false,
    message: 'Internal server error'
  }, 500);
});

export default app;
