/**
 * Centralized Indian Rupee (INR) currency formatting utility for Campus Auction Platform.
 * Uses Intl.NumberFormat with 'en-IN' locale for standard Indian digit grouping (e.g., ₹1,25,000).
 */

export const CURRENCY_SYMBOL = '₹';

/**
 * Format a numeric amount into Indian Rupees (INR) with standard Indian digit grouping.
 * Omits trailing .00 for whole-rupee amounts while preserving paise when present.
 *
 * Examples:
 *   formatCurrency(500)         => "₹500"
 *   formatCurrency(1500)        => "₹1,500"
 *   formatCurrency(12500)       => "₹12,500"
 *   formatCurrency(125000)      => "₹1,25,000"
 *   formatCurrency(1234567.5)   => "₹12,34,567.50"
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }

  const isWhole = Number.isInteger(amount) || amount % 1 === 0;

  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(amount);
}

/**
 * Formats a raw number according to the Indian numbering system without the currency symbol.
 */
export function formatIndianNumber(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0';
  }

  const isWhole = Number.isInteger(amount) || amount % 1 === 0;

  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
