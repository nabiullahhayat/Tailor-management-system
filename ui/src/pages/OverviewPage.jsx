import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Clock,
  Receipt,
  TrendingUp,
  Users,
} from 'lucide-react';
import PageShell from '../components/desktop/PageShell.jsx';
import KpiCard from '../components/desktop/KpiCard.jsx';
import KpiChartCard from '../components/desktop/KpiChartCard.jsx';
import ChartCard from '../components/desktop/ChartCard.jsx';
import VerticalCategoryBarChart from '../components/desktop/VerticalCategoryBarChart.jsx';
import ChartAreaGradients from '../components/charts/ChartAreaGradients.jsx';
import ChartTooltip from '../components/charts/ChartTooltip.jsx';
import ModernBarGradients, { barGradientUrl } from '../components/charts/ModernBarGradients.jsx';
import {
  CHART_ANIMATION,
  CHART_MARGIN,
  AREA_EXPENSE,
  AREA_INCOME,
  useChartTheme,
} from '../components/charts/chartTheme.js';
import DataTable from '../components/desktop/DataTable.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import Button from '../components/ui/Button.jsx';
import OrderDetailModal from '../components/modals/OrderDetailModal.jsx';
import { useCustomers } from '../context/CustomerContext.jsx';
import { useOrders } from '../context/OrderContext.jsx';
import { useSales } from '../context/SaleContext.jsx';
import { dashboardService } from '../services/index.js';
import { expenseService } from '../services/index.js';
import * as store from '../storage/localStore.js';
import {
  formatCurrency,
  formatCurrencyAxis,
  getCurrentMonthDailyRevenueExpense,
  getExpensesByCategory,
  getMonthlyRevenueExpense,
  getOrdersByStatus,
  getSalesByType,
} from '../utils/chartData.js';
import { buildOrderCustomerBalanceMap } from '../utils/orderCustomerBalance.js';
import { toLocalDateKey } from '../utils/orderDelivery.js';
import { DATA_CHANGED_EVENT } from '../utils/dataSync.js';
import SolarDatePicker from '../components/ui/SolarDatePicker.jsx';
import { getTodaySolar } from '../utils/solarDate.js';
import {
  computeDashboardKpis,
  DASHBOARD_PERIODS,
  getDashboardPeriodBounds,
} from '../utils/dashboardPeriod.js';

function resolveCustomerId(order, customers) {
  if (order.customerId) return order.customerId;
  const name = (order.customerName || '').trim().toLowerCase();
  if (!name) return null;
  return customers.find((c) => c.name.toLowerCase() === name)?.id ?? null;
}

