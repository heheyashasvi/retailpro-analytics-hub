import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProductSalesData } from '@/types'
import { TrendingUp } from 'lucide-react'

interface TopProductsProps {
  data: ProductSalesData[]
  isLoading: boolean
}

export function TopProducts({ data, isLoading }: TopProductsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Products</CardTitle>
          <CardDescription>Best performing products by sales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Products</CardTitle>
          <CardDescription>Best performing products by sales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">No sales data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Products</CardTitle>
        <CardDescription>Best performing products by sales</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.slice(0, 5).map((product, index) => (
            <div key={product.productId} className="flex items-center space-x-4">
              {/* Rank */}
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                <span className="text-sm font-medium text-blue-600">
                  {index + 1}
                </span>
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-none truncate">
                  {product.productName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {product.quantity} units sold
                </p>
              </div>

              {/* Sales Amount */}
              <div className="text-right">
                <p className="text-sm font-medium">
                  {formatCurrency(product.totalSales)}
                </p>
                <div className="flex items-center text-xs text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Top {index + 1}
                </div>
              </div>
            </div>
          ))}

          {/* Summary */}
          {data.length > 5 && (
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground text-center">
                Showing top 5 of {data.length} products
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}