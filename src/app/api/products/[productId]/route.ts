import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { productService } from '@/services/product'
import { 
  withApiMiddleware, 
  createSuccessResponse, 
  createErrorResponse, 
  ApiError,
  productValidationSchemas 
} from '@/lib/api-middleware'

async function handleGetProduct(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    // Verify authentication
    const user = await requireAuth()
    
    if (!params.productId) {
      throw new ApiError('INVALID_PRODUCT_ID', 'Product ID is required', 400)
    }
    
    const product = await productService.getProduct(params.productId)
    
    if (!product) {
      throw new ApiError('PRODUCT_NOT_FOUND', 'Product not found', 404)
    }
    
    return createSuccessResponse(product)
    
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      throw new ApiError('UNAUTHORIZED', 'Authentication required', 401)
    }
    
    if (error instanceof ApiError) {
      throw error
    }
    
    throw new ApiError('INTERNAL_ERROR', 'Failed to fetch product', 500)
  }
}

async function handleUpdateProduct(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    // Verify authentication
    const user = await requireAuth()
    
    if (!params.productId) {
      throw new ApiError('INVALID_PRODUCT_ID', 'Product ID is required', 400)
    }
    
    const body = await request.json()
    
    // Validate update data
    const validationResult = productValidationSchemas.update.safeParse(body)
    if (!validationResult.success) {
      throw new ApiError(
        'VALIDATION_ERROR',
        'Invalid product update data',
        400,
        { errors: validationResult.error.errors }
      )
    }
    
    const updateData = validationResult.data
    
    const updatedProduct = await productService.updateProduct(params.productId, updateData)
    
    return createSuccessResponse(updatedProduct)
    
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      throw new ApiError('UNAUTHORIZED', 'Authentication required', 401)
    }
    
    if (error instanceof Error && error.message === 'Product not found') {
      throw new ApiError('PRODUCT_NOT_FOUND', 'Product not found', 404)
    }
    
    if (error instanceof ApiError) {
      throw error
    }
    
    if (error instanceof Error) {
      throw new ApiError('PRODUCT_UPDATE_FAILED', error.message, 400)
    }
    
    throw new ApiError('INTERNAL_ERROR', 'Failed to update product', 500)
  }
}

async function handleDeleteProduct(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    // Verify authentication
    const user = await requireAuth()
    
    if (!params.productId) {
      throw new ApiError('INVALID_PRODUCT_ID', 'Product ID is required', 400)
    }
    
    await productService.deleteProduct(params.productId)
    
    return createSuccessResponse({ message: 'Product deleted successfully' })
    
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      throw new ApiError('UNAUTHORIZED', 'Authentication required', 401)
    }
    
    if (error instanceof Error && error.message === 'Product not found') {
      throw new ApiError('PRODUCT_NOT_FOUND', 'Product not found', 404)
    }
    
    if (error instanceof ApiError) {
      throw error
    }
    
    if (error instanceof Error) {
      throw new ApiError('PRODUCT_DELETION_FAILED', error.message, 400)
    }
    
    throw new ApiError('INTERNAL_ERROR', 'Failed to delete product', 500)
  }
}

export const GET = withApiMiddleware(handleGetProduct, {
  rateLimit: 'api',
  requireAuth: true,
})

export const PATCH = withApiMiddleware(handleUpdateProduct, {
  rateLimit: 'api',
  requireAuth: true,
  validation: productValidationSchemas.update,
})

export const PUT = withApiMiddleware(handleUpdateProduct, {
  rateLimit: 'api',
  requireAuth: true,
  validation: productValidationSchemas.update,
})

export const DELETE = withApiMiddleware(handleDeleteProduct, {
  rateLimit: 'api',
  requireAuth: true,
})