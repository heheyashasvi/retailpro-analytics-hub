import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/services/auth'

export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: any) => Promise<NextResponse>
) {
  try {
    // Get token from Authorization header or cookies
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('admin-token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify session
    const user = await authService.verifySession(token)
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Call the handler with authenticated user
    return await handler(request, user)
    
  } catch (error) {
    console.error('Auth middleware error:', error)
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 401 }
    )
  }
}

export async function withRole(
  request: NextRequest,
  requiredRole: 'admin' | 'super_admin',
  handler: (request: NextRequest, user: any) => Promise<NextResponse>
) {
  return withAuth(request, async (req, user) => {
    // Check if user has required role
    if (requiredRole === 'super_admin' && user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    if (requiredRole === 'admin' && !['admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    return await handler(req, user)
  })
}

// Helper function to check authentication in server components
export async function requireAuth() {
  const user = await authService.getCurrentSession()
  
  if (!user) {
    throw new Error('Authentication required')
  }
  
  return user
}

// Helper function to check role in server components
export async function requireRole(requiredRole: 'admin' | 'super_admin') {
  const user = await requireAuth()
  
  if (requiredRole === 'super_admin' && user.role !== 'super_admin') {
    throw new Error('Super admin access required')
  }
  
  if (requiredRole === 'admin' && !['admin', 'super_admin'].includes(user.role)) {
    throw new Error('Admin access required')
  }
  
  return user
}

// Legacy function name for backward compatibility
export const authMiddleware = withAuth

// Simple auth verification function
export async function verifyAuth(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('admin-token')?.value

    if (!token) {
      return { success: false, error: 'Authentication required' }
    }

    const user = await authService.verifySession(token)
    
    if (!user) {
      return { success: false, error: 'Invalid or expired token' }
    }

    return { success: true, user }
  } catch (error) {
    console.error('Auth verification error:', error)
    return { success: false, error: 'Authentication failed' }
  }
}