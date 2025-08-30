const cheerio = require('cheerio');
const natural = require('natural');

class SEOAnalyzer {
  static analyzeContent(content, title, metaDescription) {
    const $ = cheerio.load(content);
    const text = $.text();
    
    // Basic SEO metrics
    const wordCount = text.split(/\s+/).length;
    const titleLength = title ? title.length : 0;
    const metaLength = metaDescription ? metaDescription.length : 0;
    
    // Keyword analysis
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const wordFreq = {};
    words.forEach(word => {
      if (word.length > 3) { // Skip short words
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
    
    // Get top keywords
    const topKeywords = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));
    
    // SEO score calculation
    let score = 0;
    const recommendations = [];
    
    // Title analysis
    if (titleLength < 30) {
      recommendations.push('Title is too short. Aim for 30-60 characters.');
    } else if (titleLength > 60) {
      recommendations.push('Title is too long. Aim for 30-60 characters.');
    } else {
      score += 20;
    }
    
    // Meta description analysis
    if (metaLength < 120) {
      recommendations.push('Meta description is too short. Aim for 120-160 characters.');
    } else if (metaLength > 160) {
      recommendations.push('Meta description is too long. Aim for 120-160 characters.');
    } else {
      score += 20;
    }
    
    // Content length analysis
    if (wordCount < 300) {
      recommendations.push('Content is too short. Aim for at least 300 words.');
    } else if (wordCount > 2000) {
      score += 20;
    } else {
      score += 15;
    }
    
    // Heading analysis
    const headings = $('h1, h2, h3, h4, h5, h6');
    if (headings.length > 0) {
      score += 15;
    } else {
      recommendations.push('Add headings to improve content structure.');
    }
    
    // Image analysis
    const images = $('img');
    if (images.length > 0) {
      score += 10;
      const imagesWithAlt = images.filter((i, el) => $(el).attr('alt')).length;
      if (imagesWithAlt < images.length) {
        recommendations.push('Add alt text to all images for better accessibility.');
      }
    }
    
    // Link analysis
    const links = $('a');
    if (links.length > 0) {
      score += 10;
    }
    
    return {
      score: Math.min(score, 100),
      metrics: {
        wordCount,
        titleLength,
        metaLength,
        headingsCount: headings.length,
        imagesCount: images.length,
        linksCount: links.length
      },
      topKeywords,
      recommendations
    };
  }
}

module.exports = SEOAnalyzer;
