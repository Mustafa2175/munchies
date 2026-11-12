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
      className={`bg-white rounded-2xl border border-border shadow-card transition-all duration-200 overflow-hidden ${
        hoverable ? 'hover:shadow-card-hover hover:-translate-y-0.5' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

