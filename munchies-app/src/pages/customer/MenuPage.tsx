/**
 * @module pages/customer/MenuPage
 * @description Full interactive sectioned menu page with compact RTL heading,
 * sticky horizontal category navigation, IntersectionObserver scroll spy, and search.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Utensils } from 'lucide-react';
import { CategoryNav } from '@/components/product/CategoryNav';
import { ProductSearch } from '@/components/product/ProductSearch';
import { ProductGrid } from '@/components/product/ProductGrid';
import { FixedCartBar } from '@/components/cart/FixedCartBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { useProductStore } from '@/stores/productStore';
import { useCategoryStore } from '@/stores/categoryStore';
import type { Category, Product } from '@/types';

interface CategorySection {
  category: Category;
  products: Product[];
}

function formatArabicItemCount(count: number): string {
  if (count === 1 || count > 10) return `${count} صنف`;
  return `${count} أصناف`;
}

export const MenuPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const products = useProductStore((s) => s.products);
  const storeCategories = useCategoryStore((s) => s.categories);

  const stickyBarRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const scrollLockRef = useRef<{ targetId: string; until: number }>({
    targetId: '',
    until: 0,
  });
  const skipNextUrlScrollRef = useRef<boolean>(false);
  const lastHandledUrlCategoryRef = useRef<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [stickyOffset, setStickyOffset] = useState<number>(126);

  // Sort dynamic Firestore categories consistently and exclude synthetic 'all'
  const orderedCategories = useMemo(
    () =>
      [...storeCategories]
        .filter((c) => c.id !== 'all')
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [storeCategories]
  );

  // Resolve category from URL parameter (matches either id or slug)
  const resolveCategoryId = useCallback(
    (param: string | null): string | null => {
      if (!param || param === 'all') return null;
      const normalized = param.trim().toLowerCase();
      const match = orderedCategories.find(
        (c) =>
          c.id.toLowerCase() === normalized ||
          c.slug?.toLowerCase() === normalized
      );
      return match ? match.id : param;
    },
    [orderedCategories]
  );

  // Filter products by search query, keeping existing product/category availability handling intact
  const searchFilteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return products;
    return products.filter(
      (product) =>
        product.name.ar.toLowerCase().includes(query) ||
        product.description.ar.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  // Group filtered products into ordered category sections (only non-empty sections)
  const categorySections: CategorySection[] = useMemo(() => {
    const byCategory = new Map<string, Product[]>();
    for (const product of searchFilteredProducts) {
      const list = byCategory.get(product.categoryId);
      if (list) list.push(product);
      else byCategory.set(product.categoryId, [product]);
    }

    const sections: CategorySection[] = [];
    for (const category of orderedCategories) {
      const items = byCategory.get(category.id);
      if (items && items.length > 0) {
        sections.push({ category, products: items });
      }
    }
    return sections;
  }, [orderedCategories, searchFilteredProducts]);

  const visibleCategories = useMemo(
    () => categorySections.map((s) => s.category),
    [categorySections]
  );
  const sectionIdsKey = useMemo(
    () => categorySections.map((s) => s.category.id).join('|'),
    [categorySections]
  );

  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    () => resolveCategoryId(searchParams.get('category')) ?? ''
  );

  const effectiveActiveCategoryId = useMemo(() => {
    if (visibleCategories.some((c) => c.id === activeCategoryId)) {
      return activeCategoryId;
    }
    return visibleCategories[0]?.id ?? '';
  }, [activeCategoryId, visibleCategories]);

  // Dynamically measure Navbar + sticky CategoryNav height for exact scroll offsets
  useEffect(() => {
    const updateOffset = () => {
      const header = document.querySelector('header');
      const headerH = header
        ? header.getBoundingClientRect().height
        : window.innerWidth >= 640
        ? 72
        : 64;
      const barH = stickyBarRef.current
        ? stickyBarRef.current.getBoundingClientRect().height
        : 52;
      setStickyOffset(Math.round(headerH + barH + 12));
    };

    updateOffset();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateOffset) : null;
    if (stickyBarRef.current) ro?.observe(stickyBarRef.current);
    window.addEventListener('resize', updateOffset);

    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', updateOffset);
    };
  }, [visibleCategories.length]);

  const scrollToCategorySection = useCallback(
    (catId: string, behavior: ScrollBehavior = 'smooth') => {
      const targetEl = sectionRefs.current[catId];
      if (!targetEl) return;

      setActiveCategoryId(catId);
      scrollLockRef.current = { targetId: catId, until: Date.now() + 1100 };
      const releaseLock = () => {
        scrollLockRef.current.until = 0;
      };
      window.addEventListener('scrollend', releaseLock, { once: true });

      const top = Math.max(
        0,
        window.scrollY + targetEl.getBoundingClientRect().top - stickyOffset
      );
      window.scrollTo({ top, behavior });
    },
    [stickyOffset]
  );

  // Handle initial URL deep-link (/menu?category=...) or external URL changes
  useEffect(() => {
    const param = searchParams.get('category');
    if (skipNextUrlScrollRef.current) {
      skipNextUrlScrollRef.current = false;
      lastHandledUrlCategoryRef.current = param;
      return;
    }

    const resolved = resolveCategoryId(param);
    if (!resolved) {
      lastHandledUrlCategoryRef.current = null;
      return;
    }

    if (
      lastHandledUrlCategoryRef.current !== resolved &&
      sectionRefs.current[resolved]
    ) {
      lastHandledUrlCategoryRef.current = resolved;
      const raf = requestAnimationFrame(() => {
        scrollToCategorySection(resolved, 'smooth');
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [searchParams, sectionIdsKey, resolveCategoryId, scrollToCategorySection]);

  // Unlock programmatic scroll guard immediately if the user manually scrolls
  useEffect(() => {
    const cancelLock = () => {
      if (scrollLockRef.current.until > Date.now()) {
        scrollLockRef.current.until = 0;
      }
    };
    window.addEventListener('wheel', cancelLock, { passive: true });
    window.addEventListener('touchstart', cancelLock, { passive: true });
    return () => {
      window.removeEventListener('wheel', cancelLock);
      window.removeEventListener('touchstart', cancelLock);
    };
  }, []);

  // Efficient IntersectionObserver Scroll Spy across all rendered category sections
  useEffect(() => {
    const orderedIds = sectionIdsKey ? sectionIdsKey.split('|') : [];
    if (orderedIds.length === 0) return;

    const intersectingIds = new Set<string>();
    const activationLine = stickyOffset + 64;

    const updateActiveCategory = () => {
      if (Date.now() < scrollLockRef.current.until) return;

      // Pick the deepest section in DOM order whose heading entered the upper reading band
      let bestId: string | null = null;
      for (const id of orderedIds) {
        const el = sectionRefs.current[id];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.bottom > stickyOffset + 8 && rect.top <= activationLine) {
          bestId = id;
        }
      }

      if (bestId) {
        setActiveCategoryId((prev) => (prev === bestId ? prev : bestId));
        return;
      }

      const firstVisible = orderedIds.find((id) => intersectingIds.has(id));
      const fallback = firstVisible ?? orderedIds[0];
      if (fallback) {
        setActiveCategoryId((prev) => (prev === fallback ? prev : fallback));
      }
    };

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.categoryId;
          if (!id) continue;
          if (entry.isIntersecting) intersectingIds.add(id);
          else intersectingIds.delete(id);
        }
        updateActiveCategory();
      },
      {
        root: null,
        rootMargin: `-${stickyOffset}px 0px -30% 0px`,
        threshold: [0, 0.05, 0.15, 0.35, 0.6, 0.9],
      }
    );

    for (const id of orderedIds) {
      const el = sectionRefs.current[id];
      if (el) sectionObserver.observe(el);
    }

    // Bottom sentinel guarantees even a short last category activates at page bottom
    const bottomEl = bottomSentinelRef.current;
    const bottomObserver = bottomEl
      ? new IntersectionObserver(
          ([entry]) => {
            if (!entry?.isIntersecting) return;
            if (Date.now() < scrollLockRef.current.until) return;
            const nearPageBottom =
              window.innerHeight + window.scrollY >=
              document.documentElement.scrollHeight - 48;
            if (nearPageBottom && orderedIds.length > 0) {
              const lastId = orderedIds[orderedIds.length - 1];
              setActiveCategoryId((prev) => (prev === lastId ? prev : lastId));
            }
          },
          { root: null, threshold: 0 }
        )
      : null;

    if (bottomObserver && bottomEl) {
      bottomObserver.observe(bottomEl);
    }

    return () => {
      sectionObserver.disconnect();
      bottomObserver?.disconnect();
    };
  }, [sectionIdsKey, stickyOffset]);

  const handleSelectCategory = useCallback(
    (catId: string) => {
      skipNextUrlScrollRef.current = true;
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('category', catId);
      setSearchParams(nextParams, { replace: true });
      scrollToCategorySection(catId, 'smooth');
    },
    [searchParams, setSearchParams, scrollToCategorySection]
  );

  const handleResetFilters = () => {
    setSearchQuery('');
    skipNextUrlScrollRef.current = true;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('category');
    setSearchParams(nextParams, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3.5 sm:pt-6 pb-28 sm:pb-36 relative">
      {/* Compact Right-Aligned Header (RTL) */}
      <div className="text-start pb-2.5 sm:pb-3">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-dark tracking-tight">
            منيو مانشيز
          </h1>
          <span className="text-xs text-medium-gray tabular-nums shrink-0">
            {formatArabicItemCount(searchFilteredProducts.length)}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-medium-gray mt-0.5">
          اختار اللي على مزاجك، طازة ومقرمش
        </p>
      </div>

      {/* Sticky Horizontal Category Navigation directly beneath Heading & Navbar */}
      {visibleCategories.length > 0 && (
        <div
          ref={stickyBarRef}
          className="sticky top-16 sm:top-[72px] z-30 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 bg-[#FDFCFE]/95 backdrop-blur-md border-b border-border/80"
        >
          <CategoryNav
            categories={visibleCategories}
            activeCategoryId={effectiveActiveCategoryId}
            onSelectCategory={handleSelectCategory}
          />
        </div>
      )}

      {/* Search & Menu Category Sections */}
      <div className="mt-3 sm:mt-4 space-y-6 sm:space-y-8">
        <div className="sm:max-w-md">
          <ProductSearch value={searchQuery} onChange={setSearchQuery} />
        </div>

        {categorySections.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={Utensils}
              title="ملقيناش اللي بتدور عليه!"
              description="جرّب تدور بكلمة تانية."
              actionLabel="شوف كل المنيو"
              onAction={handleResetFilters}
            />
          </div>
        ) : (
          <div className="space-y-7 sm:space-y-10">
            {categorySections.map(({ category, products: sectionProducts }) => {
              const isCategoryDisabled = category.isActive === false;
              return (
                <section
                  key={category.id}
                  id={`category-section-${category.id}`}
                  data-category-id={category.id}
                  ref={(el) => {
                    sectionRefs.current[category.id] = el;
                  }}
                  style={{ scrollMarginTop: `${stickyOffset}px` }}
                  className="space-y-3 sm:space-y-4"
                >
                  <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-border/70">
                    <div className="flex items-center gap-2 min-w-0">
                      <h2 className="text-base sm:text-xl font-black text-dark truncate">
                        {category.name.ar}
                      </h2>
                      {isCategoryDisabled && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-danger-light text-danger shrink-0">
                          مش متاح حالياً
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-medium-gray bg-light-gray px-2.5 py-0.5 rounded-full tabular-nums shrink-0">
                      {formatArabicItemCount(sectionProducts.length)}
                    </span>
                  </div>

                  <ProductGrid products={sectionProducts} />
                </section>
              );
            })}
            <div ref={bottomSentinelRef} className="h-px w-full" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Fixed Interactive Bottom Cart Bar */}
      <FixedCartBar />
    </div>
  );
};
