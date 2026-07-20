import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className = '', ...props }: SkeletonProps) {
  return (
    <div 
      className={`animate-pulse bg-[#1e293b]/50 rounded-xl ${className}`} 
      {...props} 
    />
  );
}

// Custom Order Card Skeleton
export function OrderCardSkeleton() {
  return (
    <div className="p-5 bg-slate-900/60 border border-white/5 rounded-3xl space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 min-w-0 flex-grow">
          {/* order number skeleton */}
          <Skeleton className="h-3 w-16" />
          {/* service title skeleton */}
          <Skeleton className="h-4 w-32" />
        </div>
        {/* status badge skeleton */}
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>

      {/* description skeleton */}
      <div className="space-y-1.5 pt-1">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>

      {/* dimensions & details skeletons */}
      <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-20 justify-self-end" />
      </div>

      {/* date skeleton */}
      <div className="flex justify-between pt-2 border-t border-white/5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}

// Custom Statistics Card Skeleton
export function StatCardSkeleton() {
  return (
    <div className="p-6 bg-slate-900/40 border border-white/5 rounded-3xl space-y-3">
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>
      <Skeleton className="h-7 w-32" />
      <div className="space-y-1 pt-1">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}
