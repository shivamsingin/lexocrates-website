# Lexocrates Blog Admin Panel

A comprehensive blog management system with advanced SEO optimization features, built with Node.js/Express backend, MongoDB database, and React frontend.

## Features

### 🚀 Core Features
- **Complete Blog Management**: Create, edit, publish, and archive blog posts
- **Advanced SEO Optimization**: Real-time SEO analysis and scoring
- **Rich Text Editor**: WYSIWYG editor with formatting options
- **Image Management**: Upload, optimize, and manage images with alt text
- **User Management**: Role-based access control (Admin/Editor)
- **Responsive Design**: Mobile-friendly interface

### 📊 SEO Features
- **SEO Analysis Panel**: Real-time scoring and suggestions
- **Keyword Density Analysis**: Track focus keyword usage
- **Meta Description Optimization**: Character counter and validation
- **Title Length Checker**: Optimal length recommendations
- **Alt Tag Validation**: Ensure all images have proper alt text
- **Content Structure Analysis**: Heading hierarchy validation
- **Duplicate Content Detection**: Prevent content similarity issues
- **Google Preview**: Live preview of search result appearance
- **Schema Markup Support**: JSON-LD structured data

### 🔧 Technical Features
- **MongoDB Integration**: Scalable NoSQL database
- **JWT Authentication**: Secure token-based authentication
- **File Upload**: Image processing and optimization
- **RESTful API**: Complete CRUD operations
- **Real-time Validation**: Form validation and error handling
- **Responsive UI**: Tailwind CSS with custom components

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Multer** - File upload handling
- **Sharp** - Image processing
- **Natural** - NLP for SEO analysis
- **Cheerio** - HTML parsing

### Frontend
- **React 18** - UI library
- **React Router** - Navigation
- **React Hook Form** - Form management
- **React Quill** - Rich text editor
- **React Select** - Enhanced select components
- **React Dropzone** - File upload
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Axios** - HTTP client
- **React Hot Toast** - Notifications

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Lexocrates/admin-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/lexocrates_admin
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRE=7d
   MAX_FILE_SIZE=5242880
   UPLOAD_PATH=./uploads
   RATE_LIMIT_WINDOW=15
   RATE_LIMIT_MAX=100
   CORS_ORIGIN=http://localhost:3000
   ADMIN_EMAIL=admin@lexocrates.com
   ADMIN_PASSWORD=admin123
   ```

4. **Start MongoDB**
   ```bash
   # Start MongoDB service
   mongod
   ```

5. **Run the backend**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd ../admin-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the frontend**
   ```bash
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `GET /api/auth/users` - Get all users (Admin)
- `PUT /api/auth/users/:id` - Update user (Admin)
- `DELETE /api/auth/users/:id` - Delete user (Admin)

### Blog Posts
- `GET /api/blog` - Get all blog posts
- `GET /api/blog/:id` - Get single blog post
- `POST /api/blog` - Create blog post
- `PUT /api/blog/:id` - Update blog post
- `DELETE /api/blog/:id` - Delete blog post
- `POST /api/blog/analyze-seo` - Analyze SEO
- `GET /api/blog/stats` - Get blog statistics
- `PUT /api/blog/bulk` - Bulk update posts

## Database Schema

### User Model
```javascript
{
  email: String (required, unique),
  password: String (required, hashed),
  name: String (required),
  role: String (enum: ['admin', 'editor']),
  isActive: Boolean,
  lastLogin: Date,
  avatar: String
}
```

