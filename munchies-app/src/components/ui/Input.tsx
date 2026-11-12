/**
 * @module components/ui/Input
 * @description Accessible text input supporting labels, icons, right action elements (e.g. password toggle), RTL/LTR, and error states.
 */

import React, { forwardRef } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      rightElement,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const hasEndAddon = Boolean(RightIcon || rightElement);

    return (
      <div className="w-full text-start">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-dark mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative rounded-xl shadow-xs">
          {LeftIcon && (
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3.5 text-gray-400">
              <LeftIcon className="h-4 w-4" />
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`block w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-dark placeholder:text-medium-gray transition-colors focus:outline-none focus:ring-2 disabled:bg-light-gray disabled:text-medium-gray disabled:cursor-not-allowed ${
              LeftIcon ? 'ps-10' : ''
            } ${hasEndAddon ? 'pe-10' : ''} ${
              error
                ? 'border-danger focus:border-danger focus:ring-danger/20'
                : 'border-border focus:border-primary focus:ring-primary/20'
            } ${className}`}
            aria-invalid={error ? 'true' : undefined}
            {...props}
          />
          {rightElement ? (
            <div className="absolute inset-y-0 end-0 flex items-center pe-2">
              {rightElement}
            </div>
          ) : RightIcon ? (
            <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3.5 text-gray-400">
              <RightIcon className="h-4 w-4" />
            </div>
          ) : null}
        </div>
        {error && <p className="mt-1 text-xs text-danger font-medium">{error}</p>}
        {!error && helperText && (
          <p className="mt-1 text-xs text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
