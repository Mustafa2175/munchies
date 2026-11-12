/**
 * @module pages/customer/BuildYourOwnPage
 * @description Interactive custom sandwich builder with gamified step-by-step experience,
 * live price calculation, nutritional breakdown, and seamless cart integration. Strictly Arabic.
 */

import React from 'react';
import { SandwichBuilder } from '@/components/sandwich-builder';

export const BuildYourOwnPage: React.FC = () => {
  return <SandwichBuilder />;
};

export default BuildYourOwnPage;
