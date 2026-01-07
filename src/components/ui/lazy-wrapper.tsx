import React, { ComponentType, Suspense } from "react"
import { LoadingSpinner } from "./loading-spinner"

type LazyWrapperProps = {
  fallback?: React.ReactNode
}

export function LazyWrapper<T extends ComponentType<any>>({
  component: LazyComponent,
  fallback,
  ...props
}: {
  component: T
} & LazyWrapperProps & React.ComponentProps<T>) {
  return (
    <Suspense fallback={fallback ?? <LoadingSpinner />}>
      <LazyComponent {...props} />
    </Suspense>
  )
}


