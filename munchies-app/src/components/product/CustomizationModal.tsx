/**
 * @module components/product/CustomizationModal
 * @description Product details and customization modal matching the Mawloof reference.
 * Features:
 * - Prominent food hero photography at top
 * - Clean Arabic RTL typography and product description
 * - Collapsible dropdown/accordion customization groups
 * - Standardized terminology: "مطلوب" (Required) and "اختياري" (Optional)
 * - Fixed bottom ordering bar with quantity selector (+ / -), live EGP pricing, and full-width CTA
 * - Dedicated full-screen sheet on mobile, spacious modal on desktop
 */

import React, { useState, useEffect } from 'react';
import {
  Check,
  Ban,
  Clock,
  ChevronDown,
  Plus,
  Minus,
  ArrowLeft,
} from 'lucide-react';
import type { Product, CustomizationGroup, CustomizationOption } from '@/types';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { useCartStore } from '@/stores/cartStore';
import { isProductAvailable } from '@/stores/productStore';
import { useIsStoreOpen } from '@/stores/restaurantStore';
import { useIsCategoryActive } from '@/stores/categoryStore';
import toast from 'react-hot-toast';

export interface CustomizationModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CustomizationModal: React.FC<CustomizationModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const addItem = useCartStore((state) => state.addItem);
  const isStoreOpen = useIsStoreOpen();
  const isCategoryActive = useIsCategoryActive(product?.categoryId);

  const [quantity, setQuantity] = useState(1);
  const [selectedOptionsByGroup, setSelectedOptionsByGroup] = useState<Record<string, string[]>>({});
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Lock body scroll and register escape key listener when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset or initialize when product changes
  useEffect(() => {
    if (!product) return;
    setQuantity(1);
    setSpecialInstructions('');

    const defaults: Record<string, string[]> = {};
    const initialOpen: Record<string, boolean> = {};

    if (product.customizationGroups) {
      product.customizationGroups.forEach((group: CustomizationGroup, idx: number) => {
        const isRequired = Boolean(
          group.isRequired ||
          (group.minSelections && group.minSelections > 0) ||
          (group.minSelect && group.minSelect > 0)
        );

        initialOpen[group.id] = isRequired || idx === 0;

        const defaultOpt = group.options?.find((o) => o.isDefault);
        if (defaultOpt) {
          defaults[group.id] = [defaultOpt.id];
        } else if (isRequired && group.options && group.options.length > 0 && group.type === 'single') {
          defaults[group.id] = [group.options[0].id];
        } else {
          defaults[group.id] = [];
        }
      });
    }

    setSelectedOptionsByGroup(defaults);
    setOpenGroups(initialOpen);
  }, [product]);

  if (!isOpen || !product) return null;

  const isProductBaseAvailable = isProductAvailable(product);
  const isAvailable = isProductBaseAvailable && isCategoryActive;
  const isOrderable = isAvailable && isStoreOpen;
  const productName = product.name.ar;
  const productDesc = product.description.ar;
  const displayImage = product.image || '/hero_burger_clean_cutout.png';

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const handleOptionToggle = (group: CustomizationGroup, optionId: string) => {
    if (!isOrderable) return;
    const current = selectedOptionsByGroup[group.id] || [];
    const isSingle = group.type === 'single' || group.maxSelections === 1;

    if (isSingle) {
      setSelectedOptionsByGroup((prev) => ({
        ...prev,
        [group.id]: [optionId],
      }));
    } else {
      if (current.includes(optionId)) {
        setSelectedOptionsByGroup((prev) => ({
          ...prev,
          [group.id]: current.filter((id) => id !== optionId),
        }));
      } else {
        const max = group.maxSelections || 10;
        if (current.length >= max) {
          toast.error(`الحد الأقصى للاختيار هو ${max}`);
          return;
        }
        setSelectedOptionsByGroup((prev) => ({
          ...prev,
          [group.id]: [...current, optionId],
        }));
      }
    }
  };

  // Calculate live total price
  let additionSum = 0;
  const formattedCustomizations: any[] = [];

  if (product.customizationGroups) {
    product.customizationGroups.forEach((group: CustomizationGroup) => {
      const selectedIds = selectedOptionsByGroup[group.id] || [];
      const chosenOpts = group.options?.filter((o) => selectedIds.includes(o.id)) || [];

      if (chosenOpts.length > 0) {
        formattedCustomizations.push({
          groupId: group.id,
          groupName: group.name,
          selectedOptions: chosenOpts.map((o) => ({
            optionId: o.id,
            name: o.name,
            price: o.price,
          })),
        });
        additionSum += chosenOpts.reduce((acc, opt) => acc + opt.price, 0);
      }
    });
  }

  const unitPrice = product.price + additionSum;
  const totalPrice = unitPrice * quantity;

  const handleIncrement = () => {
    if (!isOrderable) return;
    if (quantity < 99) setQuantity((q) => q + 1);
  };

  const handleDecrement = () => {
    if (!isOrderable) return;
    if (quantity > 1) setQuantity((q) => q - 1);
  };

  const handleAddToCart = () => {
    if (!isStoreOpen) {
      toast.error('المطعم مغلق حالياً ولا يستقبل طلبات جديدة');
      return;
    }
    if (!isCategoryActive) {
      toast.error('عذراً، هذا القسم غير متاح للطلب حالياً');
      return;
    }
    if (!isProductBaseAvailable) {
      toast.error('عذراً، هذا الصنف غير متوفر للطلب حالياً');
      return;
    }

    if (product.customizationGroups) {
      for (const group of product.customizationGroups) {
        const isRequiredGroup = Boolean(
          group.isRequired ||
          (group.minSelections && group.minSelections > 0) ||
          (group.minSelect && group.minSelect > 0)
        );
        const selectedCount = selectedOptionsByGroup[group.id]?.length || 0;
        const minRequired = group.minSelections || (group.isRequired ? 1 : 0);

        if (isRequiredGroup && selectedCount < minRequired) {
          setOpenGroups((prev) => ({ ...prev, [group.id]: true }));
          toast.error(`يرجى تحديد "${group.name.ar}" (مطلوب) للمتابعة`);
          return;
        }
      }
    }

    addItem({
      productId: product.id,
      name: product.name,
      image: displayImage,
      basePrice: product.price,
      quantity,
      customizations: formattedCustomizations,
      specialInstructions: specialInstructions.trim() || undefined,
    });

    toast.success(`تمت إضافة "${productName}" إلى السلة`);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-dark/60 backdrop-blur-xs animate-fade-in"
      dir="rtl"
    >
      <div
        className="fixed inset-0 hidden sm:block"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="relative z-10 w-full sm:max-w-xl md:max-w-2xl h-[100dvh] sm:h-auto sm:max-h-[90vh] bg-white sm:rounded-2xl shadow-card-hover border-0 sm:border border-border flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label={`تخصيص ${productName}`}
      >
        {/* Top Header */}
        <header className="bg-primary text-white px-4 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between shrink-0 z-20">
          <h2 className="text-sm sm:text-base font-black tracking-tight text-white truncate max-w-[70%]">
            {productName}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs sm:text-sm font-bold transition-all cursor-pointer"
            aria-label="إغلاق والرجوع"
          >
            <span>رجوع</span>
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          </button>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain no-scrollbar">
          {/* Food Photography */}
          <div className="relative w-full h-56 xs:h-64 sm:h-72 bg-light-gray overflow-hidden shrink-0 select-none flex items-center justify-center p-4">
            <img
              src={displayImage}
              alt={productName}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/hero_burger_clean_cutout.png';
              }}
              className={`w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.15)] transition-all duration-300 ${
                !isAvailable ? 'grayscale opacity-60' : ''
              }`}
            />

            {/* Availability Badges Overlay */}
            <div className="absolute top-3 start-3 flex flex-col gap-1.5 z-10">
              {!isCategoryActive ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-white bg-danger px-3 py-1 rounded-full shadow-xs">
                  <Ban className="w-3.5 h-3.5" />
                  <span>القسم غير متاح حالياً</span>
                </span>
              ) : !isProductBaseAvailable ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-white bg-danger px-3 py-1 rounded-full shadow-xs">
                  <Ban className="w-3.5 h-3.5" />
                  <span>غير متوفر حالياً</span>
                </span>
              ) : !isStoreOpen ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-white bg-warning-800 px-3 py-1 rounded-full shadow-xs">
                  <Clock className="w-3.5 h-3.5" />
                  <span>المطعم مغلق حالياً</span>
                </span>
              ) : null}
            </div>
          </div>

          {/* Product Info & Customization Accordions */}
          <div className="p-4 sm:p-6 space-y-5 pb-36 sm:pb-36">
            <div className="space-y-1.5">
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-xl sm:text-2xl font-black text-dark">
                  {productName}
                </h1>
                <div className="text-lg sm:text-xl font-extrabold text-primary shrink-0">
                  <CurrencyDisplay amount={product.price} />
                </div>
              </div>

              {productDesc && (
                <p className="text-xs sm:text-sm text-medium-gray leading-relaxed pt-0.5">
                  {productDesc}
                </p>
              )}
            </div>

            {/* Customization Accordion Groups */}
            {product.customizationGroups && product.customizationGroups.length > 0 && (
              <div className="space-y-3 pt-1">
                {product.customizationGroups.map((group: CustomizationGroup) => {
                  const isGroupOpen = Boolean(openGroups[group.id]);
                  const isRequired = Boolean(
                    group.isRequired ||
                    (group.minSelections && group.minSelections > 0) ||
                    (group.minSelect && group.minSelect > 0)
                  );
                  const isSingle = group.type === 'single' || group.maxSelections === 1;
                  const selectedIds = selectedOptionsByGroup[group.id] || [];

                  const selectedOpts =
                    group.options?.filter((o) => selectedIds.includes(o.id)) || [];
                  const summaryText =
                    selectedOpts.length > 0
                      ? selectedOpts.map((o) => o.name.ar).join('، ')
                      : isRequired
                      ? 'يرجى الاختيار'
                      : 'لا توجد إضافات مختارة';

                  return (
                    <div
                      key={group.id}
                      className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden transition-all duration-200"
                    >
                      {/* Accordion Trigger Header */}
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.id)}
                        className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-3 text-start hover:bg-light-gray/50 transition-colors cursor-pointer select-none"
                        aria-expanded={isGroupOpen}
                      >
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm sm:text-base font-extrabold text-dark">
                              {group.name.ar}
                            </h3>

                            {isRequired ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-danger-light text-danger border border-danger/20">
                                مطلوب
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-warning-light text-warning-800 border border-warning/20">
                                اختياري
                              </span>
                            )}

                            {!isSingle && group.maxSelections && (
                              <span className="text-[11px] text-medium-gray font-medium">
                                (اختر حتى {group.maxSelections})
                              </span>
                            )}
                          </div>

                          <p
                            className={`text-xs truncate ${
                              selectedOpts.length > 0
                                ? 'text-primary font-bold'
                                : 'text-medium-gray'
                            }`}
                          >
                            {summaryText}
                          </p>
                        </div>

                        <div className="w-8 h-8 rounded-full bg-light-gray flex items-center justify-center shrink-0">
                          <ChevronDown
                            className={`w-4 h-4 text-medium-gray transition-transform duration-200 ${
                              isGroupOpen ? 'rotate-180 text-primary' : ''
                            }`}
                          />
                        </div>
                      </button>

                      {/* Options List */}
                      {isGroupOpen && (
                        <div className="p-3 sm:p-4 pt-1 border-t border-border space-y-2 bg-[#FCFBFE]">
                          {group.options?.map((option: CustomizationOption) => {
                            const isSelected = selectedIds.includes(option.id);
                            const isOptionAvailable = option.isAvailable !== false;

                            return (
                              <div
                                key={option.id}
                                onClick={() => {
                                  if (isOptionAvailable && isOrderable) {
                                    handleOptionToggle(group, option.id);
                                  }
                                }}
                                className={`p-3 sm:p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all select-none ${
                                  !isOptionAvailable || !isOrderable
                                    ? 'opacity-50 cursor-not-allowed bg-light-gray border-border'
                                    : isSelected
                                    ? 'border-primary bg-primary-50 ring-1 ring-primary/20 shadow-xs cursor-pointer'
                                    : 'border-border bg-white hover:border-gray-300 hover:bg-light-gray/30 cursor-pointer'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  {isSingle ? (
                                    <div
                                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                        isSelected
                                          ? 'border-primary bg-white'
                                          : 'border-gray-300 bg-white'
                                      }`}
                                    >
                                      {isSelected && (
                                        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                                      )}
                                    </div>
                                  ) : (
                                    <div
                                      className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${
                                        isSelected
                                          ? 'border-primary bg-primary text-white'
                                          : 'border-gray-300 bg-white'
                                      }`}
                                    >
                                      {isSelected && (
                                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                                      )}
                                    </div>
                                  )}

                                  <span
                                    className={`text-xs sm:text-sm font-bold ${
                                      isSelected
                                        ? 'text-primary'
                                        : 'text-dark'
                                    }`}
                                  >
                                    {option.name.ar}
                                  </span>
                                </div>

                                <div className="shrink-0 text-start">
                                  {option.price > 0 ? (
                                    <span className="text-xs sm:text-sm font-black text-primary">
                                      +<CurrencyDisplay amount={option.price} />
                                    </span>
                                  ) : (
                                    <span className="text-xs text-medium-gray font-bold">
                                      مجاناً
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Special Instructions */}
            <div className="bg-white rounded-2xl border border-border p-4 shadow-xs space-y-2">
              <label className="block text-xs sm:text-sm font-bold text-dark">
                ملاحظات خاصة للمطبخ (اختياري)
              </label>
              <textarea
                rows={2}
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="مثال: بدون بصل، زيادة صوص، بدون مخلل..."
                disabled={!isOrderable}
                className="w-full text-xs sm:text-sm rounded-xl border border-border p-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:bg-light-gray disabled:text-medium-gray resize-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Fixed Sticky Bottom Ordering Bar */}
        <footer
          className="bg-white/95 backdrop-blur-md border-t border-border p-3.5 sm:p-4 shadow-card-hover z-30 shrink-0 space-y-3"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.85rem)' }}
        >
          {/* Row 1: Quantity Selector & Live Total Price */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center bg-light-gray rounded-2xl p-1 border border-border">
              <button
                type="button"
                onClick={handleDecrement}
                disabled={!isOrderable || quantity <= 1}
                className="w-9 h-9 rounded-xl bg-white text-primary shadow-xs flex items-center justify-center font-black hover:bg-gray-50 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                aria-label="تقليل الكمية"
              >
                <Minus className="w-4 h-4 stroke-[3]" />
              </button>
              <span className="w-9 text-center font-black text-sm sm:text-base text-dark select-none tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                onClick={handleIncrement}
                disabled={!isOrderable || quantity >= 99}
                className="w-9 h-9 rounded-xl bg-primary text-white shadow-xs flex items-center justify-center font-black hover:bg-primary-600 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                aria-label="زيادة الكمية"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
              </button>
            </div>

            <div className="text-start">
              <span className="text-[11px] font-bold text-medium-gray block leading-tight">
                الإجمالي
              </span>
              <div className="text-xl sm:text-2xl font-black text-primary">
                <CurrencyDisplay amount={totalPrice} />
              </div>
            </div>
          </div>

          {/* Row 2: Add to Cart Full Width CTA Button */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!isOrderable}
            className={`w-full py-3.5 sm:py-4 rounded-xl font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer select-none active:scale-[0.99] ${
              !isAvailable
                ? 'bg-danger-light text-danger border border-danger/30 cursor-not-allowed opacity-90'
                : !isStoreOpen
                ? 'bg-warning-light text-warning-800 border border-warning/30 cursor-not-allowed opacity-90'
                : 'bg-primary hover:bg-primary-600 text-white shadow-primary/20'
            }`}
          >
            {!isCategoryActive ? (
              <span>القسم غير متاح حالياً</span>
            ) : !isProductBaseAvailable ? (
              <span>غير متوفر حالياً</span>
            ) : !isStoreOpen ? (
              <span>المطعم مغلق حالياً</span>
            ) : (
              <>
                <span>أضف إلى السلة</span>
                <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
};
