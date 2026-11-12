/**
 * @module components/sandwich-builder/BuilderSummary
 * @description Clean, minimal desktop summary panel for current sandwich selections and price.
 * Displays selected layers, nutritional totals, and live price breakdown.
 */

import React from 'react';
import { formatPrice } from '@/lib/currency';
import type { BuilderItem } from '@/data/buildYourOwnData';

interface BuilderSummaryProps {
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
  };
}

const STEP_LABELS: Record<string, string> = {
  protein: 'البروتين',
  bread: 'العيش',
  cheese: 'الجبن واللحوم',
  toppings: 'الإضافات والصوصات',
};

export const BuilderSummary: React.FC<BuilderSummaryProps> = ({
  selections,
  basePrice,
  addonsPrice,
  unitPrice,
  totalPrice,
  quantity,
  totalNutrition,
}) => {
  const hasAnySelection = Object.values(selections).some((arr) => arr.length > 0);

  return (
    <div className="bg-white rounded-xl border border-border p-5 space-y-5">
      {/* Header */}
      <div className="pb-3 border-b border-border">
        <h3 className="font-bold text-sm text-dark">
          ملخص الساندوتش
        </h3>
      </div>

      {/* Selected Items Breakdown */}
      {hasAnySelection ? (
        <div className="space-y-4 text-xs">
          {Object.entries(STEP_LABELS).map(([stepId, label]) => {
            const items = selections[stepId] || [];
            if (items.length === 0) return null;

            return (
              <div key={stepId} className="space-y-1.5">
                <span className="font-bold text-medium-gray text-[11px] block">
                  {label}
                </span>
                <div className="space-y-1 pr-1">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between"
                    >
                      <span className="text-dark font-medium truncate ml-2">
                        {item.name.ar}
                      </span>
                      <span className="text-dark tabular-nums number-ltr shrink-0 font-medium">
                        {stepId === 'protein'
                          ? formatPrice(item.price)
                          : item.price > 0
                          ? `+${formatPrice(item.price)}`
                          : 'مشمل'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-medium-gray text-center py-4">
          لم يتم تحديد مكونات بعد
        </p>
      )}

      {/* Nutrition Summary (Clean text row) */}
      {hasAnySelection && (
        <div className="pt-3 border-t border-border flex items-center justify-between text-[11px] text-medium-gray">
          <span>{totalNutrition.calories} كالوري</span>
          <span>•</span>
          <span>{totalNutrition.protein}جم بروتين</span>
          <span>•</span>
          <span>{totalNutrition.carbs}جم كارب</span>
          <span>•</span>
          <span>{totalNutrition.fat}جم دهون</span>
        </div>
      )}

      {/* Price Summary */}
      {hasAnySelection && (
        <div className="pt-3 border-t border-border space-y-2 text-xs">
          {basePrice > 0 && (
            <div className="flex items-center justify-between text-medium-gray">
              <span>سعر البروتين الأساسي</span>
              <span className="text-dark tabular-nums number-ltr font-medium">
                {formatPrice(basePrice)}
              </span>
            </div>
          )}
          {addonsPrice > 0 && (
            <div className="flex items-center justify-between text-medium-gray">
              <span>الإضافات</span>
              <span className="text-dark tabular-nums number-ltr font-medium">
                +{formatPrice(addonsPrice)}
              </span>
            </div>
          )}
          {quantity > 1 && (
            <div className="flex items-center justify-between text-medium-gray">
              <span>سعر الساندوتش الواحد</span>
              <span className="text-dark tabular-nums number-ltr font-medium">
                {formatPrice(unitPrice)}
              </span>
            </div>
          )}
          {quantity > 1 && (
            <div className="flex items-center justify-between text-medium-gray">
              <span>الكمية</span>
              <span className="text-dark tabular-nums number-ltr font-medium">
                × {quantity}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-border text-sm">
            <span className="font-bold text-dark">الإجمالي</span>
            <span className="font-black text-lg text-primary tabular-nums number-ltr">
              {formatPrice(totalPrice)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
