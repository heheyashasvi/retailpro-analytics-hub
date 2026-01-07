export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { productService } from '@/services/product'
import { 
  withApiMiddleware, 
  createSuccessResponse, 
  ApiError 
} from '@/lib/api-middleware'

async function handleProductStats(request: NextRequest) {
  try {
    // Verify authentication
    const user = await requireAuth()
    
    const stats = await productService.getProductStats()
    
    // Add additional computed statistics
    const enhancedStats = {
      ...stats,
      stockHealth: {
        healthy: stats.totalProducts - stats.lowStockCount,
        lowStock: stats.lowStockCount,
        healthPercentage: stats.totalProducts > 0 
          ? Math.round(((stats.totalProducts - stats.lowStockCount) / stats.totalProducts) * 100)
          : 0
      },
      statusDistribution: {
        active: stats.activeProducts,
        inactive: stats.inactiveProducts,
        draft: stats.draftProducts,
        activePercentage: stats.totalProducts > 0 
          ? Math.round((stats.activeProducts / stats.totalProducts) * 100)
          : 0
      },
      valueMetrics: {
        totalValue: stats.totalValue,
        averagePrice: Math.round(stats.averagePrice * 100) / 100, // Round to 2 decimal places
        averageValuePerProduct: stats.totalProducts > 0 
          ? Math.round((stats.totalValue / stats.totalProducts) * 100) / 100
          : 0
      },
      generatedAt: new Date().toISOString()
    }
    
    return createSuccessResponse(enhancedStats)
    
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      throw new ApiError('UNAUTHORIZED', 'Authentication required', 401)
    }
    
    if (error instanceof ApiError) {
      throw error
    }
    
    throw new ApiError('INTERNAL_ERROR', 'Failed to fetch product statistics', 500)
  }
}

export const GET = withApiMiddleware(handleProductStats, {
  rateLimit: 'api',
  requireAuth: true,
})