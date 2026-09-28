/** Afghan Afghani (AFN) — Unicode currency sign */
export const CURRENCY_SYMBOL = '؋';

export function formatCurrency(value, options = {}) {
  const { maximumFractionDigits } = options;
  const n = Number(value || 0);
  const formatted =
    maximumFractionDigits != null
      ? n.toLocaleString(undefined, { maximumFractionDigits })
      : n.toLocaleString(undefined);
  return `${CURRENCY_SYMBOL}${formatted}`;
}

/** Compact axis labels, e.g. ؋12k */
export function formatCurrencyAxis(value) {
  const n = Number(value || 0);
  if (Math.abs(n) >= 1000) return `${CURRENCY_SYMBOL}${n / 1000}k`;
  return `${CURRENCY_SYMBOL}${n}`;
}
