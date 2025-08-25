# Lexocrates Blog Backend

A comprehensive blog backend with advanced SEO optimization features that can run in three environments:

- **Local Development** (Node.js/Express for offline testing)
- **Cloudflare Workers** (serverless deployment)
- **Shared Hosting** (GoDaddy/Namecheap compatible)

## 🚀 Features

### Core Blog Features
- ✅ **CRUD Operations** - Create, read, update, delete blog posts
- ✅ **User Authentication** - JWT-based authentication system
- ✅ **Role-based Access** - Admin, editor, and author roles
- ✅ **Categories & Tags** - Organize content with categories and tags
- ✅ **Search & Filtering** - Advanced search with pagination
- ✅ **File Uploads** - Image and document upload support

### Advanced SEO Features
- ✅ **SEO Analysis** - Real-time SEO scoring and suggestions
- ✅ **Meta Tags** - Title, description, keywords management
- ✅ **Schema Markup** - JSON-LD structured data generation
- ✅ **Keyword Density** - Optimal keyword usage analysis
- ✅ **Content Analysis** - Reading level, word count, heading structure
- ✅ **Google Preview** - Live search result preview
- ✅ **Internal/External Links** - Link analysis and suggestions
- ✅ **Image Optimization** - Alt text and image SEO analysis

### Technical Features
- ✅ **Multi-Environment** - Works on local, Cloudflare, and shared hosting
- ✅ **MySQL Database** - Compatible with all hosting environments
- ✅ **API-First Design** - RESTful API endpoints
- ✅ **Security** - Rate limiting, CORS, input validation
- ✅ **Performance** - Caching, compression, optimization
- ✅ **Monitoring** - Health checks, logging, error handling

## 📋 Prerequisites

### For All Environments
- **MySQL Database** (5.7+ or 8.0+)
- **Node.js** (18+ for local development)
- **Git** for version control

### For Cloudflare Workers
- **Cloudflare Account**
- **Wrangler CLI** (`npm install -g wrangler`)

### For Shared Hosting
- **PHP 7.4+** support
- **MySQL** database access
- **Apache/Nginx** with mod_rewrite

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd blog-backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
cp env.example .env
# Edit .env with your configuration
```

### 4. Database Setup
```bash
# Create database
mysql -u root -p -e "CREATE DATABASE lexocrates_blog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Run migrations
npm run db:migrate

# Seed initial data
npm run db:seed
```

## 🏃‍♂️ Running in Different Environments

### Local Development

#### Quick Start
```bash
# Start development server
npm run dev

# Server will be available at http://localhost:5000
```

#### Database Setup (Local)
```bash
# Install MySQL locally or use Docker
docker run --name mysql-blog -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=lexocrates_blog -p 3306:3306 -d mysql:8.0

# Update .env with local database settings
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=lexocrates_blog
```

#### Testing
```bash
# Run tests
npm test

# Health check
curl http://localhost:5000/api/health
```

### Cloudflare Workers

#### Setup
```bash
# Login to Cloudflare
wrangler login

# Create D1 database
wrangler d1 create lexocrates-blog

# Create R2 bucket for uploads
wrangler r2 bucket create lexocrates-uploads

# Update wrangler.toml with your database and bucket IDs
```

#### Development
```bash
# Local development with Cloudflare Workers
npm run workers:dev

# Test locally
curl http://localhost:8787/api/health
```

#### Deployment
```bash
# Deploy to production
npm run workers:deploy

# Deploy to development environment
wrangler deploy --env development
```

### Shared Hosting (GoDaddy/Namecheap)

#### Setup
1. **Upload Files**
   ```bash
   # Upload the entire project to your hosting
   # Ensure shared-hosting/ folder is in your public_html or www directory
   ```

2. **Database Configuration**
   - Create MySQL database in your hosting control panel
   - Update `.env` with your hosting database credentials
   - Import the schema: `src/db/schema.sql`

3. **File Permissions**
   ```bash
   # Set proper permissions
   chmod 755 shared-hosting/
   chmod 644 shared-hosting/.htaccess
   chmod 644 shared-hosting/index.php
   ```

#### Access
- **API Base URL**: `https://yourdomain.com/api/`
- **Health Check**: `https://yourdomain.com/api/health`

