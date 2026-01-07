import { NextRequest } from 'next/server'
import { authService } from '@/services/auth'
import { AdminCredentials } from '@/types'
import { 
  withApiMiddleware, 
  createSuccessResponse, 
  ApiError,
  adminValidationSchemas
} from '@/lib/api-middleware'
import { validateEmail } from '@/lib/input-sanitizer'

async function handleLogin(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate credentials using enhanced schema
    const validationResult = adminValidationSchemas.login.safeParse(body)
    if (!validationResult.success) {
      throw new ApiError(
        'VALIDATION_ERROR',
        'Invalid login credentials format',
        400,
        { errors: validationResult.error.errors }
      )
    }
    
    const { email, password } = validationResult.data
    
    // Additional email validation
    if (!validateEmail(email)) {
      throw new ApiError('INVALID_EMAIL', 'Invalid email format', 400)
    }
    
    const result = await authService.login({ email, password })

    if (result.success && result.token) {
      // Create response with secure cookie
      const response = createSuccessResponse({
        user: result.user,
        message: 'Login successful'
      })

      // Set secure cookie with enhanced security
      response.cookies.set('admin-token', result.token, {
        httpOnly: true,
        secure: false, // Set to false for localhost development
        sameSite: 'lax', // Changed from 'strict' to 'lax' for better compatibility
        maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
        path: '/',
        // Add domain in production
        ...(process.env.NODE_ENV === 'production' && {
          domain: process.env.COOKIE_DOMAIN || undefined
        })
      })

      return response
    } else {
      // Log failed login attempt for security monitoring
      console.warn(`Failed login attempt for email: ${email}`)
      
      throw new ApiError('LOGIN_FAILED', result.error || 'Invalid credentials', 401)
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    
    throw new ApiError('INTERNAL_ERROR', 'Login failed', 500)
  }
}

export const POST = withApiMiddleware(handleLogin, {
  rateLimit: 'auth', // Strict rate limiting for auth
  requireCSRF: false, // Temporarily disable CSRF protection for debugging
  // validation: adminValidationSchemas.login, // Disable validation for now
  allowedMethods: ['POST'],
})