### BlogPost Model
```javascript
{
  title: String (required, max 60 chars),
  slug: String (required, unique),
  metaDescription: String (required, max 160 chars),
  focusKeywords: [String],
  content: String (required, min 300 chars),
  excerpt: String (max 200 chars),
  images: [{
    url: String,
    altText: String (max 125 chars),
    caption: String (max 200 chars)
  }],
  internalLinks: [{
    url: String,
    text: String,
    isExternal: Boolean,
    nofollow: Boolean
  }],
  externalLinks: [{
    url: String,
    text: String,
    isExternal: Boolean,
    nofollow: Boolean
  }],
  schemaMarkup: String,
  seoAnalysis: {
    keywordDensity: Number,
    metaDescriptionLength: Number,
    hasAltTags: Boolean,
    hasInternalLinks: Boolean,
    hasExternalLinks: Boolean,
    wordCount: Number,
    readingTime: Number,
    seoScore: Number,
    suggestions: [String]
  },
  status: String (enum: ['draft', 'published', 'archived']),
  publishedAt: Date,
  author: ObjectId (ref: 'User'),
  category: String (required),
  tags: [String],
  featuredImage: String,
  readTime: Number,
  viewCount: Number,
  isFeatured: Boolean,
  allowComments: Boolean
}
```

## SEO Analysis Features

### Real-time Analysis
- **Title Optimization**: Length validation (30-60 characters)
- **Meta Description**: Length validation (120-160 characters)
- **Keyword Density**: Optimal range (0.5-2.5%)
- **Content Structure**: Heading hierarchy validation
- **Image Optimization**: Alt text validation
- **Link Analysis**: Internal and external link tracking
- **Content Metrics**: Word count and reading time calculation

### SEO Scoring System
- **Excellent (80-100)**: Green badge
- **Good (60-79)**: Yellow badge
- **Poor (0-59)**: Red badge

### Automated Suggestions
- Missing alt tags for images
- Keyword density optimization
- Content length recommendations
- Link building suggestions
- Duplicate content warnings

## Usage Guide

### Creating a Blog Post

1. **Navigate to Blog Posts** → Click "New Post"
2. **Fill Basic Information**:
   - Title (auto-generates slug)
   - Meta description (with character counter)
   - Focus keywords
   - Category selection
   - Status (draft/published/archived)

3. **Write Content**:
   - Use the rich text editor
   - Add headings (H1, H2, H3)
   - Insert images with alt text
   - Add internal and external links

4. **SEO Optimization**:
   - Click "SEO Analysis" button
   - Review score and suggestions
   - Implement recommended improvements
   - Check Google preview

5. **Save and Publish**:
   - Save as draft or publish immediately
   - Monitor SEO score improvements

### Managing Users

1. **Admin Access**: Navigate to Users section
2. **Create Users**: Add new editors or admins
3. **Role Management**: Assign appropriate permissions
4. **User Status**: Activate/deactivate accounts

### SEO Best Practices

1. **Title Optimization**:
   - Include primary keyword
   - Keep between 30-60 characters
   - Make it compelling and clickable

2. **Meta Description**:
   - Summarize content accurately
   - Include focus keywords naturally
   - Keep between 120-160 characters

3. **Content Structure**:
   - Use one H1 heading per page
   - Organize with H2 and H3 headings
   - Include focus keywords in headings

4. **Image Optimization**:
   - Add descriptive alt text
   - Use relevant file names
   - Optimize image sizes

5. **Internal Linking**:
   - Link to related content
   - Use descriptive anchor text
   - Maintain logical site structure

## Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt encryption
- **Role-based Access**: Admin/Editor permissions
- **Input Validation**: Server-side validation
- **Rate Limiting**: API request throttling
- **CORS Protection**: Cross-origin security
- **Helmet Security**: HTTP headers protection

## Deployment

### Backend Deployment
1. Set production environment variables
2. Configure MongoDB connection
3. Set up file upload directory
4. Configure reverse proxy (nginx)
5. Use PM2 for process management

### Frontend Deployment
1. Build production bundle: `npm run build`
2. Serve static files with nginx
3. Configure API proxy
4. Set up SSL certificates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## Changelog

### v1.0.0
- Initial release
- Complete blog management system
- Advanced SEO analysis
- User management
- Responsive design
