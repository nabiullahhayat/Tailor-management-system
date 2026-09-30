import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import TableRowActions from '../components/ui/TableRowActions.jsx';
import PageShell from '../components/desktop/PageShell.jsx';
import DataTable from '../components/desktop/DataTable.jsx';
import SearchInput from '../components/ui/SearchInput.jsx';
import Button from '../components/ui/Button.jsx';
import CustomerDetailsModal, {
  EditCustomerModal,
  AddOrderCustomerModal,
  AddSalesCustomerModal,
  SalesCustomerDetailsModal,
  EditSalesCustomerModal,
  DeleteConfirmModal,
} from '../components/modals/CustomerModals.jsx';
import { useCustomers } from '../context/CustomerContext.jsx';
import { useOrders } from '../context/OrderContext.jsx';
import { useSalesCustomers } from '../context/SalesCustomerContext.jsx';
import { useSales } from '../context/SaleContext.jsx';
import { applyOrderCustomerCashPayment, buildOrderCustomerBalanceMap } from '../utils/orderCustomerBalance.js';
import { orderService } from '../services/index.js';
import { notify } from '../utils/toast.js';
import { formatCurrency } from '../utils/currency.js';
import { formatSolarDisplay } from '../utils/solarDate.js';
import {
  applySalesCustomerCreditPayment,
  buildSalesCustomerBalanceMap,
  getSalesForCustomer,
} from '../utils/salesCustomerBalance.js';

