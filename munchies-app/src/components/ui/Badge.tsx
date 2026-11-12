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
    'best-seller': 'bg-yellow text-dark',
    new: 'bg-primary text-white',
    offer: 'bg-danger text-white',
    success: 'bg-success text-white',
    default: 'bg-light-gray text-dark border border-border',
  }[variant];

  return (
    <span
      className={`inline-flex items-center rounded-full tracking-wide select-none ${sizeClasses} ${variantClasses} ${className}`}
    >
      {children}
    </span>
  );
};

