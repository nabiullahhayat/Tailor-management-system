import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import PageShell from '../components/desktop/PageShell.jsx';
import KpiCard from '../components/desktop/KpiCard.jsx';
import ChartCard from '../components/desktop/ChartCard.jsx';
import ChartAreaGradients from '../components/charts/ChartAreaGradients.jsx';
import ChartTooltip from '../components/charts/ChartTooltip.jsx';
import {
  CHART_ANIMATION,
  CHART_GRID,
  CHART_MARGIN,
  AREA_EXPENSE,
  AREA_INCOME,
  chartXAxisProps,
  chartYAxisProps,
} from '../components/charts/chartTheme.js';
import DataTable from '../components/desktop/DataTable.jsx';
import SearchInput from '../components/ui/SearchInput.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import Modal from '../components/ui/Modal.jsx';
import TableRowActions from '../components/ui/TableRowActions.jsx';
import { transactionService } from '../services/index.js';
import { formatCurrency, formatCurrencyAxis, getDailyIncomeTrend } from '../utils/chartData.js';
import { formatSolarDisplay } from '../utils/solarDate.js';
import { notify } from '../utils/toast.js';
import { DeleteConfirmModal } from '../components/modals/CustomerModals.jsx';
import { DATA_CHANGED_EVENT } from '../utils/dataSync.js';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';

const DAKHAL_REFRESH_COLLECTIONS = new Set(['transactions', 'expenses', 'income']);

const CATEGORY_FILTERS = ['All', 'Income', 'Expense'];
const TYPE_FILTERS = ['All Types', 'Order', 'Fabric', 'Machinery', 'Other'];

function getTransactionGroup(tx) {
  const haystack = `${tx.type || ''} ${tx.title || ''}`.toLowerCase();
  if (haystack.includes('order')) return 'Order';
  if (haystack.includes('fabric')) return 'Fabric';
  if (haystack.includes('machinery') || haystack.includes('machine')) return 'Machinery';
  return 'Other';
}

