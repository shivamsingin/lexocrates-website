#!/bin/bash

echo "🚀 Lexocrates Website Deployment Script"
echo "========================================"
echo ""

echo "📋 Prerequisites Check:"
echo "1. Make sure you have a CloudFlare account"
echo "2. Ensure all website files are in this directory"
echo ""

echo "📁 Current files in directory:"
ls -la *.html *.css *.js *.md
echo ""

echo "🌐 Deployment Options:"
echo ""
echo "Option 1: Direct Upload to CloudFlare Pages"
echo "1. Go to https://dash.cloudflare.com"
echo "2. Navigate to Pages"
echo "3. Click 'Create a project'"
echo "4. Choose 'Direct Upload'"
echo "5. Upload all files from this directory"
echo "6. Configure project name: lexocrates-legal-services"
echo "7. Click 'Save and Deploy'"
echo ""

echo "Option 2: GitHub Integration"
echo "1. Create a new repository on GitHub"
echo "2. Run: git remote add origin https://github.com/YOUR_USERNAME/lexocrates-website.git"
echo "3. Run: git push -u origin main"
echo "4. Connect CloudFlare Pages to your GitHub repository"
echo ""

echo "✅ Post-Deployment Checklist:"
echo "- [ ] Verify all pages load correctly"
echo "- [ ] Test contact forms"
echo "- [ ] Check mobile responsiveness"
echo "- [ ] Verify all navigation links work"
echo "- [ ] Test newsletter subscription"
echo ""

echo "🔗 Your website will be available at:"
echo "https://lexocrates-legal-services.pages.dev"
echo ""

echo "📞 Need help? Check the DEPLOYMENT.md file for detailed instructions."
echo ""
