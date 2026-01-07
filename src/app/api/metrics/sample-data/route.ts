import { NextResponse } from 'next/server'
import { metricsService } from '@/services/metrics'

export async function POST() {
  try {
    await metricsService.createSampleSalesData()

    return NextResponse.json({
      success: true,
      message: 'Sample sales data created successfully',
    })
  } catch (error) {
    console.error('Create sample data API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SAMPLE_DATA_ERROR',
          message: 'Failed to create sample sales data',
        },
      },
      { status: 500 }
    )
  }
}