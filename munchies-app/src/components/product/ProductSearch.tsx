/**
 * @module components/product/ProductSearch
 * @description Search input with clear button and debouncing support.
 */

import React from 'react';
import { Search, X } from 'lucide-react';

export interface ProductSearchProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const ProductSearch: React.FC<ProductSearchProps> = ({
  value,
  onChange,
  className = '',
}) => {
  return (
    <div className={`relative w-full ${className}`}>
      <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3.5 text-medium-gray">
        <Search className="w-4 h-4" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="ابحث في السندوتشات، البرجر، الإضافات..."
        className="w-full rounded-xl border border-border bg-white py-2.5 ps-10 pe-9 text-sm text-dark placeholder:text-medium-gray focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all shadow-xs"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute inset-y-0 end-0 flex items-center pe-3 text-medium-gray hover:text-dark cursor-pointer"
          aria-label="مسح البحث"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
