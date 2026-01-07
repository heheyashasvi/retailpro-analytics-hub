import { NextResponse } from 'next/server'
import { metricsService } from '@/services/metrics'

export async function GET() {
  try {
    const stockMetrics = await metricsService.getStockMetrics()

    return NextResponse.json({
      success: true,
      data: stockMetrics,
    })
  } catch (error) {
    console.error('Stock metrics API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'STOCK_METRICS_ERROR',
          message: 'Failed to fetch stock metrics',
        },
      },
      { status: 500 }
    )
  }
}