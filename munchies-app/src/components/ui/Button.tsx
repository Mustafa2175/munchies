/**
 * @module components/ui/Button
 * @description Flexible styled button supporting brand colors, sizes, icons, and loading state.
 */

import React, { forwardRef } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'yellow' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      fullWidth = false,
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer select-none rounded-xl active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 focus:outline-none focus:ring-2 focus:ring-offset-2';

    const sizeClasses = {
      sm: 'text-xs px-3 h-8 gap-1.5',
      md: 'text-sm px-4 h-10 gap-2',
      lg: 'text-base px-6 h-12 gap-2.5',
    }[size];

    const variantClasses = {
      primary:
        'bg-primary hover:bg-primary-600 text-white shadow-md hover:shadow-lg focus:ring-primary',
      yellow:
        'bg-yellow hover:bg-yellow-dark text-dark font-semibold shadow-md hover:shadow-lg focus:ring-yellow',
      secondary:
        'bg-white border-2 border-primary text-primary hover:bg-primary-50 focus:ring-primary',
      ghost:
        'bg-transparent hover:bg-light-gray text-dark focus:ring-primary',
      danger:
        'bg-danger hover:bg-red-600 text-white shadow-sm focus:ring-danger',
    }[variant];

    const widthClass = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseClasses} ${sizeClasses} ${variantClasses} ${widthClass} ${className}`}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ms-1 me-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        )}
        {!isLoading && LeftIcon && <LeftIcon className="w-4 h-4 shrink-0" />}
        <span>{children}</span>
        {!isLoading && RightIcon && <RightIcon className="w-4 h-4 shrink-0" />}
      </button>
    );
  }
);

Button.displayName = 'Button';

