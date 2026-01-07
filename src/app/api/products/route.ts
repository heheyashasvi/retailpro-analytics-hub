export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { productService } from '@/services/product'
import { ProductFilters } from '@/types'
import { 
  withApiMiddleware, 
  createSuccessResponse, 
  createErrorResponse, 
  ApiError,
  productValidationSchemas 
} from '@/lib/api-middleware'
import { z } from 'zod'

async function handleGetProducts(request: NextRequest) {
  try {
    // Verify authentication
    const user = await requireAuth()
    
    const { searchParams } = new URL(request.url)
    
    // Parse and validate query parameters
    const rawFilters = {
      search: searchParams.get('search') || undefined,
      category: searchParams.get('category') || undefined,
      status: searchParams.get('status') || undefined,
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20,
    }
    
    // Validate filters
    const validationResult = productValidationSchemas.filters.safeParse(rawFilters)
    if (!validationResult.success) {
      throw new ApiError(
        'INVALID_FILTERS',
        'Invalid filter parameters',
        400,
        { errors: validationResult.error.errors }
      )
    }
    
    const filters = validationResult.data
    
    const productList = await productService.listProducts(filters)
    
    return createSuccessResponse(productList)
    
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      throw new ApiError('UNAUTHORIZED', 'Authentication required', 401)
    }
    
    if (error instanceof ApiError) {
      throw error
    }
    
    throw new ApiError('INTERNAL_ERROR', 'Failed to fetch products', 500)
  }
}

async function handleCreateProduct(request: NextRequest) {
  try {
    // Verify authentication
    const user = await requireAuth()
    
    const body = await request.json()
    
    // Validate product data
    const validationResult = productValidationSchemas.create.safeParse(body)
    if (!validationResult.success) {
      throw new ApiError(
        'VALIDATION_ERROR',
        'Invalid product data',
        400,
        { errors: validationResult.error.errors }
      )
    }
    
    const productData = validationResult.data
    
    const product = await productService.createProduct(productData)
    
    return createSuccessResponse(product, 201)
    
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      throw new ApiError('UNAUTHORIZED', 'Authentication required', 401)
    }
    
    if (error instanceof ApiError) {
      throw error
    }
    
    if (error instanceof Error) {
      throw new ApiError('PRODUCT_CREATION_FAILED', error.message, 400)
    }
    
    throw new ApiError('INTERNAL_ERROR', 'Failed to create product', 500)
  }
}

export const GET = withApiMiddleware(handleGetProducts, {
  rateLimit: 'api',
  requireAuth: true,
})

export const POST = withApiMiddleware(handleCreateProduct, {
  rateLimit: 'api',
  requireAuth: true,
  validation: productValidationSchemas.create,
})