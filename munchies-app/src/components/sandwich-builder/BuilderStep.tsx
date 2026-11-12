/**
 * @module components/sandwich-builder/BuilderStep
 * @description Clean, minimal presentation of a sandwich builder step.
 * Renders ingredient selection rows with radio/checkbox controls and clear headers.
 */

import React from 'react';
import { SelectionCard } from './SelectionCard';
import type { StepConfig } from './useSandwichBuilder';
import type { BuilderItem } from '@/data/buildYourOwnData';

interface BuilderStepProps {
  step: StepConfig;
  stepIndex: number;
  isItemSelected: (stepId: string, itemId: string) => boolean;
  onSelectItem: (stepId: string, item: BuilderItem, mode: 'single' | 'multiple') => void;
}

export const BuilderStep: React.FC<BuilderStepProps> = ({
  step,
  stepIndex,
  isItemSelected,
  onSelectItem,
}) => {
  const hasSubgroups = step.subgroups && step.subgroups.length > 0;
  const isProteinStep = step.id === 'protein';

  return (
    <div className="space-y-5 animate-fade-slide-in">
      {/* Step Header */}
      <div className="pb-3 border-b border-border space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
              {stepIndex + 1}
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-dark">
              {step.title}
            </h2>
          </div>

          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
              step.isRequired
                ? 'bg-red-50 text-danger border border-red-100'
                : 'bg-light-gray text-medium-gray'
            }`}
          >
            {step.isRequired ? 'مطلوب' : 'اختياري'}
          </span>
        </div>

        <p className="text-xs sm:text-sm text-medium-gray pr-8">
          {step.description}
        </p>
      </div>

      {/* Subgroups (Step 4: Toppings vs Sauces) */}
      {hasSubgroups ? (
        <div className="space-y-6">
          {step.subgroups!.map((group) => {
            const groupItems = step.items.filter((item) =>
              group.itemIds.includes(item.id)
            );
            if (groupItems.length === 0) return null;

            return (
              <div key={group.label} className="space-y-3">
                <h3 className="text-sm font-bold text-dark text-right">
                  {group.label}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {groupItems.map((item) => (
                    <SelectionCard
                      key={item.id}
                      item={item}
                      isSelected={isItemSelected(step.id, item.id)}
                      onSelect={() => onSelectItem(step.id, item, step.selectionMode)}
                      selectionMode={step.selectionMode}
                      isAddon={true}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Standard List of Selection Rows */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {step.items.map((item) => (
            <SelectionCard
              key={item.id}
              item={item}
              isSelected={isItemSelected(step.id, item.id)}
              onSelect={() => onSelectItem(step.id, item, step.selectionMode)}
              selectionMode={step.selectionMode}
              isAddon={!isProteinStep}
            />
          ))}
        </div>
      )}
    </div>
  );
};