## 📊 Database Schema

### Core Tables
```sql
-- Users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('admin', 'editor', 'author') DEFAULT 'author',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Blog posts with SEO fields
CREATE TABLE blogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  meta_description TEXT,
  keywords JSON,
  content LONGTEXT,
  excerpt TEXT,
  featured_image VARCHAR(500),
  images JSON,
  internal_links JSON,
  external_links JSON,
  schema_markup JSON,
  author_id INT,
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  seo_score INT DEFAULT 0,
  word_count INT DEFAULT 0,
  reading_time INT DEFAULT 0,
  published_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Blog Posts (Public)
- `GET /api/blog` - Get all published posts
- `GET /api/blog/:slug` - Get single post by slug

### Blog Posts (Admin)
- `POST /api/blog` - Create new post
- `PUT /api/blog/:id` - Update post
- `DELETE /api/blog/:id` - Delete post
- `GET /api/blog/:id/seo` - Get SEO analysis

### Categories & Tags
- `GET /api/categories` - Get all categories
- `GET /api/tags` - Get all tags

### System
- `GET /api/health` - Health check

## 🔧 Configuration

### Environment Variables
```bash
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=lexocrates_blog
DB_PORT=3306

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# SEO Settings
SEO_TITLE_MAX_LENGTH=60
SEO_DESCRIPTION_MAX_LENGTH=160
SEO_KEYWORD_DENSITY_MIN=0.5
SEO_KEYWORD_DENSITY_MAX=2.5
```

### SEO Analysis Features
- **Title Analysis**: Length, keyword presence, brand inclusion
- **Meta Description**: Length, keyword density, call-to-action
- **Content Analysis**: Word count, reading level, keyword density
- **Heading Structure**: H1, H2, H3 hierarchy analysis
- **Image Optimization**: Alt text presence and quality
- **Link Analysis**: Internal/external link balance
- **Schema Markup**: JSON-LD structured data generation

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Cloudflare Workers
```bash
npm run workers:deploy
```

### Shared Hosting
1. Upload files to hosting
2. Configure database
3. Update `.env` file
4. Test API endpoints

## 📝 Usage Examples

### Create a Blog Post
```javascript
const response = await fetch('/api/blog', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: 'Your Blog Title',
    content: '<h1>Your Content</h1><p>Blog content here...</p>',
    meta_description: 'SEO description here...',
    keywords: ['keyword1', 'keyword2', 'keyword3'],
    status: 'draft'
  })
});
```

### Get SEO Analysis
```javascript
const analysis = await fetch('/api/blog/1/seo', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **Rate Limiting** - Prevent abuse
- **Input Validation** - Sanitize all inputs
- **CORS Protection** - Configured for your domains
- **SQL Injection Protection** - Parameterized queries
- **XSS Protection** - Content sanitization
- **CSRF Protection** - Token validation

## 📈 Performance Features

- **Database Indexing** - Optimized queries
- **Connection Pooling** - Efficient database connections
- **Caching** - Response caching
- **Compression** - Gzip compression
- **CDN Ready** - Static file optimization
- **Lazy Loading** - Efficient data loading

## 🐛 Troubleshooting

### Common Issues

#### Database Connection
```bash
# Test database connection
mysql -u your_user -p -h your_host your_database

# Check environment variables
echo $DB_HOST
echo $DB_USER
```

#### Cloudflare Workers
```bash
# Check wrangler configuration
wrangler whoami
wrangler d1 list

# Test locally
wrangler dev
```

#### Shared Hosting
```bash
# Check PHP version
php -v

# Check MySQL support
php -m | grep mysql

# Check file permissions
ls -la shared-hosting/
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the troubleshooting section
- Open an issue on GitHub
- Contact the development team

## 🔄 Updates

Stay updated with the latest features and security patches:
```bash
git pull origin main
npm install
npm run db:migrate
```

---

**Built with ❤️ for Lexocrates**
