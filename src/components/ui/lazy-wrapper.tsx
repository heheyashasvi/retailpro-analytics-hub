'use client'

import { Suspense, lazy, ComponentType } from 'react'
import { LoadingSpinner } from './loading-spinner'

interface LazyWrapperProps {
  fallback?: React.ReactNode
}

export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFn)
  
  return function LazyWrapper(props: React.ComponentProps<T> & LazyWrapperProps) {
    const { fallback: customFallback, ...componentProps } = props
    
    return (
      <Suspense fallback={customFallback || fallback || <LoadingSpinner />}>
        <LazyComponent {...(componentProps as React.ComponentProps<T>)} />
      </Suspense>
    )
  }
}

export function LazyComponentWrapper({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <Suspense fallback={fallback || <LoadingSpinner />}>
      {children}
    </Suspense>
  )
}