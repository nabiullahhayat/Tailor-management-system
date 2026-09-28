import { getTodaySolarParts, jalaliToGregorian } from './solarDate.js';
import { toLocalDateKey } from './orderDelivery.js';

export const DASHBOARD_PERIODS = ['today', 'week', 'month', 'year', 'custom'];

function startOfLocalDay(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getDashboardPeriodBounds(period, customFrom = '', customTo = '') {
  const today = startOfLocalDay();
  const todayKey = toLocalDateKey(today);

  if (period === 'today') {
    return { startKey: todayKey, endKey: todayKey };
  }

  if (period === 'week') {
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    return { startKey: toLocalDateKey(weekStart), endKey: todayKey };
  }

  if (period === 'month') {
    const { year, month } = getTodaySolarParts();
    const g = jalaliToGregorian(year, month, 1);
    const monthStart = new Date(g.year, g.month - 1, g.day);
    return { startKey: toLocalDateKey(monthStart), endKey: todayKey };
  }

  if (period === 'year') {
    const { year } = getTodaySolarParts();
    const g = jalaliToGregorian(year, 1, 1);
    const yearStart = new Date(g.year, g.month - 1, g.day);
    return { startKey: toLocalDateKey(yearStart), endKey: todayKey };
  }

  if (period === 'custom') {
    let startKey = toLocalDateKey(customFrom);
    let endKey = toLocalDateKey(customTo);
    if (startKey && endKey && startKey > endKey) {
      [startKey, endKey] = [endKey, startKey];
    }
    return { startKey: startKey || todayKey, endKey: endKey || todayKey };
  }

  return { startKey: todayKey, endKey: todayKey };
}

export function isDateKeyInRange(dateStr, startKey, endKey) {
  const key = toLocalDateKey(dateStr);
  if (!key || !startKey || !endKey) return false;
  return key >= startKey && key <= endKey;
}

export function computeDashboardKpis({
  orders = [],
  income = [],
  sales = [],
  customers = [],
  startKey,
  endKey,
}) {
  const inRange = (dateStr) => isDateKeyInRange(dateStr, startKey, endKey);

  const orderCount = orders.filter((o) => inRange(o.orderDate)).length;

  const incomeFromRecords = income
    .filter((i) => inRange(i.incomeDate))
    .reduce((s, i) => s + (i.amount || 0), 0);
  const incomeFromSales = sales
    .filter((s) => s.paymentStatus === 'Paid' && inRange(s.saleDate))
    .reduce((s, sale) => s + (sale.totalAmount || 0), 0);
  const totalIncome = incomeFromRecords + incomeFromSales;

  const pendingOrders = orders.filter(
    (o) => ['Finding', 'Ready'].includes(o.status) && inRange(o.orderDate),
  ).length;

  const newCustomers = customers.filter((c) => inRange(c.addedDate)).length;

  return {
    orderCount,
    totalIncome,
    pendingOrders,
    newCustomers,
  };
}
