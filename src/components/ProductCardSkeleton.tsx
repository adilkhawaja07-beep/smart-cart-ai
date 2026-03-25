import { Skeleton } from '@/components/ui/skeleton';

export function ProductCardSkeleton() {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-card p-3 md:p-4">
      {/* Image skeleton */}
      <div className="relative mb-3 overflow-hidden rounded-md bg-muted">
        <Skeleton className="aspect-square w-full" />
      </div>

      {/* Badge skeleton */}
      <div className="absolute right-3 top-3 md:right-4 md:top-4">
        <Skeleton className="h-6 w-12 rounded-full" />
      </div>

      {/* Category skeleton */}
      <Skeleton className="mb-2 h-4 w-16" />

      {/* Product name skeleton */}
      <div className="mb-2 space-y-1">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      {/* Unit skeleton */}
      <Skeleton className="mb-3 h-3 w-12" />

      {/* Price skeleton */}
      <div className="flex items-baseline gap-2 mb-3">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-4 w-12" />
      </div>

      {/* Button skeleton */}
      <Skeleton className="h-9 w-full rounded-md" />
    </div>
  );
}
