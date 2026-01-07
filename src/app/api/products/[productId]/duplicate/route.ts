import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { productService } from '@/services/product'

export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    // Verify authentication
    const user = await requireAuth()
    
    // Get the original product
    const originalProduct = await productService.getProduct(params.productId)
    
    if (!originalProduct) {
      return NextResponse.json({
        success: false,
        error: { message: 'Product not found' }
      }, { status: 404 })
    }
    
    // Create a duplicate with modified name
    const duplicateData = {
      name: `${originalProduct.name} (Copy)`,
      description: originalProduct.description,
      price: originalProduct.price,
      costPrice: originalProduct.costPrice,
      stock: 0, // Start with 0 stock for duplicates
      lowStockThreshold: originalProduct.lowStockThreshold,
      category: originalProduct.category,
      status: 'draft' as const, // Start as draft
      specifications: originalProduct.specifications,
      tags: originalProduct.tags,
      // Note: Images are not duplicated to avoid storage costs
      // Users can add images manually to the duplicate
    }
    
    const duplicatedProduct = await productService.createProduct(duplicateData)
    
    return NextResponse.json({
      success: true,
      product: duplicatedProduct,
      message: 'Product duplicated successfully'
    })
    
  } catch (error) {
    console.error('Error duplicating product:', error)
    
    if (error instanceof Error && error.message === 'No authentication token found') {
      return NextResponse.json({
        success: false,
        error: { message: 'Authentication required' }
      }, { status: 401 })
    }
    
    return NextResponse.json({
      success: false,
      error: { message: error instanceof Error ? error.message : 'Internal server error' }
    }, { status: 500 })
  }
}