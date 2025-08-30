// Blog API Integration for Lexocrates Website
class BlogAPI {
    constructor(baseURL = '/api') {
        this.baseURL = baseURL;
    }

    // Fetch all published blogs with optional filters
    async getBlogs(options = {}) {
        const {
            page = 1,
            limit = 10,
            category = null,
            tag = null,
            search = null,
            author = null
        } = options;

        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            status: 'published'
        });

        if (category) params.append('category', category);
        if (tag) params.append('tag', tag);
        if (search) params.append('search', search);
        if (author) params.append('author', author);

        try {
            const response = await fetch(`${this.baseURL}/blog?${params}`);
            const data = await response.json();
            
            if (data.success) {
                return data;
            } else {
                throw new Error(data.message || 'Failed to fetch blogs');
            }
        } catch (error) {
            console.error('Error fetching blogs:', error);
            return { blogs: [], pagination: { page: 1, pages: 1, total: 0 } };
        }
    }

    // Fetch a single blog post by slug
    async getBlogBySlug(slug) {
        try {
            const response = await fetch(`${this.baseURL}/blog/${slug}`);
            const data = await response.json();
            
            if (data.success) {
                return data.blog;
            } else {
                throw new Error(data.message || 'Blog post not found');
            }
        } catch (error) {
            console.error('Error fetching blog post:', error);
            return null;
        }
    }

    // Fetch blog statistics
    async getBlogStats() {
        try {
            const response = await fetch(`${this.baseURL}/blog/stats`);
            const data = await response.json();
            
            if (data.success) {
                return data.stats;
            } else {
                throw new Error(data.message || 'Failed to fetch blog stats');
            }
        } catch (error) {
            console.error('Error fetching blog stats:', error);
            return null;
        }
    }

    // Fetch categories
    async getCategories() {
        try {
            const response = await fetch(`${this.baseURL}/categories`);
            const data = await response.json();
            
            if (data.success) {
                return data.categories;
            } else {
                throw new Error(data.message || 'Failed to fetch categories');
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            return [];
        }
    }

    // Fetch tags
    async getTags() {
        try {
            const response = await fetch(`${this.baseURL}/tags`);
            const data = await response.json();
            
            if (data.success) {
                return data.tags;
            } else {
                throw new Error(data.message || 'Failed to fetch tags');
            }
        } catch (error) {
            console.error('Error fetching tags:', error);
            return [];
        }
    }
}

// Blog Display Functions
class BlogDisplay {
    constructor(api) {
        this.api = api;
    }

