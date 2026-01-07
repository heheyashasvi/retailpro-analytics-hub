'use client'

import { useEffect, useState } from 'react'
import { SalesChart } from './sales-chart'
import { StockOverview } from './stock-overview'
import { TopProducts } from './top-products'
import { MetricsCards } from './metrics-cards'
import { CategoryStockChart } from './category-stock-chart'
import { AnalyticsOverview } from './analytics-overview'
import { SalesMetrics, StockMetrics, TimeSeries, ProductSalesData, CategoryStockData } from '@/types'

// Mock data for dashboard components
const generateMockSalesData = (): SalesMetrics => {
  const salesByPeriod: TimeSeries[] = []
  const today = new Date()
  
  // Generate 30 days of mock sales data
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    salesByPeriod.push({
      date: date.toISOString().split('T')[0],
      value: Math.floor(Math.random() * 5000) + 1000 // Random sales between $1000-$6000
    })
  }

  const topProducts: ProductSalesData[] = [
    { productId: '1', productName: 'Wireless Headphones', quantity: 45, totalSales: 8999 },
    { productId: '2', productName: 'Running Shoes', quantity: 32, totalSales: 4159 },
    { productId: '3', productName: 'Coffee Maker', quantity: 28, totalSales: 3499 },
    { productId: '4', productName: 'Laptop Stand', quantity: 56, totalSales: 2799 },
    { productId: '5', productName: 'Bluetooth Speaker', quantity: 23, totalSales: 2299 },
  ]

  return {
    totalSales: salesByPeriod.reduce((sum, day) => sum + day.value, 0),
    salesByPeriod,
    topProducts
  }
}

const generateMockStockData = (): StockMetrics => {
  const stockByCategory: CategoryStockData[] = [
    { category: 'Electronics', totalStock: 1250, productCount: 15 },
    { category: 'Clothing', totalStock: 890, productCount: 22 },
    { category: 'Home & Garden', totalStock: 650, productCount: 18 },
    { category: 'Sports', totalStock: 420, productCount: 12 },
    { category: 'Books', totalStock: 380, productCount: 8 },
  ]

  const lowStockProducts = [
    { 
      id: '1', 
      name: 'Wireless Mouse', 
      stock: 5, 
      category: 'Electronics', 
      price: 29.99, 
      status: 'active' as const, 
      description: 'Ergonomic wireless mouse', 
      lowStockThreshold: 10, 
      createdAt: new Date(), 
      updatedAt: new Date(),
      images: [],
      specifications: {},
      tags: []
    },
    { 
      id: '2', 
      name: 'Garden Hose', 
      stock: 3, 
      category: 'Home & Garden', 
      price: 45.99, 
      status: 'active' as const, 
      description: '50ft garden hose', 
      lowStockThreshold: 10, 
      createdAt: new Date(), 
      updatedAt: new Date(),
      images: [],
      specifications: {},
      tags: []
    },
    { 
      id: '3', 
      name: 'Running Socks', 
      stock: 8, 
      category: 'Sports', 
      price: 12.99, 
      status: 'active' as const, 
      description: 'Moisture-wicking running socks', 
      lowStockThreshold: 10, 
      createdAt: new Date(), 
      updatedAt: new Date(),
      images: [],
      specifications: {},
      tags: []
    },
  ]

  return {
    totalProducts: stockByCategory.reduce((sum, cat) => sum + cat.productCount, 0),
    stockByCategory,
    lowStockProducts
  }
}

export function DashboardContent() {
  const [mounted, setMounted] = useState(false)
  const [salesData, setSalesData] = useState<SalesMetrics | null>(null)
  const [stockData, setStockData] = useState<StockMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
    
    // Simulate API loading
    const timer = setTimeout(() => {
      setSalesData(generateMockSalesData())
      setStockData(generateMockStockData())
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <div className="col-span-4 h-80 bg-gray-200 rounded-lg animate-pulse" />
          <div className="col-span-3 h-80 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Metrics Cards */}
      <MetricsCards 
        salesMetrics={salesData || undefined} 
        stockMetrics={stockData || undefined}
        isLoading={isLoading}
      />

      {/* Advanced Analytics Overview */}
      <AnalyticsOverview isLoading={isLoading} />

      {/* Main Dashboard Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Left Column - Sales Chart and Top Products */}
        <div className="col-span-4 space-y-6">
          <SalesChart 
            data={salesData?.salesByPeriod || []}
            isLoading={isLoading}
          />
          
          <TopProducts 
            data={salesData?.topProducts || []}
            isLoading={isLoading}
          />
        </div>

        {/* Right Column - Stock Components */}
        <div className="col-span-3 space-y-6">
          <StockOverview 
            data={stockData || undefined}
            isLoading={isLoading}
          />
          
          <CategoryStockChart 
            data={stockData?.stockByCategory || []}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  )
}