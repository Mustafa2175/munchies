/**
 * @module data/buildYourOwnData
 * @description Nutritional and pricing data extracted directly from Munchie's "اعمل ساندوتش علي مزاجك" menu flyer.
 */

import type { LocalizedText } from '@/types';

export interface NutritionalInfo {
  grams: number;
  calories: number;
  protein: number;
  carbs?: number;
  fat?: number;
}

export interface BuilderItem {
  id: string;
  name: LocalizedText;
  price: number;
  nutrition: NutritionalInfo;
  image?: string;
}

export const PROTEIN_OPTIONS: BuilderItem[] = [
  {
    id: 'prot_ch_grill',
    name: { ar: 'صدور فراخ جريل', en: 'Grilled Chicken Breast' },
    price: 65,
    nutrition: { grams: 140, calories: 230, protein: 42, carbs: 0, fat: 4 },
  },
  {
    id: 'prot_crispy',
    name: { ar: 'دجاج كريسبي استربس', en: 'Crispy Chicken Strips' },
    price: 70,
    nutrition: { grams: 120, calories: 320, protein: 20, carbs: 16, fat: 12 },
  },
  {
    id: 'prot_burger',
    name: { ar: 'برجر لحم بقري طازج', en: 'Fresh Beef Burger Patty' },
    price: 55,
    nutrition: { grams: 100, calories: 260, protein: 18, carbs: 1, fat: 19 },
  },
  {
    id: 'prot_beef_steak',
    name: { ar: 'شرائح لحم استيك', en: 'Sliced Beef Steak' },
    price: 45,
    nutrition: { grams: 30, calories: 55, protein: 8, carbs: 0, fat: 2 },
  },
  {
    id: 'prot_hot_dog',
    name: { ar: 'هوت دوج مشوي', en: 'Grilled Hot Dog' },
    price: 15,
    nutrition: { grams: 15, calories: 45, protein: 1.5, carbs: 1, fat: 3.5 },
  },
  {
    id: 'prot_burger_ch_grill',
    name: { ar: 'برجر فراخ جريل', en: 'Grilled Chicken Burger' },
    price: 40,
    nutrition: { grams: 100, calories: 165, protein: 23, carbs: 2, fat: 5 },
  },
];

export const BREAD_OPTIONS: BuilderItem[] = [
  {
    id: 'bread_kaiser',
    name: { ar: 'عيش كيزر طازج', en: 'Fresh Kaiser Bun' },
    price: 15,
    nutrition: { grams: 95, calories: 260, protein: 9, carbs: 49, fat: 4 },
  },
  {
    id: 'bread_french',
    name: { ar: 'عيش فرنساوي', en: 'French Baguette' },
    price: 15,
    nutrition: { grams: 85, calories: 238, protein: 8, carbs: 45, fat: 2.5 },
  },
  {
    id: 'bread_whole_grain',
    name: { ar: 'عيش حبة كاملة صحي', en: 'Whole Grain Healthy Bun' },
    price: 15,
    nutrition: { grams: 30, calories: 80, protein: 2.3, carbs: 14, fat: 1.5 },
  },
  {
    id: 'bread_fat_bun',
    name: { ar: 'خبز فات بير الضخم', en: 'Oversized Fat Bun' },
    price: 20,
    nutrition: { grams: 150, calories: 400, protein: 13, carbs: 80, fat: 4 },
  },
  {
    id: 'bread_toast',
    name: { ar: 'عيش توست محمص', en: 'Toasted Bread' },
    price: 10,
    nutrition: { grams: 15, calories: 38, protein: 1.4, carbs: 6.5, fat: 0.6 },
  },
  {
    id: 'bread_tortilla',
    name: { ar: 'عيش تورتيا راب', en: 'Tortilla Wrap' },
    price: 20,
    nutrition: { grams: 90, calories: 250, protein: 8, carbs: 50, fat: 6 },
  },
];

