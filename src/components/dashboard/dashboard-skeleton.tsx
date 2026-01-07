export function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      {/* Metrics Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border bg-card p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Sales Chart Skeleton */}
        <div className="col-span-4 rounded-lg border bg-card">
          <div className="p-6">
            <div className="space-y-2 mb-4">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-80 w-full bg-gray-200 rounded animate-pulse" />
          </div>
        </div>

        {/* Stock Overview Skeleton */}
        <div className="col-span-3 rounded-lg border bg-card">
          <div className="p-6">
            <div className="space-y-2 mb-4">
              <div className="h-6 w-28 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-36 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-gray-200 rounded animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Top Products Skeleton */}
        <div className="col-span-4 rounded-lg border bg-card">
          <div className="p-6">
            <div className="space-y-2 mb-4">
              <div className="h-6 w-28 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-44 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category Chart Skeleton */}
        <div className="col-span-3 rounded-lg border bg-card">
          <div className="p-6">
            <div className="space-y-2 mb-4">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-80 w-full bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}