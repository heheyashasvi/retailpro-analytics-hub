import { NextRequest, NextResponse } from 'next/server'
import { metricsService } from '@/services/metrics'
import { DateRange } from '@/types'

export async function GET(request: NextRequest) {
  try {
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

    const salesMetrics = await metricsService.getSalesMetrics(dateRange)

    return NextResponse.json({
      success: true,
      data: salesMetrics,
    })
  } catch (error) {
    console.error('Sales metrics API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SALES_METRICS_ERROR',
          message: 'Failed to fetch sales metrics',
        },
      },
      { status: 500 }
    )
  }
}