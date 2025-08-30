const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const {
  getBlogPosts,
  getBlogPost,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  analyzeSEO,
  getBlogStats,
  bulkUpdatePosts
} = require('../controllers/blogController');
const { 
  RateLimiter, 
  ValidationRules, 
  InputSanitizer 
} = require('../middleware/security');

const router = express.Router();

// All routes are protected
router.use(protect);

// Blog post routes with enhanced security
router.route('/')
  .get(getBlogPosts)
  .post(
    RateLimiter.fileUpload(),
    upload.array('images', 10), 
    InputSanitizer.middleware(),
    ValidationRules.blogPost(),
    ValidationRules.handleValidationErrors,
    createBlogPost
  );

router.route('/:id')
  .get(getBlogPost)
  .put(
    RateLimiter.fileUpload(),
    upload.array('images', 10), 
    InputSanitizer.middleware(),
    ValidationRules.blogPost(),
    ValidationRules.handleValidationErrors,
    updateBlogPost
  )
  .delete(deleteBlogPost);

// SEO analysis route
router.post('/analyze-seo', 
  InputSanitizer.middleware(),
  analyzeSEO
);

// Admin only routes
router.get('/stats', authorize('admin'), getBlogStats);
router.put('/bulk', 
  authorize('admin'),
  InputSanitizer.middleware(),
  bulkUpdatePosts
);

module.exports = router;
