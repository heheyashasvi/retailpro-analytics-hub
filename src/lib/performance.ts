// Performance monitoring utilities

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  // Measure function execution time
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    try {
      const result = await fn()
      const duration = performance.now() - start
      this.recordMetric(name, duration)
      return result
    } catch (error) {
      const duration = performance.now() - start
      this.recordMetric(`${name}_error`, duration)
      throw error
    }
  }

  measure<T>(name: string, fn: () => T): T {
    const start = performance.now()
    try {
      const result = fn()
      const duration = performance.now() - start
      this.recordMetric(name, duration)
      return result
    } catch (error) {
      const duration = performance.now() - start
      this.recordMetric(`${name}_error`, duration)
      throw error
    }
  }

  // Record a metric
  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    const values = this.metrics.get(name)!
    values.push(value)
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift()
    }
  }

  // Get metric statistics
  getMetricStats(name: string): { avg: number; min: number; max: number; count: number } | null {
    const values = this.metrics.get(name)
    if (!values || values.length === 0) {
      return null
    }

    const avg = values.reduce((sum, val) => sum + val, 0) / values.length
    const min = Math.min(...values)
    const max = Math.max(...values)

    return { avg, min, max, count: values.length }
  }

  // Get all metrics
  getAllMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: Record<string, any> = {}
    for (const [name] of this.metrics) {
      const stats = this.getMetricStats(name)
      if (stats) {
        result[name] = stats
      }
    }
    return result
  }

  // Clear metrics
  clearMetrics(): void {
    this.metrics.clear()
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance()

// Web Vitals monitoring
export function measureWebVitals() {
  if (typeof window === 'undefined') return

  // Measure Core Web Vitals
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const metric = entry as any
      
      switch (metric.entryType) {
        case 'largest-contentful-paint':
          performanceMonitor.recordMetric('LCP', metric.startTime)
          break
        case 'first-input':
          performanceMonitor.recordMetric('FID', metric.processingStart - metric.startTime)
          break
        case 'layout-shift':
          if (!metric.hadRecentInput) {
            performanceMonitor.recordMetric('CLS', metric.value)
          }
          break
      }
    }
  })

  try {
    observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] })
  } catch (e) {
    // Browser doesn't support these metrics
  }

  // Measure page load time
  window.addEventListener('load', () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigation) {
      performanceMonitor.recordMetric('page_load_time', navigation.loadEventEnd - navigation.fetchStart)
      performanceMonitor.recordMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart)
      performanceMonitor.recordMetric('first_byte', navigation.responseStart - navigation.fetchStart)
    }
  })
}

// Bundle size analyzer (development only)
export function analyzeBundleSize() {
  if (process.env.NODE_ENV !== 'development') return

  const scripts = document.querySelectorAll('script[src]')
  let totalSize = 0

  scripts.forEach(async (script) => {
    const src = (script as HTMLScriptElement).src
    if (src.includes('/_next/')) {
      try {
        const response = await fetch(src, { method: 'HEAD' })
        const size = parseInt(response.headers.get('content-length') || '0')
        totalSize += size
        console.log(`Bundle: ${src.split('/').pop()} - ${(size / 1024).toFixed(2)}KB`)
      } catch (e) {
        // Ignore errors
      }
    }
  })

  setTimeout(() => {
    console.log(`Total bundle size: ${(totalSize / 1024).toFixed(2)}KB`)
  }, 1000)
}

// Performance decorator for API routes
export function withPerformanceMonitoring<T extends (...args: any[]) => any>(
  name: string,
  fn: T
): T {
  return (async (...args: any[]) => {
    return await performanceMonitor.measureAsync(name, () => fn(...args))
  }) as T
}

// React hook for performance monitoring
export function usePerformanceMonitoring(componentName: string) {
  const startTime = performance.now()

  return {
    recordRender: () => {
      const renderTime = performance.now() - startTime
      performanceMonitor.recordMetric(`${componentName}_render`, renderTime)
    },
    recordInteraction: (interactionName: string) => {
      const interactionTime = performance.now()
      return () => {
        const duration = performance.now() - interactionTime
        performanceMonitor.recordMetric(`${componentName}_${interactionName}`, duration)
      }
    }
  }
}