/**
 * @module components/ui/Skeleton
 * @description Loading skeleton shimmer placeholders.
 */

import React from 'react';

export interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text' | 'card';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
}) => {
  if (variant === 'card') {
    return (
      <div className={`bg-white rounded-2xl border border-border p-4 space-y-3 ${className}`}>
        <div className="w-full h-44 rounded-xl skeleton" />
        <div className="h-5 w-3/4 rounded-md skeleton" />
        <div className="h-4 w-full rounded-md skeleton" />
        <div className="flex justify-between items-center pt-2">
          <div className="h-6 w-16 rounded-md skeleton" />
          <div className="h-8 w-20 rounded-xl skeleton" />
        </div>
      </div>
    );
  }

  const variantClass = {
    rectangular: 'rounded-xl',
    circular: 'rounded-full',
    text: 'rounded-md h-4',
  }[variant];

  return <div className={`skeleton ${variantClass} ${className}`} />;
};

