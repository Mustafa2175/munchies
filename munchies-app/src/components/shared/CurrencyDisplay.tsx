/**
 * @module components/shared/CurrencyDisplay
 * @description Format and display prices strictly in Egyptian Pounds (ج.م).
 */

import React from 'react';
import { formatPrice } from '@/lib/currency';

export interface CurrencyDisplayProps {
  amount: number;
  className?: string;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({ amount, className = '' }) => {
  return <span className={`font-bold number-ltr ${className}`}>{formatPrice(amount)}</span>;
};
