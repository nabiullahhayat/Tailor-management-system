import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { DATA_CHANGED_EVENT } from '../utils/dataSync.js';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Plus } from 'lucide-react';
import PageShell from '../components/desktop/PageShell.jsx';
import KpiChartCard from '../components/desktop/KpiChartCard.jsx';
import ChartCard from '../components/desktop/ChartCard.jsx';
import ChartAreaGradients from '../components/charts/ChartAreaGradients.jsx';
import ChartTooltip from '../components/charts/ChartTooltip.jsx';
import ModernBarGradients, { barGradientUrl } from '../components/charts/ModernBarGradients.jsx';
import {
  AREA_EXPENSE,
  CHART_ANIMATION,
  CHART_GRID,
  CHART_MARGIN,
  chartXAxisProps,
  chartYAxisProps,
} from '../components/charts/chartTheme.js';
import DataTable from '../components/desktop/DataTable.jsx';
import Input from '../components/ui/Input.jsx';
import SolarDatePicker from '../components/ui/SolarDatePicker.jsx';
import { formatSolarDisplay, getTodaySolar } from '../utils/solarDate.js';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import TableRowActions from '../components/ui/TableRowActions.jsx';
import { DeleteConfirmModal } from '../components/modals/CustomerModals.jsx';
import { expenseService } from '../services/index.js';
import { formatCurrency, formatCurrencyAxis, getExpensesByCategory, getExpensesMonthlyTrend } from '../utils/chartData.js';
import { notify } from '../utils/toast.js';
import { TrendingDown } from 'lucide-react';

const CATEGORY_FILTERS = ['All', 'Fabric', 'Machinery', 'Other'];

const emptyForm = { name: '', category: 'Other', amount: '', date: getTodaySolar(), description: '' };

