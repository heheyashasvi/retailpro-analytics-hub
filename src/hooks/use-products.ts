'use client'

import { 
  useQuery, 
  useMutation, 
  useQueryClient, 
  useInfiniteQuery 
} from '@tanstack/react-query'
import { 
  Product, 
  ProductFilters, 
  CreateProductRequest, 
  UpdateProductRequest,
  ProductList 
} from '@/types'

// API functions
const api = {
  // Fetch products with filters
  getProducts: async (filters: ProductFilters = {}): Promise<ProductList> => {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value))
      }
    })
    
    const response = await fetch(`/api/products?${params}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    if (!response.ok) {
      throw new Error('Failed to fetch products')
    }
    
    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to fetch products')
    }
    
    return result.data
  },

  // Fetch single product
  getProduct: async (id: string): Promise<Product> => {
    const response = await fetch(`/api/products/${id}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    if (!response.ok) {
      throw new Error('Failed to fetch product')
    }
    
    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to fetch product')
    }
    
    return result.data
  },

  // Create product
  createProduct: async (data: CreateProductRequest): Promise<Product> => {
    const response = await fetch('/api/products', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      throw new Error('Failed to create product')
    }
    
    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to create product')
    }
    
    return result.data
  },

  // Update product
  updateProduct: async ({ id, data }: { id: string; data: UpdateProductRequest }): Promise<Product> => {
    const response = await fetch(`/api/products/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      throw new Error('Failed to update product')
    }
    
    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to update product')
    }
    
    return result.data
  },

  // Delete product
  deleteProduct: async (id: string): Promise<void> => {
    const response = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error('Failed to delete product')
    }
    
    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to delete product')
    }
  },

  // Search products
  searchProducts: async (query: string, filters: Partial<ProductFilters> = {}): Promise<ProductList> => {
    const params = new URLSearchParams({ q: query })
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value))
      }
    })
    
    const response = await fetch(`/api/products/search?${params}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    if (!response.ok) {
      throw new Error('Failed to search products')
    }
    
    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to search products')
    }
    
    return result.data
  },

  // Get product statistics
  getProductStats: async () => {
    const response = await fetch('/api/products/stats', {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    if (!response.ok) {
      throw new Error('Failed to fetch product statistics')
    }
    
    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to fetch product statistics')
    }
    
    return result.data
  },

  // Batch operations
  batchUpdateProducts: async (updates: Array<{ id: string; updates: UpdateProductRequest }>) => {
    const response = await fetch('/api/products/batch', {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ updates }),
    })
    
    if (!response.ok) {
      throw new Error('Failed to batch update products')
    }
    
    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to batch update products')
    }
    
    return result.data
  },

  batchDeleteProducts: async (productIds: string[]) => {
    const response = await fetch('/api/products/batch', {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productIds }),
    })
    
    if (!response.ok) {
      throw new Error('Failed to batch delete products')
    }
    
    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to batch delete products')
    }
    
    return result.data
  },
}

// Query keys for consistent cache management
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: ProductFilters) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
  search: (query: string, filters?: Partial<ProductFilters>) => [...productKeys.all, 'search', query, filters] as const,
  stats: () => [...productKeys.all, 'stats'] as const,
}

// Custom hooks
export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => api.getProducts(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes for product lists
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => api.getProduct(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes for individual products
  })
}

export function useProductSearch(query: string, filters: Partial<ProductFilters> = {}) {
  return useQuery({
    queryKey: productKeys.search(query, filters),
    queryFn: () => api.searchProducts(query, filters),
    enabled: query.length > 0,
    staleTime: 1 * 60 * 1000, // 1 minute for search results
  })
}

export function useProductStats() {
  return useQuery({
    queryKey: productKeys.stats(),
    queryFn: api.getProductStats,
    staleTime: 30 * 1000, // 30 seconds for stats (more real-time)
  })
}

// Infinite query for large product lists
export function useInfiniteProducts(filters: ProductFilters = {}) {
  return useInfiniteQuery({
    queryKey: [...productKeys.list(filters), 'infinite'],
    queryFn: ({ pageParam = 1 }) => api.getProducts({ ...filters, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1
      }
      return undefined
    },
    staleTime: 2 * 60 * 1000,
  })
}

// Mutation hooks with optimistic updates
export function useCreateProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.createProduct,
    onSuccess: (newProduct) => {
      // Invalidate and refetch product lists
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      queryClient.invalidateQueries({ queryKey: productKeys.stats() })
      
      // Add the new product to the cache
      queryClient.setQueryData(productKeys.detail(newProduct.id), newProduct)
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.updateProduct,
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: productKeys.detail(id) })
      
      // Snapshot the previous value
      const previousProduct = queryClient.getQueryData(productKeys.detail(id))
      
      // Optimistically update the cache
      if (previousProduct) {
        queryClient.setQueryData(productKeys.detail(id), {
          ...previousProduct,
          ...data,
          updatedAt: new Date(),
        })
      }
      
      return { previousProduct }
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousProduct) {
        queryClient.setQueryData(productKeys.detail(id), context.previousProduct)
      }
    },
    onSuccess: (updatedProduct) => {
      // Update the cache with the server response
      queryClient.setQueryData(productKeys.detail(updatedProduct.id), updatedProduct)
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      queryClient.invalidateQueries({ queryKey: productKeys.stats() })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.deleteProduct,
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: productKeys.detail(id) })
      
      // Snapshot the previous value
      const previousProduct = queryClient.getQueryData(productKeys.detail(id))
      
      // Optimistically remove from cache
      queryClient.removeQueries({ queryKey: productKeys.detail(id) })
      
      return { previousProduct }
    },
    onError: (err, id, context) => {
      // Rollback on error
      if (context?.previousProduct) {
        queryClient.setQueryData(productKeys.detail(id), context.previousProduct)
      }
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      queryClient.invalidateQueries({ queryKey: productKeys.stats() })
    },
  })
}

export function useBatchUpdateProducts() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.batchUpdateProducts,
    onSuccess: () => {
      // Invalidate all product-related queries after batch operations
      queryClient.invalidateQueries({ queryKey: productKeys.all })
    },
  })
}

export function useBatchDeleteProducts() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.batchDeleteProducts,
    onSuccess: () => {
      // Invalidate all product-related queries after batch operations
      queryClient.invalidateQueries({ queryKey: productKeys.all })
    },
  })
}

// Utility hook for prefetching
export function usePrefetchProduct() {
  const queryClient = useQueryClient()
  
  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: productKeys.detail(id),
      queryFn: () => api.getProduct(id),
      staleTime: 5 * 60 * 1000,
    })
  }
}