export const CHEESE_DELI_OPTIONS: BuilderItem[] = [
  {
    id: 'deli_red_cheddar',
    name: { ar: 'شيدر أحمر', en: 'Red Cheddar' },
    price: 10,
    nutrition: { grams: 12, calories: 48, protein: 2.5, carbs: 0.3, fat: 3.8 },
  },
  {
    id: 'deli_american_cheese',
    name: { ar: 'أمريكان تشيز سايح', en: 'Melted American Cheese' },
    price: 12,
    nutrition: { grams: 13, calories: 43, protein: 2.3, carbs: 0.7, fat: 3.3 },
  },
  {
    id: 'deli_mozzarella',
    name: { ar: 'مودزريلا غنية', en: 'Rich Mozzarella' },
    price: 10,
    nutrition: { grams: 20, calories: 60, protein: 5, carbs: 0.5, fat: 5 },
  },
  {
    id: 'deli_turkey',
    name: { ar: 'تركي مدخن', en: 'Smoked Turkey' },
    price: 12,
    nutrition: { grams: 12, calories: 16, protein: 2.2, carbs: 0.3, fat: 0.5 },
  },
  {
    id: 'deli_salami',
    name: { ar: 'سلامي إيطالي', en: 'Salami' },
    price: 12,
    nutrition: { grams: 12, calories: 51, protein: 2.6, carbs: 0.1, fat: 4.2 },
  },
  {
    id: 'deli_roast_beef',
    name: { ar: 'روز بيف فاخر', en: 'Roast Beef' },
    price: 12,
    nutrition: { grams: 12, calories: 30, protein: 3.5, carbs: 0.2, fat: 1.8 },
  },
];

export const TOPPING_OPTIONS: BuilderItem[] = [
  {
    id: 'top_jalapeno',
    name: { ar: 'هالبينو حار', en: 'Jalapeño' },
    price: 4,
    nutrition: { grams: 10, calories: 5, protein: 0.2 },
  },
  {
    id: 'top_pickles',
    name: { ar: 'خيار مخلل كرانشي', en: 'Pickles' },
    price: 4,
    nutrition: { grams: 15, calories: 4, protein: 0.1 },
  },
  {
    id: 'top_mushroom',
    name: { ar: 'مشروم فريش مشوح', en: 'Sautéed Mushroom' },
    price: 10,
    nutrition: { grams: 25, calories: 12, protein: 1 },
  },
  {
    id: 'top_caramelized_onion',
    name: { ar: 'بصل مكرمل مكرمل بالعسل', en: 'Caramelized Onion' },
    price: 7,
    nutrition: { grams: 20, calories: 35, protein: 0.5 },
  },
  {
    id: 'top_fried_egg',
    name: { ar: 'بيض مقلي عيون', en: 'Fried Egg' },
    price: 10,
    nutrition: { grams: 50, calories: 78, protein: 6.3 },
  },
  {
    id: 'top_honey_cabbage',
    name: { ar: 'كرنب بالعسل الخاص', en: 'Honey Cabbage Slaw' },
    price: 10,
    nutrition: { grams: 40, calories: 45, protein: 0.8 },
  },
  {
    id: 'top_bell_pepper',
    name: { ar: 'فلفل ألوان فريش', en: 'Bell Pepper' },
    price: 7,
    nutrition: { grams: 20, calories: 8, protein: 0.3 },
  },
  {
    id: 'top_sauce',
    name: { ar: 'صوص مانشيز السري الإضافي', en: 'Extra Munchies Sauce' },
    price: 20,
    nutrition: { grams: 20, calories: 115, protein: 0.2 },
  },
  {
    id: 'top_chips',
    name: { ar: 'بطاطس شيبس مقرمشة', en: 'Crispy Chips' },
    price: 20,
    nutrition: { grams: 150, calories: 109, protein: 1.4 },
  },
];

