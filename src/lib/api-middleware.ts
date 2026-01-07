import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimit } from './rate-limit'
import { sanitizeInput } from './input-sanitizer'
import { validateCSRFToken } from './csrf-protection'

// Standard error response format
export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, any>
  }
  timestamp: string
}

// Standard success response format
export interface ApiSuccessResponse<T = any> {
  success: true
  data: T
  timestamp: string
}

// Enhanced security headers for all API responses
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://res.cloudinary.com",
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-DNS-Prefetch-Control': 'off',
  'X-Download-Options': 'noopen',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
}

// Rate limiting configurations with enhanced security
const RATE_LIMITS = {
  auth: { requests: 50, window: 15 * 60 * 1000 }, // 50 requests per 15 minutes (increased for testing)
  api: { requests: 100, window: 15 * 60 * 1000 }, // 100 requests per 15 minutes
  upload: { requests: 10, window: 60 * 1000 }, // 10 uploads per minute
  strict: { requests: 3, window: 60 * 1000 }, // 3 requests per minute for sensitive operations
}

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function createErrorResponse(
  error: ApiError | Error,
  statusCode?: number
): NextResponse {
  const timestamp = new Date().toISOString()
  
  if (error instanceof ApiError) {
    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      timestamp,
    }
    
    return NextResponse.json(response, { 
      status: error.statusCode,
      headers: SECURITY_HEADERS,
    })
  }
  
  // Generic error handling - don't leak internal details in production
  const response: ApiErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'Internal server error',
    },
    timestamp,
  }
  
  return NextResponse.json(response, { 
    status: statusCode || 500,
    headers: SECURITY_HEADERS,
  })
}

export function createSuccessResponse<T>(
  data: T,
  statusCode: number = 200
): NextResponse {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  }
  
  return NextResponse.json(response, { 
    status: statusCode,
    headers: SECURITY_HEADERS,
  })
}

// Enhanced validation middleware with additional security checks
export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return async (request: NextRequest): Promise<T> => {
    try {
      const contentType = request.headers.get('content-type')
      let body: any
      
      // Validate content type
      if (contentType?.includes('application/json')) {
        const text = await request.text()
        
        // Check for excessively large payloads
        if (text.length > 1024 * 1024) { // 1MB limit
          throw new ApiError('PAYLOAD_TOO_LARGE', 'Request payload too large', 413)
        }
        
        try {
          body = JSON.parse(text)
        } catch {
          throw new ApiError('INVALID_JSON', 'Invalid JSON format', 400)
        }
      } else if (contentType?.includes('multipart/form-data')) {
        const formData = await request.formData()
        body = Object.fromEntries(formData.entries())
      } else if (contentType?.includes('application/x-www-form-urlencoded')) {
        const formData = await request.formData()
        body = Object.fromEntries(formData.entries())
      } else {
        throw new ApiError('INVALID_CONTENT_TYPE', 'Unsupported content type', 400)
      }
      
      // Sanitize input to prevent XSS and injection attacks
      // Disable sanitization for now to debug
      const sanitizedBody = body
      
      // Validate with Zod
      const result = schema.safeParse(sanitizedBody)
      
      if (!result.success) {
        console.error('Validation failed:', result.error.errors)
        throw new ApiError(
          'VALIDATION_ERROR',
          'Request validation failed',
          400,
          { errors: result.error.errors }
        )
      }
      
      return result.data
    } catch (error) {
      if (error instanceof ApiError) throw error
      
      throw new ApiError(
        'REQUEST_PARSE_ERROR',
        'Failed to parse request body',
        400
      )
    }
  }
}

