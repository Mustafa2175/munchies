/**
 * @module components/ui/Card
 * @description Surface card container with hover effect.
 */

import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  hoverable = false,
  className = '',
  children,
  ...props
}) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm transition-all duration-200 overflow-hidden ${
        hoverable ? 'hover:shadow-md hover:-translate-y-0.5' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

