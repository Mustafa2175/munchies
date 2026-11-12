/**
 * @module components/sandwich-builder/BuilderNavigation
 * @description Clean, minimalist navigation controls for the sandwich builder.
 * Desktop: inline controls. Mobile: sticky bottom bar with live total price.
 */

import React from 'react';
import { ArrowRight, ArrowLeft, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/currency';
import type { BuilderPhase } from './useSandwichBuilder';

interface BuilderNavigationProps {
  phase: BuilderPhase;
  currentStep: number;
  totalSteps: number;
  isCurrentStepValid: boolean;
  isStepRequired: boolean;
  totalPrice: number;
  onNext: () => void;
  onPrev: () => void;
  onAddToCart: () => void;
  isReadyForCart: boolean;
  isLoading?: boolean;
  validationMessage?: string;
}

export const BuilderNavigation: React.FC<BuilderNavigationProps> = ({
  phase,
  currentStep,
  totalSteps,
  isCurrentStepValid,
  isStepRequired,
  totalPrice,
  onNext,
  onPrev,
  onAddToCart,
  isReadyForCart,
  isLoading = false,
  validationMessage,
}) => {
  const isFirstStep = currentStep === 0 && phase === 'building';
  const isLastBuildStep = currentStep === totalSteps - 1 && phase === 'building';
  const isReview = phase === 'review';
  const canProceed = isCurrentStepValid || !isStepRequired;

  return (
    <>
      {/* Desktop Navigation (Inline) */}
      <div className="hidden sm:flex items-center justify-between pt-6 border-t border-border mt-6">
        {/* Back Button */}
        <div>
          {!isFirstStep && (
            <Button
              variant="ghost"
              size="md"
              onClick={onPrev}
              rightIcon={ArrowRight}
              className="text-medium-gray hover:text-dark text-xs sm:text-sm"
            >
              {isReview ? 'تعديل الاختيارات' : 'السابق'}
            </Button>
          )}
        </div>

        {/* Validation Warning */}
        {!canProceed && validationMessage && (
          <span className="text-xs text-danger font-medium">
            {validationMessage}
          </span>
        )}

        {/* Forward Action */}
        <div className="flex items-center gap-3">
          {!isReview && !isStepRequired && !isCurrentStepValid && (
            <Button
              variant="ghost"
              size="md"
              onClick={onNext}
              className="text-medium-gray text-xs sm:text-sm"
            >
              تخطي
            </Button>
          )}

          {!isReview && (
            <Button
              variant={isLastBuildStep ? 'yellow' : 'primary'}
              size="md"
              onClick={onNext}
              disabled={!canProceed}
              leftIcon={isLastBuildStep ? undefined : ArrowLeft}
              className="font-bold text-xs sm:text-sm px-6"
            >
              {isLastBuildStep ? 'مراجعة الطلب' : 'التالي'}
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Navigation (Sticky Bottom Bar) */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-border px-4 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] safe-area-pb">
        {!canProceed && validationMessage && !isReview && (
          <div className="text-center text-xs text-danger font-medium pb-2">
            {validationMessage}
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          {/* Price */}
          <div className="shrink-0 text-right">
            <span className="text-[10px] text-medium-gray block">الإجمالي</span>
            <span className="text-base font-black tabular-nums number-ltr text-primary">
              {formatPrice(totalPrice)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <button
                type="button"
                onClick={onPrev}
                className="w-10 h-10 rounded-lg border border-border bg-white flex items-center justify-center text-medium-gray hover:text-dark transition-colors shrink-0 cursor-pointer"
                aria-label="السابق"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {isReview ? (
              <Button
                variant="yellow"
                size="md"
                onClick={onAddToCart}
                disabled={!isReadyForCart || isLoading}
                leftIcon={ShoppingBag}
                isLoading={isLoading}
                className="font-bold text-sm px-5"
              >
                أضف للسلة
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                {!isStepRequired && !isCurrentStepValid && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onNext}
                    className="text-medium-gray text-xs"
                  >
                    تخطي
                  </Button>
                )}
                <Button
                  variant={isLastBuildStep ? 'yellow' : 'primary'}
                  size="md"
                  onClick={onNext}
                  disabled={!canProceed}
                  leftIcon={isLastBuildStep ? undefined : ArrowLeft}
                  className="font-bold text-sm px-5"
                >
                  {isLastBuildStep ? 'مراجعة الطلب' : 'التالي'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Spacer so content is never covered by sticky bar */}
      <div className="sm:hidden h-20" />
    </>
  );
};