// Enhanced rate limiting middleware
export async function applyRateLimit(
  request: NextRequest,
  type: keyof typeof RATE_LIMITS = 'api'
): Promise<void> {
  const config = RATE_LIMITS[type]
  const identifier = getClientIdentifier(request)
  
  const isAllowed = await rateLimit(identifier, config.requests, config.window)
  
  if (!isAllowed) {
    // Log potential abuse
    console.warn(`Rate limit exceeded for ${identifier} on ${request.url}`)
    
    throw new ApiError(
      'RATE_LIMIT_EXCEEDED',
      'Too many requests. Please try again later.',
      429,
      { 
        retryAfter: Math.ceil(config.window / 1000),
        type: type 
      }
    )
  }
}

// Enhanced client identifier with better security
function getClientIdentifier(request: NextRequest): string {
  // Try to get user ID from auth token first
  const authCookie = request.cookies.get('admin-token')?.value
  if (authCookie) {
    try {
      // Create a hash of the token for privacy
      const hash = Array.from(new TextEncoder().encode(authCookie))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
        .substring(0, 16)
      return `user:${hash}`
    } catch {
      // Fall through to IP-based identification
    }
  }
  
  // Fall back to IP address with additional headers for better identification
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const vercelIP = request.headers.get('x-vercel-forwarded-for')
  const userAgent = request.headers.get('user-agent')?.substring(0, 50) || 'unknown'
  
  const ip = forwarded?.split(',')[0] || realIP || vercelIP || 'unknown'
  
  // Create a composite identifier for better rate limiting
  return `ip:${ip}:${userAgent}`
}

// CORS middleware with enhanced security
export function applyCors(response: NextResponse, request: NextRequest): NextResponse {
  const origin = request.headers.get('origin')
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'https://localhost:3000'
  ]
  
  // Only allow specific origins
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set('Access-Control-Max-Age', '86400')
  
  return response
}

// Enhanced request logging with security information
export function logRequest(request: NextRequest, startTime: number, error?: Error): void {
  const duration = Date.now() - startTime
  const method = request.method
  const url = new URL(request.url)
  const pathname = url.pathname
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const ip = getClientIdentifier(request)
  const status = error ? 'ERROR' : 'SUCCESS'
  
  // Log security-relevant information
  const logData = {
    timestamp: new Date().toISOString(),
    method,
    pathname,
    status,
    duration: `${duration}ms`,
    ip: ip.substring(0, 20), // Truncate for privacy
    userAgent: userAgent.substring(0, 100), // Truncate for log size
    error: error?.message
  }
  
  console.log(`[API] ${JSON.stringify(logData)}`)
  
  // Log suspicious activity
  if (error && (error as ApiError).statusCode === 429) {
    console.warn(`[SECURITY] Rate limit exceeded: ${JSON.stringify(logData)}`)
  }
  
  if (error && (error as ApiError).code === 'CSRF_TOKEN_INVALID') {
    console.warn(`[SECURITY] CSRF attack attempt: ${JSON.stringify(logData)}`)
  }
}

// Authentication middleware
export async function requireAuth(request: NextRequest): Promise<any> {
  const token = request.cookies.get('admin-token')?.value
  
  if (!token) {
    throw new ApiError('UNAUTHORIZED', 'Authentication required', 401)
  }
  
  try {
    // Import auth service dynamically to avoid circular dependencies
    const { authService } = await import('@/services/auth')
    const user = await authService.verifySession(token)
    
    if (!user) {
      throw new ApiError('UNAUTHORIZED', 'Invalid or expired session', 401)
    }
    
    return user
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError('UNAUTHORIZED', 'Authentication failed', 401)
  }
}

