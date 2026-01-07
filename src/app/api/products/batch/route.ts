import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { productService } from '@/services/product'
import { 
  withApiMiddleware, 
  createSuccessResponse, 
  ApiError,
  productValidationSchemas 
} from '@/lib/api-middleware'
import { z } from 'zod'

// Schema for batch operations
const batchUpdateSchema = z.object({
  updates: z.array(z.object({
    id: z.string().min(1),
    updates: productValidationSchemas.update
  })).min(1).max(100)
})

const batchDeleteSchema = z.object({
  productIds: z.array(z.string().min(1)).min(1).max(100)
})

const batchStatusUpdateSchema = z.object({
  productIds: z.array(z.string().min(1)).min(1).max(100),
  status: z.enum(['active', 'inactive', 'draft'])
})

async function handleBatchUpdate(request: NextRequest) {
  try {
    // Verify authentication
    const user = await requireAuth()
    
    const body = await request.json()
    
    // Validate batch update data
    const validationResult = batchUpdateSchema.safeParse(body)
    if (!validationResult.success) {
      throw new ApiError(
        'VALIDATION_ERROR',
        'Invalid batch update data',
        400,
        { errors: validationResult.error.errors }
      )
    }
    
    const { updates } = validationResult.data
    
    const result = await productService.batchUpdateProducts(updates)
    
    return createSuccessResponse({
      updatedProducts: result.successful,
      failedProducts: result.failed,
      successCount: result.successful.length,
      totalRequested: updates.length
    })
    
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      throw new ApiError('UNAUTHORIZED', 'Authentication required', 401)
    }
    
    if (error instanceof ApiError) {
      throw error
    }
    
    if (error instanceof Error) {
      throw new ApiError('BATCH_UPDATE_FAILED', error.message, 400)
    }
    
    throw new ApiError('INTERNAL_ERROR', 'Failed to update products', 500)
  }
}

async function handleBatchDelete(request: NextRequest) {
  try {
    // Verify authentication
    const user = await requireAuth()
    
    const body = await request.json()
    
    // Validate batch delete data
    const validationResult = batchDeleteSchema.safeParse(body)
    if (!validationResult.success) {
      throw new ApiError(
        'VALIDATION_ERROR',
        'Invalid batch delete data',
        400,
        { errors: validationResult.error.errors }
      )
    }
    
    const { productIds } = validationResult.data
    
    const results = []
    const errors = []
    
    // Delete products one by one to handle individual failures
    for (const productId of productIds) {
      try {
        await productService.deleteProduct(productId)
        results.push({ id: productId, success: true })
      } catch (error) {
        console.error(`Failed to delete product ${productId}:`, error)
        errors.push({
          id: productId,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        results.push({ id: productId, success: false })
      }
    }
    
    return createSuccessResponse({
      results,
      successCount: results.filter(r => r.success).length,
      errorCount: errors.length,
      errors: errors.length > 0 ? errors : undefined
    })
    
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      throw new ApiError('UNAUTHORIZED', 'Authentication required', 401)
    }
    
    if (error instanceof ApiError) {
      throw error
    }
    
    throw new ApiError('INTERNAL_ERROR', 'Failed to delete products', 500)
  }
}

async function handleBatchStatusUpdate(request: NextRequest) {
  try {
    // Verify authentication
    const user = await requireAuth()
    
    const body = await request.json()
    
    // Validate batch status update data
    const validationResult = batchStatusUpdateSchema.safeParse(body)
    if (!validationResult.success) {
      throw new ApiError(
        'VALIDATION_ERROR',
        'Invalid batch status update data',
        400,
        { errors: validationResult.error.errors }
      )
    }
    
    const { productIds, status } = validationResult.data
    
    // Create batch update array
    const updates = productIds.map(id => ({
      id,
      updates: { status }
    }))
    
    const result = await productService.batchUpdateProducts(updates)
    
    return createSuccessResponse({
      updatedProducts: result.successful,
      failedProducts: result.failed,
      successCount: result.successful.length,
      totalRequested: productIds.length,
      newStatus: status
    })
    
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      throw new ApiError('UNAUTHORIZED', 'Authentication required', 401)
    }
    
    if (error instanceof ApiError) {
      throw error
    }
    
    if (error instanceof Error) {
      throw new ApiError('BATCH_STATUS_UPDATE_FAILED', error.message, 400)
    }
    
    throw new ApiError('INTERNAL_ERROR', 'Failed to update product statuses', 500)
  }
}

// Route handlers
export const PATCH = withApiMiddleware(handleBatchUpdate, {
  rateLimit: 'api',
  requireAuth: true,
  validation: batchUpdateSchema,
})

export const DELETE = withApiMiddleware(handleBatchDelete, {
  rateLimit: 'api',
  requireAuth: true,
  validation: batchDeleteSchema,
})

export const PUT = withApiMiddleware(handleBatchStatusUpdate, {
  rateLimit: 'api',
  requireAuth: true,
  validation: batchStatusUpdateSchema,
})