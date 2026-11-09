/**
 * @module components/product/CustomizationModal
 * @description Modal for selecting bread, cheeses, additions, and special instructions. Strictly Arabic.
 * Evaluates both individual product availability and restaurant open/close status.
 */

import React, { useState } from 'react';
import { Check, Ban, Clock } from 'lucide-react';
import type { Product, CustomizationGroup } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
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
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Reset or initialize when product changes
  React.useEffect(() => {
    if (!product) return;
    setQuantity(1);
    setSpecialInstructions('');

    // Pre-select defaults
    const defaults: Record<string, string[]> = {};
    if (product.customizationGroups) {
      product.customizationGroups.forEach((group: CustomizationGroup) => {
        const defaultOpt = group.options?.find((o) => o.isDefault);
        if (defaultOpt) {
          defaults[group.id] = [defaultOpt.id];
        } else if (group.isRequired && group.options && group.options.length > 0) {
          defaults[group.id] = [group.options[0].id];
        } else {
          defaults[group.id] = [];
        }
      });
    }
    setSelectedOptionsByGroup(defaults);
  }, [product]);

  if (!product) return null;

  const isProductBaseAvailable = isProductAvailable(product);
  const isAvailable = isProductBaseAvailable && isCategoryActive;
  const isOrderable = isAvailable && isStoreOpen;
  const productName = product.name.ar;
  const productDesc = product.description.ar;

  const handleOptionToggle = (group: CustomizationGroup, optionId: string) => {
    if (!isOrderable) return;
    const current = selectedOptionsByGroup[group.id] || [];

    if (group.type === 'single') {
      setSelectedOptionsByGroup({
        ...selectedOptionsByGroup,
        [group.id]: [optionId],
      });
    } else {
      // Multiple
      if (current.includes(optionId)) {
        setSelectedOptionsByGroup({
          ...selectedOptionsByGroup,
          [group.id]: current.filter((id) => id !== optionId),
        });
      } else {
        const max = group.maxSelections || 10;
        if (current.length < max) {
          setSelectedOptionsByGroup({
            ...selectedOptionsByGroup,
            [group.id]: [...current, optionId],
          });
        }
      }
    }
  };

  // Calculate live total
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

    addItem({
      productId: product.id,
      name: product.name,
      image: product.image,
      basePrice: product.price,
      quantity,
      customizations: formattedCustomizations,
      specialInstructions: specialInstructions.trim() || undefined,
    });
    toast.success(`تمت إضافة "${productName}" إلى السلة`);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="space-y-6">
        {/* Product Header */}
        <div className="flex gap-4 items-start">
          <img
            src={product.image}
            alt={productName}
            className={`w-24 h-24 rounded-2xl object-cover shrink-0 border border-gray-100 shadow-xs transition-all ${
              !isAvailable ? 'grayscale opacity-60' : ''
            }`}
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-black text-[#26212B]">{productName}</h3>
              {!isCategoryActive ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                  <Ban className="w-3 h-3" />
                  <span>القسم غير متاح حالياً</span>
                </span>
              ) : !isProductBaseAvailable ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                  <Ban className="w-3 h-3" />
                  <span>غير متوفر حالياً</span>
                </span>
              ) : !isStoreOpen ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  <Clock className="w-3 h-3" />
                  <span>المطعم مغلق حالياً</span>
                </span>
              ) : null}
            </div>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">{productDesc}</p>
            <div className="mt-2 text-base font-extrabold text-[#512080]">
              <CurrencyDisplay amount={product.price} />
            </div>
          </div>
        </div>

        {/* Customization Groups */}
        {product.customizationGroups && product.customizationGroups.length > 0 && (
          <div className="space-y-5 border-t border-gray-100 pt-4">
            {product.customizationGroups.map((group: CustomizationGroup) => {
              const selectedIds = selectedOptionsByGroup[group.id] || [];
              const groupTitle = group.name.ar;

              return (
                <div key={group.id} className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-[#26212B] flex items-center gap-1.5">
                      <span>{groupTitle}</span>
                      {group.isRequired && (
                        <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">
                          إجباري
                        </span>
                      )}
                    </h4>
                    {group.type === 'multiple' && (
                      <span className="text-xs text-gray-400">
                        اختر حتى {group.maxSelections || 5}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {group.options?.map((option) => {
                      const isSelected = selectedIds.includes(option.id);
                      const optName = option.name.ar;

                      return (
                        <div
                          key={option.id}
                          onClick={() => handleOptionToggle(group, option.id)}
                          className={`flex items-center justify-between p-3 rounded-xl border text-sm transition-all ${
                            !isOrderable
                              ? 'cursor-not-allowed opacity-70 border-gray-200 bg-gray-50'
                              : isSelected
                              ? 'border-[#512080] bg-[#F3EDFA] text-[#512080] font-bold shadow-xs cursor-pointer'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all ${
                                isSelected
                                  ? 'border-[#512080] bg-[#512080] text-white'
                                  : 'border-gray-300'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className="text-xs">{optName}</span>
                          </div>
                          {option.price > 0 && (
                            <span className="text-xs font-semibold text-[#512080]">
                              +<CurrencyDisplay amount={option.price} />
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Special Instructions */}
        <div className="space-y-1.5 border-t border-gray-100 pt-4">
          <label className="text-xs font-bold text-[#26212B]">
            ملاحظات خاصة للمطبخ
          </label>
          <input
            type="text"
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            placeholder="مثال: بدون بصل، زيادة صوص..."
            disabled={!isOrderable}
            className="w-full text-xs rounded-xl border border-gray-200 p-2.5 focus:outline-none focus:border-[#512080] disabled:bg-gray-50 disabled:text-gray-400"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 gap-4">
          <QuantitySelector value={quantity} onChange={setQuantity} disabled={!isOrderable} />
          <Button
            variant={isOrderable ? 'yellow' : 'ghost'}
            disabled={!isOrderable}
            onClick={handleAddToCart}
            fullWidth
            size="lg"
            className={
              !isAvailable
                ? 'bg-red-50 text-red-600 border border-red-200 cursor-not-allowed font-bold opacity-90 hover:bg-red-50 hover:text-red-600'
                : !isStoreOpen
                ? 'bg-amber-50 text-amber-700 border border-amber-200 cursor-not-allowed font-bold opacity-90 hover:bg-amber-50 hover:text-amber-700'
                : ''
            }
          >
            {!isCategoryActive ? (
              <span>القسم غير متاح حالياً</span>
            ) : !isProductBaseAvailable ? (
              <span>غير متوفر حالياً</span>
            ) : !isStoreOpen ? (
              <span>المطعم مغلق حالياً</span>
            ) : (
              <>
                <span>أضف للسلة</span>
                <span className="mx-2 font-black">•</span>
                <CurrencyDisplay amount={totalPrice} />
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
