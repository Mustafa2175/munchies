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
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
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
        <h2 className="text-xl font-bold text-gray-800">الصنف غير موجود</h2>
        <Link to={ROUTES.MENU} className="mt-4 inline-block text-[#512080] font-bold">
          العودة للمنيو
        </Link>
      </div>
    );
  }

  const isProductBaseAvailable = isProductAvailable(product);
  const isAvailable = isProductBaseAvailable && isCategoryActive;
  const isOrderable = isAvailable && isStoreOpen;
  const productName = product.name.ar;
  const productDesc = product.description.ar;

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
      image: product.image,
      basePrice: product.price,
      quantity,
      customizations,
      specialInstructions: notes.trim() || undefined,
    });

    toast.success(`تمت إضافة "${productName}" إلى السلة بنجاح!`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Back to menu */}
      <div className="mb-6">
        <Link
          to={ROUTES.MENU}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#512080] transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة للمنيو</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Product Image */}
        <div className="lg:col-span-6 sticky top-28">
          <div className="relative aspect-4/3 rounded-3xl overflow-hidden bg-gray-100 shadow-xl border-4 border-white">
            <img
              src={product.image}
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
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-red-600 text-white shadow-md">
                  <Ban className="w-4 h-4" />
                  <span>القسم غير متاح حالياً</span>
                </span>
              ) : !isProductBaseAvailable ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-red-600 text-white shadow-md">
                  <Ban className="w-4 h-4" />
                  <span>غير متوفر حالياً</span>
                </span>
              ) : !isStoreOpen ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-amber-600 text-white shadow-md">
                  <Clock className="w-4 h-4" />
                  <span>المطعم مغلق</span>
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
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-[#26212B]">
                {productName}
              </h1>
              {!isAvailable ? (
                <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                  غير متوفر
                </span>
              ) : !isStoreOpen ? (
                <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                  المطعم مغلق حالياً
                </span>
              ) : null}
            </div>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              {productDesc}
            </p>
            <div className="mt-4 text-2xl font-black text-[#512080]">
              <CurrencyDisplay amount={product.price} />
            </div>
          </div>

          {/* Bread Selection */}
          {breadGroup && (
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-bold text-[#26212B]">
                {breadGroup.name.ar}
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                {breadGroup.options?.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={!isOrderable}
                    onClick={() => setSelectedBread(opt.id)}
                    className={`flex items-center justify-between p-3 rounded-2xl border text-xs font-bold transition-all text-start cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                      selectedBread === opt.id
                        ? 'border-[#512080] bg-[#F3EDFA] text-[#512080] shadow-xs'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span>{opt.name.ar}</span>
                    {opt.price > 0 && <span>+<CurrencyDisplay amount={opt.price} /></span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Additions */}
          {additionsGroup && (
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-bold text-[#26212B]">
                {additionsGroup.name.ar}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {additionsGroup.options?.map((opt) => {
                  const isChecked = selectedAdditions.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={!isOrderable}
                      onClick={() => handleToggleAddition(opt.id)}
                      className={`flex flex-col justify-between p-3 rounded-2xl border text-xs font-bold transition-all text-start cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                        isChecked
                          ? 'border-[#512080] bg-[#F3EDFA] text-[#512080] shadow-xs'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="truncate">{opt.name.ar}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 text-[#512080]" />}
                      </div>
                      <span className="text-[11px] text-gray-500 mt-1">
                        +<CurrencyDisplay amount={opt.price} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5 pt-4 border-t border-gray-100">
            <label className="text-xs font-bold text-[#26212B]">
              ملاحظات خاصة للمطبخ
            </label>
            <input
              type="text"
              value={notes}
              disabled={!isOrderable}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: بدون بصل، زيادة صوص..."
              className="w-full text-xs rounded-xl border border-gray-200 p-3 focus:outline-none focus:border-[#512080] disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>

          {/* Quantity & CTA */}
          <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
            <QuantitySelector value={quantity} onChange={setQuantity} disabled={!isOrderable} />
            <Button
              variant={isOrderable ? 'yellow' : 'ghost'}
              size="lg"
              fullWidth
              disabled={!isOrderable}
              onClick={handleAddToCart}
              className={
                !isAvailable
                  ? 'bg-red-50 text-red-600 border border-red-200 cursor-not-allowed font-black text-sm opacity-90 hover:bg-red-50 hover:text-red-600'
                  : !isStoreOpen
                  ? 'bg-amber-50 text-amber-700 border border-amber-200 cursor-not-allowed font-black text-sm opacity-90 hover:bg-amber-50 hover:text-amber-700'
                  : 'font-black text-sm shadow-md'
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
                  <span className="mx-2">•</span>
                  <CurrencyDisplay amount={lineTotal} />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
