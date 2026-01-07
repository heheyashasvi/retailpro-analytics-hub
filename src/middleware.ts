import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Security headers for all responses
const SECURITY_HEADERS = {
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  // Enable XSS protection
  'X-XSS-Protection': '1; mode=block',
  // Control referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-inline/eval
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://res.cloudinary.com",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
  ].join('; '),
  // HSTS for HTTPS enforcement
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  // Prevent DNS prefetching
  'X-DNS-Prefetch-Control': 'off',
  // Disable download of untrusted executables
  'X-Download-Options': 'noopen',
  // Prevent IE from executing downloads in site context
  'X-Permitted-Cross-Domain-Policies': 'none',
}

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Clean up expired rate limit entries
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000) // Clean every 5 minutes

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const remoteAddr = request.headers.get('x-vercel-forwarded-for')
  
  return forwarded?.split(',')[0] || realIP || remoteAddr || 'unknown'
}

function applyRateLimit(request: NextRequest, maxRequests: number = 100, windowMs: number = 15 * 60 * 1000): boolean {
  const ip = getClientIP(request)
  const now = Date.now()
  const windowStart = Math.floor(now / windowMs) * windowMs
  const key = `${ip}:${windowStart}`
  
  const entry = rateLimitStore.get(key)
  
  if (!entry) {
    rateLimitStore.set(key, { count: 1, resetTime: windowStart + windowMs })
    return true
  }
  
  if (entry.count >= maxRequests) {
    return false
  }
  
  entry.count++
  return true
}

function isAuthRoute(pathname: string): boolean {
  return pathname.startsWith('/api/auth/') || pathname === '/login'
}

function isProtectedRoute(pathname: string): boolean {
  return pathname.startsWith('/dashboard') || 
         (pathname.startsWith('/api/') && !isAuthRoute(pathname) && !pathname.startsWith('/api/test'))
}

async function verifyAuthentication(request: NextRequest): Promise<boolean> {
  try {
    const token = request.cookies.get('admin-token')?.value
    
    if (!token) {
      return false
    }
    
    // Simple JWT format check (should have 3 parts separated by dots)
    const parts = token.split('.')
    if (parts.length !== 3) {
      return false
    }
    
    try {
      // Decode the payload (middle part) to check basic validity
      const payload = JSON.parse(atob(parts[1]))
      
      // Check if token is expired
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return false
      }
      
      // Check if adminId exists in payload
      return !!payload.adminId
    } catch (decodeError) {
      return false
    }
  } catch (error) {
    console.error('Session verification error in middleware:', error)
    return false
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()
  
  // Apply security headers to all responses
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  // Apply stricter rate limiting for auth endpoints
  if (isAuthRoute(pathname)) {
    const isAllowed = applyRateLimit(request, 50, 15 * 60 * 1000) // 50 requests per 15 minutes (increased for testing)
    if (!isAllowed) {
      if (pathname.startsWith('/api/')) {
        // Return JSON error for API routes
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              code: 'RATE_LIMIT_EXCEEDED', 
              message: 'Too many requests. Please try again later.' 
            },
            timestamp: new Date().toISOString()
          },
          { 
            status: 429,
            headers: {
              ...SECURITY_HEADERS,
              'Retry-After': '900', // 15 minutes
            }
          }
        )
      } else {
        // Return HTML error page for non-API routes
        return new NextResponse('Too Many Requests', { 
          status: 429,
          headers: {
            ...SECURITY_HEADERS,
            'Retry-After': '900', // 15 minutes
          }
        })
      }
    }
  } else {
    // General rate limiting for other routes
    const isAllowed = applyRateLimit(request, 100, 15 * 60 * 1000) // 100 requests per 15 minutes
    if (!isAllowed) {
      if (pathname.startsWith('/api/')) {
        // Return JSON error for API routes
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              code: 'RATE_LIMIT_EXCEEDED', 
              message: 'Too many requests. Please try again later.' 
            },
            timestamp: new Date().toISOString()
          },
          { 
            status: 429,
            headers: {
              ...SECURITY_HEADERS,
              'Retry-After': '900',
            }
          }
        )
      } else {
        // Return HTML error page for non-API routes
        return new NextResponse('Too Many Requests', { 
          status: 429,
          headers: {
            ...SECURITY_HEADERS,
            'Retry-After': '900',
          }
        })
      }
    }
  }
  
  // Check authentication for protected routes
  if (isProtectedRoute(pathname)) {
    const isAuthenticated = await verifyAuthentication(request)
    
    if (!isAuthenticated) {
      if (pathname.startsWith('/api/')) {
        // Return JSON error for API routes
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              code: 'UNAUTHORIZED', 
              message: 'Authentication required' 
            },
            timestamp: new Date().toISOString()
          },
          { 
            status: 401,
            headers: SECURITY_HEADERS
          }
        )
      } else {
        // Redirect to login for page routes
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
      }
    }
  }
  
  // Prevent access to login page if already authenticated
  if (pathname === '/login') {
    const isAuthenticated = await verifyAuthentication(request)
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }
  
  // Add CSRF token to response headers for forms
  if (request.method === 'GET' && !pathname.startsWith('/api/')) {
    const csrfToken = generateCSRFToken()
    response.headers.set('X-CSRF-Token', csrfToken)
    response.cookies.set('csrf-token', csrfToken, {
      httpOnly: false, // Allow JavaScript access for client-side forms
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60, // 1 hour
    })
  }
  
  return response
}

function generateCSRFToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}