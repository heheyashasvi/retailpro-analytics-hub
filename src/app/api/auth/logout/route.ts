export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { redirect } from 'next/navigation'

export async function POST(request: NextRequest) {
  try {
    // Clear the admin token cookie
    const response = NextResponse.redirect(new URL('/', request.url))
    
    response.cookies.set('admin-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Logout API error:', error)
    // Even on error, redirect to main page
    return NextResponse.redirect(new URL('/', request.url))
  }
}