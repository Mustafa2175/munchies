/**
 * @module components/ui/QuantitySelector
 * @description Plus/minus quantity increment controls.
 */

import React from 'react';
import { Plus, Minus } from 'lucide-react';

export interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
  disabled?: boolean;
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  value,
  onChange,
  min = 1,
  max = 99,
  size = 'md',
  disabled = false,
}) => {
  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    if (value < max) {
      onChange(value + 1);
    }
  };

  const btnSize = size === 'sm' ? 'w-6 h-6' : 'w-8 h-8';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  const textSize = size === 'sm' ? 'text-xs px-2' : 'text-sm px-3';

  return (
    <div
      className={`inline-flex items-center rounded-xl border border-border bg-light-gray p-1 select-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        className={`${btnSize} flex items-center justify-center rounded-lg bg-white text-dark shadow-xs hover:bg-gray-50 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all`}
        aria-label="قلّل الكمية"
      >
        <Minus className={iconSize} />
      </button>
      <span className={`${textSize} font-bold text-dark min-w-6 text-center tabular-nums number-ltr`}>
        {value}
      </span>
      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        className={`${btnSize} flex items-center justify-center rounded-lg bg-primary text-white shadow-xs hover:bg-primary-600 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all`}
        aria-label="زوّد الكمية"
      >
        <Plus className={iconSize} />
      </button>
    </div>
  );
};

