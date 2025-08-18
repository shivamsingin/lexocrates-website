class SeoAnalyzer {
  constructor() {
    this.idealTitleLength = { min: 30, max: 60 };
    this.idealMetaDescriptionLength = { min: 120, max: 160 };
    this.idealKeywordDensity = { min: 0.5, max: 2.5 };
    this.idealWordCount = { min: 300, max: 2500 };
  }

  coerceToString(value) {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value.filter(v => typeof v === 'string').join(' ');
    if (typeof value === 'object') {
      if (Array.isArray(value.ops)) {
        return value.ops.map(op => (typeof op.insert === 'string' ? op.insert : '')).join('');
      }
      if (typeof value.html === 'string') return value.html;
      if (typeof value.value === 'string') return value.value;
      return '';
    }
    return '';
  }

  // Main analysis function
  async analyzeContent({ title, content, meta_description, keywords }) {
    const analysis = {
      score: 0,
      issues: [],
      suggestions: [],
      metrics: {}
    };

    // Coerce inputs to safe types (handle Quill Delta and objects)
    const safeTitle = this.coerceToString(title);
    const safeMeta = this.coerceToString(meta_description);
    const safeKeywords = Array.isArray(keywords) ? keywords.map(k => this.coerceToString(k)).filter(Boolean) : [];
    const safeContent = this.coerceToString(content);

    // Analyze title
    const titleAnalysis = this.analyzeTitle(safeTitle, safeKeywords);
    analysis.metrics.title = titleAnalysis;
    analysis.score += titleAnalysis.score;

    // Analyze meta description
    const metaAnalysis = this.analyzeMetaDescription(safeMeta, safeKeywords);
    analysis.metrics.meta_description = metaAnalysis;
    analysis.score += metaAnalysis.score;

    // Analyze content
    const contentAnalysis = this.analyzeContent(safeContent, safeKeywords);
    analysis.metrics.content = contentAnalysis;
    analysis.score += contentAnalysis.score;

    // Analyze keywords
    const keywordAnalysis = this.analyzeKeywords(safeKeywords, safeContent);
    analysis.metrics.keywords = keywordAnalysis;
    analysis.score += keywordAnalysis.score;

    // Analyze headings
    const headingAnalysis = this.analyzeHeadings(safeContent);
    analysis.metrics.headings = headingAnalysis;
    analysis.score += headingAnalysis.score;

    // Analyze images
    const imageAnalysis = this.analyzeImages(safeContent);
    analysis.metrics.images = imageAnalysis;
    analysis.score += imageAnalysis.score;

    // Analyze links
    const linkAnalysis = this.analyzeLinks(safeContent);
    analysis.metrics.links = linkAnalysis;
    analysis.score += linkAnalysis.score;

    // Compile issues and suggestions
    analysis.issues = this.compileIssues(analysis.metrics);
    analysis.suggestions = this.compileSuggestions(analysis.metrics);

    // Normalize score to 0-100
    analysis.score = Math.min(100, Math.max(0, analysis.score));

    return analysis;
  }

  // Analyze title
  analyzeTitle(title, keywords) {
    const analysis = { score: 0, issues: [], suggestions: [] };
    
    if (!title) {
      analysis.issues.push('Missing title');
      return analysis;
    }

    const length = title.length;
    const hasKeywords = keywords.some(keyword => 
      title.toLowerCase().includes(keyword.toLowerCase())
    );

    // Length check
    if (length < this.idealTitleLength.min) {
      analysis.issues.push(`Title too short (${length} chars, minimum ${this.idealTitleLength.min})`);
    } else if (length > this.idealTitleLength.max) {
      analysis.issues.push(`Title too long (${length} chars, maximum ${this.idealTitleLength.max})`);
    } else {
      analysis.score += 20;
    }

    // Keyword presence
    if (hasKeywords) {
      analysis.score += 20;
    } else {
      analysis.issues.push('Title missing focus keywords');
      analysis.suggestions.push('Include primary keywords in title');
    }

    // Brand presence
    if (title.toLowerCase().includes('lexocrates')) {
      analysis.score += 10;
    }

    // Emotional/action words
    const actionWords = ['best', 'top', 'guide', 'complete', 'ultimate', 'essential'];
    if (actionWords.some(word => title.toLowerCase().includes(word))) {
      analysis.score += 10;
    }

    return analysis;
  }

  // Analyze meta description
  analyzeMetaDescription(meta_description, keywords) {
    const analysis = { score: 0, issues: [], suggestions: [] };
    
    if (!meta_description) {
      analysis.issues.push('Missing meta description');
      return analysis;
    }

    const length = meta_description.length;
    const hasKeywords = keywords.some(keyword => 
      meta_description.toLowerCase().includes(keyword.toLowerCase())
    );

    // Length check
    if (length < this.idealMetaDescriptionLength.min) {
      analysis.issues.push(`Meta description too short (${length} chars, minimum ${this.idealMetaDescriptionLength.min})`);
    } else if (length > this.idealMetaDescriptionLength.max) {
      analysis.issues.push(`Meta description too long (${length} chars, maximum ${this.idealMetaDescriptionLength.max})`);
    } else {
      analysis.score += 20;
    }

    // Keyword presence
    if (hasKeywords) {
      analysis.score += 20;
    } else {
      analysis.issues.push('Meta description missing focus keywords');
      analysis.suggestions.push('Include primary keywords in meta description');
    }

    // Call to action
    const ctaWords = ['learn', 'discover', 'find', 'get', 'read', 'explore'];
    if (ctaWords.some(word => meta_description.toLowerCase().includes(word))) {
      analysis.score += 10;
    }

    return analysis;
  }

  // Analyze content
  analyzeContent(content, keywords) {
    const analysis = { score: 0, issues: [], suggestions: [] };
    
    // Coerce inputs to safe types
    const safeContent = this.coerceToString(content);
    const safeKeywords = Array.isArray(keywords) ? keywords.map(k => this.coerceToString(k)).filter(Boolean) : [];
    
    if (!safeContent) {
      analysis.issues.push('Missing content');
      return analysis;
    }

    // Strip HTML tags for word counting
    const textContent = safeContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const wordCount = textContent ? textContent.split(/\s+/).length : 0;
    
    // Debug logging
    console.log('SEO Analyzer debug:');
    console.log('Original content length:', safeContent.length);
    console.log('Text content after HTML strip:', textContent);
    console.log('Word count:', wordCount);
    console.log('Content preview:', safeContent.substring(0, 200));
    const keywordDensity = this.calculateKeywordDensity(safeContent, safeKeywords);
    const hasKeywords = safeKeywords.some(keyword => 
      safeContent.toLowerCase().includes(keyword.toLowerCase())
    );

    // Word count check
    if (wordCount < this.idealWordCount.min) {
      analysis.issues.push(`Content too short (${wordCount} words, minimum ${this.idealWordCount.min})`);
    } else if (wordCount > this.idealWordCount.max) {
      analysis.issues.push(`Content too long (${wordCount} words, maximum ${this.idealWordCount.max})`);
    } else {
      analysis.score += 15;
    }

    // Keyword presence
    if (hasKeywords) {
      analysis.score += 15;
    } else {
      analysis.issues.push('Content missing focus keywords');
      analysis.suggestions.push('Include primary keywords naturally in content');
    }

    // Keyword density
    if (keywordDensity >= this.idealKeywordDensity.min && keywordDensity <= this.idealKeywordDensity.max) {
      analysis.score += 10;
    } else if (keywordDensity > this.idealKeywordDensity.max) {
      analysis.issues.push(`Keyword density too high (${keywordDensity.toFixed(2)}%)`);
      analysis.suggestions.push('Reduce keyword stuffing');
    } else {
      analysis.issues.push(`Keyword density too low (${keywordDensity.toFixed(2)}%)`);
      analysis.suggestions.push('Increase keyword usage naturally');
    }

    // Reading level
    const readingLevel = this.calculateReadingLevel(safeContent);
    if (readingLevel <= 8) {
      analysis.score += 10;
    } else {
      analysis.issues.push(`Content may be too complex (reading level: ${readingLevel})`);
      analysis.suggestions.push('Simplify language for better readability');
    }

    return analysis;
  }

  // Analyze keywords
  analyzeKeywords(keywords, content) {
    const analysis = { score: 0, issues: [], suggestions: [] };
    
    // Coerce inputs to safe types
    const safeKeywords = Array.isArray(keywords) ? keywords : [];
    const safeContent = typeof content === 'string' ? content : String(content ?? '');
    
    if (!safeKeywords || safeKeywords.length === 0) {
      analysis.issues.push('No keywords specified');
      return analysis;
    }

    // Keyword count
    if (safeKeywords.length >= 3 && safeKeywords.length <= 8) {
      analysis.score += 15;
    } else if (safeKeywords.length < 3) {
      analysis.issues.push('Too few keywords (minimum 3 recommended)');
    } else {
      analysis.issues.push('Too many keywords (maximum 8 recommended)');
    }

    // Keyword length
    const longKeywords = safeKeywords.filter(kw => kw.length > 50);
    if (longKeywords.length > 0) {
      analysis.issues.push('Some keywords are too long');
      analysis.suggestions.push('Keep keywords under 50 characters');
    } else {
      analysis.score += 10;
    }

    // Keyword presence in content
    const presentKeywords = safeKeywords.filter(keyword => 
      safeContent.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (presentKeywords.length === safeKeywords.length) {
      analysis.score += 15;
    } else {
      const missing = safeKeywords.filter(kw => !presentKeywords.includes(kw));
      analysis.issues.push(`Keywords not found in content: ${missing.join(', ')}`);
      analysis.suggestions.push('Include all keywords naturally in content');
    }

    return analysis;
  }

  // Analyze headings
  analyzeHeadings(content) {
    const analysis = { score: 0, issues: [], suggestions: [] };
    
    const h1Matches = content.match(/<h1[^>]*>(.*?)<\/h1>/gi);
    const h2Matches = content.match(/<h2[^>]*>(.*?)<\/h2>/gi);
    const h3Matches = content.match(/<h3[^>]*>(.*?)<\/h3>/gi);

    // H1 count
    if (!h1Matches || h1Matches.length === 0) {
      analysis.issues.push('Missing H1 heading');
      analysis.suggestions.push('Add one H1 heading to your content');
    } else if (h1Matches.length > 1) {
      analysis.issues.push('Multiple H1 headings found');
      analysis.suggestions.push('Use only one H1 heading per page');
    } else {
      analysis.score += 15;
    }

    // H2 and H3 presence
    if (h2Matches && h2Matches.length >= 2) {
      analysis.score += 10;
    } else {
      analysis.issues.push('Insufficient H2 headings');
      analysis.suggestions.push('Add more H2 headings to structure content');
    }

    if (h3Matches && h3Matches.length >= 1) {
      analysis.score += 5;
    }

    return analysis;
  }

  // Analyze images
  analyzeImages(content) {
    const analysis = { score: 0, issues: [], suggestions: [] };
    
    const imgMatches = content.match(/<img[^>]*>/gi);
    const altMatches = content.match(/alt=["']([^"']*)["']/gi);

    if (!imgMatches || imgMatches.length === 0) {
      analysis.issues.push('No images found');
      analysis.suggestions.push('Add relevant images to improve engagement');
    } else {
      analysis.score += 10;

      // Check alt text
      if (!altMatches || altMatches.length < imgMatches.length) {
        analysis.issues.push('Some images missing alt text');
        analysis.suggestions.push('Add descriptive alt text to all images');
      } else {
        analysis.score += 10;
      }
    }

    return analysis;
  }

  // Analyze links
  analyzeLinks(content) {
    const analysis = { score: 0, issues: [], suggestions: [] };
    
    const linkMatches = content.match(/<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi);
    const internalLinks = content.match(/href=["']\/([^"']*)["']/gi);
    const externalLinks = content.match(/href=["']https?:\/\/(?!.*lexocrates)[^"']*["']/gi);

    if (linkMatches && linkMatches.length > 0) {
      analysis.score += 10;

      // Internal links
      if (internalLinks && internalLinks.length >= 2) {
        analysis.score += 10;
      } else {
        analysis.issues.push('Insufficient internal links');
        analysis.suggestions.push('Add more internal links to related content');
      }

      // External links
      if (externalLinks && externalLinks.length >= 1) {
        analysis.score += 5;
      } else {
        analysis.issues.push('No external links found');
        analysis.suggestions.push('Add relevant external links for credibility');
      }
    } else {
      analysis.issues.push('No links found');
      analysis.suggestions.push('Add internal and external links');
    }

    return analysis;
  }

  // Helper methods
  calculateKeywordDensity(content, keywords) {
    if (!content || !keywords || keywords.length === 0) return 0;
    
    const safeContent = typeof content === 'string' ? content : String(content ?? '');
    const safeKeywords = Array.isArray(keywords) ? keywords : [];
    
    // Strip HTML tags for keyword density calculation
    const textContent = safeContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = textContent.toLowerCase().split(/\s+/);
    const totalWords = words.length;
    let keywordCount = 0;

    safeKeywords.forEach(keyword => {
      const keywordWords = keyword.toLowerCase().split(/\s+/);
      for (let i = 0; i <= words.length - keywordWords.length; i++) {
        let match = true;
        for (let j = 0; j < keywordWords.length; j++) {
          if (words[i + j] !== keywordWords[j]) {
            match = false;
            break;
          }
        }
        if (match) keywordCount++;
      }
    });

    return (keywordCount / totalWords) * 100;
  }

  calculateReadingLevel(content) {
    // Simplified Flesch-Kincaid Grade Level calculation
    const safeContent = typeof content === 'string' ? content : String(content ?? '');
    // Strip HTML tags for reading level calculation
    const textContent = safeContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const sentences = textContent.split(/[.!?]+/).length;
    const words = textContent.split(/\s+/).length;
    const syllables = this.countSyllables(textContent);

    if (sentences === 0 || words === 0) return 0;

    return 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
  }

  countSyllables(text) {
    // Simplified syllable counting
    const safeText = typeof text === 'string' ? text : String(text ?? '');
    const words = safeText.toLowerCase().split(/\s+/);
    let count = 0;

    words.forEach(word => {
      const vowels = word.match(/[aeiouy]+/g);
      if (vowels) {
        count += vowels.length;
      } else {
        count += 1;
      }
    });

    return count;
  }

  compileIssues(metrics) {
    const issues = [];
    Object.values(metrics).forEach(metric => {
      if (metric.issues) {
        issues.push(...metric.issues);
      }
    });
    return issues;
  }

  compileSuggestions(metrics) {
    const suggestions = [];
    Object.values(metrics).forEach(metric => {
      if (metric.suggestions) {
        suggestions.push(...metric.suggestions);
      }
    });
    return suggestions;
  }

  // Generate schema markup
  generateSchemaMarkup(blogData) {
    const { title, content, author_name, published_at, featured_image } = blogData;
    
    return {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": title,
      "author": {
        "@type": "Person",
        "name": author_name
      },
      "datePublished": published_at,
      "dateModified": new Date().toISOString(),
      "image": featured_image,
      "publisher": {
        "@type": "Organization",
        "name": "Lexocrates",
        "logo": {
          "@type": "ImageObject",
          "url": "https://lexocrates.com/logo.png"
        }
      },
      "description": content.substring(0, 160),
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `https://lexocrates.com/blog/${blogData.slug}`
      }
    };
  }

  // Generate Google search preview
  generateSearchPreview(blogData) {
    const { title, meta_description, slug } = blogData;
    
    return {
      title: title.length > 60 ? title.substring(0, 57) + '...' : title,
      url: `https://lexocrates.com/blog/${slug}`,
      description: meta_description && meta_description.length > 160 
        ? meta_description.substring(0, 157) + '...' 
        : meta_description
    };
  }
}

module.exports = new SeoAnalyzer();
