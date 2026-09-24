const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function monthKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function lastMonths(count = 6) {
  const months = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: monthKey(d),
      label: MONTH_LABELS[d.getMonth()],
    });
  }
  return months;
}

export function getMonthlyRevenueExpense({ income = [], expenses = [], sales = [] }) {
  const months = lastMonths(6);
  const incomeMap = Object.fromEntries(months.map((m) => [m.key, 0]));
  const expenseMap = Object.fromEntries(months.map((m) => [m.key, 0]));

  income.forEach((item) => {
    const key = monthKey(item.incomeDate);
    if (key in incomeMap) incomeMap[key] += item.amount || 0;
  });

  sales
    .filter((s) => s.paymentStatus === 'Paid')
    .forEach((sale) => {
      const key = monthKey(sale.saleDate);
      if (key in incomeMap) incomeMap[key] += sale.totalAmount || 0;
    });

  expenses.forEach((expense) => {
    const key = monthKey(expense.date);
    if (key in expenseMap) expenseMap[key] += expense.amount || 0;
  });

  return months.map((m) => ({
    month: m.label,
    income: incomeMap[m.key],
    expense: expenseMap[m.key],
    profit: incomeMap[m.key] - expenseMap[m.key],
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

export function getDailyIncomeTrend(transactions = [], days = 14, locale = 'en-US') {
  const result = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
    const income = transactions
      .filter((t) => t.category === 'income' && t.date === key)
      .reduce((s, t) => s + t.amount, 0);
    const expense = transactions
      .filter((t) => t.category === 'expense' && t.date === key)
      .reduce((s, t) => s + t.amount, 0);
    result.push({ day: label, income, expense });
  }
  return result;
}

export function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}
