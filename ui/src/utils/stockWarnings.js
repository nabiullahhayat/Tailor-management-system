export const DEFAULT_FABRIC_WARNING = 10;
export const DEFAULT_MACHINERY_WARNING = 3;

export function getWarningQuantity(item, kind) {
  const raw = item?.warningQuantity;
  if (raw !== undefined && raw !== null && raw !== '') {
    const n = Number(raw);
    if (!Number.isNaN(n) && n >= 0) return n;
  }
  return kind === 'fabric' ? DEFAULT_FABRIC_WARNING : DEFAULT_MACHINERY_WARNING;
}

export function isStockAtOrBelowWarning(item, kind) {
  const stock = Number(item?.stock ?? 0);
  return stock <= getWarningQuantity(item, kind);
}

export function collectStockWarnings(fabrics = [], machinery = []) {
  const fabricAlerts = fabrics
    .filter((f) => isStockAtOrBelowWarning(f, 'fabric'))
    .map((f) => ({
      id: f.id,
      kind: 'fabric',
      name: f.name,
      stock: Number(f.stock ?? 0),
      warningQuantity: getWarningQuantity(f, 'fabric'),
      unitLabel: 'm',
    }));

  const machineryAlerts = machinery
    .filter((m) => isStockAtOrBelowWarning(m, 'machinery'))
    .map((m) => ({
      id: m.id,
      kind: 'machinery',
      name: m.name,
      stock: Number(m.stock ?? 0),
      warningQuantity: getWarningQuantity(m, 'machinery'),
      unitLabel: 'units',
    }));

  return [...fabricAlerts, ...machineryAlerts];
}
