import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import PageShell from '../components/desktop/PageShell.jsx';
import DataTable from '../components/desktop/DataTable.jsx';
import SearchInput from '../components/ui/SearchInput.jsx';
import SolarDatePicker from '../components/ui/SolarDatePicker.jsx';
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
import { isInSolarDateRange } from '../utils/dateRangeFilter.js';
import { notify } from '../utils/toast.js';

const STATUS_FILTERS = ['All', 'Finding', 'Ready', 'Delivered'];

function resolveCustomerId(order, customers) {
  if (order.customerId) return order.customerId;
  const name = (order.customerName || '').trim().toLowerCase();
  if (!name) return null;
  return customers.find((c) => c.name.toLowerCase() === name)?.id ?? null;
}

function PaidAmountEditor({ order, onSave }) {
  const [value, setValue] = useState(String(order.paidAmount ?? 0));
  const [saving, setSaving] = useState(false);

  const commit = async () => {
    const next = Math.max(0, parseFloat(value) || 0);
    const prev = Number(order.paidAmount || 0);
    if (next === prev) return;
    setSaving(true);
    try {
      await onSave(order.id, next);
    } catch (err) {
      setValue(String(prev));
      notify.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <input
      type="number"
      min={0}
      disabled={saving}
      value={value}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => commit()}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.target.blur();
        }
      }}
      className="input-field w-full min-w-[4.5rem] max-w-[6rem] rounded-md border-2 bg-surface px-2 py-1 text-base font-semibold text-success outline-none"
    />
  );
}

export default function OrdersPage() {
  const { t } = useTranslation();
  const {
    orders,
    updateOrderStatus,
    recordOrderPayment,
    setOrderPaidAmount,
    updateOrder,
    deleteOrder,
    refreshOrders,
  } = useOrders();
  const { customers, refreshCustomers } = useCustomers();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
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
          !query || o.customerName.toLowerCase().includes(query.toLowerCase());
        const matchStatus = statusFilter === 'All' || o.status === statusFilter;
        const orderDate = o.orderDateSolar || o.date || o.createdAt;
        const matchDate =
          (!dateFrom && !dateTo) || isInSolarDateRange(orderDate, dateFrom, dateTo);
        return matchSearch && matchStatus && matchDate;
      }),
    [orders, query, statusFilter, dateFrom, dateTo],
  );

  const customerPhoneFor = (order) => {
    const cid = resolveCustomerId(order, customers);
    const c = cid ? customers.find((x) => x.id === cid) : null;
    return c?.phone || '';
  };

  const handlePaidUpdate = async (id, paidAmount) => {
    await setOrderPaidAmount(id, { paidAmount, recordIncome: true });
    await refreshOrders();
    await refreshCustomers();
    notify.success(t('toasts.paymentRecorded'));
  };

  const columns = [
    {
      key: 'customer',
      label: t('common.customer'),
      render: (r) => <span className="font-medium text-ink">{r.customerName}</span>,
    },
    {
      key: 'type',
      label: t('orders.garment'),
      render: (r) => <span className="text-ink">{r.orderType}</span>,
    },
    { key: 'delivery', label: t('orders.del'), className: 'whitespace-nowrap', render: (r) => formatSolarDisplay(r.deliveryDate) },
    { key: 'amount', label: t('common.total'), className: 'whitespace-nowrap', render: (r) => formatCurrency(r.totalAmount) },
    {
      key: 'paid',
      label: t('common.money'),
      render: (r) => <PaidAmountEditor key={`${r.id}-${r.paidAmount}`} order={r} onSave={handlePaidUpdate} />,
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
          return <span className="text-sm text-success">{t('common.credit')} ؋{credit.toLocaleString()}</span>;
        }
        if (debt > 0) {
          return <span className="text-sm text-danger">{t('common.debt')} ؋{debt.toLocaleString()}</span>;
        }
        return <span className="text-sm text-ink-muted">{t('common.settled')}</span>;
      },
    },
    { key: 'status', label: t('common.status'), render: (r) => <StatusBadge status={r.status} /> },
    { key: 'payment', label: t('orders.payStatus'), render: (r) => <StatusBadge status={r.paymentStatus || 'Pending'} /> },
    {
      key: 'actions',
      label: t('common.actions'),
      className: 'w-[5.5rem] table-actions-cell',
      render: (r) => (
        <TableRowActions
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
        <div className="mb-5 flex flex-col gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-md flex-1">
              <SearchInput value={query} onChange={setQuery} placeholder={t('orders.search')} />
            </div>
            <div className="grid max-w-xl gap-3 sm:grid-cols-2">
              <SolarDatePicker
                label={t('dashboard.periodFrom')}
                value={dateFrom}
                onChange={setDateFrom}
                allowEmpty
                className="mb-0"
              />
              <SolarDatePicker
                label={t('dashboard.periodTo')}
                value={dateTo}
                onChange={setDateTo}
                allowEmpty
                className="mb-0"
              />
            </div>
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
          columns={columns}
          rows={filtered}
          onRowClick={setSelected}
          emptyMessage={t('orders.empty')}
          wrapCells
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
          name: deleteTarget?.customerName,
        })}
        rows={[]}
        confirmLabel={t('common.delete')}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          try {
            await deleteOrder(deleteTarget.id);
            await refreshOrders();
            notify.success(t('orders.deleted'), t('orders.deletedDesc', { name: deleteTarget.customerName }));
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
