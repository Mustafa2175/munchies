/**
 * @module components/sandwich-builder/BuilderProgress
 * @description Simplified, minimal horizontal step progress indicator.
 * Displays clean numbered steps, completion checks, and a subtle progress bar.
 */

import React from 'react';
import { Check } from 'lucide-react';
import { BUILDER_STEPS } from './useSandwichBuilder';

interface BuilderProgressProps {
  currentStep: number;
  isStepCompleted: (step: number) => boolean;
  onStepClick: (step: number) => void;
  isReview?: boolean;
}

export const BuilderProgress: React.FC<BuilderProgressProps> = ({
  currentStep,
  isStepCompleted,
  onStepClick,
  isReview = false,
}) => {
  const stepsList = [
    ...BUILDER_STEPS.map((s) => ({ id: s.id, title: s.title })),
    { id: 'review', title: 'مراجعة الطلب' },
  ];

  const totalSteps = stepsList.length;
  const activeIndex = isReview ? totalSteps - 1 : currentStep;
  const progressPercent = ((activeIndex + 1) / totalSteps) * 100;

  return (
    <div className="w-full">
      {/* Desktop Step Numbers & Labels */}
      <div className="hidden sm:block">
        <div className="flex items-center justify-between mb-3">
          {stepsList.map((step, index) => {
            const isCompleted = isReview ? index < activeIndex : isStepCompleted(index);
            const isCurrent = index === activeIndex;
            const isClickable = isCompleted || index <= activeIndex;

            return (
              <React.Fragment key={step.id}>
                <button
                  type="button"
                  onClick={() => isClickable && onStepClick(index)}
                  disabled={!isClickable}
                  className={`flex items-center gap-2 group transition-colors ${
                    isClickable ? 'cursor-pointer' : 'cursor-default opacity-50'
                  }`}
                >
                  {/* Step Indicator Dot */}
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCompleted
                        ? 'bg-primary text-white'
                        : isCurrent
                        ? 'bg-primary text-white ring-2 ring-primary/20 ring-offset-2'
                        : 'border border-gray-300 bg-white text-gray-500'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : (
                      index + 1
                    )}
                  </div>

                  {/* Step Label */}
                  <span
                    className={`text-xs font-medium transition-colors ${
                      isCurrent
                        ? 'text-dark font-bold'
                        : isCompleted
                        ? 'text-dark'
                        : 'text-medium-gray'
                    }`}
                  >
                    {step.title}
                  </span>
                </button>

                {/* Divider Line */}
                {index < totalSteps - 1 && (
                  <div className="flex-1 mx-3 h-px bg-gray-200">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{
                        width: index < activeIndex ? '100%' : '0%',
                      }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Mobile Compact Progress Bar */}
      <div className="sm:hidden space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-dark">
            {stepsList[activeIndex]?.title}
          </span>
          <span className="text-medium-gray text-[11px] tabular-nums">
            {activeIndex + 1} من {totalSteps}
          </span>
        </div>

        {/* Minimal Progress Line */}
        <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
