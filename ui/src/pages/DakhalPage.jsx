import { useCallback, useEffect, useMemo, useState } from 'react';
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
import DataTable from '../components/desktop/DataTable.jsx';
import SearchInput from '../components/ui/SearchInput.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import Modal from '../components/ui/Modal.jsx';
import TableRowActions from '../components/ui/TableRowActions.jsx';
import { transactionService } from '../services/index.js';
import { formatCurrency, getDailyIncomeTrend } from '../utils/chartData.js';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';

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
  const [transactions, setTransactions] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    const data = await transactionService.getAll();
    setTransactions(data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(() => {
    const income = transactions.filter((t) => t.category === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter((t) => t.category === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expense, profit: income - expense };
  }, [transactions]);

  const trendData = useMemo(() => getDailyIncomeTrend(transactions), [transactions]);

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
    { key: 'title', label: 'Description', render: (r) => <span className="font-medium text-ink">{r.title}</span> },
    { key: 'type', label: 'Type', render: (r) => r.type },
    { key: 'date', label: 'Date', render: (r) => r.date },
    {
      key: 'amount',
      label: 'Amount',
      render: (r) => (
        <span className={`font-bold ${r.category === 'income' ? 'text-success' : 'text-danger'}`}>
          {r.category === 'income' ? '+' : '-'}{formatCurrency(r.amount)}
        </span>
      ),
    },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions',
      label: 'Actions',
      className: 'w-28',
      render: (r) => <TableRowActions onView={() => setSelected(r)} />,
    },
  ];

  return (
    <>
      <PageShell
        title="Dakhal — Finance Ledger"
        subtitle="Track all income and expense transactions in one place"
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Dakhal' }]}
      >
        <section className="mb-8 grid gap-4 sm:grid-cols-3">
          <KpiCard title="Total Income" value={formatCurrency(summary.income)} icon={TrendingUp} accent="success" />
          <KpiCard title="Total Expense" value={formatCurrency(summary.expense)} icon={TrendingDown} accent="danger" />
          <KpiCard title="Net Profit" value={formatCurrency(summary.profit)} icon={Wallet} accent="navy" />
        </section>

        <section className="mb-8">
          <ChartCard title="Daily Cash Flow" subtitle="Income vs expense over the last 14 days">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Area type="monotone" dataKey="income" stroke="#00a76f" fill="#00a76f33" strokeWidth={2} name="Income" />
                  <Area type="monotone" dataKey="expense" stroke="#ff5630" fill="#ff563033" strokeWidth={2} name="Expense" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </section>

        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-md flex-1">
            <SearchInput value={query} onChange={setQuery} placeholder="Search transactions…" />
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_FILTERS.map((f) => (
              <button key={f} type="button" onClick={() => setCategoryFilter(f)} className={`filter-chip ${categoryFilter === f ? 'filter-chip-active' : ''}`}>{f}</button>
            ))}
          </div>
        </div>
        <div className="mb-5 flex flex-wrap gap-2">
          {TYPE_FILTERS.map((f) => (
            <button key={f} type="button" onClick={() => setTypeFilter(f)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${typeFilter === f ? 'bg-primary-soft text-navy' : 'bg-background text-ink-muted'}`}>{f}</button>
          ))}
        </div>

        <DataTable columns={columns} rows={filtered} onRowClick={setSelected} emptyMessage="No transactions found." />
      </PageShell>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.title} subtitle={selected?.type}>
        {selected && (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-ink-muted">Amount</span><span className="font-bold">{formatCurrency(selected.amount)}</span></div>
            <div className="flex justify-between"><span className="text-ink-muted">Category</span><span className="font-bold capitalize">{selected.category}</span></div>
            <div className="flex justify-between"><span className="text-ink-muted">Date</span><span className="font-bold">{selected.date}</span></div>
            <StatusBadge status={selected.status} />
          </div>
        )}
      </Modal>
    </>
  );
}
