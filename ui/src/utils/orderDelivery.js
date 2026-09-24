import { isSolarDateString, parseSolarDateString } from './solarDate.js';

/** Local calendar date as YYYY-MM-DD. */
export function toLocalDateKey(dateInput) {
  if (dateInput == null || dateInput === '') return null;
  const raw = String(dateInput).trim();
  if (isSolarDateString(raw)) {
    const d = parseSolarDateString(raw);
    if (d && !Number.isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
  }
  const isoDay = raw.split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoDay)) return isoDay;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getTomorrowDateKey(fromDate = new Date()) {
  const d = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  d.setDate(d.getDate() + 1);
  return toLocalDateKey(d);
}

/** True when delivery is tomorrow (not today, not overdue, not later). */
export function isOrderDeliveryTomorrow(order, fromDate = new Date()) {
  if (!order?.deliveryDate) return false;
  if (order.status === 'Delivered') return false;
  const deliveryKey = toLocalDateKey(order.deliveryDate);
  if (!deliveryKey) return false;
  return deliveryKey === getTomorrowDateKey(fromDate);
}

export function formatOrderWarningLabel(order) {
  const token = order?.tokenNumber || '';
  const short = token.replace(/^ORD-/i, '#');
  return short.startsWith('#') ? short : `#${short}`;
}
