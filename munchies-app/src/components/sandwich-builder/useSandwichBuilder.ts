/**
 * @module components/sandwich-builder/useSandwichBuilder
 * @description State management for the step-by-step sandwich builder.
 * Manages selections, step navigation, validation, live pricing, and nutrition.
 */

import { useState, useCallback, useMemo } from 'react';
import {
  PROTEIN_OPTIONS,
  BREAD_OPTIONS,
  CHEESE_DELI_OPTIONS,
  TOPPING_OPTIONS,
  type BuilderItem,
} from '@/data/buildYourOwnData';

export type BuilderPhase = 'intro' | 'building' | 'review';

export interface StepConfig {
  id: string;
  title: string;
  description: string;
  isRequired: boolean;
  selectionMode: 'single' | 'multiple';
  items: BuilderItem[];
  subgroups?: { label: string; itemIds: string[] }[];
}

const SAUCE_IDS = ['top_sauce'];
const TOPPING_IDS = TOPPING_OPTIONS.filter((t) => !SAUCE_IDS.includes(t.id)).map((t) => t.id);

export const BUILDER_STEPS: StepConfig[] = [
  {
    id: 'protein',
    title: 'اختيار البروتين',
    description: 'اختار نوع البروتين الأساسي',
    isRequired: true,
    selectionMode: 'single',
    items: PROTEIN_OPTIONS,
  },
  {
    id: 'bread',
    title: 'اختيار العيش',
    description: 'اختار نوع العيش المفضل',
    isRequired: true,
    selectionMode: 'single',
    items: BREAD_OPTIONS,
  },
  {
    id: 'cheese',
    title: 'الجبن واللحوم الباردة',
    description: 'إضافات الجبن واللحوم الباردة — اختياري',
    isRequired: false,
    selectionMode: 'multiple',
    items: CHEESE_DELI_OPTIONS,
  },
  {
    id: 'toppings',
    title: 'الإضافات والصوصات',
    description: 'الإضافات الخضراء والصوصات المميزة — اختياري',
    isRequired: false,
    selectionMode: 'multiple',
    items: TOPPING_OPTIONS,
    subgroups: [
      { label: 'الإضافات', itemIds: TOPPING_IDS },
      { label: 'الصوصات', itemIds: SAUCE_IDS },
    ],
  },
];

export function useSandwichBuilder() {
  const [phase, setPhase] = useState<BuilderPhase>('intro');
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState<Record<string, BuilderItem[]>>({});
  const [quantity, setQuantity] = useState(1);

  const totalSteps = BUILDER_STEPS.length;
  const step = BUILDER_STEPS[currentStep];

  // Selection toggle
  const selectItem = useCallback(
    (stepId: string, item: BuilderItem, mode: 'single' | 'multiple') => {
      setSelections((prev) => {
        const current = prev[stepId] || [];
        if (mode === 'single') {
          return { ...prev, [stepId]: [item] };
        }
        const exists = current.some((i) => i.id === item.id);
        if (exists) {
          return { ...prev, [stepId]: current.filter((i) => i.id !== item.id) };
        }
        return { ...prev, [stepId]: [...current, item] };
      });
    },
    []
  );

  const isItemSelected = useCallback(
    (stepId: string, itemId: string) => {
      return (selections[stepId] || []).some((i) => i.id === itemId);
    },
    [selections]
  );

  // Validation
  const isCurrentStepValid = useMemo(() => {
    if (!step) return false;
    if (!step.isRequired) return true;
    const selected = selections[step.id] || [];
    return selected.length > 0;
  }, [step, selections]);

  const getStepValidation = useCallback(
    (stepIndex: number) => {
      const s = BUILDER_STEPS[stepIndex];
      if (!s) return { valid: false, message: '' };
      if (!s.isRequired) return { valid: true, message: '' };
      const selected = selections[s.id] || [];
      if (selected.length === 0) {
        return { valid: false, message: `يرجى ${s.title}` };
      }
      return { valid: true, message: '' };
    },
    [selections]
  );

  // Price calculations
  const allSelectedItems = useMemo(() => {
    return Object.values(selections).flat();
  }, [selections]);

  const basePrice = useMemo(() => {
    const protein = selections['protein']?.[0];
    return protein?.price || 0;
  }, [selections]);

  const addonsPrice = useMemo(() => {
    let total = 0;
    const bread = selections['bread']?.[0];
    if (bread) total += bread.price;
    const cheeses = selections['cheese'] || [];
    total += cheeses.reduce((sum, c) => sum + c.price, 0);
    const toppings = selections['toppings'] || [];
    total += toppings.reduce((sum, t) => sum + t.price, 0);
    return total;
  }, [selections]);

  const unitPrice = basePrice + addonsPrice;
  const totalPrice = unitPrice * quantity;

  // Navigation
  const startBuilder = useCallback(() => {
    setPhase('building');
    setCurrentStep(0);
  }, []);

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < BUILDER_STEPS.length) {
      setCurrentStep(stepIndex);
      setPhase('building');
    }
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setPhase('review');
    }
  }, [currentStep, totalSteps]);

  const prevStep = useCallback(() => {
    if (phase === 'review') {
      setPhase('building');
      setCurrentStep(totalSteps - 1);
      return;
    }
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep, phase, totalSteps]);

  const goToReview = useCallback(() => {
    setPhase('review');
  }, []);

  const goToIntro = useCallback(() => {
    setPhase('intro');
    setCurrentStep(0);
    setSelections({});
    setQuantity(1);
  }, []);

  const isStepCompleted = useCallback(
    (stepIndex: number) => {
      const s = BUILDER_STEPS[stepIndex];
      if (!s) return false;
      const selected = selections[s.id] || [];
      if (s.isRequired) return selected.length > 0;
      return currentStep > stepIndex || selected.length > 0;
    },
    [selections, currentStep]
  );

  const isReadyForCart = useMemo(() => {
    return BUILDER_STEPS.filter((s) => s.isRequired).every((s) => {
      return (selections[s.id] || []).length > 0;
    });
  }, [selections]);

  const totalNutrition = useMemo(() => {
    const all = allSelectedItems;
    return {
      calories: all.reduce((sum, item) => sum + (item.nutrition.calories || 0), 0),
      protein: Math.round(all.reduce((sum, item) => sum + (item.nutrition.protein || 0), 0) * 10) / 10,
      carbs: Math.round(all.reduce((sum, item) => sum + (item.nutrition.carbs || 0), 0) * 10) / 10,
      fat: Math.round(all.reduce((sum, item) => sum + (item.nutrition.fat || 0), 0) * 10) / 10,
      grams: all.reduce((sum, item) => sum + (item.nutrition.grams || 0), 0),
    };
  }, [allSelectedItems]);

  return {
    phase,
    currentStep,
    step,
    totalSteps,
    selections,
    quantity,
    isCurrentStepValid,

    basePrice,
    addonsPrice,
    unitPrice,
    totalPrice,
    totalNutrition,

    allSelectedItems,
    isReadyForCart,

    startBuilder,
    goToStep,
    nextStep,
    prevStep,
    goToReview,
    goToIntro,
    selectItem,
    isItemSelected,
    isStepCompleted,
    getStepValidation,
    setQuantity,
  };
}
