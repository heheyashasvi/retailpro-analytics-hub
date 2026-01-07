import { ProductTableSkeleton } from '@/components/ui/skeleton';

export default function ProductsLoading() {
  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-200 animate-pulse rounded" />
            <div className="h-4 w-64 bg-gray-200 animate-pulse rounded" />
          </div>
          <div className="h-10 w-32 bg-gray-200 animate-pulse rounded" />
        </div>
        
        <div className="flex space-x-4">
          <div className="h-10 w-64 bg-gray-200 animate-pulse rounded" />
          <div className="h-10 w-32 bg-gray-200 animate-pulse rounded" />
        </div>
        
        <ProductTableSkeleton />
      </div>
    </div>
  );
}