/**
 * @module components/sandwich-builder/BuilderIntro
 * @description Clean, minimalist intro screen for Munchie's Build Your Own Sandwich.
 * Presents the value proposition with clear typography and a prominent CTA.
 */

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface BuilderIntroProps {
  onStart: () => void;
}

export const BuilderIntro: React.FC<BuilderIntroProps> = ({ onStart }) => {
  return (
    <div className="max-w-xl mx-auto px-4 py-12 sm:py-16 text-center space-y-8 animate-fade-slide-in">
      {/* Product Image */}
      <div className="w-48 h-48 sm:w-60 sm:h-60 mx-auto">
        <img
          src="/hero_burger_clean_cutout.png"
          alt="ساندوتش مانشيز"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Copy */}
      <div className="space-y-3">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-dark leading-tight">
          اعمل ساندوتشك بنفسك
        </h1>
        <p className="text-sm sm:text-base text-medium-gray max-w-md mx-auto leading-relaxed">
          اختار مكوناتك، وظبطه على مزاجك
        </p>
      </div>

      {/* Minimal Steps Flow Overview */}
      <div className="flex items-center justify-center gap-2 text-xs text-medium-gray pt-2">
        <span>البروتين</span>
        <span>←</span>
        <span>العيش</span>
        <span>←</span>
        <span>الجبن واللحوم</span>
        <span>←</span>
        <span>الإضافات</span>
      </div>

      {/* Primary CTA */}
      <div className="pt-2">
        <Button
          variant="yellow"
          size="lg"
          onClick={onStart}
          leftIcon={ArrowLeft}
          className="font-bold text-base px-8 h-12 shadow-sm hover:shadow"
        >
          يلا نبدأ!
        </Button>
      </div>
    </div>
  );
};
