const slugify = require('slugify');
const dbConnection = require('../db/connection');
const seoAnalyzer = require('../utils/seoAnalyzer');

class BlogHandler {
  constructor(dbConnection) {
    this.db = dbConnection;
  }

  // Safe JSON parsing method
  safeJsonParse(jsonString, defaultValue) {
    if (!jsonString || jsonString === 'null' || jsonString === 'undefined') return defaultValue;
    
    // If it's already an object/array, return it
    if (typeof jsonString === 'object') return jsonString;
    
    // If it's a string that looks like JSON, try to parse it
    if (typeof jsonString === 'string') {
      try {
        const parsed = JSON.parse(jsonString);
        return parsed;
      } catch (error) {
        // If it's a comma-separated string, split it
        if (jsonString.includes(',')) {
          return jsonString.split(',').map(item => item.trim()).filter(item => item.length > 0);
        }
        // If it's a single item, return as array
        if (jsonString.trim().length > 0) {
          return [jsonString.trim()];
        }
        return defaultValue;
      }
    }
    
    return defaultValue;
  }

  async getBlogs(options = {}) {
    try {
      const { page = 1, limit = 10, category, tag, search } = options;
      const offset = (page - 1) * limit;
      
      let sql = `
        SELECT DISTINCT b.*, 
               u.name as author_name,
               GROUP_CONCAT(DISTINCT c.name) as categories,
               GROUP_CONCAT(DISTINCT t.name) as tags
        FROM blogs b
        LEFT JOIN users u ON b.author_id = u.id
        LEFT JOIN blog_categories bc ON b.id = bc.blog_id
        LEFT JOIN categories c ON bc.category_id = c.id
        LEFT JOIN blog_tags bt ON b.id = bt.blog_id
        LEFT JOIN tags t ON bt.tag_id = t.id
        WHERE b.status = "published"
      `;
      const params = [];
      
      if (category) {
        sql += ' AND c.slug = ?';
        params.push(category);
      }
      
      if (tag) {
        sql += ' AND t.slug = ?';
        params.push(tag);
      }
      
      if (search) {
        sql += ' AND (b.title LIKE ? OR b.content LIKE ? OR b.excerpt LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }
      
      sql += ` GROUP BY b.id ORDER BY b.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
      
      const blogs = await this.db.query(sql, params);
      
      // Process categories and tags for each blog
      const processedBlogs = blogs.map(blog => ({
        ...blog,
        categories: blog.categories ? blog.categories.split(',').map(cat => cat.trim()).filter(cat => cat.length > 0) : [],
        tags: blog.tags ? blog.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [],
        keywords: this.safeJsonParse(blog.keywords, []),
        images: this.safeJsonParse(blog.images, []),
        internal_links: this.safeJsonParse(blog.internal_links, []),
        external_links: this.safeJsonParse(blog.external_links, []),
        schema_markup: this.safeJsonParse(blog.schema_markup, {})
      }));
      
      // Get total count for pagination
      let countSql = `
        SELECT COUNT(DISTINCT b.id) as total
        FROM blogs b
        LEFT JOIN blog_categories bc ON b.id = bc.blog_id
        LEFT JOIN categories c ON bc.category_id = c.id
        LEFT JOIN blog_tags bt ON b.id = bt.blog_id
        LEFT JOIN tags t ON bt.tag_id = t.id
        WHERE b.status = "published"
      `;
      const countParams = [];
      
      if (category) {
        countSql += ' AND c.slug = ?';
        countParams.push(category);
      }
      
      if (tag) {
        countSql += ' AND t.slug = ?';
        countParams.push(tag);
      }
      
      if (search) {
        countSql += ' AND (b.title LIKE ? OR b.content LIKE ? OR b.excerpt LIKE ?)';
        const searchTerm = `%${search}%`;
        countParams.push(searchTerm, searchTerm, searchTerm);
      }
      
      const [countResult] = await this.db.query(countSql, countParams);
      const total = countResult.total;
      
      return {
        blogs: processedBlogs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting blogs:', error);
      throw error;
    }
  }

  async getBlogBySlug(slug) {
    try {
      const sql = `
        SELECT b.*, 
               u.name as author_name,
               GROUP_CONCAT(DISTINCT c.name) as categories,
               GROUP_CONCAT(DISTINCT t.name) as tags
        FROM blogs b
        LEFT JOIN users u ON b.author_id = u.id
        LEFT JOIN blog_categories bc ON b.id = bc.blog_id
        LEFT JOIN categories c ON bc.category_id = c.id
        LEFT JOIN blog_tags bt ON b.id = bt.blog_id
        LEFT JOIN tags t ON bt.tag_id = t.id
        WHERE b.slug = ? AND b.status = "published"
        GROUP BY b.id
      `;
      const blogs = await this.db.query(sql, [slug]);
      if (!blogs[0]) return null;
      
      const blog = blogs[0];
      return {
        ...blog,
        categories: blog.categories ? blog.categories.split(',').map(cat => cat.trim()).filter(cat => cat.length > 0) : [],
        tags: blog.tags ? blog.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [],
        keywords: this.safeJsonParse(blog.keywords, []),
        images: this.safeJsonParse(blog.images, []),
        internal_links: this.safeJsonParse(blog.internal_links, []),
        external_links: this.safeJsonParse(blog.external_links, []),
        schema_markup: this.safeJsonParse(blog.schema_markup, {})
      };
    } catch (error) {
      console.error('Error getting blog by slug:', error);
      throw error;
    }
  }

  // Get single blog post by id
  async getBlogById(id) {
    const sql = `
      SELECT b.*, 
             u.name as author_name,
             GROUP_CONCAT(DISTINCT c.name) as categories,
             GROUP_CONCAT(DISTINCT t.name) as tags
      FROM blogs b
      LEFT JOIN users u ON b.author_id = u.id
      LEFT JOIN blog_categories bc ON b.id = bc.blog_id
      LEFT JOIN categories c ON bc.category_id = c.id
      LEFT JOIN blog_tags bt ON b.id = bt.blog_id
      LEFT JOIN tags t ON bt.tag_id = t.id
      WHERE b.id = ?
      GROUP BY b.id
    `;

    const [blog] = await this.db.query(sql, [id]);
    if (!blog) return null;

    return {
      ...blog,
      categories: blog.categories ? blog.categories.split(',').map(cat => cat.trim()).filter(cat => cat.length > 0) : [],
      tags: blog.tags ? blog.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [],
      keywords: this.safeJsonParse(blog.keywords, []),
      images: this.safeJsonParse(blog.images, []),
      internal_links: this.safeJsonParse(blog.internal_links, []),
      external_links: this.safeJsonParse(blog.external_links, []),
      schema_markup: this.safeJsonParse(blog.schema_markup, {})
    };
  }

  // Create new blog post
  async createBlog(blogData, authorId) {
    const {
      title,
      content,
      meta_description,
      keywords = [],
      excerpt,
      featured_image,
      images = [],
      internal_links = [],
      external_links = [],
      schema_markup = {},
      status = 'draft',
      categories = [],
      tags = []
    } = blogData;

    // Coerce input types to safe values
    const safeTitle = typeof title === 'string' ? title : String(title ?? '');
    const safeContent = typeof content === 'string' ? content : (content ? String(content) : '');
    const safeMeta = typeof meta_description === 'string' ? meta_description : String(meta_description ?? '');
    const safeKeywords = Array.isArray(keywords) ? keywords : [];

    // Generate slug
    let slug = slugify(safeTitle, { lower: true, strict: true });
    
    // Check if slug exists
    let counter = 1;
    let originalSlug = slug;
    while (await this.slugExists(slug)) {
      slug = `${originalSlug}-${counter}`;
      counter++;
    }

    // Calculate SEO metrics
    console.log('Calling SEO analyzer with:');
    console.log('safeContent type:', typeof safeContent);
    console.log('safeContent value:', safeContent.substring(0, 50) + '...');
    
    const seoAnalysis = await seoAnalyzer.analyzeContent({
      title: safeTitle,
      content: safeContent,
      meta_description: safeMeta,
      keywords: safeKeywords
    });

    // Strip HTML tags for word counting (same logic as SEO analyzer)
    const textContent = safeContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const wordCount = textContent ? textContent.split(/\s+/).length : 0;
    const readingTime = Math.ceil(wordCount / 200); // 200 words per minute
    
    // Debug logging
    console.log('Blog handler debug:');
    console.log('Original content length:', safeContent.length);
    console.log('Text content after HTML strip:', textContent.substring(0, 100) + '...');
    console.log('Word count:', wordCount);

    return await this.db.transaction(async (connection) => {
      // Prepare parameters for insert
      const paramNames = [
        'title','slug','content','meta_description','keywords',
        'excerpt','featured_image','images','internal_links',
        'external_links','schema_markup','author_id','status',
        'seo_score','word_count','reading_time','published_at'
      ];
      const params = [
        safeTitle, slug, safeContent, safeMeta, JSON.stringify(safeKeywords),
        excerpt ?? null, featured_image ?? null, JSON.stringify(images ?? []), JSON.stringify(internal_links ?? []),
        JSON.stringify(external_links ?? []), JSON.stringify(schema_markup ?? {}), authorId ?? null, (status ?? 'draft'),
        seoAnalysis.score ?? 0, wordCount ?? 0, readingTime ?? 0,
        (status === 'published' ? new Date() : null)
      ];

      // Validate no undefined params
      const undefinedIndex = params.findIndex(v => v === undefined);
      if (undefinedIndex !== -1) {
        const undefinedName = paramNames[undefinedIndex] || `index_${undefinedIndex}`;
        throw new Error(`Undefined parameter: ${undefinedName}`);
      }
      
      // Insert blog post
      const [result] = await connection.execute(`
        INSERT INTO blogs (
          title, slug, content, meta_description, keywords,
          excerpt, featured_image, images, internal_links,
          external_links, schema_markup, author_id, status,
          seo_score, word_count, reading_time, published_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, params);

      const blogId = result.insertId;

      // Add categories
      if (categories.length > 0) {
        await this.addCategories(connection, blogId, categories);
      }

      // Add tags
      if (tags.length > 0) {
        await this.addTags(connection, blogId, tags);
      }

      // Store SEO analysis
      await connection.execute(`
        INSERT INTO seo_analysis (blog_id, analysis_type, score, issues, suggestions)
        VALUES (?, 'content', ?, ?, ?)
      `, [
        blogId, seoAnalysis.score, 
        JSON.stringify(seoAnalysis.issues), 
        JSON.stringify(seoAnalysis.suggestions)
      ]);

      return { id: blogId, slug, seoAnalysis };
    });
  }

