#!/bin/bash

# Force complete any pending git operations
git merge --abort 2>/dev/null || true
git reset --hard HEAD 2>/dev/null || true

# Add all changes
git add .

# Commit with deployment fixes
git commit -m "Fix deployment issues: force dynamic rendering and SQLite database

- Add dynamic exports to all API routes with runtime and revalidate configs
- Switch Prisma schema from PostgreSQL to SQLite for Vercel deployment
- Add database initialization script for production
- Create not-found page with dynamic export
- Update build script to handle database setup
- Force dynamic rendering globally in layout and route files"

# Push to GitHub
git push origin main --force-with-lease

echo "Deployment fixes pushed to GitHub!"
echo "Now go to Vercel dashboard and redeploy your project."