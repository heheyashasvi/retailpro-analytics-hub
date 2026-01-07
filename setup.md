# E-commerce Admin Dashboard Setup Guide

This comprehensive guide will help you set up and run the e-commerce admin dashboard locally and deploy it to production.

## 📋 Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm or yarn** - Package manager (comes with Node.js)
- **Git** - Version control system
- **Cloudinary Account** - For image storage (free tier available)

## 🚀 Quick Start (5 minutes)

### 1. Clone and Install
```bash
git clone <your-repository-url>
cd ecommerce-admin-dashboard
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
# Database
DATABASE_URL="file:./prisma/dev.db"

# Authentication (CHANGE IN PRODUCTION!)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production-make-it-long-and-random"
BCRYPT_ROUNDS=12

# Cloudinary Configuration (Sign up at https://cloudinary.com)
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

### 3. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed the database with initial admin user and sample data
npx prisma db seed
```

### 4. Start Development Server
```bash
npm run dev
```

🎉 **Success!** Open `http://localhost:3000` in your browser.

## 🔐 Default Login Credentials

**Admin Account:**
- **Email**: `admin@ecommerce.com`
- **Password**: `admin123456`

**⚠️ Important**: Change these credentials in production!

## 🌐 Cloudinary Setup (Required for Image Uploads)

### Free Account Setup:
1. Visit [Cloudinary.com](https://cloudinary.com) and sign up for free
2. Go to your Dashboard
3. Copy the following values to your `.env` file:
   - **Cloud Name**: Found in the dashboard header
   - **API Key**: Found in the "Account Details" section
   - **API Secret**: Found in the "Account Details" section (click "Reveal")

### Alternative: Skip Image Uploads
If you want to test without Cloudinary, you can:
1. Leave Cloudinary variables empty in `.env`
2. Image upload features will show error messages but won't break the app
3. All other features will work normally

## 🧪 Testing the Application

### Run All Tests
```bash
# Unit tests (fast)
npm test

# Property-based tests (comprehensive)
npm run test:property

# Integration tests (end-to-end workflows)
npm run test:integration

# Run all tests
npm run test:all
```

### Test Coverage
- **Unit Tests**: Core functionality validation
- **Property Tests**: Edge case and invariant testing with fast-check
- **Integration Tests**: Complete user workflow testing

## 📁 Project Structure Overview

```
ecommerce-admin-dashboard/
├── src/
│   ├── app/                    # Next.js App Router (pages & API)
│   │   ├── api/               # Backend API routes
│   │   ├── dashboard/         # Admin dashboard pages
│   │   ├── login/             # Authentication
│   │   └── layout.tsx         # Root layout
│   ├── components/            # React components
│   │   ├── auth/              # Login/logout components
│   │   ├── dashboard/         # Dashboard widgets
│   │   ├── products/          # Product management
│   │   └── ui/                # Base UI components
│   ├── services/              # Business logic
│   │   ├── auth.ts            # Authentication service
│   │   ├── product.ts         # Product management
│   │   └── database.ts        # Database operations
│   ├── lib/                   # Utilities and config
│   └── types/                 # TypeScript definitions
├── prisma/                    # Database schema & migrations
└── public/                    # Static assets
```

## 🚀 Production Deployment

### 1. Environment Configuration
Create a production `.env` file:
```env
# Production Database (PostgreSQL recommended)
DATABASE_URL="postgresql://user:password@host:port/database"

# Strong JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET="your-super-long-random-production-jwt-secret-here"
BCRYPT_ROUNDS=12

# Production Cloudinary
CLOUDINARY_CLOUD_NAME="your-production-cloud-name"
CLOUDINARY_API_KEY="your-production-api-key"
CLOUDINARY_API_SECRET="your-production-api-secret"

# Production App URL
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NODE_ENV="production"
```

### 2. Database Migration
```bash
# For PostgreSQL/MySQL in production
npx prisma migrate deploy
npx prisma db seed
```

### 3. Build and Deploy
```bash
# Build the application
npm run build

# Start production server
npm start
```

### 4. Deployment Platforms

#### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Railway
```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy
railway login
railway deploy
```

#### Docker
```dockerfile
# Dockerfile included in project
docker build -t ecommerce-admin .
docker run -p 3000:3000 ecommerce-admin
```

## 🔧 Advanced Configuration

### Database Options

#### SQLite (Development)
```env
DATABASE_URL="file:./prisma/dev.db"
```

#### PostgreSQL (Production)
```env
DATABASE_URL="postgresql://user:password@host:port/database"
```

#### MySQL (Alternative)
```env
DATABASE_URL="mysql://user:password@host:port/database"
```

### Security Configuration

#### JWT Settings
- **Development**: Any secret works
- **Production**: Use `openssl rand -base64 32` to generate
- **Expiration**: Configured in `src/services/auth.ts`

#### CSRF Protection
- Automatically enabled in production
- Can be disabled for testing in `src/app/api/auth/login/route.ts`

#### Rate Limiting
- **Auth endpoints**: 50 requests per 15 minutes
- **General endpoints**: 100 requests per 15 minutes
- Configure in `src/middleware.ts`

## 🛠 Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Reset database
rm prisma/dev.db
npx prisma migrate dev --name init
npx prisma db seed
```

#### Image Upload Failures
1. Verify Cloudinary credentials in `.env`
2. Check network connectivity
3. Ensure Cloudinary account is active
4. Test with a small image first

#### Authentication Issues
```bash
# Clear browser data
# Check JWT_SECRET is consistent
# Verify admin user exists in database
npx prisma studio  # Browse database
```

#### Build Errors
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

#### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000
# Or use different port
npm run dev -- -p 3001
```

### Performance Issues

#### Slow Database Queries
- Check database indexes in `prisma/schema.prisma`
- Use `npx prisma studio` to inspect data
- Consider upgrading to PostgreSQL for production

#### Large Bundle Size
```bash
# Analyze bundle
npm run build
npm run analyze
```

#### Memory Issues
- Increase Node.js memory: `NODE_OPTIONS="--max-old-space-size=4096" npm run build`

## 📊 Monitoring and Maintenance

### Health Checks
- **Database**: `GET /api/health/db`
- **Authentication**: `GET /api/health/auth`
- **Images**: `GET /api/health/images`

### Logs
- **Development**: Console output
- **Production**: Configure logging service (e.g., LogRocket, Sentry)

### Backups
```bash
# SQLite backup
cp prisma/dev.db prisma/backup-$(date +%Y%m%d).db

# PostgreSQL backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

## 🆘 Getting Help

### Documentation
- **Next.js**: [nextjs.org/docs](https://nextjs.org/docs)
- **Prisma**: [prisma.io/docs](https://prisma.io/docs)
- **Tailwind**: [tailwindcss.com/docs](https://tailwindcss.com/docs)

### Support Channels
1. **GitHub Issues**: Report bugs and request features
2. **Discussions**: Ask questions and share ideas
3. **Documentation**: Check README.md for detailed info

### Common Commands Reference
```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint
npm run type-check      # Run TypeScript checks

# Database
npx prisma studio       # Database browser
npx prisma migrate dev  # Run migrations
npx prisma db seed      # Seed database
npx prisma generate     # Generate client

# Testing
npm test               # Unit tests
npm run test:property  # Property tests
npm run test:integration # Integration tests
npm run test:watch     # Watch mode
```

---

**🎯 Need help?** Create an issue in the repository with:
- Your operating system
- Node.js version (`node --version`)
- Error messages (full stack trace)
- Steps to reproduce the issue

**✅ Ready to go?** Start with the Quick Start section above!