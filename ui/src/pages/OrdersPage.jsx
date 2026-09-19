import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import PageShell from '../components/desktop/PageShell.jsx';
import DataTable from '../components/desktop/DataTable.jsx';
import SearchInput from '../components/ui/SearchInput.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import Button from '../components/ui/Button.jsx';
import TableRowActions from '../components/ui/TableRowActions.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import OrderDetailModal from '../components/modals/OrderDetailModal.jsx';
import EditOrderModal from '../components/modals/EditOrderModal.jsx';
import { useOrders } from '../context/OrderContext.jsx';
import { useCustomers } from '../context/CustomerContext.jsx';
import { formatCurrency } from '../utils/chartData.js';
import { buildOrderCustomerBalanceMap } from '../utils/orderCustomerBalance.js';
import { notify } from '../utils/toast.js';

const STATUS_FILTERS = ['All', 'Finding', 'Ready', 'Delivered'];

function resolveCustomerId(order, customers) {
  if (order.customerId) return order.customerId;
  const name = (order.customerName || '').trim().toLowerCase();
  if (!name) return null;
  return customers.find((c) => c.name.toLowerCase() === name)?.id ?? null;
}

export default function OrdersPage() {
  const { orders, updateOrderStatus, recordOrderPayment, updateOrder, deleteOrder, refreshOrders } =
    useOrders();
  const { customers, refreshCustomers } = useCustomers();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selected, setSelected] = useState(null);
  const [editOrder, setEditOrder] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const balanceMap = useMemo(
    () => buildOrderCustomerBalanceMap(customers, orders),
    [customers, orders],
  );

  const liveSelected = useMemo(
    () => (selected ? orders.find((o) => o.id === selected.id) ?? selected : null),
    [selected, orders],
  );

  const selectedCustomerBalance = useMemo(() => {
    if (!liveSelected) return null;
    const cid = resolveCustomerId(liveSelected, customers);
    if (!cid || !balanceMap[cid]) return null;
    return {
      debt: balanceMap[cid].creditRemaining,
      credit: balanceMap[cid].prepaidCredit,
    };
  }, [liveSelected, customers, balanceMap]);

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
    { key: 'amount', label: 'Total', render: (r) => formatCurrency(r.totalAmount) },
    {
      key: 'paid',
      label: 'Paid',
      render: (r) => (
        <span className="text-success">{formatCurrency(r.paidAmount || 0)}</span>
      ),
    },
    {
      key: 'remaining',
      label: 'Remaining',
      render: (r) => {
        const rem = Math.max(0, Number(r.totalAmount || 0) - Number(r.paidAmount || 0));
        return <span className={rem > 0 ? 'text-danger font-medium' : 'text-ink-muted'}>{formatCurrency(rem)}</span>;
      },
    },
    {
      key: 'custBalance',
      label: 'Customer balance',
      render: (r) => {
        const cid = resolveCustomerId(r, customers);
        if (!cid || !balanceMap[cid]) return '—';
        const debt = balanceMap[cid].creditRemaining;
        const credit = balanceMap[cid].prepaidCredit;
        if (credit > 0) {
          return <span className="text-xs text-success">Credit ₹{credit.toLocaleString()}</span>;
        }
        if (debt > 0) {
          return <span className="text-xs text-danger">Debt ₹{debt.toLocaleString()}</span>;
        }
        return <span className="text-xs text-ink-muted">Settled</span>;
      },
    },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'payment', label: 'Payment', render: (r) => <StatusBadge status={r.paymentStatus || 'Pending'} /> },
    {
      key: 'actions',
      label: 'Actions',
      className: 'w-28',
      render: (r) => (
        <TableRowActions
          onView={() => setSelected(r)}
          onEdit={() => setEditOrder(r)}
          onDelete={() => setDeleteTarget(r)}
        />
      ),
    },
  ];

  const handleRecordPayment = async (id, data) => {
    const updated = await recordOrderPayment(id, data);
    await refreshOrders();
    await refreshCustomers();
    setSelected((prev) => (prev?.id === id ? { ...prev, ...updated } : prev));
    return updated;
  };

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
        customerBalance={selectedCustomerBalance}
        onClose={() => setSelected(null)}
        onStatusChange={async (id, status) => {
          const updated = await updateOrderStatus(id, status);
          setSelected((prev) => (prev?.id === id ? { ...prev, ...updated, status: updated?.status ?? status } : prev));
          return updated;
        }}
        onRecordPayment={handleRecordPayment}
      />

      <EditOrderModal
        open={!!editOrder}
        order={editOrder}
        onClose={() => setEditOrder(null)}
        onSave={async (id, data) => {
          await updateOrder(id, data);
          await refreshOrders();
        }}
      />

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete order?"
        subtitle={`Remove ${deleteTarget?.tokenNumber} for ${deleteTarget?.customerName}? This cannot be undone.`}
        rows={[]}
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          try {
            await deleteOrder(deleteTarget.id);
            notify.success('Order deleted', deleteTarget.tokenNumber);
            if (selected?.id === deleteTarget.id) setSelected(null);
            setDeleteTarget(null);
          } catch (err) {
            notify.error('Delete failed', err.message);
          }
        }}
      />
    </>
  );
}
