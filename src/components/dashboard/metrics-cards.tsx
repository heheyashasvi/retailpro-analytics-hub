import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SalesMetrics, StockMetrics } from '@/types'
import { DollarSign, Package, AlertTriangle, TrendingUp, BarChart3, Users, ShoppingCart, Target } from 'lucide-react'

interface MetricsCardsProps {
  salesMetrics?: SalesMetrics
  stockMetrics?: StockMetrics
  isLoading: boolean
}

export function MetricsCards({ salesMetrics, stockMetrics, isLoading }: MetricsCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const calculateSalesGrowth = () => {
    if (!salesMetrics?.salesByPeriod || salesMetrics.salesByPeriod.length < 2) {
      return 0
    }
    
    const recent = salesMetrics.salesByPeriod.slice(-7) // Last 7 days
    const previous = salesMetrics.salesByPeriod.slice(-14, -7) // Previous 7 days
    
    const recentTotal = recent.reduce((sum, day) => sum + day.value, 0)
    const previousTotal = previous.reduce((sum, day) => sum + day.value, 0)
    
    if (previousTotal === 0) return 0
    return ((recentTotal - previousTotal) / previousTotal) * 100
  }

  const salesGrowth = calculateSalesGrowth()

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {/* Revenue Analytics */}
      <Card className="border-l-4 border-l-green-500 hover:shadow-xl transition-all duration-300 hover:scale-105 animate-pulse-glow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">Revenue Analytics</CardTitle>
          <BarChart3 className="h-5 w-5 text-green-600 animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {isLoading ? (
              <div className="h-8 w-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse" />
            ) : (
              formatCurrency(salesMetrics?.totalSales || 0)
            )}
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {isLoading ? (
              <div className="h-4 w-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse" />
            ) : (
              <span className={salesGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                {salesGrowth >= 0 ? '↗' : '↘'} {Math.abs(salesGrowth).toFixed(1)}% vs last period
              </span>
            )}
          </p>
        </CardContent>
      </Card>

      {/* Inventory Intelligence */}
      <Card className="border-l-4 border-l-blue-500 hover:shadow-xl transition-all duration-300 hover:scale-105 animate-pulse-glow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">Inventory Intelligence</CardTitle>
          <Package className="h-5 w-5 text-blue-600 animate-bounce" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {isLoading ? (
              <div className="h-8 w-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse" />
            ) : (
              stockMetrics?.totalProducts || 0
            )}
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Active SKUs in catalog
          </p>
        </CardContent>
      </Card>

      {/* Risk Management */}
      <Card className="border-l-4 border-l-orange-500 hover:shadow-xl transition-all duration-300 hover:scale-105 animate-pulse-glow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">Risk Management</CardTitle>
          <AlertTriangle className="h-5 w-5 text-orange-600 animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {isLoading ? (
              <div className="h-8 w-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse" />
            ) : (
              <span className={stockMetrics?.lowStockProducts.length ? 'text-orange-600' : 'text-green-600'}>
                {stockMetrics?.lowStockProducts.length || 0}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Items requiring attention
          </p>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card className="border-l-4 border-l-purple-500 hover:shadow-xl transition-all duration-300 hover:scale-105 animate-pulse-glow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">Performance Insights</CardTitle>
          <Target className="h-5 w-5 text-purple-600 animate-spin-slow" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {isLoading ? (
              <div className="h-8 w-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse" />
            ) : (
              formatCurrency(salesMetrics?.topProducts[0]?.totalSales || 0)
            )}
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {isLoading ? (
              <div className="h-4 w-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse" />
            ) : (
              salesMetrics?.topProducts[0]?.productName || 'Top performer'
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}