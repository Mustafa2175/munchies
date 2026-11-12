/**
 * @module lib/address
 * @description Shared delivery address formatting helpers for Munchie's.
 * Handles both simplified single-string addresses and historical structured addresses
 * (area, street, building, landmark) consistently across Checkout, Admin, Receipts, and Tracking.
 */

import { getLocalizedText } from '@/lib/i18n';
import type { Address } from '@/types';

export interface FormattedDeliveryAddress {
  /** Primary display string (either the single freeform address or joined historical parts). */
  mainText: string;
  /** Area/district if present (legacy structured orders). */
  area: string;
  /** Street / primary line. */
  street: string;
  /** Building / apartment / secondary line (legacy structured orders). */
  building: string;
  /** Landmark or delivery instructions if present. */
  landmark: string;
  /** True when the address carries legacy structured fields (area, building, floor, apartment). */
  isStructured: boolean;
}

/**
 * Normalizes a delivery address object or string into a consistent display structure.
 */
export function formatDeliveryAddress(
  address?: Address | string | null
): FormattedDeliveryAddress {
  if (!address) {
    return {
      mainText: '',
      area: '',
      street: '',
      building: '',
      landmark: '',
      isStructured: false,
    };
  }

  if (typeof address === 'string') {
    const trimmed = address.trim();
    return {
      mainText: trimmed,
      area: '',
      street: trimmed,
      building: '',
      landmark: '',
      isStructured: false,
    };
  }

  const area = getLocalizedText(address.area, '').trim();
  const street = getLocalizedText(address.addressLine1 || address.street, '').trim();
  const building = getLocalizedText(address.addressLine2 || address.building, '').trim();
  const floor = getLocalizedText(address.floor, '').trim();
  const apartment = getLocalizedText(address.apartment, '').trim();
  const landmark = getLocalizedText(address.deliveryInstructions || address.notes, '').trim();

  const isStructured = Boolean(area || building || floor || apartment);

  const parts = [
    area,
    street,
    building,
    floor ? `الدور ${floor}` : '',
    apartment ? `شقة ${apartment}` : '',
  ].filter(Boolean);

  return {
    mainText: parts.join(' – '),
    area,
    street,
    building,
    landmark,
    isStructured,
  };
}

