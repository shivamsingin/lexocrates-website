const cheerio = require('cheerio');
const natural = require('natural');

class SEOAnalyzer {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
  }

  // Analyze keyword density
  analyzeKeywordDensity(content, keywords) {
    if (!content || !keywords || keywords.length === 0) {
      return { density: 0, distribution: {} };
    }

    const words = this.tokenizer.tokenize(content.toLowerCase());
    const totalWords = words.length;
    const distribution = {};

    keywords.forEach(keyword => {
      const keywordWords = this.tokenizer.tokenize(keyword.toLowerCase());
      let count = 0;

      for (let i = 0; i <= words.length - keywordWords.length; i++) {
        let match = true;
        for (let j = 0; j < keywordWords.length; j++) {
          if (words[i + j] !== keywordWords[j]) {
            match = false;
            break;
          }
        }
        if (match) count++;
      }

      distribution[keyword] = {
        count,
        density: totalWords > 0 ? (count / totalWords) * 100 : 0
      };
    });

    const totalDensity = Object.values(distribution)
      .reduce((sum, item) => sum + item.density, 0);

    return {
      density: totalDensity,
      distribution
    };
  }

  // Check meta description length
  checkMetaDescription(metaDescription) {
    if (!metaDescription) return { valid: false, length: 0, message: 'Meta description is missing' };
    
    const length = metaDescription.length;
    if (length < 120) {
      return { valid: false, length, message: 'Meta description is too short (aim for 120-160 characters)' };
    } else if (length > 160) {
      return { valid: false, length, message: 'Meta description is too long (max 160 characters)' };
    } else {
      return { valid: true, length, message: 'Meta description length is optimal' };
    }
  }

  // Check title length
  checkTitle(title) {
    if (!title) return { valid: false, length: 0, message: 'Title is missing' };
    
    const length = title.length;
    if (length < 30) {
      return { valid: false, length, message: 'Title is too short (aim for 30-60 characters)' };
    } else if (length > 60) {
      return { valid: false, length, message: 'Title is too long (max 60 characters)' };
    } else {
      return { valid: true, length, message: 'Title length is optimal' };
    }
  }

  // Check for alt tags in images
  checkAltTags(images) {
    if (!images || images.length === 0) {
      return { valid: true, missing: 0, message: 'No images found' };
    }

    const missingAlt = images.filter(img => !img.altText || img.altText.trim() === '').length;
    const total = images.length;

    if (missingAlt === 0) {
      return { valid: true, missing: 0, total, message: 'All images have alt text' };
    } else {
      return { 
        valid: false, 
        missing: missingAlt, 
        total, 
        message: `${missingAlt} out of ${total} images are missing alt text` 
      };
    }
  }

  // Check for internal and external links
  checkLinks(internalLinks, externalLinks) {
    const internalCount = internalLinks ? internalLinks.length : 0;
    const externalCount = externalLinks ? externalLinks.length : 0;
    const totalLinks = internalCount + externalCount;

    const suggestions = [];

    if (internalCount === 0) {
      suggestions.push('Add internal links to improve site navigation and SEO');
    }

    if (externalCount === 0) {
      suggestions.push('Consider adding relevant external links for credibility');
    }

    if (totalLinks < 3) {
      suggestions.push('Add more links to improve content connectivity');
    }

    return {
      internalCount,
      externalCount,
      totalLinks,
      suggestions
    };
  }

  // Check content structure (headings)
  checkContentStructure(content) {
    const $ = cheerio.load(content);
    const headings = {
      h1: $('h1').length,
      h2: $('h2').length,
      h3: $('h3').length,
      h4: $('h4').length,
      h5: $('h5').length,
      h6: $('h6').length
    };

    const suggestions = [];

    if (headings.h1 === 0) {
      suggestions.push('Add an H1 heading to improve content structure');
    } else if (headings.h1 > 1) {
      suggestions.push('Use only one H1 heading per page');
    }

    if (headings.h2 === 0) {
      suggestions.push('Add H2 headings to organize content sections');
    }

    if (headings.h3 === 0 && headings.h2 > 0) {
      suggestions.push('Consider adding H3 headings for better content hierarchy');
    }

    return {
      headings,
      suggestions
    };
  }

  // Calculate word count and reading time
  calculateContentMetrics(content) {
    if (!content) return { wordCount: 0, readingTime: 0 };

    const $ = cheerio.load(content);
    const text = $.text();
    const words = this.tokenizer.tokenize(text);
    const wordCount = words ? words.length : 0;
    const readingTime = Math.ceil(wordCount / 200); // 200 words per minute

    return { wordCount, readingTime };
  }

  // Check for duplicate content (basic check)
  checkDuplicateContent(content, existingPosts) {
    if (!content || !existingPosts || existingPosts.length === 0) {
      return { hasDuplicates: false, similarity: 0 };
    }

    const contentWords = new Set(this.tokenizer.tokenize(content.toLowerCase()));
    let maxSimilarity = 0;

    existingPosts.forEach(post => {
      const postWords = new Set(this.tokenizer.tokenize(post.content.toLowerCase()));
      const intersection = new Set([...contentWords].filter(x => postWords.has(x)));
      const similarity = intersection.size / Math.max(contentWords.size, postWords.size);
      maxSimilarity = Math.max(maxSimilarity, similarity);
    });

    return {
      hasDuplicates: maxSimilarity > 0.7,
      similarity: maxSimilarity * 100
    };
  }

  // Generate SEO score
  generateSEOScore(analysis) {
    let score = 0;
    const maxScore = 100;

    // Title (15 points)
    if (analysis.titleCheck && analysis.titleCheck.valid) {
      score += 15;
    }

    // Meta description (15 points)
    if (analysis.metaDescriptionCheck && analysis.metaDescriptionCheck.valid) {
      score += 15;
    }

    // Keyword density (20 points)
    if (analysis.keywordDensity && analysis.keywordDensity.density >= 0.5 && analysis.keywordDensity.density <= 2.5) {
      score += 20;
    } else if (analysis.keywordDensity && analysis.keywordDensity.density > 0) {
      score += 10;
    }

    // Alt tags (10 points)
    if (analysis.altTagsCheck && analysis.altTagsCheck.valid) {
      score += 10;
    }

    // Links (10 points)
    if (analysis.linksCheck && analysis.linksCheck.totalLinks >= 3) {
      score += 10;
    } else if (analysis.linksCheck && analysis.linksCheck.totalLinks > 0) {
      score += 5;
    }

    // Content structure (10 points)
    if (analysis.contentStructure && analysis.contentStructure.headings.h1 === 1 && analysis.contentStructure.headings.h2 > 0) {
      score += 10;
    }

    // Word count (10 points)
    if (analysis.contentMetrics && analysis.contentMetrics.wordCount >= 300) {
      score += 10;
    }

    // No duplicates (10 points)
    if (analysis.duplicateCheck && !analysis.duplicateCheck.hasDuplicates) {
      score += 10;
    }

    return Math.min(score, maxScore);
  }

  // Comprehensive SEO analysis
  analyzeSEO(blogPost, existingPosts = []) {
    const analysis = {};

    // Basic checks
    analysis.titleCheck = this.checkTitle(blogPost.title);
    analysis.metaDescriptionCheck = this.checkMetaDescription(blogPost.metaDescription);
    analysis.keywordDensity = this.analyzeKeywordDensity(blogPost.content, blogPost.focusKeywords);
    analysis.altTagsCheck = this.checkAltTags(blogPost.images);
    analysis.linksCheck = this.checkLinks(blogPost.internalLinks, blogPost.externalLinks);
    analysis.contentStructure = this.checkContentStructure(blogPost.content);
    analysis.contentMetrics = this.calculateContentMetrics(blogPost.content);
    analysis.duplicateCheck = this.checkDuplicateContent(blogPost.content, existingPosts);

    // Generate suggestions
    analysis.suggestions = [];

    if (!analysis.titleCheck.valid) {
      analysis.suggestions.push(analysis.titleCheck.message);
    }

    if (!analysis.metaDescriptionCheck.valid) {
      analysis.suggestions.push(analysis.metaDescriptionCheck.message);
    }

    if (analysis.keywordDensity.density < 0.5) {
      analysis.suggestions.push('Increase keyword density (aim for 0.5-2.5%)');
    } else if (analysis.keywordDensity.density > 2.5) {
      analysis.suggestions.push('Reduce keyword density to avoid keyword stuffing');
    }

    if (!analysis.altTagsCheck.valid) {
      analysis.suggestions.push(analysis.altTagsCheck.message);
    }

    analysis.suggestions.push(...analysis.linksCheck.suggestions);
    analysis.suggestions.push(...analysis.contentStructure.suggestions);

    if (analysis.contentMetrics.wordCount < 300) {
      analysis.suggestions.push('Increase content length (aim for at least 300 words)');
    }

    if (analysis.duplicateCheck.hasDuplicates) {
      analysis.suggestions.push(`Content has ${analysis.duplicateCheck.similarity.toFixed(1)}% similarity with existing posts`);
    }

    // Generate SEO score
    analysis.seoScore = this.generateSEOScore(analysis);

    return analysis;
  }
}

module.exports = new SEOAnalyzer();
