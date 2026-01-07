'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect } from 'react'

// Cache management utilities
export function useCacheManagement() {
  const queryClient = useQueryClient()

  // Invalidate all product-related data
  const invalidateProducts = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['products'] })
  }, [queryClient])

  // Invalidate all metrics data
  const invalidateMetrics = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['metrics'] })
  }, [queryClient])

  // Invalidate authentication data
  const invalidateAuth = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['auth'] })
  }, [queryClient])

  // Clear all cache
  const clearAllCache = useCallback(() => {
    queryClient.clear()
  }, [queryClient])

  // Prefetch critical data
  const prefetchCriticalData = useCallback(() => {
    // Prefetch current user
    queryClient.prefetchQuery({
      queryKey: ['auth', 'user'],
      staleTime: 5 * 60 * 1000,
    })

    // Prefetch dashboard metrics
    queryClient.prefetchQuery({
      queryKey: ['metrics', 'sales'],
      staleTime: 30 * 1000,
    })

    queryClient.prefetchQuery({
      queryKey: ['metrics', 'stock'],
      staleTime: 30 * 1000,
    })

    // Prefetch recent products
    queryClient.prefetchQuery({
      queryKey: ['products', 'list', { page: 1, limit: 10 }],
      staleTime: 2 * 60 * 1000,
    })
  }, [queryClient])

  // Background sync for real-time updates
  const enableBackgroundSync = useCallback(() => {
    const interval = setInterval(() => {
      // Only sync if the tab is visible
      if (!document.hidden) {
        // Refetch metrics for real-time dashboard
        queryClient.invalidateQueries({ 
          queryKey: ['metrics'],
          refetchType: 'active' // Only refetch active queries
        })
        
        // Refetch product stats
        queryClient.invalidateQueries({ 
          queryKey: ['products', 'stats'],
          refetchType: 'active'
        })
      }
    }, 30 * 1000) // Every 30 seconds

    return () => clearInterval(interval)
  }, [queryClient])

  // Handle network status changes
  const handleNetworkChange = useCallback(() => {
    const handleOnline = () => {
      // Refetch all active queries when coming back online
      queryClient.refetchQueries({ type: 'active' })
    }

    const handleOffline = () => {
      // Optionally handle offline state
      console.log('Application is offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [queryClient])

  // Handle visibility changes for performance
  const handleVisibilityChange = useCallback(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Refetch stale queries when tab becomes visible
        queryClient.refetchQueries({ 
          type: 'active',
          stale: true 
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [queryClient])

  return {
    invalidateProducts,
    invalidateMetrics,
    invalidateAuth,
    clearAllCache,
    prefetchCriticalData,
    enableBackgroundSync,
    handleNetworkChange,
    handleVisibilityChange,
  }
}

// Hook to set up automatic cache management
export function useAutomaticCacheManagement() {
  const {
    prefetchCriticalData,
    enableBackgroundSync,
    handleNetworkChange,
    handleVisibilityChange,
  } = useCacheManagement()

  useEffect(() => {
    // Prefetch critical data on mount
    prefetchCriticalData()

    // Set up background sync
    const cleanupBackgroundSync = enableBackgroundSync()

    // Set up network change handling
    const cleanupNetworkHandling = handleNetworkChange()

    // Set up visibility change handling
    const cleanupVisibilityHandling = handleVisibilityChange()

    return () => {
      cleanupBackgroundSync()
      cleanupNetworkHandling()
      cleanupVisibilityHandling()
    }
  }, [
    prefetchCriticalData,
    enableBackgroundSync,
    handleNetworkChange,
    handleVisibilityChange,
  ])
}

// Hook for optimistic UI updates
export function useOptimisticUpdates() {
  const queryClient = useQueryClient()

  const optimisticProductUpdate = useCallback((productId: string, updates: any) => {
    queryClient.setQueryData(['products', 'detail', productId], (old: any) => {
      if (!old) return old
      return { ...old, ...updates, updatedAt: new Date() }
    })
  }, [queryClient])

  const rollbackProductUpdate = useCallback((productId: string, previousData: any) => {
    if (previousData) {
      queryClient.setQueryData(['products', 'detail', productId], previousData)
    }
  }, [queryClient])

  return {
    optimisticProductUpdate,
    rollbackProductUpdate,
  }
}