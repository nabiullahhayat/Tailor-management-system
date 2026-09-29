/** Translate stored expense notes (often English from stock sync) for display. */

const STOCK_LINE =
  /^(Stock purchase|Initial stock):\s*([\d.]+)\s*@\s*؋([\d.,]+)(?:\s+from\s+(.+?))?(?:\.\s*(.*))?$/i;

export function formatExpenseDescription(description, t) {
  if (description == null || String(description).trim() === '') {
    return '—';
  }
  const raw = String(description).trim();

  const stockMatch = raw.match(STOCK_LINE);
  if (stockMatch) {
    const [, prefix, qty, unit, supplier, tailNotes] = stockMatch;
    const prefixKey = /^initial/i.test(prefix) ? 'initialStock' : 'stockPurchase';
    let text = t(`expensesDesc.${prefixKey}`, { qty, unit });
    if (supplier) text += t('expensesDesc.fromSupplier', { supplier: supplier.trim() });
    if (tailNotes?.trim()) text += `. ${tailNotes.trim()}`;
    return text;
  }

  if (/^stock purchase$/i.test(raw)) {
    return t('expensesDesc.stockPurchaseShort');
  }

  const fromMatch = raw.match(/^Purchased from\s+(.+)$/i);
  if (fromMatch) {
    return t('expensesDesc.purchasedFrom', { supplier: fromMatch[1].trim() });
  }

  return raw;
}
