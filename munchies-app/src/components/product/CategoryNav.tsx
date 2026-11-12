/**
 * @module components/product/CategoryNav
 * @description Sticky horizontal scrollable category pill navigation with RTL auto-centering.
 */

import React, { useEffect, useRef } from 'react';
import type { Category } from '@/types';

export interface CategoryNavProps {
  categories: Category[];
  activeCategoryId: string;
  onSelectCategory: (id: string) => void;
  className?: string;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({
  categories,
  activeCategoryId,
  onSelectCategory,
  className = '',
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Keep the active category pill horizontally visible inside the scroll container
  // without triggering vertical window scroll.
  useEffect(() => {
    const container = scrollContainerRef.current;
    const activeTab = tabRefs.current[activeCategoryId];
    if (!container || !activeTab) return;

    const containerRect = container.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();
    const delta =
      tabRect.left + tabRect.width / 2 - (containerRect.left + containerRect.width / 2);

    if (Math.abs(delta) > 6) {
      container.scrollBy({ left: delta, behavior: 'smooth' });
    }
  }, [activeCategoryId, categories]);

  return (
    <div
      ref={scrollContainerRef}
      role="tablist"
      aria-label="أقسام المنيو"
      className={`w-full overflow-x-auto no-scrollbar touch-pan-x py-2.5 ${className}`}
    >
      <div className="flex items-center gap-2 min-w-max">
        {categories.map((category) => {
          const isActive = activeCategoryId === category.id;
          const isCategoryEnabled = category.isActive !== false;
          const name = category.name.ar;

          return (
            <button
              key={category.id}
              ref={(el) => {
                tabRefs.current[category.id] = el;
              }}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelectCategory(category.id)}
              className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-[13px] font-bold transition-colors duration-200 cursor-pointer select-none active:scale-95 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                isActive
                  ? !isCategoryEnabled
                    ? 'bg-danger text-white shadow-xs'
                    : 'bg-primary text-white shadow-xs'
                  : !isCategoryEnabled
                  ? 'bg-danger-light text-danger border border-danger/30 hover:bg-red-100 opacity-85'
                  : 'bg-white border border-border text-dark hover:bg-gray-50'
              }`}
            >
              <span>{name}</span>
              {!isCategoryEnabled && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-black/25 text-white' : 'bg-danger/10 text-danger'
                  }`}
                >
                  مش متاح
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
