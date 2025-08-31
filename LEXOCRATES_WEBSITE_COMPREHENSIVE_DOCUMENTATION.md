# Lexocrates Website - Comprehensive Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Frontend (Main Website)](#frontend-main-website)
4. [Backend Systems](#backend-systems)
5. [Admin Panel](#admin-panel)
6. [Blog System](#blog-system)
7. [Security Features](#security-features)
8. [File Management](#file-management)
9. [Deployment](#deployment)
10. [Default Credentials](#default-credentials)
11. [API Endpoints](#api-endpoints)
12. [Troubleshooting](#troubleshooting)

---

## 🏢 Overview

**Lexocrates** is a comprehensive legal services website offering legal outsourcing services from India to global law firms. The platform includes:

- **Main Website**: Static HTML/CSS/JS frontend with multiple service pages
- **Admin Panel**: React-based admin interface for content management
- **Blog System**: Full-featured blog with SEO optimization
- **File Management**: Secure file upload/download system with encryption
- **Contact Management**: Integrated contact forms and email system

### Key Features
- ✅ Multi-page responsive website
- ✅ Dark/Light mode toggle
- ✅ SEO optimized content
- ✅ Contact forms with CAPTCHA
- ✅ Blog system with admin panel
- ✅ File upload/download system
- ✅ Role-based access control
- ✅ Multi-factor authentication
- ✅ Comprehensive security measures

---

## 🏗️ System Architecture

### Technology Stack

#### Frontend (Main Website)
- **HTML5** - Semantic markup
- **CSS3** - Custom styling with CSS variables
- **JavaScript (ES6+)** - Interactive functionality
- **Responsive Design** - Mobile-first approach

#### Admin Frontend
- **React 18** - Modern UI framework
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing
- **React Hook Form** - Form management
- **React Quill** - Rich text editor
- **Axios** - HTTP client

#### Backend Systems
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Primary database (admin system)
- **MySQL** - Blog database
- **JWT** - Authentication tokens
- **Multer** - File upload handling
- **Sharp** - Image processing
- **Winston** - Logging

#### Security & Infrastructure
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - DDoS protection
- **CSRF Protection** - Cross-site request forgery
- **XSS Protection** - Cross-site scripting prevention
- **Input Sanitization** - Data validation
- **File Encryption** - Secure file storage

---

## 🌐 Frontend (Main Website)

### File Structure
```
/
├── index.html              # Home page
├── about.html              # About page
├── services.html           # Services overview
├── industries.html         # Industry solutions
├── contact.html            # Contact page
├── blog.html               # Blog listing
├── blog-post.html          # Individual blog post
├── team.html               # Team page
├── testimonials.html       # Testimonials
├── careers.html            # Careers page
├── styles.css              # Main stylesheet
├── script.js               # Main JavaScript
├── email-config.js         # Email configuration
├── captcha-config.js       # CAPTCHA settings
├── csrf-utils.js           # CSRF utilities
├── cookie-consent.js       # Cookie consent
├── support-widget.js       # Support widget
├── support-widget.css      # Support widget styles
├── images/                 # Image assets
└── [service-pages].html    # Individual service pages
```

### Key Features

#### 1. Dark/Light Mode Toggle
- **Implementation**: CSS variables with JavaScript toggle
- **Storage**: LocalStorage for persistence
- **Auto-detection**: System preference detection
- **Smooth transitions**: CSS transitions for theme switching

#### 2. Responsive Design
- **Mobile-first**: Optimized for mobile devices
- **Breakpoints**: 768px, 1024px, 1200px
- **Flexible layouts**: CSS Grid and Flexbox
- **Touch-friendly**: Optimized for touch interfaces

#### 3. Contact Forms
- **CAPTCHA Integration**: Google reCAPTCHA v2
- **CSRF Protection**: Token-based protection
- **Email Integration**: Nodemailer backend
- **Validation**: Client and server-side validation

#### 4. SEO Optimization
- **Meta tags**: Comprehensive meta information
- **Structured data**: JSON-LD markup
- **Sitemap**: XML sitemap generation
- **Open Graph**: Social media optimization

### Service Pages
Each service page includes:
- Hero section with service overview
- Detailed service description
- Benefits and features
- Process workflow
- Call-to-action sections

**Available Services:**
- Legal Research
- Contract Drafting
- Litigation Support
- eDiscovery
- Compliance
- IP Research
- M&A Due Diligence
- Legal Data Entry
- Legal Transcription
- Legal Translation
- Citation Formatting
- Virtual Paralegal

---

## 🔧 Backend Systems

### 1. Admin Backend (`/admin-backend`)

#### Setup Instructions
```bash
cd admin-backend
npm install
cp env.example .env
# Configure .env file with your settings
npm start
```

#### Environment Configuration
```env
# Server Configuration
PORT=5001
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/lexocrates_admin

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key
JWT_EXPIRE=24h

# Default Admin Account
ADMIN_EMAIL=admin@lexocrates.com
ADMIN_PASSWORD=admin123

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@lexocrates.com
```

#### Key Features
- **User Management**: CRUD operations for users
- **Role-Based Access Control**: Granular permissions
- **Multi-Factor Authentication**: TOTP-based MFA
- **File Management**: Secure file upload/download
- **Audit Logging**: Comprehensive activity tracking
- **Security Headers**: Helmet.js implementation
- **Rate Limiting**: DDoS protection
- **Input Validation**: Express-validator integration

### 2. Blog Backend (`/blog-backend`)

#### Setup Instructions
```bash
cd blog-backend
npm install
# Configure database connection
npm start
```

#### Features
- **Blog CRUD**: Create, read, update, delete posts
- **SEO Optimization**: Automatic meta tag generation
- **Image Processing**: Sharp.js for image optimization
- **Search Functionality**: Full-text search
- **Category Management**: Blog categorization
- **Tag System**: Post tagging

---

## 🎛️ Admin Panel

### Access Information
- **URL**: `http://localhost:3000` (after starting admin frontend)
- **Default Email**: `admin@lexocrates.com`
- **Default Password**: `admin123`

### Setup Instructions

#### 1. Start Admin Frontend
```bash
cd admin-frontend
npm install
npm start
```

#### 2. Start Admin Backend
```bash
cd admin-backend
npm install
npm start
```

#### 3. Access Admin Panel
- Open browser to `http://localhost:3000`
- Login with default credentials
- Complete MFA setup if prompted

### Admin Panel Features

#### 1. Dashboard
- **Overview**: System statistics and recent activity
- **Quick Actions**: Common tasks shortcuts
- **Recent Posts**: Latest blog posts
- **User Activity**: Recent user actions
- **System Health**: Server status and metrics

#### 2. Blog Management
- **Create Post**: Rich text editor with markdown support
- **Edit Posts**: In-place editing with version history
- **Publish/Draft**: Post status management
- **SEO Tools**: Meta description, keywords, Open Graph
- **Media Library**: Image and file management
- **Categories & Tags**: Content organization

#### 3. User Management
- **User List**: View all registered users
- **Role Assignment**: Assign roles and permissions
- **Account Status**: Enable/disable accounts
- **Password Reset**: Admin-initiated password resets
- **Activity Logs**: User action tracking

#### 4. File Management
- **Upload Files**: Drag-and-drop file upload
- **File Encryption**: Automatic file encryption
- **Access Control**: Permission-based file access
- **Download Tracking**: File download analytics
- **Storage Management**: File storage optimization

#### 5. Analytics & Reports
- **Blog Analytics**: Post views, engagement metrics
- **User Analytics**: User behavior and patterns
- **System Reports**: Performance and security reports
- **Export Data**: CSV/JSON data export

### Role-Based Access Control

#### Roles Hierarchy
1. **Client** - Basic access
   - Read blog posts
   - View analytics

2. **Staff** - Content management
   - All client permissions
   - Write and publish blog posts
   - Manage content
   - View reports

3. **Admin** - Full system access
   - All staff permissions
   - Manage users and permissions
   - System settings
   - Billing management
   - Delete content

#### Permissions
- `read_blog` - Read blog posts and content
- `write_blog` - Create and edit blog posts
- `publish_blog` - Publish blog posts
- `delete_blog` - Delete blog posts
- `manage_users` - Manage user accounts and permissions
- `manage_settings` - Manage system settings
- `view_analytics` - View analytics and statistics
- `manage_content` - Manage all content types
- `manage_billing` - Manage billing and subscriptions
- `view_reports` - View system reports

---

## 📝 Blog System

### Blog Features
- **Rich Text Editor**: React Quill integration
- **Markdown Support**: Markdown syntax highlighting
- **SEO Optimization**: Automatic meta tag generation
- **Image Management**: Drag-and-drop image upload
- **Category System**: Hierarchical categories
- **Tag System**: Flexible tagging
- **Draft System**: Save and publish workflow
- **Version History**: Post revision tracking
- **Search Functionality**: Full-text search
- **Social Sharing**: Open Graph integration

### Creating a Blog Post

#### 1. Access Blog Management
- Login to admin panel
- Navigate to "Blog Management" → "Create Post"

#### 2. Fill Post Details
- **Title**: SEO-optimized post title
- **Content**: Rich text content using editor
- **Excerpt**: Brief post summary
- **Categories**: Select relevant categories
- **Tags**: Add relevant tags
- **Featured Image**: Upload or select image

#### 3. SEO Settings
- **Meta Title**: Custom meta title
- **Meta Description**: SEO description
- **Keywords**: Target keywords
- **Slug**: URL-friendly post slug
- **Open Graph**: Social media optimization

#### 4. Publishing Options
- **Status**: Draft, Published, or Scheduled
- **Publish Date**: Set future publication date
- **Author**: Select post author
- **Visibility**: Public or private

#### 5. Publish Post
- Click "Publish" to make post live
- Or save as draft for later editing

### Blog API Endpoints

#### Public Endpoints
```
GET /api/blog - List all published posts
GET /api/blog/:id - Get specific post
GET /api/blog/categories - List categories
GET /api/blog/tags - List tags
GET /api/blog/search - Search posts
```

#### Admin Endpoints (Authentication Required)
```
POST /api/blog - Create new post
PUT /api/blog/:id - Update post
DELETE /api/blog/:id - Delete post
POST /api/blog/:id/publish - Publish draft
POST /api/blog/:id/unpublish - Unpublish post
```

---

## 🔒 Security Features

### 1. Authentication & Authorization
- **JWT Tokens**: Secure token-based authentication
- **Refresh Tokens**: Automatic token renewal
- **Multi-Factor Authentication**: TOTP-based MFA
- **Role-Based Access Control**: Granular permissions
- **Session Management**: Secure session handling

### 2. Data Protection
- **Input Sanitization**: XSS prevention
- **CSRF Protection**: Cross-site request forgery prevention
- **SQL Injection Prevention**: Parameterized queries
- **File Upload Security**: Type and size validation
- **File Encryption**: AES-256 encryption for sensitive files

### 3. Infrastructure Security
- **Security Headers**: Helmet.js implementation
- **Rate Limiting**: DDoS protection
- **CORS Configuration**: Cross-origin resource sharing
- **HTTPS Enforcement**: Secure communication
- **Cookie Security**: HttpOnly and Secure flags

### 4. Audit & Monitoring
- **Activity Logging**: Comprehensive audit trails
- **Error Tracking**: Error monitoring and alerting
- **Security Events**: Security incident logging
- **Performance Monitoring**: System performance tracking

---

## 📁 File Management

### File Upload System
- **Supported Formats**: PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, JPEG, PNG, ZIP
- **Size Limits**: Configurable file size limits
- **Encryption**: Automatic file encryption
- **Access Control**: Permission-based access
- **Virus Scanning**: File security scanning

### File Operations

#### Upload Files
1. Navigate to "File Management" in admin panel
2. Click "Upload Files"
3. Drag and drop files or click to select
4. Set access permissions
5. Click "Upload"

#### Download Files
1. Browse file library
2. Select file to download
3. System generates secure download link
4. Download with proper authentication

#### File Security
- **Encryption**: AES-256 encryption at rest
- **Access Tokens**: Temporary download tokens
- **Audit Trail**: Complete download tracking
- **Expiration**: Automatic link expiration

---

## 🚀 Deployment

### Production Deployment

#### 1. Environment Setup
```bash
# Set production environment
NODE_ENV=production

# Configure production database
MONGODB_URI=mongodb://your-production-db

# Set production secrets
JWT_SECRET=your-production-jwt-secret
JWT_REFRESH_SECRET=your-production-refresh-secret
```

#### 2. Build Frontend
```bash
cd admin-frontend
npm run build
```

#### 3. Start Services
```bash
# Start admin backend
cd admin-backend
npm start

# Serve static files (main website)
# Use nginx or similar web server
```

#### 4. SSL/HTTPS Setup
- Configure SSL certificates
- Set up reverse proxy (nginx)
- Enable HTTPS enforcement
- Configure security headers

### Deployment Scripts
- `setup.sh` - Initial server setup
- `deploy.sh` - Production deployment script

---

## 🔑 Default Credentials

### Admin Panel Access
```
Email: admin@lexocrates.com
Password: admin123
```

### Database Access
```
MongoDB (Admin Backend):
- Database: lexocrates_admin
- Default connection: mongodb://localhost:27017/lexocrates_admin

MySQL (Blog Backend):
- Database: lexocrates_blog
- Default connection: localhost:3306
```

### Important Security Notes
⚠️ **CRITICAL**: Change default credentials immediately after setup
- Update admin email and password
- Change JWT secrets
- Update database passwords
- Configure proper email settings
- Set up SSL certificates

---

## 🔌 API Endpoints

### Authentication Endpoints
```
POST /api/auth/register - User registration
POST /api/auth/login - User login
POST /api/auth/logout - User logout
POST /api/auth/refresh - Refresh token
POST /api/auth/mfa/setup - Setup MFA
POST /api/auth/mfa/enable - Enable MFA
POST /api/auth/mfa/verify - Verify MFA token
POST /api/auth/forgot-password - Password reset request
POST /api/auth/reset-password - Reset password
```

### Blog Endpoints
```
GET /api/blog - List blog posts
GET /api/blog/:id - Get specific post
POST /api/blog - Create post (admin)
PUT /api/blog/:id - Update post (admin)
DELETE /api/blog/:id - Delete post (admin)
GET /api/blog/categories - List categories
GET /api/blog/tags - List tags
GET /api/blog/search - Search posts
```

### File Management Endpoints
```
POST /api/files/upload - Upload file
GET /api/files - List files
GET /api/files/:id - Get file info
GET /api/files/:id/download - Download file
DELETE /api/files/:id - Delete file
POST /api/files/:id/share - Share file
```

### User Management Endpoints
```
GET /api/users - List users (admin)
GET /api/users/:id - Get user info
PUT /api/users/:id - Update user
DELETE /api/users/:id - Delete user (admin)
POST /api/users/:id/role - Update user role (admin)
```

### Analytics Endpoints
```
GET /api/analytics/blog - Blog analytics
GET /api/analytics/users - User analytics
GET /api/analytics/files - File analytics
GET /api/analytics/system - System analytics
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Admin Panel Not Loading
**Symptoms**: Admin panel shows blank page or errors
**Solutions**:
- Check if backend is running (`npm start` in admin-backend)
- Verify MongoDB connection
- Check browser console for errors
- Ensure all environment variables are set

#### 2. File Upload Failures
**Symptoms**: Files fail to upload or show errors
**Solutions**:
- Check file size limits
- Verify file type restrictions
- Ensure upload directory has write permissions
- Check disk space availability

#### 3. Authentication Issues
**Symptoms**: Login fails or sessions expire quickly
**Solutions**:
- Verify JWT secrets are set correctly
- Check token expiration settings
- Ensure cookies are enabled
- Verify CORS configuration

#### 4. Blog Posts Not Publishing
**Symptoms**: Posts remain in draft status
**Solutions**:
- Check user permissions
- Verify database connection
- Check for validation errors
- Review server logs

#### 5. Email Not Sending
**Symptoms**: Contact forms or password resets not working
**Solutions**:
- Verify SMTP settings
- Check email credentials
- Ensure port 587/465 is open
- Test with different email provider

### Log Files
- **Application Logs**: `admin-backend/logs/app.log`
- **Error Logs**: `admin-backend/logs/error.log`
- **Security Logs**: `admin-backend/logs/security.log`
- **Audit Logs**: `admin-backend/logs/audit.log`

### Performance Optimization
- **Database Indexing**: Ensure proper MongoDB indexes
- **Caching**: Implement Redis caching for frequently accessed data
- **CDN**: Use CDN for static assets
- **Image Optimization**: Compress images before upload
- **Code Splitting**: Implement React code splitting

### Backup & Recovery
- **Database Backups**: Regular MongoDB backups
- **File Backups**: Encrypted file storage backups
- **Configuration Backups**: Environment and config files
- **Disaster Recovery**: Documented recovery procedures

---

## 📞 Support & Maintenance

### Regular Maintenance Tasks
1. **Database Maintenance**: Regular cleanup and optimization
2. **Security Updates**: Keep dependencies updated
3. **Backup Verification**: Test backup and recovery procedures
4. **Performance Monitoring**: Monitor system performance
5. **Security Audits**: Regular security assessments

### Monitoring & Alerts
- **Server Monitoring**: CPU, memory, disk usage
- **Application Monitoring**: Response times, error rates
- **Security Monitoring**: Failed login attempts, suspicious activity
- **Backup Monitoring**: Backup success/failure alerts

### Contact Information
- **Technical Support**: tech-support@lexocrates.com
- **Security Issues**: security@lexocrates.com
- **General Inquiries**: contact@lexocrates.com

---

## 📚 Additional Resources

### Documentation Files
- `AUTHENTICATION.md` - Detailed authentication documentation
- `SECURITY_IMPLEMENTATION.md` - Security implementation details
- `EMAIL_SETUP_GUIDE.md` - Email configuration guide
- `DEPLOYMENT.md` - Deployment instructions

### Development Tools
- **Postman Collection**: API testing collection
- **Database Schema**: MongoDB and MySQL schemas
- **Environment Templates**: `.env.example` files
- **Docker Configuration**: Container deployment setup

### Third-Party Integrations
- **Google reCAPTCHA**: CAPTCHA protection
- **Nodemailer**: Email functionality
- **Sharp**: Image processing
- **Winston**: Logging system
- **Helmet**: Security headers

---

*This documentation covers all aspects of the Lexocrates website system. For specific implementation details, refer to the individual documentation files in the `/docs` directory.*
