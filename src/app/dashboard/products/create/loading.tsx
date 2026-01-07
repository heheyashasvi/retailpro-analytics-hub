import { FormSkeleton } from '@/components/ui/skeleton';

export default function CreateProductLoading() {
  return (
    <div className="container mx-auto py-6">
      <div className="max-w-2xl mx-auto">
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-200 animate-pulse rounded" />
            <div className="h-4 w-64 bg-gray-200 animate-pulse rounded" />
          </div>
          
          <div className="border rounded-lg p-6">
            <FormSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}