export default function DakhalPage() {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(async () => {
    const data = await transactionService.getAll();
    setTransactions(data);
    setSelected((prev) => {
      if (!prev) return null;
      return data.find((t) => t.id === prev.id) ?? null;
    });
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 1000);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    const onDataChanged = (event) => {
      const collection = event.detail?.collection;
      if (!collection || DAKHAL_REFRESH_COLLECTIONS.has(collection)) {
        load();
      }
    };
    window.addEventListener(DATA_CHANGED_EVENT, onDataChanged);
    return () => window.removeEventListener(DATA_CHANGED_EVENT, onDataChanged);
  }, [load]);

  const summary = useMemo(() => {
    const income = transactions.filter((t) => t.category === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter((t) => t.category === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expense, profit: income - expense };
  }, [transactions]);

  const trendData = useMemo(() => getDailyIncomeTrend(transactions, 14), [transactions]);

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const matchCategory =
        categoryFilter === 'All' ||
        (categoryFilter === 'Income' && tx.category === 'income') ||
        (categoryFilter === 'Expense' && tx.category === 'expense');
      const group = getTransactionGroup(tx);
      const matchType = typeFilter === 'All Types' || group === typeFilter;
      const matchQuery =
        !query ||
        tx.title.toLowerCase().includes(query.toLowerCase()) ||
        tx.type.toLowerCase().includes(query.toLowerCase());
      return matchCategory && matchType && matchQuery;
    });
  }, [transactions, categoryFilter, typeFilter, query]);

  const columns = [
    { key: 'title', label: t('dakhal.description'), render: (r) => <span className="font-medium text-ink">{r.title}</span> },
    { key: 'type', label: t('common.type'), render: (r) => t(`ledger.${r.type}`, { defaultValue: r.type }) },
    { key: 'date', label: t('common.date'), render: (r) => formatSolarDisplay(r.date) },
    {
      key: 'amount',
      label: t('common.amount'),
      render: (r) => (
        <span className={`font-bold ${r.category === 'income' ? 'text-success' : 'text-danger'}`}>
          {r.category === 'income' ? '+' : '-'}{formatCurrency(r.amount)}
        </span>
      ),
    },
    { key: 'status', label: t('common.status'), render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions',
      label: t('common.actions'),
      className: 'w-28',
      render: (r) => (
        <TableRowActions
          onView={() => setSelected(r)}
          onDelete={() => setDeleteTarget(r)}
        />
      ),
    },
  ];

  return (
    <>
      <PageShell
        title={t('dakhal.title')}
        subtitle={t('dakhal.subtitle')}
        breadcrumbs={[{ label: t('common.home'), to: '/' }, { label: t('nav.items.dakhal') }]}
      >
        <section className="mb-8 grid gap-4 sm:grid-cols-3">
          <KpiCard title={t('dakhal.income')} value={formatCurrency(summary.income)} icon={TrendingUp} accent="success" />
          <KpiCard title={t('dakhal.expense')} value={formatCurrency(summary.expense)} icon={TrendingDown} accent="danger" />
          <KpiCard title={t('dakhal.profit')} value={formatCurrency(summary.profit)} icon={Wallet} accent="navy" />
        </section>

        <section className="mb-8">
          <ChartCard title={t('dakhalExtra.cashFlow')} subtitle={t('dakhalExtra.cashFlowHint')}>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={CHART_MARGIN}>
                  <ChartAreaGradients />
                  <CartesianGrid {...CHART_GRID} vertical={false} />
                  <XAxis dataKey="day" {...chartXAxisProps()} />
                  <YAxis {...chartYAxisProps({ tickFormatter: formatCurrencyAxis })} />
                  <Tooltip content={<ChartTooltip valueFormatter={(v) => formatCurrency(v)} />} />
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
        </section>

        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-md flex-1">
            <SearchInput value={query} onChange={setQuery} placeholder={t('dakhal.search')} />
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_FILTERS.map((f) => (
              <button key={f} type="button" onClick={() => setCategoryFilter(f)} className={`filter-chip ${categoryFilter === f ? 'filter-chip-active' : ''}`}>{t(`filters.${f}`)}</button>
            ))}
          </div>
        </div>
        <div className="mb-5 flex flex-wrap gap-2">
          {TYPE_FILTERS.map((f) => (
            <button key={f} type="button" onClick={() => setTypeFilter(f)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${typeFilter === f ? 'bg-primary-soft text-navy' : 'bg-background text-ink-muted'}`}>{t(`filters.${f}`)}</button>
          ))}
        </div>

        <DataTable columns={columns} rows={filtered} onRowClick={setSelected} emptyMessage={t('dakhalExtra.empty')} />
      </PageShell>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.title} subtitle={selected ? t(`ledger.${selected.type}`, { defaultValue: selected.type }) : ''}>
        {selected && (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-ink-muted">{t('common.amount')}</span><span className="font-bold">{formatCurrency(selected.amount)}</span></div>
            <div className="flex justify-between"><span className="text-ink-muted">{t('dakhalExtra.category')}</span><span className="font-bold">{selected.category === 'income' ? t('dashboard.income') : t('dashboard.expense')}</span></div>
            <div className="flex justify-between"><span className="text-ink-muted">{t('common.date')}</span><span className="font-bold">{formatSolarDisplay(selected.date)}</span></div>
            <StatusBadge status={selected.status} />
          </div>
        )}
      </Modal>

      <DeleteConfirmModal
        open={!!deleteTarget}
        name={deleteTarget?.title}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          await transactionService.delete(deleteTarget.id);
          setDeleteTarget(null);
          if (selected?.id === deleteTarget.id) setSelected(null);
          await load();
          notify.success(t('toasts.transactionRemoved'));
        }}
      />
    </>
  );
}
