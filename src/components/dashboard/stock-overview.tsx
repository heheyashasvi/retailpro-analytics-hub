import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StockMetrics } from '@/types'
import { AlertTriangle, Package, CheckCircle } from 'lucide-react'

interface StockOverviewProps {
  data?: StockMetrics
  isLoading: boolean
}

export function StockOverview({ data, isLoading }: StockOverviewProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stock Overview</CardTitle>
          <CardDescription>Current inventory status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-200 rounded animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalStock = data?.stockByCategory.reduce((sum, category) => sum + category.totalStock, 0) || 0
  const lowStockCount = data?.lowStockProducts.length || 0
  const healthyStockCount = (data?.totalProducts || 0) - lowStockCount

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Overview</CardTitle>
        <CardDescription>Current inventory status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Total Stock */}
          <div className="flex items-center space-x-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium leading-none">Total Stock</p>
              <p className="text-sm text-muted-foreground">
                {totalStock.toLocaleString()} units across {data?.totalProducts || 0} products
              </p>
            </div>
          </div>

          {/* Healthy Stock */}
          <div className="flex items-center space-x-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium leading-none">Healthy Stock</p>
              <p className="text-sm text-muted-foreground">
                {healthyStockCount} products above threshold
              </p>
            </div>
          </div>

          {/* Low Stock Alert */}
          <div className="flex items-center space-x-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              lowStockCount > 0 ? 'bg-red-100' : 'bg-gray-100'
            }`}>
              <AlertTriangle className={`h-5 w-5 ${
                lowStockCount > 0 ? 'text-red-600' : 'text-gray-400'
              }`} />
            </div>
            <div>
              <p className="text-sm font-medium leading-none">Low Stock Alert</p>
              <p className="text-sm text-muted-foreground">
                {lowStockCount > 0 
                  ? `${lowStockCount} products need restocking`
                  : 'All products well stocked'
                }
              </p>
            </div>
          </div>

          {/* Low Stock Products List */}
          {lowStockCount > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium mb-2">Products needing attention:</p>
              <div className="space-y-1">
                {data?.lowStockProducts.slice(0, 3).map((product) => (
                  <div key={product.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground truncate">
                      {product.name}
                    </span>
                    <span className="text-red-600 font-medium">
                      {product.stock} left
                    </span>
                  </div>
                ))}
                {lowStockCount > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{lowStockCount - 3} more products
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}