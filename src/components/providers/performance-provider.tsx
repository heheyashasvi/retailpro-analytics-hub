'use client'

import { useEffect } from 'react'
import { measureWebVitals, analyzeBundleSize } from '@/lib/performance'

export function PerformanceProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize Web Vitals monitoring
    measureWebVitals()
    
    // Analyze bundle size in development
    if (process.env.NODE_ENV === 'development') {
      analyzeBundleSize()
    }
    
    // Report performance metrics periodically
    const interval = setInterval(() => {
      if (process.env.NODE_ENV === 'development') {
        const metrics = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        if (metrics) {
          console.group('Performance Metrics')
          console.log('Page Load Time:', `${(metrics.loadEventEnd - metrics.fetchStart).toFixed(2)}ms`)
          console.log('DOM Content Loaded:', `${(metrics.domContentLoadedEventEnd - metrics.fetchStart).toFixed(2)}ms`)
          console.log('First Byte (TTFB):', `${(metrics.responseStart - metrics.fetchStart).toFixed(2)}ms`)
          console.groupEnd()
        }
      }
    }, 30000) // Report every 30 seconds in development
    
    return () => clearInterval(interval)
  }, [])

  return <>{children}</>
}