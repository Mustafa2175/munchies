/**
 * @module components/sandwich-builder/SandwichBuilderMain
 * @description Orchestrator component for Munchie's Build Your Own Sandwich.
 * Manages clean, professional multi-step flow: Intro → Steps → Review → Cart.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCartStore } from '@/stores/cartStore';
import { ROUTES } from '@/config/routes';

import { useSandwichBuilder, BUILDER_STEPS } from './useSandwichBuilder';
import { BuilderIntro } from './BuilderIntro';
import { BuilderProgress } from './BuilderProgress';
import { BuilderStep } from './BuilderStep';
import { BuilderReview } from './BuilderReview';
import { BuilderSummary } from './BuilderSummary';
import { BuilderNavigation } from './BuilderNavigation';

export const SandwichBuilder: React.FC = () => {
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);

  const builder = useSandwichBuilder();

  const handleAddToCart = () => {
    if (!builder.isReadyForCart) {
      toast.error('يرجى اختيار البروتين والعيش أولاً');
      return;
    }

    const protein = builder.selections['protein']?.[0];
    const bread = builder.selections['bread']?.[0];
    const cheeses = builder.selections['cheese'] || [];
    const toppings = builder.selections['toppings'] || [];

    if (!protein || !bread) {
      toast.error('يرجى اختيار البروتين والعيش أولاً');
      return;
    }

    const customTitle = `ساندوتش ${protein.name.ar} على عيش ${bread.name.ar}`;

    const customizations = [
      {
        groupId: 'protein',
        groupName: { ar: 'البروتين', en: 'Protein' },
        selectedOptions: [
          {
            optionId: protein.id,
            name: protein.name,
            price: 0,
          },
        ],
      },
      {
        groupId: 'bread',
        groupName: { ar: 'العيش', en: 'Bread' },
        selectedOptions: [
          {
            optionId: bread.id,
            name: bread.name,
            price: bread.price,
          },
        ],
      },
    ];

    if (cheeses.length > 0) {
      customizations.push({
        groupId: 'cheese',
        groupName: { ar: 'الجبن واللحوم الباردة', en: 'Cheese & Deli' },
        selectedOptions: cheeses.map((c) => ({
          optionId: c.id,
          name: c.name,
          price: c.price,
        })),
      });
    }

    if (toppings.length > 0) {
      customizations.push({
        groupId: 'toppings',
        groupName: { ar: 'الإضافات والصوصات', en: 'Toppings & Sauces' },
        selectedOptions: toppings.map((t) => ({
          optionId: t.id,
          name: t.name,
          price: t.price,
        })),
      });
    }

    addItem({
      productId: 'custom_sandwich',
      name: { ar: customTitle, en: customTitle },
      image: '/hero_burger_clean_cutout.png',
      basePrice: protein.price,
      quantity: builder.quantity,
      customizations,
      specialInstructions: `${builder.totalNutrition.calories} سعرة حرارية | ${builder.totalNutrition.protein}جم بروتين`,
    });

    toast.success('تمت إضافة ساندوتشك المخصص للسلة');
    navigate(ROUTES.CART);
  };

  if (builder.phase === 'intro') {
    return <BuilderIntro onStart={builder.startBuilder} />;
  }

  const currentStepConfig = BUILDER_STEPS[builder.currentStep];
  const validation = builder.getStepValidation(builder.currentStep);

  return (
    <div className="min-h-screen bg-[#FDFCFE]">
      {/* Top Sticky Progress Indicator */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-border px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="max-w-5xl mx-auto">
          <BuilderProgress
            currentStep={builder.currentStep}
            isStepCompleted={builder.isStepCompleted}
            onStepClick={builder.goToStep}
            isReview={builder.phase === 'review'}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Main Customization Area (Right side in RTL) */}
          <div className="lg:col-span-8">
            {builder.phase === 'building' && currentStepConfig && (
              <>
                <BuilderStep
                  key={currentStepConfig.id}
                  step={currentStepConfig}
                  stepIndex={builder.currentStep}
                  isItemSelected={builder.isItemSelected}
                  onSelectItem={builder.selectItem}
                />
                <BuilderNavigation
                  phase={builder.phase}
                  currentStep={builder.currentStep}
                  totalSteps={builder.totalSteps}
                  isCurrentStepValid={builder.isCurrentStepValid}
                  isStepRequired={currentStepConfig.isRequired}
                  totalPrice={builder.totalPrice}
                  onNext={builder.nextStep}
                  onPrev={builder.prevStep}
                  onAddToCart={handleAddToCart}
                  isReadyForCart={builder.isReadyForCart}
                  validationMessage={validation.message}
                />
              </>
            )}

            {builder.phase === 'review' && (
              <>
                <BuilderReview
                  selections={builder.selections}
                  basePrice={builder.basePrice}
                  addonsPrice={builder.addonsPrice}
                  unitPrice={builder.unitPrice}
                  totalPrice={builder.totalPrice}
                  quantity={builder.quantity}
                  totalNutrition={builder.totalNutrition}
                  onChangeQuantity={builder.setQuantity}
                  onAddToCart={handleAddToCart}
                  onEditStep={builder.goToStep}
                />
                <BuilderNavigation
                  phase={builder.phase}
                  currentStep={builder.currentStep}
                  totalSteps={builder.totalSteps}
                  isCurrentStepValid={true}
                  isStepRequired={false}
                  totalPrice={builder.totalPrice}
                  onNext={builder.nextStep}
                  onPrev={builder.prevStep}
                  onAddToCart={handleAddToCart}
                  isReadyForCart={builder.isReadyForCart}
                />
              </>
            )}
          </div>

          {/* Desktop Summary Panel (Left side in RTL) */}
          <div className="hidden lg:block lg:col-span-4">
            <div className="sticky top-20">
              <BuilderSummary
                selections={builder.selections}
                basePrice={builder.basePrice}
                addonsPrice={builder.addonsPrice}
                unitPrice={builder.unitPrice}
                totalPrice={builder.totalPrice}
                quantity={builder.quantity}
                totalNutrition={builder.totalNutrition}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
