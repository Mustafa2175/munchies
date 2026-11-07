/**
 * @module lib/currency
 * @description Currency and pricing utilities strictly in Arabic (ج.م).
 */

export function formatPrice(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  return `${rounded} ج.م`;
}

export function formatPriceCompact(amount: number): string {
  return `${amount} ج.م`;
}
