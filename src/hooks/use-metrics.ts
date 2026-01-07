'use client'

import { useQuery } from '@tanstack/react-query'
import { SalesMetrics, StockMetrics } from '@/types'

// API functions for metrics
const metricsApi = {
  getSalesMetrics: async (dateRange?: { start: string; end: string }): Promise<SalesMetrics> => {
    const params = new URLSearchParams()
    if (dateRange) {
      params.append('start', dateRange.start)
      params.append('end', dateRange.end)
    }
    
    const response = await fetch(`/api/metrics/sales?${params}`)
    if (!response.ok) {
      throw new Error('Failed to fetch sales metrics')
    }
    
    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to fetch sales metrics')
    }
    
    return result.data
  },

  getStockMetrics: async (): Promise<StockMetrics> => {
    const response = await fetch('/api/metrics/stock')
    if (!response.ok) {
      throw new Error('Failed to fetch stock metrics')
    }
    
    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to fetch stock metrics')
    }
    
    return result.data
  },

  getProductMetrics: async (productId: string) => {
    const response = await fetch(`/api/metrics/product/${productId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch product metrics')
    }
    
    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to fetch product metrics')
    }
    
    return result.data
  },

  generateSampleData: async () => {
    const response = await fetch('/api/metrics/sample-data', {
      method: 'POST',
    })
    
    if (!response.ok) {
      throw new Error('Failed to generate sample data')
    }
    
    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to generate sample data')
    }
    
    return result.data
  },
}

// Query keys for metrics
export const metricsKeys = {
  all: ['metrics'] as const,
  sales: (dateRange?: { start: string; end: string }) => [...metricsKeys.all, 'sales', dateRange] as const,
  stock: () => [...metricsKeys.all, 'stock'] as const,
  product: (productId: string) => [...metricsKeys.all, 'product', productId] as const,
}

// Custom hooks for metrics
export function useSalesMetrics(dateRange?: { start: string; end: string }) {
  return useQuery({
    queryKey: metricsKeys.sales(dateRange),
    queryFn: () => metricsApi.getSalesMetrics(dateRange),
    staleTime: 30 * 1000, // 30 seconds - metrics should be relatively fresh
    refetchInterval: 60 * 1000, // Refetch every minute for real-time dashboard
  })
}

export function useStockMetrics() {
  return useQuery({
    queryKey: metricsKeys.stock(),
    queryFn: metricsApi.getStockMetrics,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  })
}

export function useProductMetrics(productId: string) {
  return useQuery({
    queryKey: metricsKeys.product(productId),
    queryFn: () => metricsApi.getProductMetrics(productId),
    enabled: !!productId,
    staleTime: 2 * 60 * 1000, // 2 minutes for individual product metrics
  })
}

// Combined dashboard metrics hook
export function useDashboardMetrics(dateRange?: { start: string; end: string }) {
  const salesMetrics = useSalesMetrics(dateRange)
  const stockMetrics = useStockMetrics()
  
  return {
    sales: salesMetrics,
    stock: stockMetrics,
    isLoading: salesMetrics.isLoading || stockMetrics.isLoading,
    isError: salesMetrics.isError || stockMetrics.isError,
    error: salesMetrics.error || stockMetrics.error,
  }
}