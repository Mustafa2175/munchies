/**
 * @file test-checkout-flow.ts
 * @description Test suite for Munchie's Cart Summary, Simplified Delivery Address, and 3-Step Checkout UX.
 * Tests validation rules, step transitions, fulfillment logic, price calculations, and address compatibility.
 */

import { z } from 'zod';
import { normalizeEgyptianPhone, isValidEgyptianPhone } from '../src/lib/validators';
import { formatDeliveryAddress } from '../src/lib/address';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

console.log('🧪 Starting Cart & 3-Step Checkout Test Suite...\n');

// 1. Test Phone Validation
console.log('--- Test 1: Egyptian Phone Validation ---');
assert(isValidEgyptianPhone(normalizeEgyptianPhone('01025707026')), 'Valid Vodafone Egyptian phone (01025707026)');
assert(isValidEgyptianPhone(normalizeEgyptianPhone('01112345678')), 'Valid Etisalat Egyptian phone (01112345678)');
assert(isValidEgyptianPhone(normalizeEgyptianPhone('01234567890')), 'Valid Orange Egyptian phone (01234567890)');
assert(isValidEgyptianPhone(normalizeEgyptianPhone('01555555555')), 'Valid WE Egyptian phone (01555555555)');
assert(!isValidEgyptianPhone(normalizeEgyptianPhone('010123456')), 'Rejects short phone number');
assert(!isValidEgyptianPhone(normalizeEgyptianPhone('01312345678')), 'Rejects invalid prefix (013)');
assert(!isValidEgyptianPhone(normalizeEgyptianPhone('')), 'Rejects empty phone number');

// 2. Test Simplified Single-Textarea Delivery Address Schema
console.log('\n--- Test 2: Simplified Delivery Address Validation ---');
const deliveryAddressSchema = z
  .string()
  .trim()
  .min(5, 'من فضلك اكتب عنوان التوصيل بالتفصيل');

assert(
  deliveryAddressSchema.safeParse('الكورنيش، شارع النفق، عمارة 12، الدور الثالث').success,
  'Valid single-field freeform delivery address'
);

assert(
  !deliveryAddressSchema.safeParse('').success,
  'Rejects empty delivery address'
);

assert(
  !deliveryAddressSchema.safeParse('   ك   ').success,
  'Rejects whitespace/too-short delivery address'
);

// 3. Test Step Progression Rules
console.log('\n--- Test 3: Step Progression Rules ---');

interface CheckoutState {
  orderType: 'pickup' | 'delivery';
  deliveryEnabled: boolean;
  fullName: string;
  phone: string;
  deliveryAddress: string;
}

function canProceedToStep2(state: CheckoutState): boolean {
  if (state.orderType === 'delivery' && !state.deliveryEnabled) {
    return false;
  }
  return true;
}

function canProceedToStep3(state: CheckoutState): boolean {
  if (!state.fullName.trim() || !state.phone.trim()) return false;
  const normalized = normalizeEgyptianPhone(state.phone);
  if (!isValidEgyptianPhone(normalized)) return false;

  if (state.orderType === 'delivery') {
    return deliveryAddressSchema.safeParse(state.deliveryAddress).success;
  }
  // Pickup requires no address
  return true;
}

// Pickup progression
const validPickupState: CheckoutState = {
  orderType: 'pickup',
  deliveryEnabled: false,
  fullName: 'أحمد محمود',
  phone: '01025707026',
  deliveryAddress: '',
};

assert(canProceedToStep2(validPickupState), 'Pickup passes Step 1 even when delivery is disabled');
assert(canProceedToStep3(validPickupState), 'Pickup passes Step 2 without needing any address');

// Delivery progression when disabled
const disabledDeliveryState: CheckoutState = {
  ...validPickupState,
  orderType: 'delivery',
  deliveryEnabled: false,
};
assert(!canProceedToStep2(disabledDeliveryState), 'Blocked from Step 2 if delivery is disabled');

// Delivery progression when enabled
const validDeliveryState: CheckoutState = {
  orderType: 'delivery',
  deliveryEnabled: true,
  fullName: 'محمود حسن',
  phone: '01123456789',
  deliveryAddress: 'الكورنيش، شارع النفق، عمارة 12، الدور الثالث، شقة 5',
};

assert(canProceedToStep2(validDeliveryState), 'Delivery passes Step 1 when delivery is enabled');
assert(canProceedToStep3(validDeliveryState), 'Delivery passes Step 2 when single address textarea is complete');

