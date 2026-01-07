export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { metricsService } from '@/services/metrics'
import { DateRange } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const { productId } = params
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let dateRange: DateRange | undefined
    if (startDate && endDate) {
      dateRange = {
        start: new Date(startDate),
        end: new Date(endDate),
      }
    }

    const productPerformance = await metricsService.getProductPerformance(productId, dateRange)

    return NextResponse.json({
      success: true,
      data: productPerformance,
    })
  } catch (error) {
    console.error('Product performance API error:', error)
    
    if (error instanceof Error && error.message === 'Product not found') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: 'Product not found',
          },
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PRODUCT_PERFORMANCE_ERROR',
          message: 'Failed to fetch product performance metrics',
        },
      },
      { status: 500 }
    )
  }
}