export default function ExpensesPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const [expenses, setExpenses] = useState([]);
  const [filter, setFilter] = useState('All');
  const [addOpen, setAddOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    const data = await expenseService.getAll();
    setExpenses(data);
  }, []);

  useEffect(() => {
    load();
  }, [load, location.key]);

  useEffect(() => {
    const onDataChanged = (event) => {
      const collection = event.detail?.collection;
      if (!collection || collection === 'expenses' || collection === 'transactions') {
        load();
      }
    };
    window.addEventListener(DATA_CHANGED_EVENT, onDataChanged);
    return () => window.removeEventListener(DATA_CHANGED_EVENT, onDataChanged);
  }, [load]);

  const filtered = useMemo(() => {
    if (filter === 'All') return expenses;
    return expenses.filter((e) => e.category === filter);
  }, [expenses, filter]);

  const total = filtered.reduce((s, e) => s + (e.amount || 0), 0);
  const filteredTrendData = useMemo(
    () => getExpensesMonthlyTrend(filtered),
    [filtered],
  );
  const chartData = useMemo(
    () => getExpensesByCategory(expenses).map((row) => ({
      ...row,
      name: t(`filters.${row.name}`, { defaultValue: row.name }),
    })),
    [expenses, t],
  );

  const openEdit = (expense) => {
    setEditTarget(expense);
    setForm({
      name: expense.name,
      category: expense.category,
      amount: String(expense.amount),
      date: expense.date,
      description: expense.description || '',
    });
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.amount || !form.date) {
      notify.error(t('toasts.missingFields'), t('toasts.missingFieldsDesc'));
      return;
    }
    const payload = {
      name: form.name,
      category: form.category,
      amount: parseFloat(form.amount),
      date: form.date,
      description: form.description,
      fromStock: false,
    };
    if (editTarget) {
      await expenseService.update(editTarget.id, payload);
      notify.success(t('toasts.expenseUpdated'));
      setEditTarget(null);
    } else {
      await expenseService.add(payload);
      notify.success(t('toasts.expenseAdded'), t('toasts.expenseAddedDesc', { name: form.name }));
      setAddOpen(false);
    }
    setForm(emptyForm);
    load();
  };

  const columns = [
    { key: 'name', label: t('expenses.expense'), render: (r) => <span className="font-medium text-ink">{r.name}</span> },
    { key: 'category', label: t('expenses.category'), render: (r) => t(`filters.${r.category}`, { defaultValue: r.category }) },
    { key: 'date', label: t('common.date'), render: (r) => formatSolarDisplay(r.date) },
    { key: 'description', label: t('common.notes'), render: (r) => r.description || '—' },
    { key: 'amount', label: t('common.amount'), render: (r) => <span className="font-bold text-danger">{formatCurrency(r.amount)}</span> },
    {
      key: 'actions',
      label: t('common.actions'),
      className: 'w-28',
      render: (r) => (
        <TableRowActions
          onView={() => setViewTarget(r)}
          onEdit={() => openEdit(r)}
          onDelete={() => setDeleteTarget(r)}
        />
      ),
    },
  ];

  const expenseFormFields = (
    <>
      <Input label={t('expensesExtra.name')} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
      <div className="mb-4">
        <p className="mb-2 text-sm font-semibold">{t('expensesExtra.category')}</p>
        <div className="flex gap-2">
          {['Fabric', 'Machinery', 'Other'].map((cat) => (
            <button key={cat} type="button" onClick={() => setForm((p) => ({ ...p, category: cat }))} className={`flex-1 rounded-lg py-2 text-sm font-bold ${form.category === cat ? 'bg-navy text-white' : 'bg-background text-ink-muted'}`}>{t(`filters.${cat}`)}</button>
          ))}
        </div>
      </div>
      <Input label={t('expensesExtra.amount')} type="number" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} />
      <SolarDatePicker
        label={t('expensesExtra.date')}
        value={form.date}
        onChange={(date) => setForm((p) => ({ ...p, date }))}
        allowEmpty={false}
      />
      <Input label={t('expensesExtra.description')} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
    </>
  );

  return (
    <>
      <PageShell
        title={t('expenses.title')}
        subtitle={t('expenses.subtitle')}
        breadcrumbs={[{ label: t('common.home'), to: '/' }, { label: t('expenses.title') }]}
        actions={<Button onClick={() => { setForm(emptyForm); setAddOpen(true); }}><Plus size={16} /> {t('expensesExtra.add')}</Button>}
      >
        <section className="mb-8 grid gap-4 sm:grid-cols-2">
          <KpiChartCard
            title={t('expenses.filtered')}
            value={formatCurrency(total)}
            subtitle={t('expensesExtra.records', { count: filtered.length })}
            icon={TrendingDown}
            accent="danger"
          >
            <p className="mb-2 text-xs font-medium text-ink-muted">{t('expensesExtra.filteredTrend')}</p>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredTrendData} margin={{ ...CHART_MARGIN, left: 0, right: 4 }}>
                  <ChartAreaGradients />
                  <CartesianGrid {...CHART_GRID} vertical={false} />
                  <XAxis dataKey="month" {...chartXAxisProps({ interval: 0, tick: { fill: '#64748b', fontSize: 10, fontWeight: 500 } })} />
                  <YAxis
                    {...chartYAxisProps({
                      width: 40,
                      tickFormatter: formatCurrencyAxis,
                    })}
                  />
                  <Tooltip content={<ChartTooltip valueFormatter={(v) => formatCurrency(v)} labelFormatter={(l) => l} />} />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    name={t('dashboard.expense')}
                    stroke="url(#chartExpenseStroke)"
                    fill={`url(#${AREA_EXPENSE.fillId})`}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2, fill: AREA_EXPENSE.stroke }}
                    {...CHART_ANIMATION}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </KpiChartCard>
          <ChartCard title={t('expensesExtra.spend')} subtitle={t('expensesExtra.spendHint')}>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={CHART_MARGIN} barCategoryGap="28%">
                  <ModernBarGradients data={chartData} idPrefix="expPageBar" />
                  <CartesianGrid {...CHART_GRID} vertical={false} />
                  <XAxis dataKey="name" {...chartXAxisProps()} />
                  <YAxis {...chartYAxisProps({ tickFormatter: formatCurrencyAxis })} />
                  <Tooltip content={<ChartTooltip valueFormatter={(v) => formatCurrency(v)} />} />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]} maxBarSize={48} {...CHART_ANIMATION}>
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={barGradientUrl(entry.fill, 'expPageBar')} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </section>

        <div className="mb-5 flex flex-wrap gap-2">
          {CATEGORY_FILTERS.map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)} className={`filter-chip ${filter === f ? 'filter-chip-active' : ''}`}>{t(`filters.${f}`)}</button>
          ))}
        </div>

        <DataTable columns={columns} rows={filtered} emptyMessage={t('expensesExtra.empty')} />
      </PageShell>

      <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title={viewTarget?.name} subtitle={viewTarget ? t(`filters.${viewTarget.category}`, { defaultValue: viewTarget.category }) : ''}>
        {viewTarget && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between rounded-lg bg-background px-3 py-2">
              <span className="text-ink-muted">{t('common.amount')}</span>
              <span className="font-bold text-danger">{formatCurrency(viewTarget.amount)}</span>
            </div>
            <div className="flex justify-between rounded-lg bg-background px-3 py-2">
              <span className="text-ink-muted">{t('common.date')}</span>
              <span className="font-semibold">{viewTarget.date}</span>
            </div>
            <div className="rounded-lg bg-background px-3 py-2">
              <p className="text-xs text-ink-muted">{t('common.notes')}</p>
              <p className="font-semibold">{viewTarget.description || '—'}</p>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title={t('expensesExtra.add')} subtitle={t('expenses.subtitle')}>
        {expenseFormFields}
        <Button className="mt-2" onClick={handleSave}>{t('common.save')}</Button>
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title={t('expensesExtra.edit')} subtitle={editTarget?.name}>
        {expenseFormFields}
        <Button className="mt-2" onClick={handleSave}>{t('modals.saveChanges')}</Button>
      </Modal>

      <DeleteConfirmModal
        open={!!deleteTarget}
        name={deleteTarget?.name}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          await expenseService.delete(deleteTarget.id);
          setDeleteTarget(null);
          notify.success(t('toasts.expenseDeleted'));
          load();
        }}
      />
    </>
  );
}
