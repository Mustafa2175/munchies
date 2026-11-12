/**
 * @module pages/customer/MenuPage
 * @description Full interactive menu page with search, categories, and direct ordering. Strictly Arabic.
 * Features:
 * - Compact horizontal product cards
 * - Fixed interactive cart summary bar at the bottom with live totals
 * - Synchronized category selection with URL search parameters (id or slug) and auto-scroll
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Utensils, AlertTriangle } from 'lucide-react';
import { CategoryNav } from '@/components/product/CategoryNav';
import { ProductSearch } from '@/components/product/ProductSearch';
import { ProductGrid } from '@/components/product/ProductGrid';
import { FixedCartBar } from '@/components/cart/FixedCartBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { useProductStore } from '@/stores/productStore';
import { useCategoryStore, useIsCategoryActive } from '@/stores/categoryStore';
import type { Category } from '@/types';

export const MenuPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const products = useProductStore((s) => s.products);
  const storeCategories = useCategoryStore((s) => s.categories);
  const menuNavRef = useRef<HTMLDivElement>(null);

  // Combine "الكل" category with dynamic store categories
  const allCategories: Category[] = useMemo(() => {
    const allCat: Category = {
      id: 'all',
      slug: 'all',
      name: { ar: 'الكل', en: 'All' },
      sortOrder: 0,
      isActive: true,
      productCount: products.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return [allCat, ...storeCategories];
  }, [storeCategories, products.length]);

  // Resolve category from URL parameter (matches either id or slug)
  const resolveCategoryId = (param: string | null): string => {
    if (!param || param === 'all') return 'all';
    const match = storeCategories.find(
      (c) => c.id.toLowerCase() === param.toLowerCase() || c.slug?.toLowerCase() === param.toLowerCase()
    );
    return match ? match.id : param;
  };

  const initialParam = searchParams.get('category');
  const [selectedCategory, setSelectedCategory] = useState<string>(() => resolveCategoryId(initialParam));
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Sync state when URL query params change
  useEffect(() => {
    const param = searchParams.get('category');
    const resolved = resolveCategoryId(param);
    setSelectedCategory(resolved);

    if (param && param !== 'all' && menuNavRef.current) {
      menuNavRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [searchParams, storeCategories]);

  const isSelectedCategoryActive = useIsCategoryActive(selectedCategory);
  const isSelectedCategoryDisabled = selectedCategory !== 'all' && !isSelectedCategoryActive;

  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(catId);
    if (catId === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', catId);
    }
    setSearchParams(searchParams);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === 'all' || product.categoryId === selectedCategory;

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        product.name.ar.toLowerCase().includes(query) ||
        product.description.ar.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-28 sm:pb-36 space-y-8 relative">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black text-dark">
          منيو مانشيز
        </h1>
        <p className="text-sm text-medium-gray">
          اختار اللي على مزاجك، وإحنا هنجهزهولك Fresh وسخن!
        </p>
      </div>

      {/* Controls: Search & Category Navigation */}
      <div ref={menuNavRef} className="space-y-4 scroll-mt-24">
        <div className="max-w-md mx-auto">
          <ProductSearch value={searchQuery} onChange={setSearchQuery} />
        </div>

        <CategoryNav
          categories={allCategories}
          activeCategoryId={selectedCategory}
          onSelectCategory={handleSelectCategory}
        />
      </div>

      {/* Warning banner when selected category is inactive */}
      {isSelectedCategoryDisabled && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex items-center gap-3 shadow-xs animate-fadeIn">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-amber-900">
              القسم ده مش متاح للطلب دلوقتي
            </h3>
            <p className="text-xs text-amber-800 mt-0.5">
              تقدر تشوف الأصناف هنا، بس مش متاح تضيفها للسلة حالياً.
            </p>
          </div>
        </div>
      )}

      {/* Products result count */}
      <div className="flex items-center justify-between text-xs text-medium-gray border-b border-border pb-3">
        <span>
          عدد الأصناف: <strong className="text-dark tabular-nums">{filteredProducts.length}</strong>
        </span>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-primary font-bold hover:underline cursor-pointer"
          >
            امسح البحث
          </button>
        )}
      </div>

      {/* Horizontal Cards Grid or Empty */}
      {filteredProducts.length === 0 ? (
        <div className="py-12">
          <EmptyState
            icon={Utensils}
            title="ملقيناش اللي بتدور عليه!"
            description="جرّب تدور بكلمة تانية."
            actionLabel="شوف كل المنيو"
            onAction={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
          />
        </div>
      ) : (
        <ProductGrid products={filteredProducts} />
      )}

      {/* Fixed Interactive Bottom Cart Bar */}
      <FixedCartBar />
    </div>
  );
};
