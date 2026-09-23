const STORAGE_KEY = 'toiler_dismissed_notifications';

export function loadDismissedNotificationKeys() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function saveDismissedNotificationKeys(keys) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...keys]));
}

export function deliveryNotificationKey(orderId, tomorrowDateKey) {
  return `delivery:${orderId}:${tomorrowDateKey}`;
}

export function stockNotificationKey(kind, id, stock) {
  return `stock:${kind}:${id}:${stock}`;
}
