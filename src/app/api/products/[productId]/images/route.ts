import { NextRequest, NextResponse } from 'next/server'
import { productService } from '@/services/product'
import { verifyAuth } from '@/lib/auth-middleware'

// Add image to product
export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string } }
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

    const { productId } = params

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const altText = formData.get('altText') as string
    const isPrimary = formData.get('isPrimary') === 'true'

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Add image to product
    const result = await productService.addProductImage(productId, file, altText, isPrimary)

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Add product image API error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add image to product',
      },
      { status: 500 }
    )
  }
}

// Get product images
export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
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

    const { productId } = params

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Get product images
    const images = await productService.getProductImages(productId)

    return NextResponse.json({
      success: true,
      data: images,
    })
  } catch (error) {
    console.error('Get product images API error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get product images',
      },
      { status: 500 }
    )
  }
}