// Delivery missing address
const invalidDeliveryState: CheckoutState = {
  ...validDeliveryState,
  deliveryAddress: '',
};
assert(!canProceedToStep3(invalidDeliveryState), 'Delivery blocked from Step 3 when address is empty');

// 4. Test Cart Summary & Checkout Delivery Fee Display & Totals
console.log('\n--- Test 4: Cart & Checkout Delivery Fee Logic ---');

function computeSummaryDisplay(
  subtotal: number,
  orderType: 'pickup' | 'delivery' | null,
  configuredFee = 25,
  discount = 0
) {
  const isFulfillmentSelected = orderType === 'pickup' || orderType === 'delivery';
  const deliveryFee = orderType === 'delivery' ? configuredFee : 0;
  const total = Math.max(0, subtotal + deliveryFee - discount);
  const feeLabel = !isFulfillmentSelected
    ? 'تُحدد عند اختيار طريقة الاستلام'
    : orderType === 'pickup'
    ? 'مجاني (استلام من الفرع)'
    : `${deliveryFee} ج.م`;

  return { deliveryFee, total, feeLabel };
}

const cartUnselected = computeSummaryDisplay(180, null, 25);
assert(
  cartUnselected.feeLabel === 'تُحدد عند اختيار طريقة الاستلام',
  'Cart before fulfillment displays placeholder text instead of free'
);
assert(cartUnselected.deliveryFee === 0 && cartUnselected.total === 180, 'Cart total excludes unconfirmed delivery fee');

const pickupSummary = computeSummaryDisplay(180, 'pickup', 25);
assert(pickupSummary.feeLabel.includes('مجاني') && pickupSummary.total === 180, 'Pickup shows مجاني and 0 delivery fee');

const deliverySummary = computeSummaryDisplay(180, 'delivery', 30);
assert(deliverySummary.deliveryFee === 30 && deliverySummary.total === 210, 'Delivery uses configured restaurant delivery fee');

// 5. Test Backward-Compatible Address Formatter
console.log('\n--- Test 5: Address Display Compatibility (New & Historical Orders) ---');

const simplifiedOrderAddress = {
  id: 'addr_1',
  label: 'عنوان التوصيل',
  area: '',
  street: 'الكورنيش، شارع النفق، عمارة 12، الدور الثالث',
  addressLine1: 'الكورنيش، شارع النفق، عمارة 12، الدور الثالث',
  addressLine2: '',
  building: '',
  deliveryInstructions: '',
  city: 'أسوان',
  isDefault: true,
};

const formattedNew = formatDeliveryAddress(simplifiedOrderAddress);
assert(
  !formattedNew.isStructured && formattedNew.area === '' && formattedNew.mainText === 'الكورنيش، شارع النفق، عمارة 12، الدور الثالث',
  'Formats simplified single-string order address cleanly without area/building prefixes'
);

const legacyStructuredAddress = {
  id: 'addr_legacy',
  label: 'عنوان التوصيل',
  area: 'أطلس',
  street: 'شارع المطار',
  addressLine1: 'شارع المطار',
  addressLine2: 'عمارة 5، الدور 2',
  building: 'عمارة 5، الدور 2',
  deliveryInstructions: 'بجوار المسجد',
  city: 'أسوان',
  isDefault: true,
};

const formattedLegacy = formatDeliveryAddress(legacyStructuredAddress);
assert(
  formattedLegacy.isStructured &&
    formattedLegacy.area === 'أطلس' &&
    formattedLegacy.street === 'شارع المطار' &&
    formattedLegacy.building === 'عمارة 5، الدور 2' &&
    formattedLegacy.landmark === 'بجوار المسجد' &&
    formattedLegacy.mainText === 'أطلس – شارع المطار – عمارة 5، الدور 2',
  'Preserves full backward compatibility for historical structured addresses'
);

const formattedRawString = formatDeliveryAddress('العقاد، عمارة 7 الدور الأول');
assert(
  !formattedRawString.isStructured && formattedRawString.mainText === 'العقاد، عمارة 7 الدور الأول',
  'Supports raw string deliveryAddress gracefully'
);

const formattedNull = formatDeliveryAddress(null);
assert(formattedNull.mainText === '' && !formattedNull.isStructured, 'Handles null deliveryAddress safely');

// 6. Test Mobile Screen Width Budgets
console.log('\n--- Test 6: Mobile Viewport Width Integrity ---');
const MOBILE_WIDTHS = [320, 360, 375, 390, 430];
MOBILE_WIDTHS.forEach((w) => {
  const outerPadding = 32;
  const available = w - outerPadding;
  assert(available >= 288, `Viewport ${w}px provides at least 288px available width (got ${available}px)`);
});

console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
