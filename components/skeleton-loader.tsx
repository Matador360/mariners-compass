import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn("skeleton-shimmer rounded-md", className)}
      aria-hidden="true"
    />
  );
}

export function GameCardSkeleton() {
  return (
    <div className="trident-card p-6 space-y-4">
      <Skeleton className="h-4 w-32" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-12 w-20" />
        <Skeleton className="h-8 w-16 rounded-full" />
        <Skeleton className="h-12 w-20" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

export function PlayerCardSkeleton() {
  return (
    <div className="trident-card p-4 space-y-3">
      <Skeleton className="h-20 w-20 rounded-full mx-auto" />
      <Skeleton className="h-4 w-28 mx-auto" />
      <Skeleton className="h-3 w-16 mx-auto" />
      <div className="flex justify-around pt-1">
        <Skeleton className="h-8 w-14" />
        <Skeleton className="h-8 w-14" />
        <Skeleton className="h-8 w-14" />
      </div>
    </div>
  );
}

export function StatsRowSkeleton() {
  return (
    <div className="flex justify-around gap-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <Skeleton className="h-6 w-14" />
          <Skeleton className="h-3 w-10" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div className="space-y-2">
      <div
        className="skeleton-shimmer rounded-lg w-full"
        style={{ height }}
        aria-hidden="true"
      />
    </div>
  );
}
