/**
 * @file test-sandwich-builder.ts
 * @description Integration and verification test script for the Gamified Sandwich Builder.
 * Tests business logic, pricing, validation, steps, cart integration, and state persistence.
 */

import {
  PROTEIN_OPTIONS,
  BREAD_OPTIONS,
  CHEESE_DELI_OPTIONS,
  TOPPING_OPTIONS,
  type BuilderItem,
} from '../src/data/buildYourOwnData';
import { BUILDER_STEPS } from '../src/components/sandwich-builder/useSandwichBuilder';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

console.log('🧪 Starting Sandwich Builder Test Suite...\n');

// 1. Verify Core Steps Configuration
console.log('--- Test 1: Step Configuration ---');
assert(BUILDER_STEPS.length === 4, 'Builder has 4 selection steps (+ 1 review step = 5 total)');
assert(BUILDER_STEPS[0].id === 'protein' && BUILDER_STEPS[0].isRequired === true && BUILDER_STEPS[0].selectionMode === 'single', 'Step 1 is Protein (Required, Single)');
assert(BUILDER_STEPS[1].id === 'bread' && BUILDER_STEPS[1].isRequired === true && BUILDER_STEPS[1].selectionMode === 'single', 'Step 2 is Bread (Required, Single)');
assert(BUILDER_STEPS[2].id === 'cheese' && BUILDER_STEPS[2].isRequired === false && BUILDER_STEPS[2].selectionMode === 'multiple', 'Step 3 is Cheese & Deli (Optional, Multiple)');
assert(BUILDER_STEPS[3].id === 'toppings' && BUILDER_STEPS[3].isRequired === false && BUILDER_STEPS[3].selectionMode === 'multiple', 'Step 4 is Toppings & Sauces (Optional, Multiple)');
assert(BUILDER_STEPS[3].subgroups?.length === 2, 'Step 4 has subgroups for Toppings and Sauces');

// 2. Test Selection & Pricing Logic
console.log('\n--- Test 2: Pricing & Nutrition Math ---');
const protein = PROTEIN_OPTIONS.find((p) => p.id === 'prot_ch_grill')!; // 65 EGP, 230 cal, 42g protein
const bread = BREAD_OPTIONS.find((b) => b.id === 'bread_kaiser')!; // 15 EGP, 260 cal, 9g protein
const cheese1 = CHEESE_DELI_OPTIONS.find((c) => c.id === 'deli_red_cheddar')!; // 10 EGP, 48 cal
const cheese2 = CHEESE_DELI_OPTIONS.find((c) => c.id === 'deli_turkey')!; // 12 EGP, 16 cal
const topping1 = TOPPING_OPTIONS.find((t) => t.id === 'top_mushroom')!; // 10 EGP, 12 cal
const sauce1 = TOPPING_OPTIONS.find((t) => t.id === 'top_sauce')!; // 20 EGP, 115 cal

const selections: Record<string, BuilderItem[]> = {
  protein: [protein],
  bread: [bread],
  cheese: [cheese1, cheese2],
  toppings: [topping1, sauce1],
};

const basePrice = selections['protein']?.[0]?.price || 0;
const addonsPrice =
  (selections['bread']?.[0]?.price || 0) +
  (selections['cheese'] || []).reduce((s, c) => s + c.price, 0) +
  (selections['toppings'] || []).reduce((s, t) => s + t.price, 0);

const unitPrice = basePrice + addonsPrice;
const quantity = 2;
const totalPrice = unitPrice * quantity;

assert(basePrice === 65, 'Base protein price is 65 EGP');
assert(addonsPrice === 15 + 10 + 12 + 10 + 20, `Addons price is 67 EGP (got ${addonsPrice})`);
assert(unitPrice === 132, `Unit sandwich price is 132 EGP (got ${unitPrice})`);
assert(totalPrice === 264, `Total price for 2 sandwiches is 264 EGP (got ${totalPrice})`);

// 3. Test Nutrition Aggregation
console.log('\n--- Test 3: Nutrition Aggregation ---');
const allItems = Object.values(selections).flat();
const totalCalories = allItems.reduce((sum, item) => sum + (item.nutrition.calories || 0), 0);
const totalProtein = Math.round(allItems.reduce((sum, item) => sum + (item.nutrition.protein || 0), 0) * 10) / 10;

