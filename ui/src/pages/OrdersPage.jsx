import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { formatSolarDisplay } from '../utils/solarDate.js';
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
  const { t } = useTranslation();
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

  const customerPhoneFor = (order) => {
    const cid = resolveCustomerId(order, customers);
    const c = cid ? customers.find((x) => x.id === cid) : null;
    return c?.phone || '';
  };

  const columns = [
    {
      key: 'token',
      label: t('orders.order'),
      className: 'w-[4.5rem]',
      render: (r) => <span className="font-semibold text-accent">{r.tokenNumber.replace('ORD-', '')}</span>,
    },
    {
      key: 'customer',
      label: t('common.customer'),
      render: (r) => (
        <span className="block max-w-[7rem] truncate font-medium text-ink" title={r.customerName}>
          {r.customerName}
        </span>
      ),
    },
    {
      key: 'type',
      label: t('orders.garment'),
      render: (r) => (
        <span className="block max-w-[5rem] truncate" title={r.orderType}>
          {r.orderType}
        </span>
      ),
    },
    { key: 'delivery', label: t('orders.del'), className: 'whitespace-nowrap', render: (r) => formatSolarDisplay(r.deliveryDate) },
    { key: 'amount', label: t('common.total'), className: 'whitespace-nowrap', render: (r) => formatCurrency(r.totalAmount) },
    {
      key: 'paid',
      label: t('common.paid'),
      render: (r) => (
        <span className="text-success">{formatCurrency(r.paidAmount || 0)}</span>
      ),
    },
    {
      key: 'remaining',
      label: t('common.remaining'),
      render: (r) => {
        const rem = Math.max(0, Number(r.totalAmount || 0) - Number(r.paidAmount || 0));
        return <span className={rem > 0 ? 'text-danger font-medium' : 'text-ink-muted'}>{formatCurrency(rem)}</span>;
      },
    },
    {
      key: 'custBalance',
      label: t('common.balance'),
      className: 'whitespace-nowrap',
      render: (r) => {
        const cid = resolveCustomerId(r, customers);
        if (!cid || !balanceMap[cid]) return '—';
        const debt = balanceMap[cid].creditRemaining;
        const credit = balanceMap[cid].prepaidCredit;
        if (credit > 0) {
          return <span className="text-xs text-success">{t('common.credit')} ؋{credit.toLocaleString()}</span>;
        }
        if (debt > 0) {
          return <span className="text-xs text-danger">{t('common.debt')} ؋{debt.toLocaleString()}</span>;
        }
        return <span className="text-xs text-ink-muted">{t('common.settled')}</span>;
      },
    },
    { key: 'status', label: t('common.status'), render: (r) => <StatusBadge status={r.status} /> },
    { key: 'payment', label: t('orders.pay'), render: (r) => <StatusBadge status={r.paymentStatus || 'Pending'} /> },
    {
      key: 'actions',
      label: t('common.actions'),
      className: 'w-[5.5rem]',
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
        title={t('orders.title')}
        subtitle={t('orders.subtitle', { count: filtered.length })}
        breadcrumbs={[{ label: t('common.home'), to: '/' }, { label: t('orders.title') }]}
        actions={<Link to="/orders/new"><Button><Plus size={16} /> {t('common.newOrder')}</Button></Link>}
      >
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-md flex-1">
            <SearchInput value={query} onChange={setQuery} placeholder={t('orders.search')} />
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`filter-chip ${statusFilter === status ? 'filter-chip-active' : ''}`}
              >
                {t(`status.${status}`, { defaultValue: status })}
              </button>
            ))}
          </div>
        </div>

        <DataTable
          compact
          columns={columns}
          rows={filtered}
          onRowClick={setSelected}
          emptyMessage={t('orders.empty')}
        />
      </PageShell>

      <OrderDetailModal
        open={!!liveSelected}
        order={liveSelected}
        customerBalance={selectedCustomerBalance}
        customerPhone={liveSelected ? customerPhoneFor(liveSelected) : ''}
        onClose={() => setSelected(null)}
        onPaymentComplete={() => setSelected(null)}
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
        title={t('orders.deleteTitle')}
        subtitle={t('orders.deleteSubtitle', {
          token: deleteTarget?.tokenNumber,
          name: deleteTarget?.customerName,
        })}
        rows={[]}
        confirmLabel={t('common.delete')}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          try {
            await deleteOrder(deleteTarget.id);
            await refreshOrders();
            notify.success(t('orders.deleted'), t('orders.deletedDesc', { token: deleteTarget.tokenNumber }));
            if (selected?.id === deleteTarget.id) setSelected(null);
            setDeleteTarget(null);
          } catch (err) {
            notify.error(t('orders.deleteFailed'), err.message);
          }
        }}
      />
    </>
  );
}
