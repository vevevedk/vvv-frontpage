import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export function Skeleton({ 
  className = '', 
  width, 
  height,
  variant = 'rectangular' 
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-200';
  
  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  };

  const style = {
    width: width || 'auto',
    height: height || (variant === 'text' ? '1rem' : 'auto'),
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
}

// Card Skeleton
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <Skeleton width="60%" height="24px" />
      <Skeleton width="100%" height="16px" />
      <Skeleton width="100%" height="16px" />
      <Skeleton width="80%" height="16px" />
      <div className="flex gap-3 mt-4">
        <Skeleton width="100px" height="36px" />
        <Skeleton width="100px" height="36px" />
      </div>
    </div>
  );
}

// Table Skeleton
export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={`header-${i}`} height="20px" />
          ))}
        </div>
      </div>
      
      {/* Rows */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="p-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton key={`cell-${rowIndex}-${colIndex}`} height="16px" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Chart Skeleton
export function SkeletonChart() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <Skeleton width="40%" height="24px" className="mb-6" />
      <div className="space-y-3">
        <div className="flex items-end gap-2 h-48">
          {Array.from({ length: 12 }).map((_, i) => {
            const height = Math.random() * 60 + 40;
            return (
              <Skeleton 
                key={i} 
                className="flex-1"
                height={`${height}%`}
              />
            );
          })}
        </div>
        <div className="flex justify-between pt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} width="60px" height="12px" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Stats Card Skeleton
export function SkeletonStatsCard() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <Skeleton width="70%" height="16px" />
          <Skeleton width="50%" height="32px" />
          <Skeleton width="60%" height="14px" />
        </div>
        <Skeleton variant="circular" width="48px" height="48px" />
      </div>
    </div>
  );
}

// Dashboard Grid Skeleton
export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatsCard key={i} />
        ))}
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonChart />
        <SkeletonChart />
      </div>
      
      {/* Table */}
      <SkeletonTable />
    </div>
  );
}

// List Skeleton
export function SkeletonList({ items = 5 }: { items?: number }) {
  return (
    <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="p-4 flex items-center gap-4">
          <Skeleton variant="circular" width="48px" height="48px" />
          <div className="flex-1 space-y-2">
            <Skeleton width="60%" height="18px" />
            <Skeleton width="40%" height="14px" />
          </div>
        </div>
      ))}
    </div>
  );
}