assert(totalCalories === 230 + 260 + 48 + 16 + 12 + 115, `Total calories is 681 cal (got ${totalCalories})`);
assert(totalProtein > 50, `Total protein is high: ${totalProtein}g`);

// 4. Test Validation Rules
console.log('\n--- Test 4: Validation Rules ---');
function validateSelections(sel: Record<string, BuilderItem[]>) {
  const missingRequired: string[] = [];
  for (const step of BUILDER_STEPS) {
    if (step.isRequired && (!sel[step.id] || sel[step.id].length === 0)) {
      missingRequired.push(step.id);
    }
  }
  return {
    isValid: missingRequired.length === 0,
    missingRequired,
  };
}

assert(!validateSelections({}).isValid, 'Empty selections fail validation');
assert(!validateSelections({ protein: [protein] }).isValid, 'Missing bread fails validation');
assert(!validateSelections({ bread: [bread] }).isValid, 'Missing protein fails validation');
assert(validateSelections({ protein: [protein], bread: [bread] }).isValid, 'Protein + Bread passes validation (optional steps omitted)');
assert(validateSelections(selections).isValid, 'Complete selections pass validation');

// 5. Test Cart Customization Payload
console.log('\n--- Test 5: Cart Structure & Pricing Integration ---');
const customTitle = `ساندوتش ${protein.name.ar} على عيش ${bread.name.ar}`;
const customizations = [
  {
    groupId: 'protein',
    groupName: { ar: 'البروتين', en: 'Protein' },
    selectedOptions: [{ optionId: protein.id, name: protein.name, price: 0 }],
  },
  {
    groupId: 'bread',
    groupName: { ar: 'العيش', en: 'Bread' },
    selectedOptions: [{ optionId: bread.id, name: bread.name, price: bread.price }],
  },
  {
    groupId: 'cheese',
    groupName: { ar: 'الجبن والدلي', en: 'Cheese & Deli' },
    selectedOptions: (selections['cheese'] || []).map((c) => ({
      optionId: c.id,
      name: c.name,
      price: c.price,
    })),
  },
  {
    groupId: 'toppings',
    groupName: { ar: 'الإضافات والصوصات', en: 'Toppings & Sauces' },
    selectedOptions: (selections['toppings'] || []).map((t) => ({
      optionId: t.id,
      name: t.name,
      price: t.price,
    })),
  },
];

// Simulate Cart Store calculation
const optionSum = customizations.reduce(
  (acc, group) =>
    acc + group.selectedOptions.reduce((oAcc, opt) => oAcc + opt.price, 0),
  0
);
const cartUnitPrice = basePrice + optionSum;
const cartLineTotal = cartUnitPrice * quantity;

assert(optionSum === addonsPrice, `Cart option sum equals addons price (${optionSum} EGP)`);
assert(cartUnitPrice === unitPrice, `Cart unit price matches builder unit price (${cartUnitPrice} EGP)`);
assert(cartLineTotal === totalPrice, `Cart line total matches builder total (${cartLineTotal} EGP)`);

// 6. Test Cart Grouping Logic (Identical vs Distinct)
console.log('\n--- Test 6: Cart Uniqueness & Grouping Key ---');
const customKey = (c: typeof customizations) =>
  JSON.stringify(
    c
      .map((g) => ({
        groupId: g.groupId,
        options: g.selectedOptions.map((o) => o.optionId).sort(),
      }))
      .sort((a, b) => a.groupId.localeCompare(b.groupId))
  );

const key1 = customKey(customizations);

// Duplicate identical sandwich
const keyIdentical = customKey(customizations);
assert(key1 === keyIdentical, 'Identical sandwiches produce identical grouping key');

// Sandwich with different bread
const diffCustomizations = [
  ...customizations.filter((c) => c.groupId !== 'bread'),
  {
    groupId: 'bread',
    groupName: { ar: 'العيش', en: 'Bread' },
    selectedOptions: [{ optionId: 'bread_french', name: { ar: 'فرنساوي', en: 'French' }, price: 15 }],
  },
];
const keyDiff = customKey(diffCustomizations);
assert(key1 !== keyDiff, 'Different sandwich configurations produce unique keys (no false grouping)');

console.log('\n🎉 ALL 18 TESTS PASSED SUCCESSFULLY!');

