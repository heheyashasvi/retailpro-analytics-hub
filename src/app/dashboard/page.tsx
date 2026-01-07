import { Suspense } from 'react'
import { DashboardContent } from '@/components/dashboard/dashboard-content'

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Business Intelligence Hub</h2>
          <p className="text-gray-600 mt-2">Real-time analytics and insights for your retail operations</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            Live Data
          </div>
        </div>
      </div>
      
      <Suspense fallback={
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div className="col-span-4 h-80 bg-gray-200 rounded-lg animate-pulse" />
            <div className="col-span-3 h-80 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
      }>
        <DashboardContent />
      </Suspense>
    </div>
  )
}