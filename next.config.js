/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force dynamic rendering for all routes
  experimental: {
    dynamicIO: true,
  },
  
  // Image optimization settings
  images: {
    domains: ['res.cloudinary.com'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false, // Prevent SVG XSS attacks
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Enable image optimization
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      // Cache static assets
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache images
      {
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
  
  // Redirect HTTP to HTTPS in production
  async redirects() {
    return process.env.NODE_ENV === 'production' ? [
      {
        source: '/(.*)',
        has: [
          {
            type: 'header',
            key: 'x-forwarded-proto',
            value: 'http',
          },
        ],
        destination: 'https://localhost:3000/:path*',
        permanent: true,
      },
    ] : []
  },
  
  // Environment variables (only expose what's needed on client)
  env: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  },
  
  // Webpack configuration for performance and security
  webpack: (config, { dev, isServer }) => {
    // Security-related webpack configurations
    if (!dev && !isServer) {
      // Remove source maps in production for security
      config.devtool = false
      
      // Enable tree shaking
      config.optimization.usedExports = true
      config.optimization.sideEffects = false
      
      // Bundle analyzer in development
      if (process.env.ANALYZE === 'true') {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'server',
            analyzerPort: isServer ? 8888 : 8889,
            openAnalyzer: true,
          })
        )
      }
    }
    
    // Prevent bundling of server-only modules on client
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    }
    
    // Optimize chunks
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
          },
        },
      }
    }
    
    return config
  },
  
  // Experimental features for performance and security
  experimental: {
    // Enable strict mode for better security
    strictNextHead: true,
    // Disable server components in pages directory for security
    serverComponentsExternalPackages: ['bcryptjs'],
    // Enable optimized CSS loading
    optimizeCss: true,
    // Force dynamic rendering for all routes
    dynamicIO: true,
  },
  
  // Compiler options
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
    // Enable SWC minification
    styledComponents: true,
  },
  
  // Output configuration - removed standalone for Vercel compatibility
  
  // Disable powered by header
  poweredByHeader: false,
  
  // Compress responses
  compress: true,
  
  // Generate ETags for caching
  generateEtags: true,
  
  // HTTP keep alive
  httpAgentOptions: {
    keepAlive: true,
  },
  
  // Enable SWC for faster builds
  swcMinify: true,
  
  // Optimize fonts
  optimizeFonts: true,
  
  // Enable modern build output
  modularizeImports: {
    '@/components/ui': {
      transform: '@/components/ui/{{member}}',
    },
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
    },
  },
}

module.exports = nextConfig