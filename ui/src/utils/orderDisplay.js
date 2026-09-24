export function parseOrderLineItems(order) {
  if (!order) return [];
  const raw = order.orderLineItems;
  if (raw) {
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return Array.isArray(raw) ? raw : [];
  }
  if (order.orderType) {
    return [
      {
        orderTypeId: order.orderTypeId || null,
        orderType: order.orderType,
        price: Number(order.totalAmount || 0),
      },
    ];
  }
  return [];
}

/** Unit price × quantity (or stored lineTotal). */
export function getLineItemAmount(line) {
  if (!line) return 0;
  if (line.lineTotal != null && line.lineTotal !== '') return Number(line.lineTotal) || 0;
  const price = Number(line.price || 0);
  const qty = Number(line.quantity ?? 1) || 1;
  return price * qty;
}