export default function CustomersPage() {
  const { t } = useTranslation();
  const {
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    adjustCreditBalance: adjustOrderCreditBalance,
    refreshCustomers,
  } = useCustomers();
  const { orders, refreshOrders } = useOrders();
  const { salesCustomers, addSalesCustomer, updateSalesCustomer, deleteSalesCustomer, adjustCreditBalance } = useSalesCustomers();
  const { sales, updatePaymentStatus } = useSales();

  const orderBalanceMap = useMemo(
    () => buildOrderCustomerBalanceMap(customers, orders),
    [customers, orders],
  );

  const salesBalanceMap = useMemo(
    () => buildSalesCustomerBalanceMap(salesCustomers, sales),
    [salesCustomers, sales],
  );

  const [tab, setTab] = useState('order');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [addOrderCustomerOpen, setAddOrderCustomerOpen] = useState(false);

  const [addSaleOpen, setAddSaleOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [editSaleTarget, setEditSaleTarget] = useState(null);
  const [deleteSaleTarget, setDeleteSaleTarget] = useState(null);

  useEffect(() => {
    if (!selected?.id) return;
    const fresh = customers.find((c) => c.id === selected.id);
    if (fresh) setSelected(fresh);
  }, [customers, selected?.id]);

  const filteredOrder = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q),
    );
  }, [customers, query]);

  const filteredSale = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return salesCustomers;
    return salesCustomers.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.phone || '').includes(q),
    );
  }, [salesCustomers, query]);

  const fmt = formatCurrency;

  const orderColumns = [
    { key: 'name', label: t('customers.customerName'), render: (r) => <span className="font-medium text-ink">{r.name}</span> },
    { key: 'phone', label: t('common.phone'), render: (r) => r.phone },
    {
      key: 'remaining',
      label: t('customers.remainingDebt'),
      render: (r) => {
        const debt = orderBalanceMap[r.id]?.creditRemaining ?? 0;
        return (
          <span className={`font-semibold ${debt > 0 ? 'text-danger' : 'text-ink-muted'}`}>{fmt(debt)}</span>
        );
      },
    },
    {
      key: 'prepaid',
      label: t('common.credit'),
      render: (r) => (
        <span className="font-semibold text-success">
          {fmt(orderBalanceMap[r.id]?.prepaidCredit ?? r.creditBalance)}
        </span>
      ),
    },
    { key: 'added', label: t('customers.added'), render: (r) => formatSolarDisplay(r.addedDate) },
    {
      key: 'actions',
      label: t('common.actions'),
      className: 'table-actions-cell',
      render: (r) => (
        <TableRowActions
          onEdit={() => setEditTarget(r)}
          onDelete={() => setDeleteTarget(r)}
        />
      ),
    },
  ];

  const saleColumns = [
    { key: 'name', label: t('customers.customerName'), render: (r) => <span className="font-medium text-ink">{r.name}</span> },
    { key: 'phone', label: t('common.phone'), render: (r) => r.phone || '—' },
    {
      key: 'total',
      label: t('customers.totalSales'),
      render: (r) => <span className="font-semibold">{fmt(salesBalanceMap[r.id]?.totalAmount)}</span>,
    },
    {
      key: 'paid',
      label: t('common.paid'),
      render: (r) => <span className="font-semibold text-success">{fmt(salesBalanceMap[r.id]?.paidAmount)}</span>,
    },
    {
      key: 'credit',
      label: t('customers.remainingDebt'),
      render: (r) => {
        const credit = salesBalanceMap[r.id]?.creditRemaining ?? 0;
        return (
          <span className={`font-semibold ${credit > 0 ? 'text-danger' : 'text-ink-muted'}`}>
            {fmt(credit)}
          </span>
        );
      },
    },
    {
      key: 'prepaid',
      label: t('customers.prepaidCredit'),
      render: (r) => (
        <span className="font-semibold text-success">{fmt(salesBalanceMap[r.id]?.prepaidCredit ?? r.creditBalance)}</span>
      ),
    },
    { key: 'added', label: t('customers.added'), render: (r) => formatSolarDisplay(r.addedDate) },
    {
      key: 'actions',
      label: t('common.actions'),
      className: 'table-actions-cell',
      render: (r) => (
        <TableRowActions
          onEdit={() => setEditSaleTarget(r)}
          onDelete={() => setDeleteSaleTarget(r)}
        />
      ),
    },
  ];

  const isOrder = tab === 'order';

  return (
    <>
      <PageShell
        title={t('customers.title')}
        subtitle={
          isOrder
            ? `${customers.length} · ${t('customers.orderTab')}`
            : `${salesCustomers.length} · ${t('customers.salesTab')}`
        }
        breadcrumbs={[{ label: t('common.home'), to: '/' }, { label: t('customers.title') }]}
        actions={
          isOrder ? (
            <Button type="button" onClick={() => setAddOrderCustomerOpen(true)}>
              <Plus size={16} /> {t('customers.add')}
            </Button>
          ) : (
            <Button type="button" onClick={() => setAddSaleOpen(true)}>
              <Plus size={16} /> {t('customersExtra.addSales')}
            </Button>
          )
        }
      >
        <div className="mb-4 flex max-w-xl flex-wrap gap-2">
          {[
            { key: 'order', label: t('customers.orderTab') },
            { key: 'sale', label: t('customers.salesTab') },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setTab(key);
                setQuery('');
              }}
              className={`filter-chip flex-1 min-w-[140px] ${tab === key ? 'filter-chip-active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mb-5 max-w-md">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder={isOrder ? t('customersExtra.searchOrder') : t('customersExtra.searchSales')}
          />
        </div>

        {isOrder ? (
          <DataTable
            columns={orderColumns}
            rows={filteredOrder}
            onRowClick={setSelected}
            emptyMessage={t('customersExtra.emptyOrder')}
          />
        ) : (
          <DataTable
            columns={saleColumns}
            rows={filteredSale}
            onRowClick={setSelectedSale}
            emptyMessage={t('customersExtra.emptySales')}
          />
        )}
      </PageShell>

      <AddOrderCustomerModal
        open={addOrderCustomerOpen}
        onClose={() => setAddOrderCustomerOpen(false)}
        onSave={(name, phone, measurements) => addCustomer(name, phone, measurements)}
      />

      <CustomerDetailsModal
        open={!!selected}
        customer={selected}
        onClose={() => setSelected(null)}
      />
      <EditCustomerModal
        open={!!editTarget}
        customer={editTarget}
        creditRemaining={editTarget ? orderBalanceMap[editTarget.id]?.creditRemaining : 0}
        prepaidCredit={
          editTarget
            ? orderBalanceMap[editTarget.id]?.prepaidCredit ?? editTarget.creditBalance
            : 0
        }
        onClose={() => setEditTarget(null)}
        onSave={async (payload) => {
          await updateCustomer(payload.id, payload.name, payload.phone, payload.measurements);

          const creditDelta = payload.creditBalance - payload.initialCredit;
          if (creditDelta !== 0) {
            await adjustOrderCreditBalance(payload.id, creditDelta);
          }

          if (payload.collectedAmount > 0) {
            const customerRecord = customers.find((c) => c.id === payload.id) || editTarget;
            await applyOrderCustomerCashPayment(
              { ...customerRecord, name: payload.name },
              payload.collectedAmount,
              orders,
              customers,
              (orderId, data) =>
                orderService.setPaidAmount(orderId, {
                  ...data,
                  recordIncome: payload.sendToDakhal,
                }),
              (cid, delta) => adjustOrderCreditBalance(cid, delta),
            );
          }

          await refreshOrders();
          await refreshCustomers();
          notify.success(
            t('toasts.customerUpdated'),
            payload.collectedAmount > 0 && payload.sendToDakhal
              ? t('toasts.dakhalAdded', { amount: payload.collectedAmount.toLocaleString() })
              : undefined,
          );
        }}
      />
      <DeleteConfirmModal
        open={!!deleteTarget}
        name={deleteTarget?.name}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          deleteCustomer(deleteTarget.id);
          setDeleteTarget(null);
          notify.success(t('toasts.customerDeleted'));
        }}
      />

      <SalesCustomerDetailsModal
        open={!!selectedSale}
        customer={selectedSale}
        balance={selectedSale ? salesBalanceMap[selectedSale.id] : null}
        recentSales={
          selectedSale
            ? getSalesForCustomer(selectedSale.id, selectedSale.name, sales, salesCustomers).slice(0, 10)
            : []
        }
        onClose={() => setSelectedSale(null)}
        onEdit={(c) => {
          setSelectedSale(null);
          setEditSaleTarget(c);
        }}
        onDelete={(c) => {
          setSelectedSale(null);
          setDeleteSaleTarget(c);
        }}
      />
      <AddSalesCustomerModal
        open={addSaleOpen}
        onClose={() => setAddSaleOpen(false)}
        onSave={async (name, phone) => {
          try {
            await addSalesCustomer(name, phone);
            notify.success(t('toasts.salesCustomerAdded'));
          } catch (err) {
            notify.error(t('toasts.couldNotAddCustomer'), err.message);
          }
        }}
      />
      <EditSalesCustomerModal
        open={!!editSaleTarget}
        customer={editSaleTarget}
        creditRemaining={editSaleTarget ? salesBalanceMap[editSaleTarget.id]?.creditRemaining : 0}
        prepaidCredit={
          editSaleTarget
            ? salesBalanceMap[editSaleTarget.id]?.prepaidCredit ?? editSaleTarget.creditBalance
            : 0
        }
        onClose={() => setEditSaleTarget(null)}
        onSave={async (id, name, phone, paymentAmount) => {
          await updateSalesCustomer(id, name, phone);
          if (paymentAmount > 0) {
            const customer = salesCustomers.find((c) => c.id === id) || editSaleTarget;
            const { applied, addedToPrepaid } = await applySalesCustomerCreditPayment(
              customer,
              paymentAmount,
              sales,
              salesCustomers,
              updatePaymentStatus,
              adjustCreditBalance,
            );
            const msg =
              addedToPrepaid > 0
                ? t('toasts.paymentToDebt', {
                    applied: applied.toLocaleString(),
                    prepaid: addedToPrepaid.toLocaleString(),
                  })
                : t('toasts.paymentToDebtOnly', { applied: applied.toLocaleString() });
            notify.success(t('toasts.paymentRecorded'), msg);
          } else {
            notify.success(t('toasts.salesCustomerUpdated'));
          }
        }}
      />
      <DeleteConfirmModal
        open={!!deleteSaleTarget}
        name={deleteSaleTarget?.name}
        onCancel={() => setDeleteSaleTarget(null)}
        onConfirm={() => {
          deleteSalesCustomer(deleteSaleTarget.id);
          setDeleteSaleTarget(null);
          notify.success(t('toasts.salesCustomerDeleted'));
        }}
      />
    </>
  );
}
