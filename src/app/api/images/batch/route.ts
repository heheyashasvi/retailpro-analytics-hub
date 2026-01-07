import { NextRequest, NextResponse } from 'next/server'
import { imageService } from '@/services/image'
import { verifyAuth } from '@/lib/auth-middleware'
import { z } from 'zod'

const batchDeleteSchema = z.object({
  imageIds: z.array(z.string()).min(1, 'At least one image ID is required').max(50, 'Cannot delete more than 50 images at once'),
})

// Batch delete images
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const validation = batchDeleteSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
        },
        { status: 400 }
      )
    }

    const { imageIds } = validation.data

    // Batch delete images
    const result = await imageService.deleteImages(imageIds)

    return NextResponse.json({
      success: true,
      data: {
        deleted: result.deleted,
        failed: result.failed,
        summary: {
          total: imageIds.length,
          deleted: result.deleted.length,
          failed: result.failed.length,
        },
      },
    })
  } catch (error) {
    console.error('Batch delete images API error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete images',
      },
      { status: 500 }
    )
  }
}

// Get upload statistics
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get upload statistics
    const stats = await imageService.getUploadStats()

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error('Get upload stats API error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get upload statistics',
      },
      { status: 500 }
    )
  }
}