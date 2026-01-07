import { NextRequest, NextResponse } from 'next/server'
import { productService } from '@/services/product'
import { verifyAuth } from '@/lib/auth-middleware'
import { z } from 'zod'

const updateImageSchema = z.object({
  altText: z.string().optional(),
  isPrimary: z.boolean().optional(),
})

// Update product image
export async function PATCH(
  request: NextRequest,
  { params }: { params: { productId: string; imageId: string } }
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

    const { productId, imageId } = params

    if (!productId || !imageId) {
      return NextResponse.json(
        { success: false, error: 'Product ID and Image ID are required' },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    const validation = updateImageSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
        },
        { status: 400 }
      )
    }

    const updates = validation.data

    // Update product image
    await productService.updateProductImage(productId, imageId, updates)

    return NextResponse.json({
      success: true,
      message: 'Image updated successfully',
    })
  } catch (error) {
    console.error('Update product image API error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update product image',
      },
      { status: 500 }
    )
  }
}

// Delete product image
export async function DELETE(
  request: NextRequest,
  { params }: { params: { productId: string; imageId: string } }
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

    const { productId, imageId } = params

    if (!productId || !imageId) {
      return NextResponse.json(
        { success: false, error: 'Product ID and Image ID are required' },
        { status: 400 }
      )
    }

    // Remove product image
    await productService.removeProductImage(productId, imageId)

    return NextResponse.json({
      success: true,
      message: 'Image removed successfully',
    })
  } catch (error) {
    console.error('Remove product image API error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove product image',
      },
      { status: 500 }
    )
  }
}