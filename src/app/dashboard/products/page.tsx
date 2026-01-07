import { Suspense } from 'react'
import Link from 'next/link'
import { productService } from '@/services/product'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Package, TrendingUp, AlertTriangle } from 'lucide-react'
import { ProductsListingClient } from '@/components/products/products-listing-client'

export default async function ProductsPage() {
  let productStats
  let categories: string[] = []

  try {
    // Fetch data server-side
    productStats = await productService.getProductStats()
    
    // Get unique categories for filters
    const productList = await productService.listProducts({ limit: 1000 })
    categories = [...new Set(productList.products.map(p => p.category))].filter(Boolean)
  } catch (error) {
    console.error('Error fetching product data:', error)
    // Provide fallback data
    productStats = {
      totalProducts: 0,
      activeProducts: 0,
      draftProducts: 0,
      totalValue: 0,
      averagePrice: 0,
      lowStockCount: 0
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your product catalog
          </p>
        </div>
        <Link href="/dashboard/products/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productStats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              {productStats.activeProducts} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${productStats.totalValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg: ${productStats.averagePrice.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productStats.activeProducts}</div>
            <p className="text-xs text-muted-foreground">
              {productStats.draftProducts} drafts
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productStats.lowStockCount}</div>
            <p className="text-xs text-muted-foreground">
              Need restocking
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Products Listing with Filters and Table */}
      <Suspense fallback={
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-muted-foreground">Loading products...</div>
          </CardContent>
        </Card>
      }>
        <ProductsListingClient categories={categories} />
      </Suspense>
    </div>
  )
}