/**
 * @module components/ui/Badge
 * @description Product and status badges.
 */

import React from 'react';

export interface BadgeProps {
  variant?: 'best-seller' | 'new' | 'offer' | 'default' | 'success';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  children,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 font-bold',
    md: 'text-xs px-2.5 py-1 font-bold',
  }[size];

  const variantClasses = {
    'best-seller': 'bg-[#FFDA35] text-[#26212B] shadow-xs',
    new: 'bg-[#512080] text-white shadow-xs',
    offer: 'bg-[#E84D45] text-white shadow-xs',
    success: 'bg-[#27834B] text-white shadow-xs',
    default: 'bg-[#F5F3F7] text-[#26212B] border border-gray-200',
  }[variant];

  return (
    <span
      className={`inline-flex items-center rounded-full tracking-wide select-none ${sizeClasses} ${variantClasses} ${className}`}
    >
      {children}
    </span>
  );
};

