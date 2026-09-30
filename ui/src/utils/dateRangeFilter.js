import { normalizeSolarDateString } from './solarDate.js';
import { toLocalDateKey } from './orderDelivery.js';

/** True if recordDate falls within inclusive solar range (YYYY/MM/DD strings). Empty from/to = no bound. */
export function isInSolarDateRange(recordDate, fromSolar, toSolar) {
  const key = toLocalDateKey(recordDate);
  if (!key) return false;
  const fromKey = fromSolar ? toLocalDateKey(normalizeSolarDateString(fromSolar)) : null;
  const toKey = toSolar ? toLocalDateKey(normalizeSolarDateString(toSolar)) : null;
  if (fromKey && key < fromKey) return false;
  if (toKey && key > toKey) return false;
  return true;
}
