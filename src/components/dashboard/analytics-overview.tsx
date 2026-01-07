'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Activity, Zap, Target, Users } from 'lucide-react'

interface AnalyticsOverviewProps {
  isLoading?: boolean
}

export function AnalyticsOverview({ isLoading = false }: AnalyticsOverviewProps) {
  // Mock advanced analytics data
  const analyticsData = {
    conversionRate: 3.2,
    conversionTrend: 0.8,
    customerAcquisitionCost: 45.30,
    customerLifetimeValue: 287.50,
    inventoryTurnover: 4.2,
    forecastAccuracy: 87.5,
    marketShare: 12.3,
    competitiveIndex: 78,
    riskScore: 23,
    opportunityScore: 91
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Advanced Analytics Overview</h3>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <Activity className="w-3 h-3 mr-1" />
          Live Data
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Conversion Analytics */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center">
              <Target className="w-4 h-4 mr-2 text-blue-600" />
              Conversion Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-900">
                  {formatPercentage(analyticsData.conversionRate)}
                </span>
                <div className="flex items-center text-green-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span className="text-sm">+{formatPercentage(analyticsData.conversionTrend)}</span>
                </div>
              </div>
              <Progress value={analyticsData.conversionRate * 10} className="h-2" />
              <p className="text-xs text-gray-600">Current conversion rate vs industry avg</p>
            </div>
          </CardContent>
        </Card>

        {/* Customer Intelligence */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center">
              <Users className="w-4 h-4 mr-2 text-purple-600" />
              Customer Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">CAC</span>
                <span className="font-semibold">{formatCurrency(analyticsData.customerAcquisitionCost)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">LTV</span>
                <span className="font-semibold text-green-600">{formatCurrency(analyticsData.customerLifetimeValue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">LTV:CAC Ratio</span>
                <span className="font-bold text-lg">
                  {(analyticsData.customerLifetimeValue / analyticsData.customerAcquisitionCost).toFixed(1)}:1
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Intelligence */}
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center">
              <Zap className="w-4 h-4 mr-2 text-orange-600" />
              Inventory Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-900">
                  {analyticsData.inventoryTurnover.toFixed(1)}x
                </span>
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  Optimal
                </Badge>
              </div>
              <Progress value={analyticsData.inventoryTurnover * 20} className="h-2" />
              <p className="text-xs text-gray-600">Annual inventory turnover rate</p>
            </div>
          </CardContent>
        </Card>

        {/* Forecast Accuracy */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">
              Forecast Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-900">
                  {formatPercentage(analyticsData.forecastAccuracy)}
                </span>
                <div className="flex items-center text-green-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span className="text-sm">Excellent</span>
                </div>
              </div>
              <Progress value={analyticsData.forecastAccuracy} className="h-2" />
              <p className="text-xs text-gray-600">ML model prediction accuracy</p>
            </div>
          </CardContent>
        </Card>

        {/* Market Position */}
        <Card className="border-l-4 border-l-indigo-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">
              Market Position
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Market Share</span>
                <span className="font-semibold">{formatPercentage(analyticsData.marketShare)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Competitive Index</span>
                <span className="font-semibold">{analyticsData.competitiveIndex}/100</span>
              </div>
              <Progress value={analyticsData.competitiveIndex} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Risk & Opportunity */}
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">
              Risk & Opportunity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Risk Score</span>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  Low ({analyticsData.riskScore})
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Opportunity Score</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  High ({analyticsData.opportunityScore})
                </Badge>
              </div>
              <div className="flex items-center text-green-600 text-sm">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>Growth potential identified</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}