/**
 * @module pages/customer/ProductDetailsPage
 * @description Product detail view with gallery, ingredients, and customization. Strictly Arabic.
 * Checks both item availability and restaurant open/close status.
 */

import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowRight, Check, Ban, Clock } from 'lucide-react';
import { COMMON_CUSTOMIZATIONS } from '@/data/mockData';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
import { formatPrice } from '@/lib/currency';
import { useCartStore } from '@/stores/cartStore';
import { useProductStore, isProductAvailable } from '@/stores/productStore';
import { useIsStoreOpen } from '@/stores/restaurantStore';
import { useIsCategoryActive } from '@/stores/categoryStore';
import { ROUTES } from '@/config/routes';
import toast from 'react-hot-toast';

export const ProductDetailsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const products = useProductStore((state) => state.products);
  const product = products.find((p) => p.slug === slug || p.id === slug) || products[0];
  const addItem = useCartStore((state) => state.addItem);
  const isStoreOpen = useIsStoreOpen();
  const isCategoryActive = useIsCategoryActive(product?.categoryId);

  const [quantity, setQuantity] = useState(1);
  const [selectedBread, setSelectedBread] = useState('bun_kaiser');
  const [selectedAdditions, setSelectedAdditions] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-dark">ملقيناش الصنف ده</h2>
        <Link to={ROUTES.MENU} className="mt-4 inline-block text-primary font-bold">
          شوف المنيو
        </Link>
      </div>
    );
  }

  const isProductBaseAvailable = isProductAvailable(product);
  const isAvailable = isProductBaseAvailable && isCategoryActive;
  const isOrderable = isAvailable && isStoreOpen;
  const productName = product.name.ar;
  const productDesc = product.description.ar;
  const displayImage =
    product.image && !product.image.includes('unsplash.com')
      ? product.image
      : '/hero_burger_clean_cutout.png';

  const breadGroup = COMMON_CUSTOMIZATIONS.find((g) => g.id === 'bread_type');
  const additionsGroup = COMMON_CUSTOMIZATIONS.find((g) => g.id === 'additions');

  const handleToggleAddition = (id: string) => {
    if (!isOrderable) return;
    if (selectedAdditions.includes(id)) {
      setSelectedAdditions(selectedAdditions.filter((a) => a !== id));
    } else {
      setSelectedAdditions([...selectedAdditions, id]);
    }
  };

  const breadOption = breadGroup?.options?.find((o) => o.id === selectedBread);
  const chosenAdditions =
    additionsGroup?.options?.filter((o) => selectedAdditions.includes(o.id)) || [];

  const additionsTotal =
    (breadOption?.price || 0) +
    chosenAdditions.reduce((sum, opt) => sum + opt.price, 0);

  const unitPrice = product.price + additionsTotal;
  const lineTotal = unitPrice * quantity;

  const handleAddToCart = () => {
    if (!isStoreOpen) {
      toast.error('معلش، إحنا قافلين دلوقتي. راجعنا قريب!');
      return;
    }
    if (!isCategoryActive) {
      toast.error('القسم ده مش متاح للطلب دلوقتي');
      return;
    }
    if (!isProductBaseAvailable) {
      toast.error('الصنف ده خلص مننا مؤقتًا');
      return;
    }

    const customizations = [];
    if (breadOption && breadGroup) {
      customizations.push({
        groupId: breadGroup.id,
        groupName: breadGroup.name,
        selectedOptions: [
          {
            optionId: breadOption.id,
            name: breadOption.name,
            price: breadOption.price,
          },
        ],
      });
    }

    if (chosenAdditions.length > 0 && additionsGroup) {
      customizations.push({
        groupId: additionsGroup.id,
        groupName: additionsGroup.name,
        selectedOptions: chosenAdditions.map((a) => ({
          optionId: a.id,
          name: a.name,
          price: a.price,
        })),
      });
    }

    addItem({
      productId: product.id,
      name: product.name,
      image: displayImage,
      basePrice: product.price,
      quantity,
      customizations,
      specialInstructions: notes.trim() || undefined,
    });

    toast.success(`ضيفنا "${productName}" للسلة!`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Back to menu */}
      <div className="mb-6">
        <Link
          to={ROUTES.MENU}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-medium-gray hover:text-primary transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>ارجع للمنيو</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Product Image */}
        <div className="lg:col-span-6 sticky top-28">
          <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-light-gray shadow-card border border-border">
            <img
              src={displayImage}
              alt={productName}
              className={`w-full h-full object-cover transition-all duration-300 ${
                !isAvailable
                  ? 'grayscale opacity-60 contrast-75'
                  : !isStoreOpen
                  ? 'opacity-90'
                  : ''
              }`}
            />
            <div className="absolute top-4 start-4 flex flex-col gap-1.5">
              {!isCategoryActive ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-danger text-white shadow-xs">
                  <Ban className="w-4 h-4" />
                  <span>القسم مش متاح دلوقتي</span>
                </span>
              ) : !isProductBaseAvailable ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-danger text-white shadow-xs">
                  <Ban className="w-4 h-4" />
                  <span>خلص مننا مؤقتًا</span>
                </span>
              ) : !isStoreOpen ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-warning text-dark shadow-xs">
                  <Clock className="w-4 h-4" />
                  <span>قافلين دلوقتي</span>
                </span>
              ) : (
                <>
                  {product.isBestSeller && (
                    <Badge variant="best-seller">الأكثر طلباً</Badge>
                  )}
                  {product.isNew && <Badge variant="new">جديد</Badge>}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Product Details & Form */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-dark">
              {productName}
            </h1>
            <p className="text-sm text-medium-gray mt-2 leading-relaxed">
              {productDesc}
            </p>
            <div className="mt-4 text-2xl font-black text-primary">
              <span className="font-bold tabular-nums number-ltr">{formatPrice(product.price)}</span>
            </div>
          </div>

          {/* Bread Selection */}
          {breadGroup && (
            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-dark">
                  {breadGroup.name.ar}
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-danger-light text-danger border border-danger/20">
                  مطلوب
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {breadGroup.options?.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={!isOrderable}
                    onClick={() => setSelectedBread(opt.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all text-start cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                      selectedBread === opt.id
                        ? 'border-primary bg-primary-50 text-primary shadow-xs'
                        : 'border-border bg-white text-dark hover:border-gray-300'
                    }`}
                  >
                    <span>{opt.name.ar}</span>
                    {opt.price > 0 && <span>+<span className="font-bold tabular-nums number-ltr">{formatPrice(opt.price)}</span></span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Additions */}
          {additionsGroup && (
            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-dark">
                  {additionsGroup.name.ar}
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-warning-light text-warning-800 border border-warning/20">
                  اختياري
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {additionsGroup.options?.map((opt) => {
                  const isChecked = selectedAdditions.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={!isOrderable}
                      onClick={() => handleToggleAddition(opt.id)}
                      className={`flex flex-col justify-between p-3 rounded-xl border text-xs font-bold transition-all text-start cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                        isChecked
                          ? 'border-primary bg-primary-50 text-primary shadow-xs'
                          : 'border-border bg-white text-dark hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="truncate">{opt.name.ar}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 text-primary" />}
                      </div>
                      <span className="text-[11px] text-medium-gray mt-1">
                        +<span className="font-bold tabular-nums number-ltr">{formatPrice(opt.price)}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5 pt-4 border-t border-border">
            <label className="text-xs font-bold text-dark">
              عندك أي ملاحظات على الطلب؟
            </label>
            <input
              type="text"
              value={notes}
              disabled={!isOrderable}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: من غير بصل، زوّد صوص..."
              className="w-full text-xs rounded-xl border border-border p-3 focus:outline-none focus:border-primary disabled:bg-light-gray disabled:text-medium-gray"
            />
          </div>

          {/* Quantity & CTA */}
          <div className="flex items-center gap-4 pt-4 border-t border-border">
            <QuantitySelector value={quantity} onChange={setQuantity} disabled={!isOrderable} />
            <Button
              variant={isOrderable ? 'yellow' : 'ghost'}
              size="lg"
              fullWidth
              disabled={!isOrderable}
              onClick={handleAddToCart}
              className={
                !isAvailable
                  ? 'bg-danger-light text-danger border border-danger/30 cursor-not-allowed font-black text-sm opacity-90'
                  : !isStoreOpen
                  ? 'bg-warning-light text-warning-800 border border-warning/30 cursor-not-allowed font-black text-sm opacity-90'
                  : 'font-black text-sm shadow-md'
              }
            >
              {!isCategoryActive ? (
                <span>القسم مش متاح دلوقتي</span>
              ) : !isProductBaseAvailable ? (
                <span>خلص مننا مؤقتًا</span>
              ) : !isStoreOpen ? (
                <span>قافلين دلوقتي</span>
              ) : (
                <>
                  <span>ضيف للسلة</span>
                  <span className="mx-2">•</span>
                  <span className="font-bold tabular-nums number-ltr">{formatPrice(lineTotal)}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
