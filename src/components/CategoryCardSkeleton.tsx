import { Skeleton } from '@/components/ui/skeleton';

export function CategoryCardSkeleton() {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-card">
      {/* Image skeleton */}
      <div className="relative overflow-hidden">
        <Skeleton className="aspect-square w-full" />
      </div>

      {/* Content skeleton */}
      <div className="p-3 md:p-4">
        {/* Category name */}
        <Skeleton className="mb-2 h-5 w-24" />
        
        {/* Item count */}
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}
