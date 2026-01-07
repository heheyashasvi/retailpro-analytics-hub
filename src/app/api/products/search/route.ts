import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { productService } from '@/services/product'
import { 
  withApiMiddleware, 
  createSuccessResponse, 
  ApiError 
} from '@/lib/api-middleware'
import { z } from 'zod'

// Schema for search parameters
const searchSchema = z.object({
  q: z.string().min(1).max(255),
  limit: z.number().int().min(1).max(100).default(20),
  category: z.string().optional(),
  status: z.enum(['active', 'inactive', 'draft']).optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
})

async function handleProductSearch(request: NextRequest) {
  try {
    // Verify authentication
    const user = await requireAuth()
    
    const { searchParams } = new URL(request.url)
    
    // Parse search parameters
    const rawParams = {
      q: searchParams.get('q'),
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20,
      category: searchParams.get('category') || undefined,
      status: searchParams.get('status') || undefined,
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    }
    
    // Validate search parameters
    const validationResult = searchSchema.safeParse(rawParams)
    if (!validationResult.success) {
      throw new ApiError(
        'VALIDATION_ERROR',
        'Invalid search parameters',
        400,
        { errors: validationResult.error.errors }
      )
    }
    
    const { q, limit, category, status, minPrice, maxPrice } = validationResult.data
    
    // Build search filters
    const filters = {
      search: q,
      limit,
      category,
      status,
      minPrice,
      maxPrice,
    }
    
    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof typeof filters] === undefined) {
        delete filters[key as keyof typeof filters]
      }
    })
    
    const searchResults = await productService.listProducts(filters)
    
    // Add search metadata
    const response = {
      ...searchResults,
      searchQuery: q,
      searchFilters: {
        category,
        status,
        minPrice,
        maxPrice,
      },
      searchTime: new Date().toISOString(),
    }
    
    return createSuccessResponse(response)
    
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      throw new ApiError('UNAUTHORIZED', 'Authentication required', 401)
    }
    
    if (error instanceof ApiError) {
      throw error
    }
    
    throw new ApiError('INTERNAL_ERROR', 'Search failed', 500)
  }
}

export const GET = withApiMiddleware(handleProductSearch, {
  rateLimit: 'api',
  requireAuth: true,
})