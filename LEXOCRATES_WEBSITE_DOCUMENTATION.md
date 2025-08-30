# Lexocrates Website - Comprehensive Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Website Features](#website-features)
3. [Technical Architecture](#technical-architecture)
4. [Frontend Documentation](#frontend-documentation)
5. [Backend Documentation](#backend-documentation)
6. [Database Schema](#database-schema)
7. [API Documentation](#api-documentation)
8. [Installation & Setup](#installation--setup)
9. [Deployment Guide](#deployment-guide)
10. [Usage Guide](#usage-guide)
11. [Security Features](#security-features)
12. [Troubleshooting](#troubleshooting)

---

## 🏢 Project Overview

**Lexocrates** is a comprehensive Legal Process Outsourcing (LPO) website that provides legal support services to law firms and corporations across the US, UK, Canada, and Commonwealth nations. The website serves as both a marketing platform and a client management system.

### 🌟 Key Highlights
- **Industry:** Legal Process Outsourcing (LPO)
- **Target Audience:** Law firms, corporations, legal departments
- **Services:** Legal research, contract drafting, litigation support, eDiscovery, compliance
- **Technology Stack:** Modern web technologies with responsive design
- **Security:** Enterprise-grade security with compliance features

---

## 🚀 Website Features

### 🎨 User Interface Features
1. **Dark Mode Toggle**
   - System preference detection
   - Manual toggle with moon/sun icon
   - Persistent theme storage
   - Smooth transitions

2. **Live Support System**
   - **Live Chat Support:** Real-time chat with support agents
   - **Chatbot Support:** AI-powered automated responses
   - **Ticket/Email Support:** Form-based support requests
   - Floating widget with notification badges

3. **Responsive Design**
   - Mobile-first approach
   - Tablet and desktop optimization
   - Cross-browser compatibility
   - Touch-friendly interface

### 📞 Contact & Communication
1. **Clickable Phone Numbers**
   - Primary: +91 94140 80184
   - Automatic phone dialer integration
   - Multiple contact points throughout site

2. **Form Submission Feedback**
   - Success/error message display
   - Email validation
   - Real-time form validation
   - Professional user feedback

### 📄 Content Management
1. **Blog System**
   - Dynamic blog posts
   - Category and tag management
   - SEO optimization
   - Related posts suggestions

2. **Service Pages**
   - Detailed service descriptions
   - Industry-specific solutions
   - Case studies and testimonials

### 🔐 Security & Compliance
1. **Privacy Policy** - Comprehensive data protection
2. **Cookie Policy** - GDPR compliance
3. **Security Statement** - Security measures and protocols

---

## 🏗️ Technical Architecture

### Frontend Stack
```
HTML5 + CSS3 + JavaScript (Vanilla)
├── Tailwind CSS (Styling)
├── Font Awesome (Icons)
├── Custom CSS Variables (Theming)
└── Responsive Design (Mobile-first)
```

### Backend Stack
```
Node.js + Express.js
├── Admin Backend (Port 5003)
│   ├── MongoDB (User Management)
│   ├── Authentication & Authorization
│   └── File Upload System
└── Blog Backend (Port 5002)
    ├── MySQL (Content Management)
    ├── RESTful APIs
    └── Search & Filtering
```

### Database Architecture
```
MongoDB (Admin System)
├── Users Collection
├── Sessions Collection
└── File Storage

MySQL (Blog System)
├── blogs Table
├── categories Table
├── tags Table
├── blog_categories (Junction)
└── blog_tags (Junction)
```

---

## 🎨 Frontend Documentation

### File Structure
```
/
├── index.html              # Homepage
├── services.html           # Services overview
├── industries.html         # Industry solutions
├── about.html             # Company information
├── team.html              # Team members
├── careers.html           # Job opportunities
├── testimonials.html      # Client testimonials
├── blog.html              # Blog listing
├── blog-post.html         # Individual blog posts
├── contact.html           # Contact form
├── privacy-policy.html    # Privacy policy
├── cookie-policy.html     # Cookie policy
├── security-statement.html # Security information
├── styles.css             # Main stylesheet
├── script.js              # Main JavaScript
├── blog-api.js            # Blog API integration
├── support-widget.js      # Live support system
└── images/                # Image assets
```

### Key JavaScript Classes

#### DarkModeManager
```javascript
class DarkModeManager {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'light';
        this.systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
    }
    
    init() {
        this.setTheme(this.theme);
        this.watchSystemTheme();
    }
    
    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        this.setTheme(this.theme);
    }
}
```

#### SupportWidget
```javascript
class SupportWidget {
    constructor() {
        this.isOpen = false;
        this.currentInterface = 'welcome';
        this.notificationCount = 0;
    }
    
    init() {
        this.bindEvents();
        this.showNotification();
    }
    
    toggleWidget() {
        this.isOpen = !this.isOpen;
        this.updateWidgetDisplay();
    }
}
```

### CSS Architecture

#### Theme Variables
```css
:root {
    /* Light Theme */
    --bg-primary: #ffffff;
    --text-primary: #1f2937;
    --accent-color: #3b82f6;
    --border-color: #e5e7eb;
}

[data-theme="dark"] {
    /* Dark Theme */
    --bg-primary: #1f2937;
    --text-primary: #f9fafb;
    --accent-color: #60a5fa;
    --border-color: #374151;
}
```

#### Responsive Breakpoints
```css
/* Mobile First */
@media (min-width: 768px) { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
@media (min-width: 1280px) { /* Large Desktop */ }
```

---

## ⚙️ Backend Documentation

### Admin Backend (Port 5003)

#### File Structure
```
admin-backend/
├── server.js              # Main server file
├── package.json           # Dependencies
├── config/
│   └── database.js        # MongoDB connection
├── controllers/
│   ├── authController.js  # Authentication logic
│   ├── userController.js  # User management
│   └── uploadController.js # File uploads
├── middleware/
│   ├── auth.js           # Authentication middleware
│   ├── upload.js         # File upload middleware
│   └── validation.js     # Input validation
├── models/
│   ├── User.js           # User schema
│   └── Session.js        # Session schema
├── routes/
│   ├── auth.js           # Authentication routes
│   ├── users.js          # User management routes
│   └── uploads.js        # File upload routes
└── utils/
    ├── encryption.js     # Data encryption
    └── validation.js     # Validation utilities
```

#### Key Features
1. **User Management**
   - User registration and authentication
   - Role-based access control (RBAC)
   - Multi-factor authentication (MFA)
   - Session management

2. **File Management**
   - Secure file uploads
   - File encryption
   - Access control
   - Audit logging

3. **Security Features**
   - CSRF protection
   - Input sanitization
   - Rate limiting
   - SQL injection prevention

### Blog Backend (Port 5002)

#### File Structure
```
blog-backend/
├── server/
│   └── index.js          # Main server file
├── src/
│   ├── db/
│   │   └── connection.js # MySQL connection
│   ├── handlers/
│   │   └── blogHandler.js # Blog API logic
│   └── routes/
│       └── blogRoutes.js # Blog API routes
└── package.json          # Dependencies
```

#### Key Features
1. **Blog Management**
   - CRUD operations for blog posts
   - Category and tag management
   - Search and filtering
   - SEO optimization

2. **Content Features**
   - Rich text support
   - Image management
   - Related posts
   - Social sharing

---

## 🗄️ Database Schema

### MongoDB Collections (Admin System)

#### Users Collection
```javascript
{
    _id: ObjectId,
    name: String,
    email: String,
    password: String (hashed),
    role: String (admin, user, moderator),
    permissions: Array,
    isActive: Boolean,
    createdAt: Date,
    updatedAt: Date,
    lastLogin: Date
}
```

#### Sessions Collection
```javascript
{
    _id: ObjectId,
    userId: ObjectId,
    token: String,
    expiresAt: Date,
    createdAt: Date,
    ipAddress: String,
    userAgent: String
}
```

### MySQL Tables (Blog System)

#### blogs Table
```sql
CREATE TABLE blogs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT,
    excerpt TEXT,
    author VARCHAR(100),
    status ENUM('draft', 'published', 'archived'),
    featured_image VARCHAR(255),
    meta_title VARCHAR(255),
    meta_description TEXT,
    keywords JSON,
    images JSON,
    internal_links JSON,
    external_links JSON,
    schema_markup JSON,
    view_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### categories Table
```sql
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### tags Table
```sql
CREATE TABLE tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Junction Tables
```sql
CREATE TABLE blog_categories (
    blog_id INT,
    category_id INT,
    PRIMARY KEY (blog_id, category_id),
    FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE blog_tags (
    blog_id INT,
    tag_id INT,
    PRIMARY KEY (blog_id, tag_id),
    FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
```

---

## 🔌 API Documentation

### Admin API Endpoints

#### Authentication
```
POST /api/auth/register     # User registration
POST /api/auth/login        # User login
POST /api/auth/logout       # User logout
GET  /api/auth/profile      # Get user profile
PUT  /api/auth/profile      # Update user profile
```

#### User Management
```
GET    /api/auth/users      # Get all users
POST   /api/auth/users      # Create new user
GET    /api/auth/users/:id  # Get specific user
PUT    /api/auth/users/:id  # Update user
DELETE /api/auth/users/:id  # Delete user
```

#### File Upload
```
POST /api/uploads           # Upload file
GET  /api/uploads/:id       # Get file
DELETE /api/uploads/:id     # Delete file
```

### Blog API Endpoints

#### Blog Posts
```
GET    /api/blogs           # Get all blogs (with pagination)
GET    /api/blogs/:id       # Get specific blog
GET    /api/blogs/slug/:slug # Get blog by slug
POST   /api/blogs           # Create new blog
PUT    /api/blogs/:id       # Update blog
DELETE /api/blogs/:id       # Delete blog
```

#### Categories & Tags
```
GET /api/categories         # Get all categories
GET /api/tags              # Get all tags
```

### API Response Format
```json
{
    "success": true,
    "data": {
        // Response data
    },
    "message": "Operation successful",
    "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Response Format
```json
{
    "success": false,
    "error": {
        "code": "ERROR_CODE",
        "message": "Error description",
        "details": {}
    },
    "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MongoDB (for admin backend)
- MySQL (for blog backend)
- Git

### Step 1: Clone Repository
```bash
git clone https://github.com/shivamsingin/lexocrates-website.git
cd lexocrates-website
```

### Step 2: Install Dependencies

#### Admin Backend
```bash
cd admin-backend
npm install
```

#### Blog Backend
```bash
cd blog-backend
npm install
```

### Step 3: Environment Configuration

#### Admin Backend (.env)
```env
PORT=5003
MONGODB_URI=mongodb://localhost:27017/lexocrates_admin
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here
NODE_ENV=development
```

#### Blog Backend (.env)
```env
PORT=5002
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=lexocrates_blog
NODE_ENV=development
```

### Step 4: Database Setup

#### MongoDB Setup
```bash
# Start MongoDB
mongod

# Create database
mongo
use lexocrates_admin
```

#### MySQL Setup
```sql
-- Create database
CREATE DATABASE lexocrates_blog;
USE lexocrates_blog;

-- Run schema files
SOURCE blog-backend/schema.sql;
```

### Step 5: Start Services

#### Start Admin Backend
```bash
cd admin-backend
npm start
```

#### Start Blog Backend
```bash
cd blog-backend
npm start
```

#### Start Frontend Server
```bash
# From root directory
python3 -m http.server 8000
```

---

## 🚀 Deployment Guide

### GitHub Pages Deployment

#### Automatic Deployment
1. Push changes to `main` branch
2. GitHub Pages automatically deploys
3. Site available at: `https://username.github.io/lexocrates-website/`

#### Manual Configuration
1. Go to repository Settings
2. Navigate to Pages section
3. Select source branch (main)
4. Save configuration

### Backend Deployment

#### Heroku Deployment
```bash
# Admin Backend
cd admin-backend
heroku create lexocrates-admin
heroku config:set MONGODB_URI=your_mongodb_uri
git push heroku main

# Blog Backend
cd blog-backend
heroku create lexocrates-blog
heroku config:set DB_HOST=your_mysql_host
git push heroku main
```

#### VPS Deployment
```bash
# Install PM2
npm install -g pm2

# Start services
pm2 start admin-backend/server.js --name "admin-backend"
pm2 start blog-backend/server/index.js --name "blog-backend"

# Save PM2 configuration
pm2 save
pm2 startup
```

### Environment Variables (Production)
```env
# Admin Backend
NODE_ENV=production
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_secure_jwt_secret
SESSION_SECRET=your_secure_session_secret

# Blog Backend
NODE_ENV=production
DB_HOST=your_production_mysql_host
DB_USER=your_production_user
DB_PASSWORD=your_production_password
DB_NAME=lexocrates_blog_prod
```

---

## 📖 Usage Guide

### For Website Visitors

#### Navigation
1. **Homepage:** Overview of services and company
2. **Services:** Detailed service offerings
3. **Industries:** Industry-specific solutions
4. **About:** Company information and team
5. **Blog:** Latest articles and insights
6. **Contact:** Get in touch with the team

#### Dark Mode
- Click the moon/sun icon in the navigation
- Theme preference is saved automatically
- System preference is detected on first visit

#### Live Support
- Click the chat bubble in bottom-right corner
- Choose between:
  - **Live Chat:** Real-time support
  - **Chatbot:** Automated assistance
  - **Ticket:** Submit support request

#### Contact Forms
- Fill out required fields
- Submit form to receive confirmation
- Phone numbers are clickable for direct calling

### For Administrators

#### Admin Panel Access
1. Navigate to admin panel URL
2. Login with admin credentials
3. Access user management features

#### User Management
1. **View Users:** See all registered users
2. **Add User:** Create new user accounts
3. **Edit User:** Modify user details and permissions
4. **Delete User:** Remove user accounts

#### Content Management
1. **Blog Posts:** Create and manage blog content
2. **Categories:** Organize content by categories
3. **Tags:** Add searchable tags to content

### For Developers

#### Adding New Pages
1. Create new HTML file in root directory
2. Include standard header and footer
3. Add navigation link
4. Update sitemap if necessary

#### Modifying Styles
1. Edit `styles.css` for global styles
2. Use CSS variables for theming
3. Follow mobile-first responsive design
4. Test across different devices

#### Adding New Features
1. Create JavaScript module
2. Follow existing code patterns
3. Update documentation
4. Test thoroughly

---

## 🔒 Security Features

### Frontend Security
1. **Input Validation**
   - Client-side form validation
   - XSS prevention
   - CSRF token implementation

2. **Content Security Policy (CSP)**
   - Script source restrictions
   - Style source restrictions
   - Resource loading policies

3. **HTTPS Enforcement**
   - Secure cookie settings
   - HSTS headers
   - Mixed content prevention

### Backend Security
1. **Authentication & Authorization**
   - JWT token-based authentication
   - Role-based access control
   - Session management

2. **Data Protection**
   - Password hashing (bcrypt)
   - Data encryption at rest
   - Secure file uploads

3. **API Security**
   - Rate limiting
   - Input sanitization
   - SQL injection prevention
   - CORS configuration

### Database Security
1. **Access Control**
   - Database user permissions
   - Connection encryption
   - Query parameterization

2. **Data Integrity**
   - Foreign key constraints
   - Data validation
   - Backup procedures

---

## 🔧 Troubleshooting

### Common Issues

#### Frontend Issues
1. **Dark Mode Not Working**
   - Check browser localStorage support
   - Verify CSS variables are defined
   - Clear browser cache

2. **Live Support Widget Not Loading**
   - Check JavaScript console for errors
   - Verify support-widget.js is loaded
   - Check network connectivity

3. **Forms Not Submitting**
   - Check form validation
   - Verify API endpoints are accessible
   - Check browser console for errors

#### Backend Issues
1. **Database Connection Errors**
   - Verify database credentials
   - Check database server status
   - Test connection manually

2. **API Endpoints Not Responding**
   - Check server logs
   - Verify port configuration
   - Test endpoints with curl/Postman

3. **File Upload Issues**
   - Check file size limits
   - Verify upload directory permissions
   - Check disk space

### Performance Optimization

#### Frontend Optimization
1. **Image Optimization**
   - Use WebP format where possible
   - Implement lazy loading
   - Optimize image sizes

2. **CSS/JS Optimization**
   - Minify CSS and JavaScript
   - Use CDN for external libraries
   - Implement code splitting

3. **Caching Strategy**
   - Browser caching headers
   - Service worker implementation
   - CDN caching

#### Backend Optimization
1. **Database Optimization**
   - Index optimization
   - Query optimization
   - Connection pooling

2. **API Optimization**
   - Response caching
   - Pagination implementation
   - Rate limiting

### Monitoring & Logging
1. **Error Tracking**
   - Implement error logging
   - Set up monitoring alerts
   - Regular log analysis

2. **Performance Monitoring**
   - Response time tracking
   - Resource usage monitoring
   - User experience metrics

---

## 📞 Support & Contact

### Technical Support
- **Email:** tech-support@lexocrates.com
- **Phone:** +91 94140 80184
- **Documentation:** This file and inline code comments

### Emergency Contact
- **24/7 Support:** Available through live chat widget
- **Critical Issues:** Direct phone support
- **Escalation:** Contact system administrator

### Resources
- **GitHub Repository:** https://github.com/shivamsingin/lexocrates-website
- **API Documentation:** Available in this document
- **Deployment Guide:** Section 9 of this document

---

## 📝 Version History

### Current Version: 2.0.0
- **Date:** January 2024
- **Major Features:**
  - Dark mode implementation
  - Live support system
  - Enhanced user management
  - Improved security features
  - Mobile-first responsive design

### Previous Versions
- **v1.0.0:** Initial website launch
- **v1.5.0:** Blog system implementation
- **v1.8.0:** Admin panel addition

---

## 📄 License & Legal

### Copyright
© 2024 Lexocrates. All rights reserved.

### Terms of Use
- Website content is proprietary
- Code is licensed under MIT License
- Usage subject to terms and conditions

### Privacy & Security
- GDPR compliant
- Data protection measures in place
- Regular security audits conducted

---

*This documentation is maintained by the Lexocrates development team. For updates or corrections, please contact the technical team.*
