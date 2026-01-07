#!/bin/bash

echo "🚀 RetailPro Analytics Hub - Deployment Script"
echo "=============================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit: RetailPro Analytics Hub"
fi

echo ""
echo "✅ Project is ready for deployment!"
echo ""
echo "🎯 Next Steps:"
echo "1. Create a GitHub repository at: https://github.com/new"
echo "2. Name it: retailpro-analytics-hub"
echo "3. Run these commands:"
echo ""
echo "   git remote add origin https://github.com/YOUR_USERNAME/retailpro-analytics-hub.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "4. Deploy to Vercel:"
echo "   - Go to https://vercel.com"
echo "   - Click 'New Project'"
echo "   - Import your GitHub repository"
echo "   - Add environment variables (see DEPLOYMENT.md)"
echo "   - Click Deploy!"
echo ""
echo "📚 For detailed instructions, see DEPLOYMENT.md"
echo ""
echo "🎉 Your RetailPro Analytics Hub will be live in minutes!"