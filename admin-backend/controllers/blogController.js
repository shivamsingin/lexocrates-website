const BlogPost = require('../models/BlogPost');
const seoAnalyzer = require('../utils/seoAnalyzer');
const { processImages, deleteImage } = require('../middleware/upload');

// @desc    Get all blog posts
// @route   GET /api/blog
// @access  Private
const getBlogPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const category = req.query.category;
    const search = req.query.search;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$text = { $search: search };
    }

    // Execute query
    const posts = await BlogPost.find(query)
      .populate('author', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await BlogPost.countDocuments(query);

    res.json({
      success: true,
      count: posts.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: posts
    });
  } catch (error) {
    console.error('Get blog posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single blog post
// @route   GET /api/blog/:id
// @access  Private
const getBlogPost = async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id)
      .populate('author', 'name email');

    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    res.json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Get blog post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create blog post
// @route   POST /api/blog
// @access  Private
const createBlogPost = async (req, res) => {
  try {
    const {
      title,
      metaDescription,
      focusKeywords,
      content,
      excerpt,
      category,
      tags,
      status,
      schemaMarkup,
      internalLinks,
      externalLinks
    } = req.body;

    // Process uploaded images
    let images = [];
    if (req.files && req.files.length > 0) {
      images = await processImages(req.files);
    }

    // Create blog post
    const blogPost = new BlogPost({
      title,
      metaDescription,
      focusKeywords: focusKeywords ? JSON.parse(focusKeywords) : [],
      content,
      excerpt,
      category,
      tags: tags ? JSON.parse(tags) : [],
      status,
      schemaMarkup,
      internalLinks: internalLinks ? JSON.parse(internalLinks) : [],
      externalLinks: externalLinks ? JSON.parse(externalLinks) : [],
      images: images.map(img => ({
        url: img.url,
        altText: req.body[`altText_${img.filename}`] || '',
        caption: req.body[`caption_${img.filename}`] || '',
        filename: img.filename
      })),
      author: req.user._id
    });

    // Get existing posts for duplicate check
    const existingPosts = await BlogPost.find({ _id: { $ne: blogPost._id } });

    // Perform SEO analysis
    const seoAnalysis = seoAnalyzer.analyzeSEO(blogPost, existingPosts);
    blogPost.seoAnalysis = seoAnalysis;

    // Set published date if publishing
    if (status === 'published' && !blogPost.publishedAt) {
      blogPost.publishedAt = new Date();
    }

    const savedPost = await blogPost.save();

    res.status(201).json({
      success: true,
      data: savedPost
    });
  } catch (error) {
    console.error('Create blog post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update blog post
// @route   PUT /api/blog/:id
// @access  Private
const updateBlogPost = async (req, res) => {
  try {
    const {
      title,
      metaDescription,
      focusKeywords,
      content,
      excerpt,
      category,
      tags,
      status,
      schemaMarkup,
      internalLinks,
      externalLinks
    } = req.body;

    let blogPost = await BlogPost.findById(req.params.id);
    if (!blogPost) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    // Check if user can edit this post
    if (req.user.role !== 'admin' && blogPost.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this post' });
    }

    // Process new uploaded images
    let newImages = [];
    if (req.files && req.files.length > 0) {
      newImages = await processImages(req.files);
    }

    // Update fields
    blogPost.title = title || blogPost.title;
    blogPost.metaDescription = metaDescription || blogPost.metaDescription;
    blogPost.focusKeywords = focusKeywords ? JSON.parse(focusKeywords) : blogPost.focusKeywords;
    blogPost.content = content || blogPost.content;
    blogPost.excerpt = excerpt || blogPost.excerpt;
    blogPost.category = category || blogPost.category;
    blogPost.tags = tags ? JSON.parse(tags) : blogPost.tags;
    blogPost.schemaMarkup = schemaMarkup || blogPost.schemaMarkup;
    blogPost.internalLinks = internalLinks ? JSON.parse(internalLinks) : blogPost.internalLinks;
    blogPost.externalLinks = externalLinks ? JSON.parse(externalLinks) : blogPost.externalLinks;

    // Add new images
    if (newImages.length > 0) {
      const newImageObjects = newImages.map(img => ({
        url: img.url,
        altText: req.body[`altText_${img.filename}`] || '',
        caption: req.body[`caption_${img.filename}`] || '',
        filename: img.filename
      }));
      blogPost.images = [...blogPost.images, ...newImageObjects];
    }

    // Update status and published date
    if (status && status !== blogPost.status) {
      blogPost.status = status;
      if (status === 'published' && !blogPost.publishedAt) {
        blogPost.publishedAt = new Date();
      }
    }

    // Get existing posts for duplicate check
    const existingPosts = await BlogPost.find({ _id: { $ne: blogPost._id } });

    // Perform SEO analysis
    const seoAnalysis = seoAnalyzer.analyzeSEO(blogPost, existingPosts);
    blogPost.seoAnalysis = seoAnalysis;

    const updatedPost = await blogPost.save();

    res.json({
      success: true,
      data: updatedPost
    });
  } catch (error) {
    console.error('Update blog post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete blog post
// @route   DELETE /api/blog/:id
// @access  Private
const deleteBlogPost = async (req, res) => {
  try {
    const blogPost = await BlogPost.findById(req.params.id);
    if (!blogPost) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    // Check if user can delete this post
    if (req.user.role !== 'admin' && blogPost.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    // Delete associated images
    for (const image of blogPost.images) {
      await deleteImage(image.filename);
    }

    await blogPost.remove();

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Delete blog post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get SEO analysis for blog post
// @route   POST /api/blog/analyze-seo
// @access  Private
const analyzeSEO = async (req, res) => {
  try {
    const {
      title,
      metaDescription,
      focusKeywords,
      content,
      images,
      internalLinks,
      externalLinks
    } = req.body;

    const blogPost = {
      title,
      metaDescription,
      focusKeywords: focusKeywords || [],
      content,
      images: images || [],
      internalLinks: internalLinks || [],
      externalLinks: externalLinks || []
    };

    // Get existing posts for duplicate check
    const existingPosts = await BlogPost.find({});

    // Perform SEO analysis
    const analysis = seoAnalyzer.analyzeSEO(blogPost, existingPosts);

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('SEO analysis error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get blog post statistics
// @route   GET /api/blog/stats
// @access  Private/Admin
const getBlogStats = async (req, res) => {
  try {
    const totalPosts = await BlogPost.countDocuments();
    const publishedPosts = await BlogPost.countDocuments({ status: 'published' });
    const draftPosts = await BlogPost.countDocuments({ status: 'draft' });
    const archivedPosts = await BlogPost.countDocuments({ status: 'archived' });

    // Get posts by category
    const categoryStats = await BlogPost.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent posts
    const recentPosts = await BlogPost.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title status createdAt');

    res.json({
      success: true,
      data: {
        total: totalPosts,
        published: publishedPosts,
        draft: draftPosts,
        archived: archivedPosts,
        categories: categoryStats,
        recent: recentPosts
      }
    });
  } catch (error) {
    console.error('Get blog stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Bulk update blog posts
// @route   PUT /api/blog/bulk
// @access  Private/Admin
const bulkUpdatePosts = async (req, res) => {
  try {
    const { postIds, updates } = req.body;

    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
      return res.status(400).json({ message: 'Post IDs are required' });
    }

    const result = await BlogPost.updateMany(
      { _id: { $in: postIds } },
      { $set: updates }
    );

    res.json({
      success: true,
      data: {
        modified: result.modifiedCount,
        total: postIds.length
      }
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getBlogPosts,
  getBlogPost,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  analyzeSEO,
  getBlogStats,
  bulkUpdatePosts
};
