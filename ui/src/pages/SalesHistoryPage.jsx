import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import PageShell from '../components/desktop/PageShell.jsx';
import DataTable from '../components/desktop/DataTable.jsx';
import SearchInput from '../components/ui/SearchInput.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import Button from '../components/ui/Button.jsx';
import TableRowActions from '../components/ui/TableRowActions.jsx';
import SaleDetailModal from '../components/modals/SaleDetailModal.jsx';
import { useSales } from '../context/SaleContext.jsx';
import { formatCurrency } from '../utils/chartData.js';
import { notify } from '../utils/toast.js';

const FILTERS = ['All', 'Fabric', 'Machinery'];

export default function SalesHistoryPage() {
  const { sales, updatePaymentStatus } = useSales();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    return sales.filter((s) => {
      const matchSearch =
        !query ||
        s.customerName.toLowerCase().includes(query.toLowerCase()) ||
        s.saleType.toLowerCase().includes(query.toLowerCase());
      const matchFilter =
        filter === 'All' ||
        (filter === 'Fabric' && s.saleType === 'Fabric Sale') ||
        (filter === 'Machinery' && s.saleType === 'Machinery Sale');
      return matchSearch && matchFilter;
    });
  }, [sales, query, filter]);

  const columns = [
    { key: 'invoice', label: 'Invoice', render: (r) => <span className="font-semibold text-accent">{r.invoiceNumber}</span> },
    { key: 'customer', label: 'Customer', render: (r) => <span className="font-medium text-ink">{r.customerName}</span> },
    { key: 'type', label: 'Type', render: (r) => r.saleType },
    { key: 'product', label: 'Product', render: (r) => r.productName },
    { key: 'amount', label: 'Amount', render: (r) => formatCurrency(r.totalAmount) },
    { key: 'date', label: 'Date', render: (r) => r.date || r.saleDate?.split('T')[0] || '—' },
    { key: 'status', label: 'Payment', render: (r) => <StatusBadge status={r.paymentStatus || 'Pending'} /> },
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
        title="Sales History"
        subtitle={`${filtered.length} sales · Fabric and machinery transactions`}
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Sales' }]}
        actions={
          <div className="flex gap-2">
            <Link to="/sales/fabric"><Button variant="outline">Fabric Sale</Button></Link>
            <Link to="/sales/machinery"><Button><Plus size={16} /> Machinery Sale</Button></Link>
          </div>
        }
      >
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-md flex-1">
            <SearchInput value={query} onChange={setQuery} placeholder="Search sales…" />
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button key={f} type="button" onClick={() => setFilter(f)} className={`filter-chip ${filter === f ? 'filter-chip-active' : ''}`}>{f}</button>
            ))}
          </div>
        </div>
        <DataTable columns={columns} rows={filtered} onRowClick={setSelected} emptyMessage="No sales records found." />
      </PageShell>

      <SaleDetailModal
        open={!!selected}
        sale={selected}
        onClose={() => setSelected(null)}
        onMarkPaid={async (...args) => {
          await updatePaymentStatus(...args);
          notify.success('Payment marked as paid');
        }}
      />
    </>
  );
}
