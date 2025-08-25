-- Lexocrates Blog Database Schema
-- Compatible with Local, Cloudflare Workers, and Shared Hosting

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS lexocrates_blog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lexocrates_blog;

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('admin', 'editor', 'author') DEFAULT 'author',
  mfa_enabled TINYINT(1) DEFAULT 0,
  mfa_secret VARCHAR(64) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
);

-- Blog posts table with comprehensive SEO fields
CREATE TABLE IF NOT EXISTS blogs (
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
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_slug (slug),
  INDEX idx_status (status),
  INDEX idx_author (author_id),
  INDEX idx_published (published_at),
  INDEX idx_seo_score (seo_score),
  FULLTEXT idx_content (title, content, meta_description)
);

-- SEO analysis results table
CREATE TABLE IF NOT EXISTS seo_analysis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  blog_id INT NOT NULL,
  analysis_type ENUM('content', 'technical', 'on_page') NOT NULL,
  score INT DEFAULT 0,
  issues JSON,
  suggestions JSON,
  analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE,
  INDEX idx_blog_analysis (blog_id, analysis_type),
  INDEX idx_analyzed_at (analyzed_at)
);

-- Blog categories table
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  parent_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_slug (slug),
  INDEX idx_parent (parent_id)
);

-- Blog-category relationship table
CREATE TABLE IF NOT EXISTS blog_categories (
  blog_id INT NOT NULL,
  category_id INT NOT NULL,
  PRIMARY KEY (blog_id, category_id),
  FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  INDEX idx_blog (blog_id),
  INDEX idx_category (category_id)
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_slug (slug)
);

-- Blog-tag relationship table
CREATE TABLE IF NOT EXISTS blog_tags (
  blog_id INT NOT NULL,
  tag_id INT NOT NULL,
  PRIMARY KEY (blog_id, tag_id),
  FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
  INDEX idx_blog (blog_id),
  INDEX idx_tag (tag_id)
);

-- Insert default admin user
INSERT IGNORE INTO users (email, password, name, role) VALUES 
('admin@lexocrates.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin User', 'admin');

-- Insert default categories
INSERT IGNORE INTO categories (name, slug, description) VALUES 
('Legal Services', 'legal-services', 'Articles about legal services and processes'),
('Industry Insights', 'industry-insights', 'Industry trends and analysis'),
('Case Studies', 'case-studies', 'Real-world case studies and examples'),
('Legal Technology', 'legal-technology', 'Technology in legal industry'),
('Compliance', 'compliance', 'Compliance and regulatory updates');

-- Create indexes for better performance
CREATE INDEX idx_blogs_title ON blogs(title);
CREATE INDEX idx_blogs_created ON blogs(created_at);
CREATE INDEX idx_blogs_updated ON blogs(updated_at);
CREATE INDEX idx_users_created ON users(created_at);
CREATE INDEX idx_categories_name ON categories(name);