  // Update blog post
  async updateBlog(id, blogData, authorId) {
    const {
      title,
      content,
      meta_description,
      keywords = [],
      excerpt,
      featured_image,
      images = [],
      internal_links = [],
      external_links = [],
      schema_markup = {},
      status,
      categories = [],
      tags = []
    } = blogData;

    // Check if blog exists and user has permission
    const [existingBlog] = await this.db.query(
      'SELECT author_id, status FROM blogs WHERE id = ?',
      [id]
    );

    if (!existingBlog) {
      throw new Error('Blog post not found');
    }

    // Generate new slug if title changed
    let slug = existingBlog.slug;
    if (title && title !== existingBlog.title) {
      slug = slugify(title, { lower: true, strict: true });
      let counter = 1;
      let originalSlug = slug;
      while (await this.slugExists(slug, id)) {
        slug = `${originalSlug}-${counter}`;
        counter++;
      }
    }

    // Calculate SEO metrics
    // Coerce inputs to safe types
    const safeTitle = typeof title === 'string' ? title : String(title ?? '');
    const safeContent = typeof content === 'string' ? content : (content ? String(content) : '');
    const safeMeta = typeof meta_description === 'string' ? meta_description : String(meta_description ?? '');
    const safeKeywords = Array.isArray(keywords) ? keywords : [];

    const seoAnalysis = await seoAnalyzer.analyzeContent({
      title: safeTitle,
      content: safeContent,
      meta_description: safeMeta,
      keywords: safeKeywords
    });

    // Strip HTML tags for word counting (same logic as SEO analyzer)
    const textContent = safeContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const wordCount = textContent ? textContent.split(/\s+/).length : 0;
    const readingTime = Math.ceil(wordCount / 200);

    return await this.db.transaction(async (connection) => {
      // Update blog post
      await connection.execute(`
        UPDATE blogs SET
          title = ?, slug = ?, content = ?, meta_description = ?,
          keywords = ?, excerpt = ?, featured_image = ?, images = ?,
          internal_links = ?, external_links = ?, schema_markup = ?,
          status = ?, seo_score = ?, word_count = ?, reading_time = ?,
          published_at = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        safeTitle, slug, safeContent, safeMeta, JSON.stringify(safeKeywords),
        excerpt, featured_image, JSON.stringify(images), JSON.stringify(internal_links),
        JSON.stringify(external_links), JSON.stringify(schema_markup), status,
        seoAnalysis.score, wordCount, readingTime,
        status === 'published' ? new Date() : null, id
      ]);

      // Update categories
      await connection.execute('DELETE FROM blog_categories WHERE blog_id = ?', [id]);
      if (categories.length > 0) {
        await this.addCategories(connection, id, categories);
      }

      // Update tags
      await connection.execute('DELETE FROM blog_tags WHERE blog_id = ?', [id]);
      if (tags.length > 0) {
        await this.addTags(connection, id, tags);
      }

      // Update SEO analysis
      await connection.execute(`
        INSERT INTO seo_analysis (blog_id, analysis_type, score, issues, suggestions)
        VALUES (?, 'content', ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        score = VALUES(score), issues = VALUES(issues), 
        suggestions = VALUES(suggestions), analyzed_at = CURRENT_TIMESTAMP
      `, [
        id, seoAnalysis.score, 
        JSON.stringify(seoAnalysis.issues), 
        JSON.stringify(seoAnalysis.suggestions)
      ]);

      return { id, slug, seoAnalysis };
    });
  }

  // Delete blog post
  async deleteBlog(id) {
    const [blog] = await this.db.query('SELECT id FROM blogs WHERE id = ?', [id]);
    
    if (!blog) {
      throw new Error('Blog post not found');
    }

    await this.db.query('DELETE FROM blogs WHERE id = ?', [id]);
    return { success: true };
  }

  // Helper methods
  async slugExists(slug, excludeId = null) {
    let sql = 'SELECT id FROM blogs WHERE slug = ?';
    let params = [slug];
    
    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }

    const [result] = await this.db.query(sql, params);
    return !!result;
  }

  async addCategories(connection, blogId, categoryNames) {
    for (const categoryName of categoryNames) {
      // Get or create category
      const [rows] = await connection.execute(
        'SELECT id FROM categories WHERE name = ?',
        [categoryName]
      );
      let categoryRow = Array.isArray(rows) ? rows[0] : undefined;

      if (!categoryRow) {
        const slug = slugify(categoryName, { lower: true, strict: true });
        const [result] = await connection.execute(
          'INSERT INTO categories (name, slug) VALUES (?, ?)',
          [categoryName, slug]
        );
        categoryRow = { id: result.insertId };
      }

      // Link to blog
      await connection.execute(
        'INSERT IGNORE INTO blog_categories (blog_id, category_id) VALUES (?, ?)',
        [blogId, categoryRow.id]
      );
    }
  }

  async addTags(connection, blogId, tagNames) {
    for (const tagName of tagNames) {
      // Get or create tag
      const [rows] = await connection.execute(
        'SELECT id FROM tags WHERE name = ?',
        [tagName]
      );
      let tagRow = Array.isArray(rows) ? rows[0] : undefined;

      if (!tagRow) {
        const slug = slugify(tagName, { lower: true, strict: true });
        const [result] = await connection.execute(
          'INSERT INTO tags (name, slug) VALUES (?, ?)',
          [tagName, slug]
        );
        tagRow = { id: result.insertId };
      }

      // Link to blog
      await connection.execute(
        'INSERT IGNORE INTO blog_tags (blog_id, tag_id) VALUES (?, ?)',
        [blogId, tagRow.id]
      );
    }
  }

  // Get SEO analysis for a blog
  async getSeoAnalysis(blogId) {
    const [analysis] = await this.db.query(
      'SELECT * FROM seo_analysis WHERE blog_id = ? ORDER BY analyzed_at DESC LIMIT 1',
      [blogId]
    );

    if (!analysis) {
      return null;
    }

    return {
      ...analysis,
      issues: JSON.parse(analysis.issues || '[]'),
      suggestions: JSON.parse(analysis.suggestions || '[]')
    };
  }

  // Get categories
  async getCategories() {
    const categories = await this.db.query(
      'SELECT * FROM categories ORDER BY name ASC'
    );
    return categories;
  }

  // Get tags
  async getTags() {
    const tags = await this.db.query(
      'SELECT * FROM tags ORDER BY name ASC'
    );
    return tags;
  }
}

module.exports = BlogHandler;
