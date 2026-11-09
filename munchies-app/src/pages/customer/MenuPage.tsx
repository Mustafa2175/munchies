/**
 * @module pages/customer/MenuPage
 * @description Full interactive menu page with search, categories, and direct ordering. Strictly Arabic.
 */

import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Utensils, AlertTriangle } from 'lucide-react';
import { CategoryNav } from '@/components/product/CategoryNav';
import { ProductSearch } from '@/components/product/ProductSearch';
import { ProductGrid } from '@/components/product/ProductGrid';
import { EmptyState } from '@/components/ui/EmptyState';
import { useProductStore } from '@/stores/productStore';
import { useCategoryStore, useIsCategoryActive } from '@/stores/categoryStore';
import type { Category } from '@/types';

export const MenuPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const products = useProductStore((s) => s.products);
  const storeCategories = useCategoryStore((s) => s.categories);

  const initialCat = searchParams.get('category') || 'all';
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCat);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const isSelectedCategoryActive = useIsCategoryActive(selectedCategory);
  const isSelectedCategoryDisabled = selectedCategory !== 'all' && !isSelectedCategoryActive;

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
      // Category match
      const matchesCategory =
        selectedCategory === 'all' || product.categoryId === selectedCategory;

      // Search match
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        product.name.ar.toLowerCase().includes(query) ||
        product.description.ar.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black text-[#26212B]">
          قائمة طعام مانشيز
        </h1>
        <p className="text-sm text-gray-500">
          اختر ما يروق لمزاجك من أطباقنا اللذيذة والطازجة واستلمها ساخنة
        </p>
      </div>

      {/* Controls: Search & Category Navigation */}
      <div className="space-y-4">
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
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 flex items-center gap-3 shadow-xs animate-fadeIn">
          <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-amber-900">
              ⚠️ هذا القسم غير متاح للطلب حالياً
            </h3>
            <p className="text-xs text-amber-800 mt-0.5">
              أصناف هذا القسم للعرض فقط ولا يمكن إضافتها للسلة أو طلبها في الوقت الحالي.
            </p>
          </div>
        </div>
      )}

      {/* Products result count */}
      <div className="flex items-center justify-between text-xs text-gray-500 border-b border-gray-100 pb-3">
        <span>
          عرض {filteredProducts.length} صنف
        </span>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-[#512080] font-bold hover:underline cursor-pointer"
          >
            مسح البحث
          </button>
        )}
      </div>

      {/* Grid or Empty */}
      {filteredProducts.length === 0 ? (
        <div className="py-12">
          <EmptyState
            icon={Utensils}
            title="لم يتم العثور على نتائج تطابق بحثك"
            description="جرب البحث بكلمة أخرى أو تصفح الأقسام المختلفة."
            actionLabel="عرض كل الأصناف"
            onAction={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
          />
        </div>
      ) : (
        <ProductGrid products={filteredProducts} />
      )}
    </div>
  );
};
