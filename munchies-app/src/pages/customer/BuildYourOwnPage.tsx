/**
 * @module pages/customer/BuildYourOwnPage
 * @description Interactive custom sandwich builder with live nutritional tracker (Calories, Protein, Carbs, Fat). Strictly Arabic.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Flame,
  Dumbbell,
  Scale,
  Check,
  ShoppingBag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  PROTEIN_OPTIONS,
  BREAD_OPTIONS,
  CHEESE_DELI_OPTIONS,
  TOPPING_OPTIONS,
  type BuilderItem,
} from '@/data/buildYourOwnData';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { useCartStore } from '@/stores/cartStore';
import { ROUTES } from '@/config/routes';

export const BuildYourOwnPage: React.FC = () => {
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);

  // Selections
  const [selectedProtein, setSelectedProtein] = useState<BuilderItem | null>(PROTEIN_OPTIONS[0]);
  const [selectedBread, setSelectedBread] = useState<BuilderItem | null>(BREAD_OPTIONS[0]);
  const [selectedCheeses, setSelectedCheeses] = useState<BuilderItem[]>([CHEESE_DELI_OPTIONS[0]]);
  const [selectedToppings, setSelectedToppings] = useState<BuilderItem[]>([]);
  const [sandwichName, setSandwichName] = useState('');

  // Toggle multi-select
  const toggleCheese = (item: BuilderItem) => {
    if (selectedCheeses.some((c) => c.id === item.id)) {
      setSelectedCheeses(selectedCheeses.filter((c) => c.id !== item.id));
    } else {
      setSelectedCheeses([...selectedCheeses, item]);
    }
  };

  const toggleTopping = (item: BuilderItem) => {
    if (selectedToppings.some((t) => t.id === item.id)) {
      setSelectedToppings(selectedToppings.filter((t) => t.id !== item.id));
    } else {
      setSelectedToppings([...selectedToppings, item]);
    }
  };

  // Nutrition aggregation
  const allSelected: BuilderItem[] = [
    ...(selectedProtein ? [selectedProtein] : []),
    ...(selectedBread ? [selectedBread] : []),
    ...selectedCheeses,
    ...selectedToppings,
  ];

  const totalCalories = allSelected.reduce((sum, item) => sum + (item.nutrition.calories || 0), 0);
  const totalProtein = Math.round(
    allSelected.reduce((sum, item) => sum + (item.nutrition.protein || 0), 0) * 10
  ) / 10;
  const totalCarbs = Math.round(
    allSelected.reduce((sum, item) => sum + (item.nutrition.carbs || 0), 0) * 10
  ) / 10;
  const totalFat = Math.round(
    allSelected.reduce((sum, item) => sum + (item.nutrition.fat || 0), 0) * 10
  ) / 10;
  const totalGrams = allSelected.reduce((sum, item) => sum + (item.nutrition.grams || 0), 0);
  const totalPrice = allSelected.reduce((sum, item) => sum + item.price, 0);

  const handleAddToCart = () => {
    if (!selectedProtein || !selectedBread) {
      toast.error('يرجى اختيار البروتين والعيش');
      return;
    }

    const customTitle =
      sandwichName.trim() ||
      `ساندوتش ${selectedProtein.name.ar} على عيش ${selectedBread.name.ar}`;

    const customizations = [
      {
        groupId: 'protein',
        groupName: { ar: 'البروتين', en: 'Protein' },
        selectedOptions: [
          {
            optionId: selectedProtein.id,
            name: selectedProtein.name,
            price: 0,
          },
        ],
      },
      {
        groupId: 'bread',
        groupName: { ar: 'العيش', en: 'Bread' },
        selectedOptions: [
          {
            optionId: selectedBread.id,
            name: selectedBread.name,
            price: selectedBread.price,
          },
        ],
      },
    ];

    if (selectedCheeses.length > 0) {
      customizations.push({
        groupId: 'cheese',
        groupName: { ar: 'الجبن والدلي', en: 'Cheese & Deli' },
        selectedOptions: selectedCheeses.map((c) => ({
          optionId: c.id,
          name: c.name,
          price: c.price,
        })),
      });
    }

    if (selectedToppings.length > 0) {
      customizations.push({
        groupId: 'toppings',
        groupName: { ar: 'الإضافات والصوصات', en: 'Toppings & Sauces' },
        selectedOptions: selectedToppings.map((t) => ({
          optionId: t.id,
          name: t.name,
          price: t.price,
        })),
      });
    }

    addItem({
      productId: 'custom_sandwich',
      name: { ar: customTitle, en: customTitle },
      image:
        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
      basePrice: selectedProtein.price,
      quantity: 1,
      customizations,
      specialInstructions: `${totalCalories} سعرة حرارية | ${totalProtein}جم بروتين`,
    });

    toast.success('تمت إضافة ساندوتشك المخصص إلى السلة بنجاح!');
    navigate(ROUTES.CART);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      {/* Page Title */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFDA35]/30 text-[#512080] text-xs font-black">
          <Sparkles className="w-4 h-4 text-[#512080]" />
          <span>اصنع ساندوتشك بنفسك</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-[#26212B]">
          اعمل ساندوتش على مزاجك
        </h1>
        <p className="text-sm text-gray-500">
          اختر نوع البروتين، الخبز، الجبن، والصوصات مع حساب السعرات والقيم الغذائية لحظياً.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Step-by-Step Selection Form */}
        <div className="lg:col-span-8 space-y-8">
          {/* Step 1: Protein */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#512080] text-[#FFDA35] font-black text-xs flex items-center justify-center">
                  1
                </span>
                <h2 className="font-extrabold text-base text-[#26212B]">
                  اختر البروتين (Protein)
                </h2>
              </div>
              <span className="text-xs text-red-500 font-bold">
                إجباري
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PROTEIN_OPTIONS.map((item) => {
                const isSelected = selectedProtein?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedProtein(item)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#512080] bg-[#F3EDFA] ring-2 ring-[#512080]/20 shadow-xs'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#26212B]">
                        {item.name.ar}
                      </span>
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                          isSelected
                            ? 'border-[#512080] bg-[#512080] text-white'
                            : 'border-gray-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100/60 text-[11px]">
                      <div className="flex items-center gap-2 text-gray-500">
                        <span>{item.nutrition.grams}جم</span>
                        <span>•</span>
                        <span>{item.nutrition.calories} كالوري</span>
                        <span>•</span>
                        <span className="font-bold text-[#512080]">
                          {item.nutrition.protein}جم بروتين
                        </span>
                      </div>
                      <CurrencyDisplay amount={item.price} className="text-xs text-[#512080]" />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Step 2: Bread */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#512080] text-[#FFDA35] font-black text-xs flex items-center justify-center">
                  2
                </span>
                <h2 className="font-extrabold text-base text-[#26212B]">
                  اختر نوع العيش (Bread)
                </h2>
              </div>
              <span className="text-xs text-red-500 font-bold">
                إجباري
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BREAD_OPTIONS.map((item) => {
                const isSelected = selectedBread?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedBread(item)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#512080] bg-[#F3EDFA] ring-2 ring-[#512080]/20 shadow-xs'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#26212B]">
                        {item.name.ar}
                      </span>
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                          isSelected
                            ? 'border-[#512080] bg-[#512080] text-white'
                            : 'border-gray-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100/60 text-[11px]">
                      <div className="flex items-center gap-2 text-gray-500">
                        <span>{item.nutrition.grams}جم</span>
                        <span>•</span>
                        <span>{item.nutrition.calories} كالوري</span>
                      </div>
                      <span className="font-bold text-xs text-[#512080]">
                        +<CurrencyDisplay amount={item.price} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Step 3: Cheese & Deli */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#512080] text-[#FFDA35] font-black text-xs flex items-center justify-center">
                  3
                </span>
                <h2 className="font-extrabold text-base text-[#26212B]">
                  الجبن والدلي (Cheese & Deli)
                </h2>
              </div>
              <span className="text-xs text-gray-400">
                اختياري
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CHEESE_DELI_OPTIONS.map((item) => {
                const isSelected = selectedCheeses.some((c) => c.id === item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleCheese(item)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#512080] bg-[#F3EDFA] text-[#512080] font-bold shadow-xs'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs truncate">{item.name.ar}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#512080]" />}
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 text-[11px] text-gray-500">
                      <span>{item.nutrition.calories} كالوري</span>
                      <span className="font-bold text-[#512080]">
                        +<CurrencyDisplay amount={item.price} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Step 4: Toppings & Sauces */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#512080] text-[#FFDA35] font-black text-xs flex items-center justify-center">
                  4
                </span>
                <h2 className="font-extrabold text-base text-[#26212B]">
                  الإضافات والصوصات (Toppings & Sauces)
                </h2>
              </div>
              <span className="text-xs text-gray-400">
                اختياري
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {TOPPING_OPTIONS.map((item) => {
                const isSelected = selectedToppings.some((t) => t.id === item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleTopping(item)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#512080] bg-[#F3EDFA] text-[#512080] font-bold shadow-xs'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs truncate">{item.name.ar}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#512080]" />}
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 text-[11px] text-gray-500">
                      <span>{item.nutrition.calories} كالوري</span>
                      <span className="font-bold text-[#512080]">
                        +<CurrencyDisplay amount={item.price} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Name Your Creation */}
          <Card className="p-6 space-y-3">
            <h3 className="font-bold text-sm text-[#26212B]">
              سمّي ابتكارك (اختياري)
            </h3>
            <input
              type="text"
              value={sandwichName}
              onChange={(e) => setSandwichName(e.target.value)}
              placeholder="مثال: ساندوتش الوحش، فتنس برجر..."
              className="w-full text-xs rounded-xl border border-gray-200 bg-white p-3 focus:outline-none focus:border-[#512080]"
            />
          </Card>
        </div>

        {/* Sticky Live Nutrition & Price Summary */}
        <div className="lg:col-span-4 sticky top-28 space-y-6">
          <Card className="p-6 space-y-6 border-2 border-[#FFDA35]">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-black text-base text-[#26212B]">
                القيم الغذائية لساندوتشك
              </h3>
              <Sparkles className="w-4 h-4 text-[#FFDA35]" />
            </div>

            {/* Macros Grid */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/50">
                <Flame className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                <span className="text-xl font-black text-amber-700 block number-ltr">
                  {totalCalories}
                </span>
                <span className="text-[10px] text-gray-500 font-bold uppercase">
                  سعرة حرارية (Cal)
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200/50">
                <Dumbbell className="w-5 h-5 text-[#512080] mx-auto mb-1" />
                <span className="text-xl font-black text-[#512080] block number-ltr">
                  {totalProtein}g
                </span>
                <span className="text-[10px] text-gray-500 font-bold uppercase">
                  بروتين (Protein)
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200/50">
                <span className="text-base font-black text-blue-700 block number-ltr">
                  {totalCarbs}g
                </span>
                <span className="text-[10px] text-gray-500 font-bold uppercase">
                  كاربوهيدرات
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/50">
                <span className="text-base font-black text-emerald-700 block number-ltr">
                  {totalFat}g
                </span>
                <span className="text-[10px] text-gray-500 font-bold uppercase">
                  دهون
                </span>
              </div>
            </div>

            {/* Weight */}
            <div className="flex items-center justify-between text-xs text-gray-500 px-1">
              <span className="flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-gray-400" />
                الوزن التقريبي الصافي:
              </span>
              <span className="font-bold text-gray-700 number-ltr">{totalGrams} جم</span>
            </div>

            {/* Price & Submit */}
            <div className="pt-4 border-t border-gray-100 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-700">
                  سعر الساندوتش:
                </span>
                <CurrencyDisplay amount={totalPrice} className="text-2xl text-[#512080]" />
              </div>

              <Button
                variant="yellow"
                size="lg"
                fullWidth
                onClick={handleAddToCart}
                leftIcon={ShoppingBag}
                className="font-black shadow-lg shadow-[#FFDA35]/30"
              >
                أضف ساندوتشك للسلة
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
