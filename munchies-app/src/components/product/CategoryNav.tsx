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
          const name = category.name.ar;

          return (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer select-none active:scale-95 ${
                isActive
                  ? 'bg-[#512080] text-white shadow-md'
                  : 'bg-[#F5F3F7] text-gray-700 hover:bg-gray-200'
              }`}
            >
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
};