export default function OverviewPage() {
  const { t } = useTranslation();
  const { CHART_GRID, LEGEND_STYLE, chartXAxisProps, chartYAxisProps } = useChartTheme();
  const { customers, refreshCustomers } = useCustomers();
  const { orders, updateOrderStatus, recordOrderPayment, refreshOrders } = useOrders();
  const { sales } = useSales();
  const [dashboardData, setDashboardData] = useState(null);
  const [income, setIncome] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [period, setPeriod] = useState('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const liveSelectedOrder = useMemo(
    () => (selectedOrder ? orders.find((o) => o.id === selectedOrder.id) ?? selectedOrder : null),
    [selectedOrder, orders],
  );

  const balanceMap = useMemo(
    () => buildOrderCustomerBalanceMap(customers, orders),
    [customers, orders],
  );

  const selectedCustomerBalance = useMemo(() => {
    if (!liveSelectedOrder) return null;
    const cid = resolveCustomerId(liveSelectedOrder, customers);
    if (!cid || !balanceMap[cid]) return null;
    return {
      debt: balanceMap[cid].creditRemaining,
      credit: balanceMap[cid].prepaidCredit,
    };
  }, [liveSelectedOrder, customers, balanceMap]);

  const fetchDashboard = useCallback(async () => {
    const [data, incomeData, expenseData] = await Promise.all([
      dashboardService.getOverview(),
      store.getIncome(),
      expenseService.getAll(),
    ]);
    setDashboardData(data);
    setIncome(incomeData);
    setExpenses(expenseData);
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard, orders.length, customers.length, sales.length]);

  useEffect(() => {
    const onDataChanged = (event) => {
      const collection = event.detail?.collection;
      if (collection === 'expenses' || collection === 'transactions' || collection === 'income') {
        fetchDashboard();
      }
    };
    window.addEventListener(DATA_CHANGED_EVENT, onDataChanged);
    return () => window.removeEventListener(DATA_CHANGED_EVENT, onDataChanged);
  }, [fetchDashboard]);

  const periodBounds = useMemo(
    () => getDashboardPeriodBounds(period, customFrom, customTo),
    [period, customFrom, customTo],
  );

  const kpiStats = useMemo(
    () =>
      computeDashboardKpis({
        orders,
        income,
        sales,
        customers,
        startKey: periodBounds.startKey,
        endKey: periodBounds.endKey,
      }),
    [orders, income, sales, customers, periodBounds],
  );

  useEffect(() => {
    if (period !== 'custom') return;
    const today = getTodaySolar();
    if (!customFrom) setCustomFrom(today);
    if (!customTo) setCustomTo(today);
  }, [period, customFrom, customTo]);

  const kpiLabels = useMemo(() => {
    if (period === 'today') {
      return {
        orders: t('dashboard.todayOrders'),
        income: t('dashboard.todayIncome'),
        pending: t('dashboard.pendingOrders'),
        customers: t('dashboard.todayNewCustomers'),
        ordersHint: t('dashboard.todayOrdersHint'),
        incomeHint: t('dashboard.todayIncomeHint'),
        pendingHint: t('dashboard.pendingHint'),
        customersHint: t('dashboard.todayNewCustomersHint'),
      };
    }
    return {
      orders: t('dashboard.kpiOrders'),
      income: t('dashboard.kpiIncome'),
      pending: t('dashboard.kpiPending'),
      customers: t('dashboard.kpiNewCustomers'),
      ordersHint: t('dashboard.kpiOrdersHint'),
      incomeHint: t('dashboard.kpiIncomeHint'),
      pendingHint: t('dashboard.kpiPendingHint'),
      customersHint: t('dashboard.kpiCustomersHint'),
    };
  }, [period, t]);

  const periodChipLabel = (key) => {
    const map = {
      today: 'dashboard.periodToday',
      week: 'dashboard.periodWeek',
      month: 'dashboard.periodMonth',
      year: 'dashboard.periodYear',
      custom: 'dashboard.periodCustom',
    };
    return t(map[key] || key);
  };

  const monthlyData = useMemo(
    () => getMonthlyRevenueExpense({ income, expenses, sales }),
    [income, expenses, sales],
  );
  const currentMonthDailyData = useMemo(
    () => getCurrentMonthDailyRevenueExpense({ income, expenses, sales }),
    [income, expenses, sales],
  );
  const statusData = useMemo(
    () => getOrdersByStatus(orders).map((row) => ({
      ...row,
      name: t(`status.${row.name}`, { defaultValue: row.name }),
    })),
    [orders, t],
  );
  const expenseChart = useMemo(
    () => getExpensesByCategory(expenses).map((row) => ({
      ...row,
      name: t(`filters.${row.name}`, { defaultValue: row.name }),
    })),
    [expenses, t],
  );
  const salesChart = useMemo(
    () => getSalesByType(sales).map((row) => ({
      ...row,
      name: t(`filters.${row.name}`, { defaultValue: row.name }),
    })),
    [sales, t],
  );

  const recentOrders = dashboardData?.recent?.orders || orders.slice(0, 8);
  const pendingOrders = orders.filter((o) => ['Finding', 'Ready'].includes(o.status));
  const overdueOrders = orders.filter((o) => {
    if (!o.deliveryDate || o.status === 'Delivered') return false;
    const deliveryKey = toLocalDateKey(o.deliveryDate);
    const todayKey = toLocalDateKey(new Date());
    if (!deliveryKey || !todayKey) return false;
    return deliveryKey < todayKey;
  });

  const tableColumns = [
    { key: 'customer', label: t('common.customer'), render: (r) => <span className="font-medium text-ink">{r.customerName}</span> },
    { key: 'type', label: t('common.type'), render: (r) => r.orderType },
    { key: 'amount', label: t('common.amount'), render: (r) => formatCurrency(r.totalAmount) },
    { key: 'status', label: t('common.status'), render: (r) => <StatusBadge status={r.status} /> },
    { key: 'payment', label: t('orders.payStatus'), render: (r) => <StatusBadge status={r.paymentStatus || 'Pending'} /> },
  ];

  return (
    <>
      <PageShell
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
        breadcrumbs={[{ label: t('common.home'), to: '/' }, { label: t('nav.items.overview') }]}
        actions={
          <>
            <Link to="/orders/new"><Button>{t('common.newOrder')}</Button></Link>
            <Link to="/customers"><Button variant="outline">{t('nav.items.customers')}</Button></Link>
          </>
        }
      >
        <section className="mb-4 flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {DASHBOARD_PERIODS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setPeriod(key)}
                className={`filter-chip ${period === key ? 'filter-chip-active' : ''}`}
              >
                {periodChipLabel(key)}
              </button>
            ))}
          </div>
          {period === 'custom' && (
            <div className="grid max-w-xl gap-3 sm:grid-cols-2">
              <SolarDatePicker
                label={t('dashboard.periodFrom')}
                value={customFrom}
                onChange={setCustomFrom}
                placeholder={getTodaySolar()}
                allowEmpty={false}
                className="mb-0"
              />
              <SolarDatePicker
                label={t('dashboard.periodTo')}
                value={customTo}
                onChange={setCustomTo}
                placeholder={getTodaySolar()}
                allowEmpty={false}
                className="mb-0"
              />
            </div>
          )}
        </section>

        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            title={kpiLabels.orders}
            value={String(kpiStats.orderCount)}
            subtitle={kpiLabels.ordersHint}
            icon={Receipt}
            accent="info"
            trendLabel={period === 'today' ? t('detail.vsYesterday') : undefined}
          />
          <KpiCard
            title={kpiLabels.income}
            value={formatCurrency(kpiStats.totalIncome)}
            subtitle={kpiLabels.incomeHint}
            icon={Banknote}
            accent="success"
            trendLabel={period === 'today' ? t('detail.onTrack') : undefined}
          />
          <KpiCard
            title={kpiLabels.pending}
            value={String(kpiStats.pendingOrders)}
            subtitle={kpiLabels.pendingHint}
            icon={Clock}
            accent="warning"
          />
          <KpiCard
            title={kpiLabels.customers}
            value={String(kpiStats.newCustomers)}
            subtitle={kpiLabels.customersHint}
            icon={Users}
            accent="navy"
          />
        </section>

        <section className="mb-8 grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <ChartCard title={t('dashboard.revenue')} subtitle={t('dashboard.last6')}>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData} margin={CHART_MARGIN}>
                    <ChartAreaGradients />
                    <CartesianGrid {...CHART_GRID} vertical={false} />
                    <XAxis dataKey="month" {...chartXAxisProps()} />
                    <YAxis {...chartYAxisProps({ tickFormatter: formatCurrencyAxis })} />
                    <Tooltip content={<ChartTooltip valueFormatter={(v) => formatCurrency(v)} />} />
                    <Legend iconType="circle" wrapperStyle={LEGEND_STYLE} />
                    <Area
                      type="monotone"
                      dataKey="income"
                      stroke="url(#chartIncomeStroke)"
                      fill={`url(#${AREA_INCOME.fillId})`}
                      strokeWidth={2.5}
                      name={t('dashboard.income')}
                      dot={false}
                      activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2, fill: AREA_INCOME.stroke }}
                      {...CHART_ANIMATION}
                    />
                    <Area
                      type="monotone"
                      dataKey="expense"
                      stroke="url(#chartExpenseStroke)"
                      fill={`url(#${AREA_EXPENSE.fillId})`}
                      strokeWidth={2.5}
                      name={t('dashboard.expense')}
                      dot={false}
                      activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2, fill: AREA_EXPENSE.stroke }}
                      {...CHART_ANIMATION}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          <ChartCard title={t('dashboard.ordersStatus')} subtitle={t('dashboard.pipeline')}>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={CHART_MARGIN}>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={92}
                    paddingAngle={4}
                    cornerRadius={6}
                    stroke="#fff"
                    strokeWidth={3}
                    {...CHART_ANIMATION}
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="circle" wrapperStyle={LEGEND_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </section>

        <section className="mb-8 grid gap-6 lg:grid-cols-2">
          <ChartCard title={t('dashboard.salesType')} subtitle={t('dashboard.volume')}>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesChart} margin={CHART_MARGIN} barCategoryGap="28%">
                  <ModernBarGradients data={salesChart} idPrefix="salesBar" />
                  <CartesianGrid {...CHART_GRID} vertical={false} />
                  <XAxis dataKey="name" {...chartXAxisProps()} />
                  <YAxis {...chartYAxisProps()} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={44} {...CHART_ANIMATION}>
                    {salesChart.map((entry) => (
                      <Cell key={entry.name} fill={barGradientUrl(entry.fill, 'salesBar')} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title={t('dashboard.expensesCat')} subtitle={t('dashboard.spend')}>
            <VerticalCategoryBarChart
              data={expenseChart}
              valueKey="amount"
              formatXTick={formatCurrencyAxis}
              formatTooltip={(v) => formatCurrency(v)}
            />
          </ChartCard>
        </section>

        <section className="mb-8 grid gap-6 lg:grid-cols-3">
          <div className="panel p-5 lg:col-span-1">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="text-amber-500" size={18} />
              <h3 className="font-bold text-ink">{t('dashboard.attention')}</h3>
            </div>
            <div className="space-y-3">
              <div className="attention-metric attention-metric--danger">
                <p className="text-xs font-semibold uppercase text-danger">{t('dashboard.overdue')}</p>
                <p className="mt-1 text-2xl font-extrabold text-ink">{overdueOrders.length}</p>
              </div>
              <div className="attention-metric attention-metric--warning">
                <p className="text-xs font-semibold uppercase text-ink-muted">{t('dashboard.pendingPay')}</p>
                <p className="mt-1 text-2xl font-extrabold text-ink">
                  {formatCurrency(dashboardData?.payments?.total ?? 0)}
                </p>
              </div>
              <div className="attention-metric attention-metric--info">
                <p className="text-xs font-semibold uppercase text-ink-muted">{t('dashboard.lowStock')}</p>
                <p className="mt-1 text-2xl font-extrabold text-ink">
                  {dashboardData?.stockAlerts?.totalAlerts ?? 0}
                </p>
              </div>
            </div>
            <Link to="/stock" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent">
              {t('dashboard.viewStock')} <ArrowRight size={14} />
            </Link>
          </div>

          <KpiChartCard
            className="lg:col-span-2"
            title={t('dashboard.monthlyProfit')}
            value={formatCurrency(dashboardData?.monthly?.profit ?? 0)}
            subtitle={t('dashboard.profitHint')}
            icon={TrendingUp}
            accent={(dashboardData?.monthly?.profit ?? 0) >= 0 ? 'success' : 'danger'}
          >
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-primary-soft/60 bg-background/80 px-3 py-2.5">
                <p className="text-xs font-medium text-ink-muted">{t('dashboard.monthlyIncome')}</p>
                <p className="mt-0.5 text-base font-bold text-success">
                  {formatCurrency(dashboardData?.monthly?.income ?? 0)}
                </p>
              </div>
              <div className="rounded-xl border border-primary-soft/60 bg-background/80 px-3 py-2.5">
                <p className="text-xs font-medium text-ink-muted">{t('dashboard.monthlyExpense')}</p>
                <p className="mt-0.5 text-base font-bold text-danger">
                  {formatCurrency(dashboardData?.monthly?.expenses ?? 0)}
                </p>
              </div>
            </div>
            <p className="mb-2 text-xs font-medium text-ink-muted">{t('dashboard.profitTrend')}</p>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={currentMonthDailyData} margin={{ ...CHART_MARGIN, left: 0, right: 4 }}>
                  <ChartAreaGradients />
                  <CartesianGrid {...CHART_GRID} vertical={false} />
                  <XAxis
                    dataKey="day"
                    {...chartXAxisProps({
                      interval: currentMonthDailyData.length > 16 ? 1 : 0,
                      tick: { fill: '#64748b', fontSize: 10, fontWeight: 500 },
                    })}
                  />
                  <YAxis {...chartYAxisProps({ width: 40, tickFormatter: formatCurrencyAxis })} />
                  <Tooltip content={<ChartTooltip valueFormatter={(v) => formatCurrency(v)} />} />
                  <Legend iconType="circle" wrapperStyle={{ ...LEGEND_STYLE, paddingTop: 4, fontSize: 11 }} />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stroke="url(#chartIncomeStroke)"
                    fill={`url(#${AREA_INCOME.fillId})`}
                    strokeWidth={2}
                    name={t('dashboard.income')}
                    dot={false}
                    activeDot={{ r: 4, stroke: '#fff', strokeWidth: 2, fill: AREA_INCOME.stroke }}
                    {...CHART_ANIMATION}
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    stroke="url(#chartExpenseStroke)"
                    fill={`url(#${AREA_EXPENSE.fillId})`}
                    strokeWidth={2}
                    name={t('dashboard.expense')}
                    dot={false}
                    activeDot={{ r: 4, stroke: '#fff', strokeWidth: 2, fill: AREA_EXPENSE.stroke }}
                    {...CHART_ANIMATION}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </KpiChartCard>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-ink">{t('dashboard.recent')}</h3>
              <p className="text-sm text-ink-muted">{t('dashboard.clickRow')}</p>
            </div>
            <Link to="/orders" className="text-sm font-semibold text-accent hover:underline">{t('dashboard.viewAll')}</Link>
          </div>
          <DataTable
            columns={tableColumns}
            rows={recentOrders}
            onRowClick={(row) => setSelectedOrder(orders.find((o) => o.id === row.id) || row)}
            emptyMessage={t('dashboard.emptyOrders')}
          />
        </section>
      </PageShell>

      <OrderDetailModal
        open={!!liveSelectedOrder}
        order={liveSelectedOrder}
        customerBalance={selectedCustomerBalance}
        customerPhone={
          liveSelectedOrder?.customerId
            ? customers.find((c) => c.id === liveSelectedOrder.customerId)?.phone
            : customers.find(
                (c) => c.name.toLowerCase() === (liveSelectedOrder?.customerName || '').toLowerCase(),
              )?.phone
        }
        onClose={() => setSelectedOrder(null)}
        onPaymentComplete={() => setSelectedOrder(null)}
        onStatusChange={async (id, status) => {
          const updated = await updateOrderStatus(id, status);
          setSelectedOrder((prev) => (prev?.id === id ? { ...prev, ...updated, status: updated?.status ?? status } : prev));
          fetchDashboard();
          return updated;
        }}
        onRecordPayment={async (id, data) => {
          const updated = await recordOrderPayment(id, data);
          await refreshOrders();
          await refreshCustomers();
          setSelectedOrder((prev) => (prev?.id === id ? { ...prev, ...updated } : updated));
          fetchDashboard();
          return updated;
        }}
      />
    </>
  );
}
