const express = require('express');
const path = require('path');
const cors = require('cors');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(compression());
app.use(express.static(__dirname));
app.use('/images', express.static(path.join(__dirname, 'images')));

// Serve main pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'about.html'));
});

app.get('/blog', (req, res) => {
  res.sendFile(path.join(__dirname, 'blog.html'));
});

app.get('/services', (req, res) => {
  res.sendFile(path.join(__dirname, 'services.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'contact.html'));
});

app.get('/team', (req, res) => {
  res.sendFile(path.join(__dirname, 'team.html'));
});

app.get('/careers', (req, res) => {
  res.sendFile(path.join(__dirname, 'careers.html'));
});

app.get('/privacy-policy', (req, res) => {
  res.sendFile(path.join(__dirname, 'privacy-policy.html'));
});

app.get('/cookie-policy', (req, res) => {
  res.sendFile(path.join(__dirname, 'cookie-policy.html'));
});

app.get('/security-statement', (req, res) => {
  res.sendFile(path.join(__dirname, 'security-statement.html'));
});

// Industry pages
app.get('/industries', (req, res) => {
  res.sendFile(path.join(__dirname, 'industries.html'));
});

app.get('/healthcare', (req, res) => {
  res.sendFile(path.join(__dirname, 'healthcare.html'));
});

app.get('/manufacturing', (req, res) => {
  res.sendFile(path.join(__dirname, 'manufacturing.html'));
});

app.get('/financial-services', (req, res) => {
  res.sendFile(path.join(__dirname, 'financial-services.html'));
});

app.get('/retail', (req, res) => {
  res.sendFile(path.join(__dirname, 'retail.html'));
});

app.get('/technology', (req, res) => {
  res.sendFile(path.join(__dirname, 'technology.html'));
});

// Service pages
app.get('/contract-drafting', (req, res) => {
  res.sendFile(path.join(__dirname, 'contract-drafting.html'));
});

app.get('/legal-research', (req, res) => {
  res.sendFile(path.join(__dirname, 'legal-research.html'));
});

app.get('/legal-transcription', (req, res) => {
  res.sendFile(path.join(__dirname, 'legal-transcription.html'));
});

app.get('/legal-translation', (req, res) => {
  res.sendFile(path.join(__dirname, 'legal-translation.html'));
});

app.get('/legal-data-entry', (req, res) => {
  res.sendFile(path.join(__dirname, 'legal-data-entry.html'));
});

app.get('/ediscovery', (req, res) => {
  res.sendFile(path.join(__dirname, 'ediscovery.html'));
});

app.get('/litigation-support', (req, res) => {
  res.sendFile(path.join(__dirname, 'litigation-support.html'));
});

app.get('/ma-due-diligence', (req, res) => {
  res.sendFile(path.join(__dirname, 'ma-due-diligence.html'));
});

app.get('/ip-research', (req, res) => {
  res.sendFile(path.join(__dirname, 'ip-research.html'));
});

app.get('/citation-formatting', (req, res) => {
  res.sendFile(path.join(__dirname, 'citation-formatting.html'));
});

app.get('/compliance', (req, res) => {
  res.sendFile(path.join(__dirname, 'compliance.html'));
});

app.get('/virtual-paralegal', (req, res) => {
  res.sendFile(path.join(__dirname, 'virtual-paralegal.html'));
});

app.get('/education', (req, res) => {
  res.sendFile(path.join(__dirname, 'education.html'));
});

app.get('/testimonials', (req, res) => {
  res.sendFile(path.join(__dirname, 'testimonials.html'));
});

// API proxy to blog backend
app.get('/api/blog/*', (req, res) => {
  const targetUrl = `http://localhost:5002${req.url}`;
  res.redirect(targetUrl);
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Lexocrates Main Website Server',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🌐 Main Website Server running on port ${PORT}`);
  console.log(`📱 Website: http://localhost:${PORT}`);
  console.log(`🔍 Health: http://localhost:${PORT}/health`);
});

module.exports = app;

