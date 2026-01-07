# 🚀 RetailPro Analytics Hub - Deployment Guide

## Quick Deployment to Vercel (Recommended)

### Prerequisites
- GitHub account
- Vercel account (free at vercel.com)

### Step 1: Push to GitHub

1. **Initialize Git Repository** (if not already done):
```bash
git init
git add .
git commit -m "Initial commit: RetailPro Analytics Hub"
```

2. **Create GitHub Repository**:
   - Go to github.com and create a new repository
   - Name it: `retailpro-analytics-hub`
   - Make it public or private (your choice)

3. **Push to GitHub**:
```bash
git remote add origin https://github.com/YOUR_USERNAME/retailpro-analytics-hub.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel

1. **Go to Vercel**:
   - Visit [vercel.com](https://vercel.com)
   - Sign up/Login with your GitHub account

2. **Import Project**:
   - Click "New Project"
   - Import your `retailpro-analytics-hub` repository
   - Vercel will auto-detect it's a Next.js project

3. **Configure Environment Variables**:
   Add these environment variables in Vercel dashboard:

   ```
   NODE_ENV=production
   JWT_SECRET=your-super-secure-production-jwt-secret-here
   NEXTAUTH_SECRET=your-super-secure-nextauth-secret-here
   NEXTAUTH_URL=https://your-app-name.vercel.app
   NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
   DATABASE_URL=file:./prisma/prod.db
   ```

   **Optional (for image uploads)**:
   ```
   CLOUDINARY_CLOUD_NAME=your-cloudinary-name
   CLOUDINARY_API_KEY=your-cloudinary-key
   CLOUDINARY_API_SECRET=your-cloudinary-secret
   ```

4. **Deploy**:
   - Click "Deploy"
   - Vercel will build and deploy your app
   - You'll get a live URL like: `https://retailpro-analytics-hub.vercel.app`

### Step 3: Access Your Live App

🎉 **Your app is now live!**

**Demo Credentials**:
- Email: `admin@ecommerce.com`
- Password: `admin123456`

## Alternative Deployment Options

### Option 2: Railway (Database + App)

1. **Sign up at Railway**: [railway.app](https://railway.app)
2. **Connect GitHub**: Import your repository
3. **Add PostgreSQL**: Add a PostgreSQL database service
4. **Configure Environment Variables**: Same as above but use PostgreSQL URL
5. **Deploy**: Railway will handle the rest

### Option 3: Netlify

1. **Sign up at Netlify**: [netlify.com](https://netlify.com)
2. **Connect GitHub**: Import your repository
3. **Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `.next`
4. **Environment Variables**: Add the same variables as Vercel
5. **Deploy**: Netlify will build and deploy

## Production Environment Variables

### Required Variables:
```env
NODE_ENV=production
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters
NEXTAUTH_SECRET=your-super-secure-nextauth-secret-minimum-32-characters
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
DATABASE_URL=file:./prisma/prod.db
```

### Optional Variables:
```env
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
```

## Security Notes

⚠️ **IMPORTANT**: 
- Never use development secrets in production
- Generate strong, unique secrets for JWT_SECRET and NEXTAUTH_SECRET
- Use at least 32 characters for secrets
- Keep your environment variables secure

## Database Options

### SQLite (Default - Good for Demo)
- Uses file-based database
- Perfect for demos and small applications
- No additional setup required

### PostgreSQL (Recommended for Production)
- More robust for production use
- Better performance and scalability
- Available on Railway, Supabase, PlanetScale

To use PostgreSQL:
1. Create a PostgreSQL database
2. Update `DATABASE_URL` to your PostgreSQL connection string
3. Run migrations: `npx prisma migrate deploy`

## Custom Domain (Optional)

### On Vercel:
1. Go to your project settings
2. Click "Domains"
3. Add your custom domain
4. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to your custom domain

## Monitoring & Analytics

### Built-in Features:
- Error boundaries for graceful error handling
- Performance monitoring with Next.js analytics
- Real-time dashboard updates

### Optional Additions:
- Vercel Analytics (free)
- Sentry for error tracking
- Google Analytics for user tracking

## Troubleshooting

### Common Issues:

1. **Build Fails**:
   - Check environment variables are set
   - Ensure all dependencies are in package.json
   - Check build logs for specific errors

2. **Database Issues**:
   - Verify DATABASE_URL is correct
   - Run `npx prisma generate` locally first
   - Check database permissions

3. **Authentication Issues**:
   - Verify JWT_SECRET and NEXTAUTH_SECRET are set
   - Check NEXTAUTH_URL matches your domain
   - Ensure secrets are at least 32 characters

## Support

If you encounter issues:
1. Check the deployment logs
2. Verify all environment variables
3. Test locally first with `npm run build && npm start`
4. Check the platform-specific documentation

---

## 🎯 Quick Start Summary

1. **Push to GitHub**
2. **Connect to Vercel**
3. **Add environment variables**
4. **Deploy**
5. **Access your live app!**

Your RetailPro Analytics Hub will be live and accessible worldwide! 🌍