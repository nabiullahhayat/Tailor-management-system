import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import PageShell from '../components/desktop/PageShell.jsx';
import DataTable from '../components/desktop/DataTable.jsx';
import SearchInput from '../components/ui/SearchInput.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import Button from '../components/ui/Button.jsx';
import TableRowActions from '../components/ui/TableRowActions.jsx';
import OrderDetailModal from '../components/modals/OrderDetailModal.jsx';
import { useOrders } from '../context/OrderContext.jsx';
import { formatCurrency } from '../utils/chartData.js';
import { notify } from '../utils/toast.js';

const STATUS_FILTERS = ['All', 'Finding', 'Ready', 'Delivered'];

export default function OrdersPage() {
  const { orders, updateOrderStatus, recordOrderPayment } = useOrders();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selected, setSelected] = useState(null);

  const liveSelected = useMemo(
    () => (selected ? orders.find((o) => o.id === selected.id) ?? selected : null),
    [selected, orders],
  );

  const filtered = useMemo(
    () =>
      orders.filter((o) => {
        const matchSearch =
          !query ||
          o.customerName.toLowerCase().includes(query.toLowerCase()) ||
          o.tokenNumber.toLowerCase().includes(query.toLowerCase());
        const matchStatus = statusFilter === 'All' || o.status === statusFilter;
        return matchSearch && matchStatus;
      }),
    [orders, query, statusFilter],
  );

  const columns = [
    { key: 'token', label: 'Order #', render: (r) => <span className="font-semibold text-accent">{r.tokenNumber}</span> },
    { key: 'customer', label: 'Customer', render: (r) => <span className="font-medium text-ink">{r.customerName}</span> },
    { key: 'type', label: 'Garment', render: (r) => r.orderType },
    { key: 'delivery', label: 'Delivery', render: (r) => r.deliveryDate?.split('T')[0] || '—' },
    { key: 'amount', label: 'Amount', render: (r) => formatCurrency(r.totalAmount) },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'payment', label: 'Payment', render: (r) => <StatusBadge status={r.paymentStatus || 'Pending'} /> },
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
        title="Orders"
        subtitle={`${filtered.length} orders · Manage tailoring jobs from booking to delivery`}
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Orders' }]}
        actions={<Link to="/orders/new"><Button><Plus size={16} /> New Order</Button></Link>}
      >
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-md flex-1">
            <SearchInput value={query} onChange={setQuery} placeholder="Search by customer or order token…" />
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`filter-chip ${statusFilter === status ? 'filter-chip-active' : ''}`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <DataTable
          columns={columns}
          rows={filtered}
          onRowClick={setSelected}
          emptyMessage="No orders match your filters."
        />
      </PageShell>

      <OrderDetailModal
        open={!!liveSelected}
        order={liveSelected}
        onClose={() => setSelected(null)}
        onStatusChange={async (id, status) => {
          const updated = await updateOrderStatus(id, status);
          setSelected((prev) => (prev?.id === id ? { ...prev, ...updated, status: updated?.status ?? status } : prev));
          return updated;
        }}
        onRecordPayment={async (id, data) => {
          const updated = await recordOrderPayment(id, data);
          setSelected((prev) => (prev?.id === id ? { ...prev, ...updated } : prev));
          notify.success('Payment recorded', `₹${data.paidAmount} received`);
          return updated;
        }}
      />
    </>
  );
}
