const mongoose = require('mongoose');
const slugify = require('slugify');

const imageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  altText: {
    type: String,
    required: true,
    maxlength: [125, 'Alt text cannot exceed 125 characters']
  },
  caption: {
    type: String,
    maxlength: [200, 'Caption cannot exceed 200 characters']
  },
  filename: {
    type: String
  }
});

const linkSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  isExternal: {
    type: Boolean,
    default: false
  },
  nofollow: {
    type: Boolean,
    default: false
  }
});

const seoAnalysisSchema = new mongoose.Schema({
  keywordDensity: {
    type: Number,
    default: 0
  },
  metaDescriptionLength: {
    type: Number,
    default: 0
  },
  hasAltTags: {
    type: Boolean,
    default: false
  },
  hasInternalLinks: {
    type: Boolean,
    default: false
  },
  hasExternalLinks: {
    type: Boolean,
    default: false
  },
  wordCount: {
    type: Number,
    default: 0
  },
  readingTime: {
    type: Number,
    default: 0
  },
  seoScore: {
    type: Number,
    default: 0
  },
  suggestions: [{
    type: String
  }]
});

const blogPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    maxlength: [60, 'Title cannot exceed 60 characters'],
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  metaDescription: {
    type: String,
    required: [true, 'Meta description is required'],
    maxlength: [160, 'Meta description cannot exceed 160 characters'],
    trim: true
  },
  focusKeywords: [{
    type: String,
    trim: true
  }],
  content: {
    type: String,
    required: [true, 'Content is required'],
    minlength: [300, 'Content must be at least 300 characters']
  },
  excerpt: {
    type: String,
    maxlength: [200, 'Excerpt cannot exceed 200 characters']
  },
  images: [imageSchema],
  internalLinks: [linkSchema],
  externalLinks: [linkSchema],
  schemaMarkup: {
    type: String,
    default: ''
  },
  seoAnalysis: seoAnalysisSchema,
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  publishedAt: {
    type: Date
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Strategy', 'Technology', 'Best Practices', 'Compliance & Security', 'Industry Trends']
  },
  tags: [{
    type: String,
    trim: true
  }],
  featuredImage: {
    type: String
  },
  readTime: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  allowComments: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Generate slug from title
blogPostSchema.pre('save', function(next) {
  if (!this.isModified('title')) {
    return next();
  }
  
  this.slug = slugify(this.title, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g
  });
  
  next();
});

// Calculate reading time
blogPostSchema.pre('save', function(next) {
  if (this.content) {
    const wordsPerMinute = 200;
    const wordCount = this.content.split(/\s+/).length;
    this.readTime = Math.ceil(wordCount / wordsPerMinute);
  }
  next();
});

// Index for search optimization
blogPostSchema.index({ title: 'text', content: 'text', tags: 'text' });
blogPostSchema.index({ slug: 1 });
blogPostSchema.index({ status: 1, publishedAt: -1 });
blogPostSchema.index({ category: 1 });
blogPostSchema.index({ author: 1 });

module.exports = mongoose.model('BlogPost', blogPostSchema);
