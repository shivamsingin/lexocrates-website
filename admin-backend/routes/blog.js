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

const router = express.Router();

// All routes are protected
router.use(protect);

// Blog post routes
router.route('/')
  .get(getBlogPosts)
  .post(upload.array('images', 10), createBlogPost);

router.route('/:id')
  .get(getBlogPost)
  .put(upload.array('images', 10), updateBlogPost)
  .delete(deleteBlogPost);

// SEO analysis route
router.post('/analyze-seo', analyzeSEO);

// Admin only routes
router.get('/stats', authorize('admin'), getBlogStats);
router.put('/bulk', authorize('admin'), bulkUpdatePosts);

module.exports = router;
