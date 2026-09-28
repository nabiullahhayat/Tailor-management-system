export const DATA_CHANGED_EVENT = 'khayati:data-changed';

export function notifyDataChanged(collection) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(DATA_CHANGED_EVENT, { detail: { collection } }),
  );
}
