import { NextRequest, NextResponse } from 'next/server'
import { imageService } from '@/services/image'
import { verifyAuth } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const filename = formData.get('filename') as string

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!filename) {
      return NextResponse.json(
        { success: false, error: 'Filename is required' },
        { status: 400 }
      )
    }

    // Upload image
    const result = await imageService.uploadImage(file, {
      filename,
      size: file.size,
      mimeType: file.type,
    })

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Image upload API error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload image',
      },
      { status: 500 }
    )
  }
}

// Get upload signature for client-side uploads
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

    const { searchParams } = new URL(request.url)
    const folder = searchParams.get('folder') || 'ecommerce-products'

    // Generate upload signature
    const signature = imageService.generateUploadSignature({
      folder,
      resource_type: 'image',
      format: 'auto',
      quality: 'auto:good',
    })

    return NextResponse.json({
      success: true,
      data: signature,
    })
  } catch (error) {
    console.error('Get upload signature API error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate upload signature',
      },
      { status: 500 }
    )
  }
}