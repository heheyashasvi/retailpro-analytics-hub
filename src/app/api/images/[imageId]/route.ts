export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { imageService } from '@/services/image'
import { verifyAuth } from '@/lib/auth-middleware'

// Delete image
export async function DELETE(
  request: NextRequest,
  { params }: { params: { imageId: string } }
) {
  try {
    // Check authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { imageId } = params

    if (!imageId) {
      return NextResponse.json(
        { success: false, error: 'Image ID is required' },
        { status: 400 }
      )
    }

    // Delete image
    await imageService.deleteImage(imageId)

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    })
  } catch (error) {
    console.error('Image deletion API error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete image',
      },
      { status: 500 }
    )
  }
}

// Get image information
export async function GET(
  request: NextRequest,
  { params }: { params: { imageId: string } }
) {
  try {
    // Check authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { imageId } = params

    if (!imageId) {
      return NextResponse.json(
        { success: false, error: 'Image ID is required' },
        { status: 400 }
      )
    }

    // Get image information
    const imageInfo = await imageService.getImageInfo(imageId)

    // Generate optimized versions
    const optimizedVersions = imageService.generateOptimizedVersions(imageId)

    return NextResponse.json({
      success: true,
      data: {
        ...imageInfo,
        optimizedVersions,
      },
    })
  } catch (error) {
    console.error('Get image info API error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get image information',
      },
      { status: 500 }
    )
  }
}