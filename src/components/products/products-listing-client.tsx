'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ProductFilters } from '@/types'
import { ProductTable } from './product-table'
import { ProductFiltersComponent } from './product-filters'
import { ProductPagination } from './product-pagination'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useProducts, useDeleteProduct } from '@/hooks/use-products'

interface ProductsListingClientProps {
  categories: string[]
}

export function ProductsListingClient({ categories }: ProductsListingClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Parse filters from URL
  const [filters, setFilters] = useState<ProductFilters>(() => ({
    search: searchParams.get('search') || undefined,
    category: searchParams.get('category') || undefined,
    status: (searchParams.get('status') as 'active' | 'inactive' | 'draft') || undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
    limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20,
  }))

  // Fetch products using React Query
  const { data: products, isLoading, error } = useProducts(filters)
  
  // Delete mutation
  const deleteProductMutation = useDeleteProduct()

  // Update filters when URL changes
  useEffect(() => {
    const newFilters: ProductFilters = {
      search: searchParams.get('search') || undefined,
      category: searchParams.get('category') || undefined,
      status: (searchParams.get('status') as 'active' | 'inactive' | 'draft') || undefined,
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20,
    }
    setFilters(newFilters)
  }, [searchParams])

  const updateURL = useCallback((newFilters: ProductFilters) => {
    const params = new URLSearchParams()
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value))
      }
    })
    
    const newURL = `/dashboard/products?${params.toString()}`
    router.push(newURL)
  }, [router])

  const handleFiltersChange = useCallback((newFilters: ProductFilters) => {
    const updatedFilters = { ...newFilters, page: 1 } // Reset to first page
    setFilters(updatedFilters)
    updateURL(updatedFilters)
  }, [updateURL])

  const handlePageChange = useCallback((page: number) => {
    const newFilters = { ...filters, page }
    setFilters(newFilters)
    updateURL(newFilters)
  }, [filters, updateURL])

  const handleItemsPerPageChange = useCallback((limit: number) => {
    const newFilters = { ...filters, limit, page: 1 }
    setFilters(newFilters)
    updateURL(newFilters)
  }, [filters, updateURL])

  const handleDeleteProduct = useCallback(async (productId: string) => {
    try {
      await deleteProductMutation.mutateAsync(productId)
      // React Query will automatically update the cache and refetch
    } catch (error) {
      console.error('Error deleting product:', error)
      // You could add a toast notification here
    }
  }, [deleteProductMutation])

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-muted-foreground">Loading products...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <h3 className="text-lg font-semibold mb-2">Error loading products</h3>
            <p className="text-muted-foreground text-center mb-6">
              {error.message || 'Something went wrong'}
            </p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show empty state if no products
  if (!products || (products.products.length === 0 && !filters.search && !filters.category && !filters.status)) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Package className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No products yet</h3>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            Get started by creating your first product. You can add images, set pricing, 
            manage inventory, and more.
          </p>
          <Link href="/dashboard/products/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Product
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <ProductFiltersComponent
        onFiltersChange={handleFiltersChange}
        categories={categories}
        initialFilters={filters}
      />

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Products ({products.total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {products.products.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search criteria or filters.
              </p>
              <Link href="/dashboard/products/create">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <ProductTable
                products={products.products}
                onDelete={handleDeleteProduct}
                isDeleting={deleteProductMutation.isPending}
              />
              
              {/* Pagination */}
              <div className="mt-6">
                <ProductPagination
                  currentPage={products.page}
                  totalPages={products.totalPages}
                  totalItems={products.total}
                  itemsPerPage={filters.limit || 20}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}