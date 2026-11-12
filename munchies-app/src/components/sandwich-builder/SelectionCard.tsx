/**
 * @module components/sandwich-builder/SelectionCard
 * @description Clean, minimal selection row for sandwich builder ingredients.
 * Features clean typography, standard radio/checkbox controls, and Munchie's purple selected state.
 */

import React from 'react';
import { Check } from 'lucide-react';
import { formatPrice } from '@/lib/currency';
import type { BuilderItem } from '@/data/buildYourOwnData';

interface SelectionCardProps {
  item: BuilderItem;
  isSelected: boolean;
  onSelect: () => void;
  selectionMode?: 'single' | 'multiple';
  /** If true, prices are presented as additive (+X EGP) */
  isAddon?: boolean;
}

export const SelectionCard: React.FC<SelectionCardProps> = ({
  item,
  isSelected,
  onSelect,
  selectionMode = 'single',
  isAddon = true,
}) => {
  const isSingle = selectionMode === 'single';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex items-center justify-between p-3.5 sm:p-4 rounded-xl border text-right transition-colors cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        isSelected
          ? 'border-primary bg-primary-50/50 text-dark'
          : 'border-border bg-white hover:border-gray-300 text-dark'
      }`}
    >
      {/* Right side in RTL: Selection Control & Ingredient Name */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Selection Control: Radio (single) or Checkbox (multiple) */}
        <div
          className={`shrink-0 flex items-center justify-center transition-colors ${
            isSingle
              ? `w-5 h-5 rounded-full border ${
                  isSelected
                    ? 'border-primary bg-white'
                    : 'border-gray-300 bg-white'
                }`
              : `w-5 h-5 rounded-md border ${
                  isSelected
                    ? 'border-primary bg-primary text-white'
                    : 'border-gray-300 bg-white text-transparent'
                }`
          }`}
          aria-hidden="true"
        >
          {isSingle && isSelected && (
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
          )}
          {!isSingle && (
            <Check className={`w-3.5 h-3.5 stroke-[3] ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
          )}
        </div>

        {/* Ingredient Title & Nutritional details */}
        <div className="min-w-0">
          <span className={`block text-sm sm:text-base font-bold truncate ${
            isSelected ? 'text-primary' : 'text-dark'
          }`}>
            {item.name.ar}
          </span>
          {item.nutrition && (
            <span className="text-[11px] text-medium-gray block mt-0.5">
              {item.nutrition.grams}جم • {item.nutrition.calories} كالوري
              {item.nutrition.protein > 0 && ` • ${item.nutrition.protein}جم بروتين`}
            </span>
          )}
        </div>
      </div>

      {/* Left side in RTL: Price Tag */}
      <div className="shrink-0 mr-3 text-left">
        <span
          className={`text-xs sm:text-sm font-bold tabular-nums number-ltr ${
            isSelected ? 'text-primary font-black' : 'text-dark'
          }`}
        >
          {item.price > 0 ? (
            isAddon ? `+${formatPrice(item.price)}` : formatPrice(item.price)
          ) : (
            <span className="text-medium-gray font-normal text-xs">مشمل</span>
          )}
        </span>
      </div>
    </button>
  );
};
