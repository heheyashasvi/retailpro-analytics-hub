import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CategoryStockData } from '@/types'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface CategoryStockChartProps {
  data: CategoryStockData[]
  isLoading: boolean
}

export function CategoryStockChart({ data, isLoading }: CategoryStockChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stock by Category</CardTitle>
          <CardDescription>Inventory distribution across categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full bg-gray-200 rounded animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stock by Category</CardTitle>
          <CardDescription>Inventory distribution across categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-60">
            <p className="text-muted-foreground">No stock data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Transform data for the chart
  const chartData = data.map((category) => ({
    ...category,
    // Truncate long category names for display
    displayName: category.category.length > 10 
      ? category.category.substring(0, 10) + '...'
      : category.category,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock by Category</CardTitle>
        <CardDescription>Inventory distribution across categories</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="displayName" 
              tick={{ fontSize: 12 }}
              angle={0}
              textAnchor="middle"
              height={40}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              labelFormatter={(label, payload) => {
                // Find the original category name
                const item = payload?.[0]?.payload
                return item?.category || label
              }}
              formatter={(value: number, name: string) => {
                if (name === 'totalStock') {
                  return [value.toLocaleString(), 'Total Stock']
                }
                if (name === 'productCount') {
                  return [value, 'Products']
                }
                return [value, name]
              }}
            />
            <Bar 
              dataKey="totalStock" 
              fill="#3b82f6" 
              name="totalStock"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>

        {/* Category Details */}
        <div className="mt-4 space-y-2">
          {data.slice(0, 3).map((category) => (
            <div key={category.category} className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {category.category}
              </span>
              <span className="font-medium">
                {category.totalStock.toLocaleString()} units ({category.productCount} products)
              </span>
            </div>
          ))}
          {data.length > 3 && (
            <p className="text-xs text-muted-foreground text-center">
              +{data.length - 3} more categories
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}