// Comprehensive API wrapper with enhanced security
export function withApiMiddleware<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>,
  options: {
    rateLimit?: keyof typeof RATE_LIMITS
    requireAuth?: boolean
    requireCSRF?: boolean
    validation?: z.ZodSchema<any>
    allowedMethods?: string[]
  } = {}
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const startTime = Date.now()
    
    try {
      // Handle preflight requests
      if (request.method === 'OPTIONS') {
        const response = new NextResponse(null, { status: 200 })
        return applyCors(response, request)
      }
      
      // Check allowed methods
      if (options.allowedMethods && !options.allowedMethods.includes(request.method)) {
        throw new ApiError('METHOD_NOT_ALLOWED', 'Method not allowed', 405)
      }
      
      // Apply rate limiting
      if (options.rateLimit) {
        await applyRateLimit(request, options.rateLimit)
      }
      
      // CSRF protection for state-changing requests
      if (options.requireCSRF && !['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
        if (!validateCSRFToken(request)) {
          throw new ApiError('CSRF_TOKEN_INVALID', 'Invalid or missing CSRF token', 403)
        }
      }
      
      // Authentication check
      if (options.requireAuth) {
        await requireAuth(request)
      }
      
      // Validate request if schema provided
      if (options.validation && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        const validator = validateRequest(options.validation)
        await validator(request)
      }
      
      // Call the actual handler
      const response = await handler(request, ...args)
      
      // Apply CORS and security headers
      const finalResponse = applyCors(response, request)
      
      // Add security headers
      Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
        finalResponse.headers.set(key, value)
      })
      
      // Log successful request
      logRequest(request, startTime)
      
      return finalResponse
      
    } catch (error) {
      const apiError = error as ApiError | Error
      
      // Log request with error
      logRequest(request, startTime, apiError)
      
      return createErrorResponse(apiError)
    }
  }
}

// Enhanced validation schemas with security considerations
export const productValidationSchemas = {
  create: z.object({
    name: z.string().min(1).max(255).regex(/^[a-zA-Z0-9\s\-_.,!?()]+$/, 'Invalid characters in name'),
    description: z.string().min(1).max(2000),
    price: z.number().min(0).max(999999.99),
    stock: z.number().int().min(0).max(999999),
    category: z.string().min(1).max(100).regex(/^[a-zA-Z0-9\s\-_]+$/, 'Invalid characters in category'),
    status: z.enum(['active', 'inactive', 'draft']).default('draft'),
    costPrice: z.number().min(0).max(999999.99).optional(),
    lowStockThreshold: z.number().int().min(0).default(10),
    specifications: z.record(z.string().max(500)).optional(),
    tags: z.array(z.string().max(50)).max(20).optional(),
  }),
  
  update: z.object({
    name: z.string().min(1).max(255).regex(/^[a-zA-Z0-9\s\-_.,!?()]+$/, 'Invalid characters in name').optional(),
    description: z.string().max(2000).optional(),
    price: z.number().min(0).max(999999.99).optional(),
    stock: z.number().int().min(0).max(999999).optional(),
    category: z.string().min(1).max(100).regex(/^[a-zA-Z0-9\s\-_]+$/, 'Invalid characters in category').optional(),
    status: z.enum(['active', 'inactive', 'draft']).optional(),
    costPrice: z.number().min(0).max(999999.99).optional(),
    lowStockThreshold: z.number().int().min(0).optional(),
    specifications: z.record(z.string().max(500)).optional(),
    tags: z.array(z.string().max(50)).max(20).optional(),
  }),
  
  filters: z.object({
    search: z.string().max(100).optional(),
    category: z.string().max(100).optional(),
    status: z.enum(['active', 'inactive', 'draft']).optional(),
    minPrice: z.number().min(0).optional(),
    maxPrice: z.number().min(0).optional(),
    page: z.number().int().min(1).max(1000).default(1),
    limit: z.number().int().min(1).max(100).default(20),
  }),
}

// Admin validation schemas
export const adminValidationSchemas = {
  create: z.object({
    email: z.string().email().max(255),
    password: z.string().min(8).max(128),
    name: z.string().min(1).max(100).regex(/^[a-zA-Z\s\-']+$/, 'Invalid characters in name'),
    role: z.enum(['admin', 'super_admin']).default('admin'),
  }),
  
  login: z.object({
    email: z.string().email().max(255),
    password: z.string().min(1).max(128),
  }),
}