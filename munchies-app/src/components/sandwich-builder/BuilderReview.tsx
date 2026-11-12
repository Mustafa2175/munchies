/**
 * @module components/sandwich-builder/BuilderReview
 * @description Final review screen for Munchie's Build Your Own Sandwich.
 * Minimal, professional layout detailing selected ingredients, nutrition, price, and quantity.
 */

import React from 'react';
import { ShoppingBag, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/currency';
import type { BuilderItem } from '@/data/buildYourOwnData';

interface BuilderReviewProps {
  selections: Record<string, BuilderItem[]>;
  basePrice: number;
  addonsPrice: number;
  unitPrice: number;
  totalPrice: number;
  quantity: number;
  totalNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    grams: number;
  };
  onChangeQuantity: (qty: number) => void;
  onAddToCart: () => void;
  onEditStep: (stepIndex: number) => void;
  isLoading?: boolean;
}

const SAUCE_IDS = ['top_sauce'];

export const BuilderReview: React.FC<BuilderReviewProps> = ({
  selections,
  basePrice,
  addonsPrice,
  unitPrice,
  totalPrice,
  quantity,
  totalNutrition,
  onChangeQuantity,
  onAddToCart,
  onEditStep,
  isLoading = false,
}) => {
  const protein = selections['protein']?.[0];
  const bread = selections['bread']?.[0];
  const cheeses = selections['cheese'] || [];
  const allToppingItems = selections['toppings'] || [];

  const toppings = allToppingItems.filter((t) => !SAUCE_IDS.includes(t.id));
  const sauces = allToppingItems.filter((t) => SAUCE_IDS.includes(t.id));

  const reviewRows = [
    {
      id: 'protein',
      label: 'البروتين',
      stepIndex: 0,
      items: protein ? [protein] : [],
      emptyText: 'لم يتم التحديد',
    },
    {
      id: 'bread',
      label: 'نوع العيش',
      stepIndex: 1,
      items: bread ? [bread] : [],
      emptyText: 'لم يتم التحديد',
    },
    {
      id: 'cheese',
      label: 'الجبن واللحوم الباردة',
      stepIndex: 2,
      items: cheeses,
      emptyText: 'بدون إضافات',
    },
    {
      id: 'toppings',
      label: 'الإضافات',
      stepIndex: 3,
      items: toppings,
      emptyText: 'بدون إضافات',
    },
    {
      id: 'sauces',
      label: 'الصوصات',
      stepIndex: 3,
      items: sauces,
      emptyText: 'بدون صوص',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-slide-in">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold text-dark">
          ساندوتشك الخاص
        </h2>
        <p className="text-xs sm:text-sm text-medium-gray">
          راجع اختياراتك قبل إتمام الطلب
        </p>
      </div>

      {/* Selected Ingredients Breakdown */}
      <div className="bg-white rounded-xl border border-border divide-y divide-border">
        {reviewRows.map((row) => {
          const hasItems = row.items.length > 0;

          return (
            <div
              key={row.id}
              className="p-4 flex items-start justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-medium-gray block">
                  {row.label}
                </span>

                {!hasItems ? (
                  <span className="text-xs text-medium-gray italic mt-1 block">
                    {row.emptyText}
                  </span>
                ) : (
                  <div className="mt-1 space-y-1">
                    {row.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-xs sm:text-sm"
                      >
                        <span className="text-dark font-medium truncate ml-2">
                          {item.name.ar}
                        </span>
                        <span className="text-dark tabular-nums number-ltr shrink-0 font-medium">
                          {row.id === 'protein'
                            ? formatPrice(item.price)
                            : item.price > 0
                            ? `+${formatPrice(item.price)}`
                            : 'مشمل'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Edit link */}
              <button
                type="button"
                onClick={() => onEditStep(row.stepIndex)}
                className="text-xs text-primary hover:underline font-bold shrink-0 pt-0.5 cursor-pointer"
              >
                تعديل
              </button>
            </div>
          );
        })}
      </div>

      {/* Nutrition Information */}
      <div className="bg-light-gray/60 rounded-xl p-3.5 flex items-center justify-around text-center text-xs text-medium-gray">
        <div>
          <span className="block font-bold text-dark text-sm tabular-nums">
            {totalNutrition.calories}
          </span>
          <span className="text-[11px]">سعرة حرارية</span>
        </div>
        <div className="w-px h-6 bg-border" />
        <div>
          <span className="block font-bold text-dark text-sm tabular-nums">
            {totalNutrition.protein}g
          </span>
          <span className="text-[11px]">بروتين</span>
        </div>
        <div className="w-px h-6 bg-border" />
        <div>
          <span className="block font-bold text-dark text-sm tabular-nums">
            {totalNutrition.carbs}g
          </span>
          <span className="text-[11px]">كارب</span>
        </div>
        <div className="w-px h-6 bg-border" />
        <div>
          <span className="block font-bold text-dark text-sm tabular-nums">
            {totalNutrition.fat}g
          </span>
          <span className="text-[11px]">دهون</span>
        </div>
      </div>

      {/* Pricing & Quantity Card */}
      <div className="bg-white rounded-xl border border-border p-4 sm:p-5 space-y-4">
        <div className="space-y-2 text-xs sm:text-sm">
          <div className="flex items-center justify-between text-medium-gray">
            <span>سعر البروتين الأساسي</span>
            <span className="text-dark font-medium tabular-nums number-ltr">
              {formatPrice(basePrice)}
            </span>
          </div>

          {addonsPrice > 0 && (
            <div className="flex items-center justify-between text-medium-gray">
              <span>الإضافات</span>
              <span className="text-dark font-medium tabular-nums number-ltr">
                +{formatPrice(addonsPrice)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="font-bold text-dark">سعر الساندوتش الواحد</span>
            <span className="font-bold text-dark tabular-nums number-ltr">
              {formatPrice(unitPrice)}
            </span>
          </div>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <span className="text-xs sm:text-sm font-bold text-dark">الكمية</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onChangeQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="w-8 h-8 rounded-lg border border-border bg-white flex items-center justify-center text-dark hover:border-gray-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              aria-label="تقليل الكمية"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-sm font-bold tabular-nums text-dark w-6 text-center">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => onChangeQuantity(quantity + 1)}
              className="w-8 h-8 rounded-lg border border-border bg-white flex items-center justify-center text-dark hover:border-gray-400 transition-colors cursor-pointer"
              aria-label="زيادة الكمية"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Final Total */}
        <div className="flex items-center justify-between pt-3 border-t border-border text-base sm:text-lg">
          <span className="font-bold text-dark">الإجمالي</span>
          <span className="font-black text-xl text-primary tabular-nums number-ltr">
            {formatPrice(totalPrice)}
          </span>
        </div>
      </div>

      {/* Primary CTA (Desktop) */}
      <div className="hidden sm:block pt-2">
        <Button
          variant="yellow"
          size="lg"
          fullWidth
          onClick={onAddToCart}
          leftIcon={ShoppingBag}
          isLoading={isLoading}
          className="font-bold text-base h-12 shadow-sm hover:shadow"
        >
          أضف للسلة — {formatPrice(totalPrice)}
        </Button>
      </div>
    </div>
  );
};
