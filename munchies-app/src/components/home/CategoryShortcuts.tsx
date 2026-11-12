/**
 * @module components/home/CategoryShortcuts
 * @description Homepage category shortcuts bar.
 * Clean, touch-friendly shortcuts navigating to the menu filtered by category.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { useCategoryStore } from '@/stores/categoryStore';
import type { Category } from '@/types';

// Category-specific SVG icons
const CategoryIcon: React.FC<{ iconType: string }> = ({ iconType }) => {
  const strokeColor = 'currentColor';

  switch (iconType) {
    case 'burger':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 11C4 7 7.5 4 12 4C16.5 4 20 7 20 11H4Z" />
          <path d="M4 14H20" />
          <path d="M6 14L8 16.5H16L18 14" />
          <path d="M5 19H19C19 20.5 16 21.5 12 21.5C8 21.5 5 20.5 5 19Z" />
        </svg>
      );
    case 'shawarma':
    case 'wrap':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="7" y="3" width="10" height="18" rx="5" transform="rotate(15 12 12)" />
          <path d="M10 7L14 8.5" />
          <path d="M9 11L15 13" />
        </svg>
      );
    case 'fries':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 10L7.5 21H16.5L18 10H6Z" />
          <path d="M8 10V4" />
          <path d="M11 10V2" />
          <path d="M14 10V3" />
          <path d="M16 10V5" />
        </svg>
      );
    case 'meal':
    case 'bowl':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 11C4 16 7.5 19 12 19C16.5 19 20 16 20 11H4Z" />
          <path d="M12 19V22" />
          <path d="M8 22H16" />
        </svg>
      );
    case 'drinks':
    case 'beverages':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 8L8.5 21H15.5L17 8H7Z" />
          <path d="M6 8H18" />
          <path d="M14 2L12 8" />
        </svg>
      );
    case 'offers':
    case 'tag':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.59 13.41L13.42 20.58C13.04 20.95 12.54 21.16 12 21.16C11.46 21.16 10.96 20.95 10.59 20.59L3.41 13.42C2.5 12.5 2 11.23 2 9.91V4C2 2.9 2.9 2 4 2H9.91C11.23 2 12.5 2.5 13.41 3.41L20.59 10.59C21.37 11.37 21.37 12.63 20.59 13.41Z" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 2V22M18 2C15.8 2 14 3.8 14 6C14 7.9 15.3 9.4 17 9.9V22M6 2V6C6 7.1 6.9 8 8 8C9.1 8 10 7.1 10 6V2M8 8V22" />
        </svg>
      );
  }
};

function getCategoryIconType(cat: Category | { id: string; name: { ar: string; en: string } }): string {
  const ar = cat.name.ar.toLowerCase();
  const id = cat.id.toLowerCase();

  if (ar.includes('برجر') || id.includes('burger')) return 'burger';
  if (ar.includes('شاورما') || ar.includes('سندوتش') || id.includes('sandwich')) return 'shawarma';
  if (ar.includes('فرايز') || ar.includes('بطاطس') || ar.includes('مقبلات') || id.includes('fries')) return 'fries';
  if (ar.includes('وجب') || ar.includes('خاصة') || ar.includes('لوديد') || id.includes('specialties') || id.includes('meal')) return 'meal';
  if (ar.includes('مشروب') || ar.includes('عصير') || ar.includes('كولا') || id.includes('drink') || id.includes('beverage')) return 'drinks';
  if (ar.includes('عرض') || ar.includes('عروض') || id.includes('offer')) return 'offers';

  return 'default';
}

export const CategoryShortcuts: React.FC = () => {
  const navigate = useNavigate();
  const storeCategories = useCategoryStore((s) => s.categories);

  const activeCategories = storeCategories.filter(
    (c) => c.id !== 'all' && c.isActive !== false
  );

  const hasOffersCategory = activeCategories.some(
    (c) => c.id === 'offers' || c.name.ar.includes('العروض')
  );

  const displayList = [...activeCategories];
  if (!hasOffersCategory) {
    displayList.push({
      id: 'offers-shortcut',
      slug: 'offers',
      name: { ar: 'العروض', en: 'Offers' },
      sortOrder: 99,
      isActive: true,
      productCount: 0,
      createdAt: '',
      updatedAt: '',
    });
  }

  const handleCategoryClick = (cat: Category) => {
    if (cat.id === 'offers-shortcut' || cat.slug === 'offers') {
      navigate(ROUTES.OFFERS);
      return;
    }
    const targetParam = cat.slug || cat.id;
    navigate(`${ROUTES.MENU}?category=${encodeURIComponent(targetParam)}`);
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 sm:-mt-6 relative z-20">
      <div className="w-full overflow-x-auto no-scrollbar scroll-smooth py-2">
        <div className="flex items-center sm:justify-center gap-2.5 sm:gap-3.5 min-w-max px-1">
          {displayList.map((category) => {
            const iconType = getCategoryIconType(category);

            return (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category)}
                className="flex flex-col items-center justify-center rounded-2xl transition-all duration-200 cursor-pointer select-none active:scale-95 shrink-0 px-3.5 py-3 sm:px-4 sm:py-3.5 min-w-[76px] sm:min-w-[88px] min-h-[76px] sm:min-h-[88px] bg-white hover:bg-primary-50 text-dark hover:text-primary border border-border hover:border-primary-200 shadow-card hover:shadow-card-hover group"
                title={category.name.ar}
                aria-label={category.name.ar}
              >
                {/* Category Icon */}
                <div className="mb-1.5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <CategoryIcon iconType={iconType} />
                </div>

                {/* Category Name */}
                <span className="text-xs sm:text-sm font-extrabold tracking-tight leading-none">
                  {category.name.ar}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