    // Format date for display
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Truncate text to specified length
    truncateText(text, maxLength = 150) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    }

    // Generate blog card HTML
    generateBlogCard(blog) {
        const featuredImage = blog.featured_image || 'images/blog-default.jpg';
        const excerpt = this.truncateText(blog.excerpt || blog.meta_description || blog.content);
        const category = blog.category || 'General';
        const authorName = blog.author_name || 'Lexocrates Team';
        const publishDate = this.formatDate(blog.created_at);

        return `
            <article class="blog-card" data-slug="${blog.slug}">
                <div class="blog-card-image">
                    <img src="${featuredImage}" alt="${blog.title}" loading="lazy">
                    <div class="blog-card-category">${category}</div>
                </div>
                <div class="blog-card-content">
                    <h3 class="blog-card-title">
                        <a href="/blog-post.html?slug=${blog.slug}">${blog.title}</a>
                    </h3>
                    <p class="blog-card-excerpt">${excerpt}</p>
                    <div class="blog-card-meta">
                        <span class="blog-card-date">
                            <i class="fas fa-calendar-alt"></i>
                            ${publishDate}
                        </span>
                        <span class="blog-card-author">
                            <i class="fas fa-user"></i>
                            ${authorName}
                        </span>
                    </div>
                    <div class="blog-card-tags">
                        ${(blog.tags || []).map(tag => `<span class="blog-tag">${tag}</span>`).join('')}
                    </div>
                </div>
            </article>
        `;
    }

    // Generate blog list HTML
    generateBlogList(blogs) {
        if (!blogs || blogs.length === 0) {
            return `
                <div class="no-blogs">
                    <i class="fas fa-newspaper"></i>
                    <h3>No blog posts found</h3>
                    <p>Check back soon for new articles and insights.</p>
                </div>
            `;
        }

        return blogs.map(blog => this.generateBlogCard(blog)).join('');
    }

    // Generate pagination HTML
    generatePagination(pagination, currentFilters = {}) {
        if (pagination.pages <= 1) return '';

        const currentPage = pagination.page;
        const totalPages = pagination.pages;
        
        let paginationHTML = '<div class="pagination">';
        
        // Previous button
        if (currentPage > 1) {
            const prevParams = new URLSearchParams({ ...currentFilters, page: (currentPage - 1).toString() });
            paginationHTML += `<a href="?${prevParams}" class="pagination-btn prev"><i class="fas fa-chevron-left"></i> Previous</a>`;
        }
        
        // Page numbers
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);
        
        for (let i = startPage; i <= endPage; i++) {
            const pageParams = new URLSearchParams({ ...currentFilters, page: i.toString() });
            const activeClass = i === currentPage ? 'active' : '';
            paginationHTML += `<a href="?${pageParams}" class="pagination-btn ${activeClass}">${i}</a>`;
        }
        
        // Next button
        if (currentPage < totalPages) {
            const nextParams = new URLSearchParams({ ...currentFilters, page: (currentPage + 1).toString() });
            paginationHTML += `<a href="?${nextParams}" class="pagination-btn next">Next <i class="fas fa-chevron-right"></i></a>`;
        }
        
        paginationHTML += '</div>';
        return paginationHTML;
    }

    // Generate filters HTML
    generateFilters(categories, tags, currentFilters = {}) {
        return `
            <div class="blog-filters">
                <div class="filter-group">
                    <label for="category-filter">Category:</label>
                    <select id="category-filter" class="filter-select">
                        <option value="">All Categories</option>
                        ${categories.map(cat => `
                            <option value="${cat.slug}" ${currentFilters.category === cat.slug ? 'selected' : ''}>
                                ${cat.name}
                            </option>
                        `).join('')}
                    </select>
                </div>
                <div class="filter-group">
                    <label for="tag-filter">Tag:</label>
                    <select id="tag-filter" class="filter-select">
                        <option value="">All Tags</option>
                        ${tags.map(tag => `
                            <option value="${tag.slug}" ${currentFilters.tag === tag.slug ? 'selected' : ''}>
                                ${tag.name}
                            </option>
                        `).join('')}
                    </select>
                </div>
                <div class="filter-group">
                    <label for="search-filter">Search:</label>
                    <input type="text" id="search-filter" class="filter-input" 
                           placeholder="Search articles..." 
                           value="${currentFilters.search || ''}">
                </div>
                <button id="clear-filters" class="btn btn-secondary">Clear Filters</button>
            </div>
        `;
    }

    // Load and display blogs
    async loadBlogs(container, options = {}) {
        try {
            const data = await this.api.getBlogs(options);
            
            if (data.blogs) {
                container.innerHTML = this.generateBlogList(data.blogs);
                
                // Add pagination if available
                if (data.pagination && data.pagination.pages > 1) {
                    const paginationContainer = document.createElement('div');
                    paginationContainer.className = 'pagination-container';
                    paginationContainer.innerHTML = this.generatePagination(data.pagination, options);
                    container.parentNode.appendChild(paginationContainer);
                }
            }
        } catch (error) {
            console.error('Error loading blogs:', error);
            container.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Unable to load blog posts</h3>
                    <p>Please try again later.</p>
                </div>
            `;
        }
    }

    // Load and display a single blog post
    async loadBlogPost(container, slug) {
        try {
            const blog = await this.api.getBlogBySlug(slug);
            
            if (blog) {
                container.innerHTML = this.generateBlogPostHTML(blog);
            } else {
                container.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Blog post not found</h3>
                        <p>The requested article could not be found.</p>
                        <a href="/blog.html" class="btn btn-primary">Back to Blog</a>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading blog post:', error);
            container.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Unable to load blog post</h3>
                    <p>Please try again later.</p>
                </div>
            `;
        }
    }

    // Generate single blog post HTML
    generateBlogPostHTML(blog) {
        const featuredImage = blog.featured_image || 'images/blog-default.jpg';
        const category = blog.category || 'General';
        const authorName = blog.author_name || 'Lexocrates Team';
        const publishDate = this.formatDate(blog.created_at);
        const updateDate = blog.updated_at ? this.formatDate(blog.updated_at) : null;

        return `
            <article class="blog-post">
                <header class="blog-post-header">
                    <div class="blog-post-meta">
                        <span class="blog-post-category">${category}</span>
                        <span class="blog-post-date">
                            <i class="fas fa-calendar-alt"></i>
                            Published: ${publishDate}
                        </span>
                        ${updateDate && updateDate !== publishDate ? `
                            <span class="blog-post-updated">
                                <i class="fas fa-edit"></i>
                                Updated: ${updateDate}
                            </span>
                        ` : ''}
                        <span class="blog-post-author">
                            <i class="fas fa-user"></i>
                            By ${authorName}
                        </span>
                    </div>
                    <h1 class="blog-post-title">${blog.title}</h1>
                    ${blog.excerpt ? `<p class="blog-post-excerpt">${blog.excerpt}</p>` : ''}
                </header>
                
                ${blog.featured_image ? `
                    <div class="blog-post-image">
                        <img src="${featuredImage}" alt="${blog.title}">
                    </div>
                ` : ''}
                
                <div class="blog-post-content">
                    ${blog.content}
                </div>
                
                ${(blog.tags || []).length > 0 ? `
                    <footer class="blog-post-footer">
                        <div class="blog-post-tags">
                            <h4>Tags:</h4>
                            ${blog.tags.map(tag => `<span class="blog-tag">${tag}</span>`).join('')}
                        </div>
                    </footer>
                ` : ''}
                
                <div class="blog-post-navigation">
                    <a href="/blog.html" class="btn btn-secondary">
                        <i class="fas fa-arrow-left"></i>
                        Back to Blog
                    </a>
                </div>
            </article>
        `;
    }
}

// Initialize blog functionality
const blogAPI = new BlogAPI();
const blogDisplay = new BlogDisplay(blogAPI);

// Export for use in other scripts
window.BlogAPI = BlogAPI;
window.BlogDisplay = BlogDisplay;
window.blogAPI = blogAPI;
window.blogDisplay = blogDisplay;

