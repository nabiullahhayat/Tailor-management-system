import {
  SOLAR_MONTH_NAMES,
  addSolarMonths,
  formatSolarDayLabel,
  getSolarMonthKey,
  getTodaySolarParts,
  isSolarDateString,
  jalaliToGregorian,
  parseSolarDateString,
} from './solarDate.js';
import { toLocalDateKey } from './orderDelivery.js';

function parseToGregorianDate(dateStr) {
  if (dateStr == null || dateStr === '') return null;
  const raw = String(dateStr).trim();
  if (isSolarDateString(raw)) {
    return parseSolarDateString(raw);
  }
  const isoDay = raw.split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoDay)) {
    const [y, m, d] = isoDay.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function dayKey(date) {
  const key = toLocalDateKey(date);
  return key;
}

function lastSolarMonths(count = 6) {
  const today = getTodaySolarParts();
  const months = [];
  let y = today.year;
  let m = today.month;
  for (let i = count - 1; i >= 0; i -= 1) {
    const offset = addSolarMonths(today.year, today.month, -i);
    y = offset.year;
    m = offset.month;
    const gStart = jalaliToGregorian(y, m, 1);
    const gregKey = `${gStart.year}-${String(gStart.month).padStart(2, '0')}`;
    months.push({
      key: gregKey,
      solarKey: `${y}/${String(m).padStart(2, '0')}`,
      label: SOLAR_MONTH_NAMES[m] || `M${m}`,
    });
  }
  return months;
}

function isGregorianSameMonth(dateStr, refDate) {
  const itemKey = getSolarMonthKey(dateStr);
  const refKey = getSolarMonthKey(refDate instanceof Date ? refDate : refDate);
  if (itemKey && refKey) return itemKey === refKey;
  const d = parseToGregorianDate(dateStr);
  if (!d) return false;
  return d.getFullYear() === refDate.getFullYear() && d.getMonth() === refDate.getMonth();
}

export function getMonthlyRevenueExpense({ income = [], expenses = [], sales = [] }) {
  const months = lastSolarMonths(6);
  const incomeMap = Object.fromEntries(months.map((m) => [m.solarKey, 0]));
  const expenseMap = Object.fromEntries(months.map((m) => [m.solarKey, 0]));

  income.forEach((item) => {
    const key = getSolarMonthKey(item.incomeDate);
    if (key && key in incomeMap) incomeMap[key] += item.amount || 0;
  });

  sales
    .filter((s) => s.paymentStatus === 'Paid')
    .forEach((sale) => {
      const key = getSolarMonthKey(sale.saleDate);
      if (key && key in incomeMap) incomeMap[key] += sale.totalAmount || 0;
    });

  expenses.forEach((expense) => {
    const key = getSolarMonthKey(expense.date);
    if (key && key in expenseMap) expenseMap[key] += expense.amount || 0;
  });

  return months.map((m) => ({
    month: m.label,
    income: incomeMap[m.solarKey],
    expense: expenseMap[m.solarKey],
    profit: incomeMap[m.solarKey] - expenseMap[m.solarKey],
  }));
}

/** Daily income vs expense for the current solar month. */
export function getCurrentMonthDailyRevenueExpense({ income = [], expenses = [], sales = [] }) {
  const { year, month, day: todayDay } = getTodaySolarParts();

  const days = [];
  for (let solarDay = 1; solarDay <= todayDay; solarDay += 1) {
    const g = jalaliToGregorian(year, month, solarDay);
    const d = new Date(g.year, g.month - 1, g.day);
    days.push({
      key: dayKey(d),
      label: String(solarDay),
    });
  }

  const incomeMap = Object.fromEntries(days.map((x) => [x.key, 0]));
  const expenseMap = Object.fromEntries(days.map((x) => [x.key, 0]));

  income.forEach((item) => {
    if (!isGregorianSameMonth(item.incomeDate, new Date())) return;
    const key = dayKey(item.incomeDate);
    if (key && key in incomeMap) incomeMap[key] += item.amount || 0;
  });

  sales
    .filter((s) => s.paymentStatus === 'Paid')
    .forEach((sale) => {
      if (!isGregorianSameMonth(sale.saleDate, new Date())) return;
      const key = dayKey(sale.saleDate);
      if (key && key in incomeMap) incomeMap[key] += sale.totalAmount || 0;
    });

  expenses.forEach((expense) => {
    if (!isGregorianSameMonth(expense.date, new Date())) return;
    const key = dayKey(expense.date);
    if (key && key in expenseMap) expenseMap[key] += expense.amount || 0;
  });

  return days.map((x) => ({
    day: x.label,
    income: incomeMap[x.key],
    expense: expenseMap[x.key],
    profit: incomeMap[x.key] - expenseMap[x.key],
  }));
}

export function getOrdersByStatus(orders = []) {
  const statuses = ['Finding', 'Ready', 'Delivered'];
  const colors = { Finding: '#6366f1', Ready: '#00a76f', Delivered: '#0066ff' };
  return statuses.map((status) => ({
    name: status,
    value: orders.filter((o) => o.status === status).length,
    fill: colors[status],
  }));
}

export function getExpensesMonthlyTrend(expenses = [], count = 6) {
  const months = lastSolarMonths(count);
  const amountMap = Object.fromEntries(months.map((m) => [m.solarKey, 0]));

  expenses.forEach((expense) => {
    const solarKey = getSolarMonthKey(expense.date);
    if (solarKey && solarKey in amountMap) amountMap[solarKey] += expense.amount || 0;
  });

  return months.map((m) => ({
    month: m.label,
    amount: amountMap[m.solarKey],
  }));
}

export function getExpensesByCategory(expenses = []) {
  const categories = ['Fabric', 'Machinery', 'Other'];
  const colors = { Fabric: '#6366f1', Machinery: '#0066ff', Other: '#f59e0b' };
  return categories.map((cat) => ({
    name: cat,
    amount: expenses.filter((e) => e.category === cat).reduce((s, e) => s + (e.amount || 0), 0),
    fill: colors[cat],
  }));
}

export function getSalesByType(sales = []) {
  const types = ['Fabric Sale', 'Machinery Sale'];
  const colors = { 'Fabric Sale': '#00a76f', 'Machinery Sale': '#0066ff' };
  return types.map((type) => ({
    name: type.replace(' Sale', ''),
    value: sales.filter((s) => s.saleType === type).length,
    revenue: sales.filter((s) => s.saleType === type).reduce((s, x) => s + (x.totalAmount || 0), 0),
    fill: colors[type],
  }));
}

export function getDailyIncomeTrend(transactions = [], days = 14) {
  const result = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = toLocalDateKey(d);
    const label = formatSolarDayLabel(d);
    const income = transactions
      .filter((t) => t.category === 'income' && toLocalDateKey(t.date) === key)
      .reduce((s, t) => s + t.amount, 0);
    const expense = transactions
      .filter((t) => t.category === 'expense' && toLocalDateKey(t.date) === key)
      .reduce((s, t) => s + t.amount, 0);
    result.push({ day: label, income, expense });
  }
  return result;
}

export { CURRENCY_SYMBOL, formatCurrency, formatCurrencyAxis } from './currency.js';
