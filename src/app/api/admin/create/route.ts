import { NextRequest, NextResponse } from 'next/server'
import { withRole } from '@/lib/auth-middleware'
import { createAdminAction } from '@/app/actions/auth'

export async function POST(request: NextRequest) {
  return withRole(request, 'super_admin', async (req, user) => {
    try {
      const formData = await request.formData()
      const result = await createAdminAction(formData)
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          admin: result.admin
        })
      } else {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        )
      }
    } catch (error) {
      console.error('Create admin API error:', error)
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}