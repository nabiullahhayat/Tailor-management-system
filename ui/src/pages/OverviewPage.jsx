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
import ChartCard from '../components/desktop/ChartCard.jsx';
import DataTable from '../components/desktop/DataTable.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import TableRowActions from '../components/ui/TableRowActions.jsx';
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
  getExpensesByCategory,
  getMonthlyRevenueExpense,
  getOrdersByStatus,
  getSalesByType,
} from '../utils/chartData.js';
import { buildOrderCustomerBalanceMap } from '../utils/orderCustomerBalance.js';
import { toLocalDateKey } from '../utils/orderDelivery.js';

function resolveCustomerId(order, customers) {
  if (order.customerId) return order.customerId;
  const name = (order.customerName || '').trim().toLowerCase();
  if (!name) return null;
  return customers.find((c) => c.name.toLowerCase() === name)?.id ?? null;
}

const CHART_TOOLTIP_STYLE = {
  borderRadius: 8,
  border: '1px solid rgba(0,0,0,0.06)',
  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
};

export default function OverviewPage() {
  const { t } = useTranslation();
  const { customers, refreshCustomers } = useCustomers();
  const { orders, updateOrderStatus, recordOrderPayment, refreshOrders } = useOrders();
  const { sales } = useSales();
  const [dashboardData, setDashboardData] = useState(null);
  const [income, setIncome] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

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

  const monthlyData = useMemo(
    () => getMonthlyRevenueExpense({ income, expenses, sales }).map((row) => ({
      ...row,
      month: t(`months.${row.month}`, { defaultValue: row.month }),
    })),
    [income, expenses, sales, t],
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
    { key: 'token', label: t('dashboard.orderHash'), render: (r) => <span className="font-semibold text-accent">{r.tokenNumber}</span> },
    { key: 'customer', label: t('common.customer'), render: (r) => <span className="font-medium text-ink">{r.customerName}</span> },
    { key: 'type', label: t('common.type'), render: (r) => r.orderType },
    { key: 'amount', label: t('common.amount'), render: (r) => formatCurrency(r.totalAmount) },
    { key: 'status', label: t('common.status'), render: (r) => <StatusBadge status={r.status} /> },
    { key: 'payment', label: t('common.payment'), render: (r) => <StatusBadge status={r.paymentStatus || 'Pending'} /> },
    {
      key: 'actions',
      label: t('common.actions'),
      className: 'w-28',
      render: (r) => (
        <TableRowActions
          onView={() => setSelectedOrder(orders.find((o) => o.id === r.id) || r)}
        />
      ),
    },
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
        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            title={t('dashboard.todayOrders')}
            value={String(dashboardData?.today?.orders ?? 0)}
            subtitle={t('dashboard.todayOrdersHint')}
            icon={Receipt}
            accent="info"
            trendLabel={t('detail.vsYesterday')}
          />
          <KpiCard
            title={t('dashboard.todayIncome')}
            value={formatCurrency(dashboardData?.today?.income ?? 0)}
            subtitle={t('dashboard.todayIncomeHint')}
            icon={Banknote}
            accent="success"
            trendLabel={t('detail.onTrack')}
          />
          <KpiCard
            title={t('dashboard.pendingOrders')}
            value={String(dashboardData?.overview?.pendingOrders ?? pendingOrders.length)}
            subtitle={t('dashboard.pendingHint')}
            icon={Clock}
            accent="warning"
          />
          <KpiCard
            title={t('dashboard.totalCustomers')}
            value={String(dashboardData?.overview?.totalCustomers ?? customers.length)}
            subtitle={t('dashboard.customersHint')}
            icon={Users}
            accent="navy"
          />
        </section>

        <section className="mb-8 grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <ChartCard title={t('dashboard.revenue')} subtitle={t('dashboard.last6')}>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00a76f" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#00a76f" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff5630" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#ff5630" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v) => formatCurrency(v)} />
                    <Legend />
                    <Area type="monotone" dataKey="income" stroke="#00a76f" fill="url(#incomeGrad)" strokeWidth={2} name={t('dashboard.income')} />
                    <Area type="monotone" dataKey="expense" stroke="#ff5630" fill="url(#expenseGrad)" strokeWidth={2} name={t('dashboard.expense')} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          <ChartCard title={t('dashboard.ordersStatus')} subtitle={t('dashboard.pipeline')}>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4}>
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </section>

        <section className="mb-8 grid gap-6 lg:grid-cols-2">
          <ChartCard title={t('dashboard.salesType')} subtitle={t('dashboard.volume')}>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {salesChart.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title={t('dashboard.expensesCat')} subtitle={t('dashboard.spend')}>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expenseChart} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v) => formatCurrency(v)} />
                  <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
                    {expenseChart.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </section>

        <section className="mb-8 grid gap-6 lg:grid-cols-3">
          <div className="panel p-5 lg:col-span-1">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="text-amber-500" size={18} />
              <h3 className="font-bold text-ink">{t('dashboard.attention')}</h3>
            </div>
            <div className="space-y-3">
              <div className="rounded-lg bg-red-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase text-danger">{t('dashboard.overdue')}</p>
                <p className="mt-1 text-2xl font-extrabold text-ink">{overdueOrders.length}</p>
              </div>
              <div className="rounded-lg bg-amber-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase text-amber-700">{t('dashboard.pendingPay')}</p>
                <p className="mt-1 text-2xl font-extrabold text-ink">
                  {formatCurrency(dashboardData?.payments?.total ?? 0)}
                </p>
              </div>
              <div className="rounded-lg bg-blue-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase text-blue-700">{t('dashboard.lowStock')}</p>
                <p className="mt-1 text-2xl font-extrabold text-ink">
                  {dashboardData?.stockAlerts?.totalAlerts ?? 0}
                </p>
              </div>
            </div>
            <Link to="/stock" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent">
              {t('dashboard.viewStock')} <ArrowRight size={14} />
            </Link>
          </div>

          <div className="panel p-5 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-ink">{t('dashboard.monthlyProfit')}</h3>
                <p className="text-sm text-ink-muted">{t('dashboard.profitHint')}</p>
              </div>
              <TrendingUp className="text-success" size={22} />
            </div>
            <p className="text-4xl font-extrabold tracking-tight text-ink">
              {formatCurrency(dashboardData?.monthly?.profit ?? 0)}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-background px-4 py-3">
                <p className="text-xs text-ink-muted">{t('dashboard.monthlyIncome')}</p>
                <p className="text-lg font-bold text-success">{formatCurrency(dashboardData?.monthly?.income ?? 0)}</p>
              </div>
              <div className="rounded-lg bg-background px-4 py-3">
                <p className="text-xs text-ink-muted">{t('dashboard.monthlyExpense')}</p>
                <p className="text-lg font-bold text-danger">{formatCurrency(dashboardData?.monthly?.expenses ?? 0)}</p>
              </div>
            </div>
          </div>
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
