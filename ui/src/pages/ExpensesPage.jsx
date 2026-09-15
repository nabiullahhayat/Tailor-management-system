import { useCallback, useEffect, useMemo, useState } from 'react';
import {
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
import KpiCard from '../components/desktop/KpiCard.jsx';
import ChartCard from '../components/desktop/ChartCard.jsx';
import DataTable from '../components/desktop/DataTable.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import TableRowActions from '../components/ui/TableRowActions.jsx';
import { DeleteConfirmModal } from '../components/modals/CustomerModals.jsx';
import { expenseService } from '../services/index.js';
import { formatCurrency, getExpensesByCategory } from '../utils/chartData.js';
import { notify } from '../utils/toast.js';
import { TrendingDown } from 'lucide-react';

const CATEGORY_FILTERS = ['All', 'Fabric', 'Machinery', 'Other'];

const emptyForm = { name: '', category: 'Other', amount: '', date: '', description: '' };

export default function ExpensesPage() {
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
  }, [load]);

  const filtered = useMemo(() => {
    if (filter === 'All') return expenses;
    return expenses.filter((e) => e.category === filter);
  }, [expenses, filter]);

  const total = filtered.reduce((s, e) => s + (e.amount || 0), 0);
  const chartData = useMemo(() => getExpensesByCategory(expenses), [expenses]);

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
      notify.error('Missing fields', 'Please fill name, amount, and date.');
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
      notify.success('Expense updated');
      setEditTarget(null);
    } else {
      await expenseService.add(payload);
      notify.success('Expense added', `${form.name} saved successfully`);
      setAddOpen(false);
    }
    setForm(emptyForm);
    load();
  };

  const columns = [
    { key: 'name', label: 'Expense', render: (r) => <span className="font-medium text-ink">{r.name}</span> },
    { key: 'category', label: 'Category', render: (r) => r.category },
    { key: 'date', label: 'Date', render: (r) => r.date },
    { key: 'description', label: 'Notes', render: (r) => r.description || '—' },
    { key: 'amount', label: 'Amount', render: (r) => <span className="font-bold text-danger">{formatCurrency(r.amount)}</span> },
    {
      key: 'actions',
      label: 'Actions',
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
      <Input label="Expense Name *" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
      <div className="mb-4">
        <p className="mb-2 text-sm font-semibold">Category *</p>
        <div className="flex gap-2">
          {['Fabric', 'Machinery', 'Other'].map((cat) => (
            <button key={cat} type="button" onClick={() => setForm((p) => ({ ...p, category: cat }))} className={`flex-1 rounded-lg py-2 text-sm font-bold ${form.category === cat ? 'bg-navy text-white' : 'bg-background text-ink-muted'}`}>{cat}</button>
          ))}
        </div>
      </div>
      <Input label="Amount (₹) *" type="number" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} />
      <Input label="Date *" type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
      <Input label="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
    </>
  );

  return (
    <>
      <PageShell
        title="Expenses"
        subtitle="Track fabric purchases, machinery costs, and shop overheads"
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Expenses' }]}
        actions={<Button onClick={() => { setForm(emptyForm); setAddOpen(true); }}><Plus size={16} /> Add Expense</Button>}
      >
        <section className="mb-8 grid gap-4 sm:grid-cols-2">
          <KpiCard title="Filtered Total" value={formatCurrency(total)} subtitle={`${filtered.length} expense records`} icon={TrendingDown} accent="danger" />
          <ChartCard title="Spend by Category" subtitle="All-time expense breakdown">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </section>

        <div className="mb-5 flex flex-wrap gap-2">
          {CATEGORY_FILTERS.map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)} className={`filter-chip ${filter === f ? 'filter-chip-active' : ''}`}>{f}</button>
          ))}
        </div>

        <DataTable columns={columns} rows={filtered} emptyMessage="No expenses recorded yet." />
      </PageShell>

      <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title={viewTarget?.name} subtitle={viewTarget?.category}>
        {viewTarget && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between rounded-lg bg-background px-3 py-2">
              <span className="text-ink-muted">Amount</span>
              <span className="font-bold text-danger">{formatCurrency(viewTarget.amount)}</span>
            </div>
            <div className="flex justify-between rounded-lg bg-background px-3 py-2">
              <span className="text-ink-muted">Date</span>
              <span className="font-semibold">{viewTarget.date}</span>
            </div>
            <div className="rounded-lg bg-background px-3 py-2">
              <p className="text-xs text-ink-muted">Notes</p>
              <p className="font-semibold">{viewTarget.description || '—'}</p>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Expense" subtitle="Record a new shop expense">
        {expenseFormFields}
        <Button className="mt-2" onClick={handleSave}>Save Expense</Button>
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Expense" subtitle={editTarget?.name}>
        {expenseFormFields}
        <Button className="mt-2" onClick={handleSave}>Save Changes</Button>
      </Modal>

      <DeleteConfirmModal
        open={!!deleteTarget}
        name={deleteTarget?.name}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          await expenseService.delete(deleteTarget.id);
          setDeleteTarget(null);
          notify.success('Expense deleted');
          load();
        }}
      />
    </>
  );
}
