/**
 * @module components/product/CategoryNav
 * @description Horizontal scrollable category pill navigation.
 */

import React from 'react';
import type { Category } from '@/types';

export interface CategoryNavProps {
  categories: Category[];
  activeCategoryId: string;
  onSelectCategory: (id: string) => void;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({
  categories,
  activeCategoryId,
  onSelectCategory,
}) => {
  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2">
      <div className="flex items-center gap-2 min-w-max">
        {categories.map((category) => {
          const isActive = activeCategoryId === category.id;
          const isCategoryEnabled = category.isActive !== false;
          const name = category.name.ar;

          return (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer select-none active:scale-95 inline-flex items-center gap-1.5 ${
                isActive
                  ? !isCategoryEnabled
                    ? 'bg-danger text-white shadow-xs'
                    : 'bg-primary text-white shadow-xs'
                  : !isCategoryEnabled
                  ? 'bg-danger-light text-danger border border-danger/30 hover:bg-red-100 opacity-80'
                  : 'bg-light-gray text-dark hover:bg-gray-200'
              }`}
            >
              <span>{name}</span>
              {!isCategoryEnabled && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-black/30 text-white' : 'bg-danger/10 text-danger'
                  }`}
                >
                  غير متاح
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
