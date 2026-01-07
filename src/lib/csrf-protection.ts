import { NextRequest } from 'next/server'
import { ApiError } from './api-middleware'

// CSRF token validation
export function validateCSRFToken(request: NextRequest): boolean {
  // Skip CSRF validation for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return true
  }
  
  const tokenFromHeader = request.headers.get('X-CSRF-Token')
  const tokenFromCookie = request.cookies.get('csrf-token')?.value
  
  if (!tokenFromHeader || !tokenFromCookie) {
    return false
  }
  
  return tokenFromHeader === tokenFromCookie
}

// Generate a secure CSRF token
export function generateCSRFToken(): string {
  const timestamp = Date.now().toString(36)
  const randomBytes = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  
  return `${timestamp}.${randomBytes}`
}

// Validate CSRF token format and age
export function isValidCSRFToken(token: string): boolean {
  try {
    const [timestamp, randomPart] = token.split('.')
    
    if (!timestamp || !randomPart) {
      return false
    }
    
    // Check if token is not older than 1 hour
    const tokenTime = parseInt(timestamp, 36)
    const now = Date.now()
    const maxAge = 60 * 60 * 1000 // 1 hour
    
    return (now - tokenTime) <= maxAge
  } catch {
    return false
  }
}

// Middleware function to check CSRF protection
export function withCSRFProtection<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    // Validate CSRF token for state-changing requests
    if (!validateCSRFToken(request)) {
      throw new ApiError(
        'CSRF_TOKEN_INVALID',
        'Invalid or missing CSRF token',
        403
      )
    }
    
    return handler(request, ...args)
  }
}

// Hook for React components to get CSRF token
export function getCSRFToken(): string | null {
  if (typeof window === 'undefined') return null
  
  // Try to get from meta tag first
  const metaTag = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement
  if (metaTag) {
    return metaTag.content
  }
  
  // Try to get from cookie
  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === 'csrf-token') {
      return decodeURIComponent(value)
    }
  }
  
  return null
}