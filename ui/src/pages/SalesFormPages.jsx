import { useMemo, useState } from 'react';
import PageShell from '../components/desktop/PageShell.jsx';
import SectionTitle from '../components/ui/SectionTitle.jsx';
import Input from '../components/ui/Input.jsx';
import SearchInput from '../components/ui/SearchInput.jsx';
import Button from '../components/ui/Button.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import SaleBillModal from '../components/modals/SaleBillModal.jsx';
import { useSalesCustomers } from '../context/SalesCustomerContext.jsx';
import { useSales } from '../context/SaleContext.jsx';
import { useStock } from '../context/StockContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { notify } from '../utils/toast.js';
import {
  buildSalesCustomerBalanceMap,
  executeSaleCheckout,
  previewSaleCheckout,
} from '../utils/salesCustomerBalance.js';

function SaleFormPage({ title, subtitle, saleType, itemLabel, qtyLabel, qtyField, priceField, getItems, getPrice, getStock }) {
  const { salesCustomers, findOrCreateByName, adjustCreditBalance, refreshSalesCustomers } = useSalesCustomers();
  const { sales, addSale, updatePaymentStatus } = useSales();
  const { refreshStock } = useStock();
  const { appName } = useSettings();
  const items = getItems();

  const [salesCustomerId, setSalesCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [itemId, setItemId] = useState('');
  const [qty, setQty] = useState('');
  const [price, setPrice] = useState('');
  const [cashPaid, setCashPaid] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [billOpen, setBillOpen] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [errors, setErrors] = useState({});
  const [itemSearch, setItemSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  const selectedItem = items.find((i) => i.id === itemId);
  const total = (parseFloat(qty) || 0) * (parseFloat(price) || 0);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return salesCustomers;
    return salesCustomers.filter((c) => c.name.toLowerCase().includes(q));
  }, [salesCustomers, customerSearch]);

  const filteredItems = useMemo(() => {
    const q = itemSearch.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.name.toLowerCase().includes(q));
  }, [items, itemSearch]);

  const selectedSalesCustomer = salesCustomerId
    ? salesCustomers.find((c) => c.id === salesCustomerId)
    : null;

  const balanceMap = useMemo(
    () => buildSalesCustomerBalanceMap(salesCustomers, sales),
    [salesCustomers, sales],
  );

  const checkoutCustomer = useMemo(() => {
    if (selectedSalesCustomer) return selectedSalesCustomer;
    const name = customerName.trim().toLowerCase();
    if (!name) return null;
    return salesCustomers.find((c) => c.name.toLowerCase() === name) ?? null;
  }, [selectedSalesCustomer, customerName, salesCustomers]);

  const outstandingDebt = checkoutCustomer ? balanceMap[checkoutCustomer.id]?.creditRemaining ?? 0 : 0;
  const prepaidAvailable = checkoutCustomer ? Number(checkoutCustomer.creditBalance || 0) : 0;

  const checkoutPreview = useMemo(() => {
    if (total <= 0) return null;
    return previewSaleCheckout(checkoutCustomer || {}, total, cashPaid);
  }, [checkoutCustomer, total, cashPaid]);

  const resolveCustomerName = () => {
    if (salesCustomerId) return selectedSalesCustomer?.name || '';
    return customerName.trim();
  };

  const validate = () => {
    const e = {};
    if (!salesCustomerId && !customerName.trim()) e.customer = 'Customer is required.';
    if (!itemId) e.item = `Please select a ${itemLabel.toLowerCase()}.`;
    if (!qty || Number(qty) <= 0) e.qty = 'Enter valid quantity.';
    else if (selectedItem && Number(qty) > getStock(selectedItem)) {
      e.qty = `Only ${getStock(selectedItem)} available in stock.`;
    }
    if (!price || Number(price) <= 0) e.price = 'Enter valid price.';
    if (cashPaid !== '' && Number.isNaN(Number(cashPaid))) e.cashPaid = 'Enter a valid amount.';
    const cash = Math.max(0, parseFloat(cashPaid) || 0);
    const dueAfterCredit = checkoutCustomer
      ? Math.max(0, total - Math.min(Number(checkoutCustomer.creditBalance || 0), total))
      : total;
    if (cash > dueAfterCredit && !salesCustomerId && !customerName.trim()) {
      e.customer = 'Select or enter a customer to save extra payment as prepaid credit.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const resetForm = () => {
    setSalesCustomerId('');
    setCustomerName('');
    setItemId('');
    setQty('');
    setPrice('');
    setCashPaid('');
    setItemSearch('');
    setCustomerSearch('');
    setErrors({});
  };

  const handleConfirm = async () => {
    try {
      let resolvedSalesCustomerId = salesCustomerId;
      let resolvedName = resolveCustomerName();
      let customerRecord = selectedSalesCustomer;

      if (!resolvedSalesCustomerId && customerName.trim()) {
        customerRecord = await findOrCreateByName(customerName.trim());
        resolvedSalesCustomerId = customerRecord.id;
        resolvedName = customerRecord.name;
      }

      if (!customerRecord && resolvedSalesCustomerId) {
        customerRecord = salesCustomers.find((c) => c.id === resolvedSalesCustomerId);
      }

      let checkout = null;
      if (customerRecord) {
        checkout = await executeSaleCheckout({
          customer: customerRecord,
          saleTotal: total,
          cashPaid,
          adjustWallet: adjustCreditBalance,
        });
        await refreshSalesCustomers();
      }

      const salePaid = checkout?.salePaidAmount ?? Math.max(0, parseFloat(cashPaid) || 0);
      const paymentStatus = checkout?.paymentStatus ?? 'Pending';

      const payload = {
        customerId: null,
        salesCustomerId: resolvedSalesCustomerId,
        customerName: resolvedName,
        saleType,
        productName: selectedItem.name,
        unitPrice: price,
        totalAmount: String(total),
        paidAmount: salePaid,
        paymentStatus,
        notes: '',
      };
      if (saleType === 'Fabric Sale') {
        payload.fabricId = selectedItem.id;
        payload.meters = qty;
      } else {
        payload.machineryId = selectedItem.id;
        payload.quantity = qty;
      }

      const saved = await addSale({
        ...payload,
        paidAmount: 0,
        paymentStatus: 'Pending',
      });

      let finalSale = saved;
      if (salePaid > 0) {
        finalSale = await updatePaymentStatus(saved.id, {
          paidAmount: salePaid,
          paymentStatus,
        });
      }

      await refreshStock();
      setConfirmOpen(false);
      resetForm();
      setLastSale(finalSale);
      setBillOpen(true);
      notify.success('Sale recorded', `Bill ${finalSale.invoiceNumber} generated`);
    } catch (err) {
      notify.error('Could not save sale', err.message);
    }
  };

  const salePaidDisplay = checkoutPreview?.salePaidAmount ?? 0;
  const saleRemainingDisplay = checkoutPreview?.saleRemaining ?? total;

  const confirmRows = [
    { label: 'Customer', value: resolveCustomerName() },
    { label: itemLabel, value: selectedItem?.name || '—' },
    { label: qtyLabel, value: qty },
    { label: `Price per ${priceField}`, value: `₹${Number(price || 0).toLocaleString()}` },
    { label: 'Total amount', value: `₹${total.toLocaleString()}`, highlight: true },
    ...(checkoutPreview?.walletUsed > 0
      ? [{ label: 'Prepaid credit applied', value: `₹${checkoutPreview.walletUsed.toLocaleString()}` }]
      : []),
    ...(checkoutPreview?.amountDueAfterCredit != null && checkoutPreview.walletUsed > 0
      ? [{ label: 'Due after prepaid credit', value: `₹${checkoutPreview.amountDueAfterCredit.toLocaleString()}` }]
      : []),
    { label: 'Cash received', value: `₹${Math.max(0, parseFloat(cashPaid) || 0).toLocaleString()}` },
    { label: 'Total paid on this sale', value: `₹${salePaidDisplay.toLocaleString()}` },
    {
      label: 'Remaining on this sale',
      value: `₹${saleRemainingDisplay.toLocaleString()}`,
      highlight: saleRemainingDisplay > 0,
    },
    ...(checkoutPreview?.surplusToPrepaid > 0
      ? [{ label: 'Added to prepaid credit', value: `₹${checkoutPreview.surplusToPrepaid.toLocaleString()}` }]
      : []),
    { label: 'Payment status', value: checkoutPreview?.paymentStatus || 'Pending' },
  ];

  const selectClass =
    'w-full rounded-xl border-2 border-black/10 px-3 py-2 text-sm';

  return (
    <PageShell
      title={title}
      subtitle={subtitle}
      breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Sales', to: '/sales' }, { label: title }]}
    >
      <div className="mx-auto w-full max-w-[1440px]">
        <div className="grid items-start gap-5 xl:grid-cols-12">
          <div className="space-y-5 xl:col-span-7">
            <div className="form-panel p-4 lg:p-5">
              <SectionTitle title="Customer" />
              <div className="mb-2 max-w-md">
                <SearchInput
                  value={customerSearch}
                  onChange={setCustomerSearch}
                  placeholder="Search sales customers…"
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <select
                  value={salesCustomerId}
                  onChange={(e) => {
                    setSalesCustomerId(e.target.value);
                    if (e.target.value) setCustomerName('');
                  }}
                  className={selectClass}
                >
                  <option value="">Select sales customer…</option>
                  {filteredCustomers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <Input
                  placeholder="Or type new customer name"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    if (e.target.value.trim()) setSalesCustomerId('');
                  }}
                  error={errors.customer}
                />
              </div>

              {checkoutCustomer && (
                <div className="mt-3 grid gap-2 rounded-xl border border-primary-soft bg-background px-3 py-2 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-ink-muted">Outstanding remaining (debt)</p>
                    <p className={`text-base font-bold ${outstandingDebt > 0 ? 'text-danger' : 'text-success'}`}>
                      ₹{outstandingDebt.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-muted">Prepaid credit</p>
                    <p className="text-base font-bold text-success">₹{prepaidAvailable.toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="form-panel p-4 lg:p-5">
              <SectionTitle title={itemLabel} subtitle={`Search and select ${itemLabel.toLowerCase()} from stock`} />
              <div className="mb-3 max-w-md">
                <SearchInput
                  value={itemSearch}
                  onChange={setItemSearch}
                  placeholder={`Search ${itemLabel.toLowerCase()} by name…`}
                />
              </div>
              <select
                value={itemId}
                onChange={(e) => {
                  const item = items.find((i) => i.id === e.target.value);
                  setItemId(e.target.value);
                  if (item) setPrice(String(getPrice(item)));
                }}
                className={selectClass}
              >
                <option value="">Select {itemLabel.toLowerCase()}…</option>
                {filteredItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} — stock: {getStock(item)}
                  </option>
                ))}
              </select>
              {errors.item && <p className="mt-1 text-xs text-danger">{errors.item}</p>}
              {itemSearch && filteredItems.length === 0 && (
                <p className="mt-2 text-sm text-ink-muted">No {itemLabel.toLowerCase()} matches your search.</p>
              )}

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Input
                  label={`${qtyLabel} *`}
                  type="number"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  error={errors.qty}
                />
                <Input
                  label={`Price per ${priceField} (₹) *`}
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  error={errors.price}
                />
              </div>

              {selectedItem && (
                <div className="mt-3 rounded-lg bg-background px-3 py-2 text-sm text-ink-secondary">
                  Selected: <strong className="text-ink">{selectedItem.name}</strong>
                  {' · '}
                  Stock: <strong>{getStock(selectedItem)}</strong>
                </div>
              )}
            </div>
          </div>

          <div className="xl:col-span-5">
            <div className="form-panel p-4 lg:p-5 xl:sticky xl:top-4">
              <SectionTitle title="Payment & Total" />
              <p className="mb-3 text-xs text-ink-muted">
                Prepaid credit is applied first. Cash covers what is left; less leaves remaining, more adds
                prepaid credit.
              </p>
              {checkoutCustomer && prepaidAvailable > 0 && total > 0 && (
                <p className="mb-3 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-900">
                  Will use up to ₹{Math.min(prepaidAvailable, total).toLocaleString()} from prepaid credit
                  (balance ₹{prepaidAvailable.toLocaleString()}).
                </p>
              )}

              <Input
                label="Cash payment (₹)"
                type="number"
                value={cashPaid}
                onChange={(e) => {
                  setCashPaid(e.target.value);
                  setErrors((p) => ({ ...p, cashPaid: '', customer: '' }));
                }}
                error={errors.cashPaid}
                placeholder="Amount received now"
              />

              <div className="my-4 grid grid-cols-2 gap-2 rounded-xl bg-emerald-50/80 px-3 py-3 sm:grid-cols-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-ink-muted">Total</p>
                  <p className="text-base font-extrabold text-ink">₹{total.toLocaleString()}</p>
                </div>
                {checkoutPreview?.walletUsed > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-ink-muted">Credit used</p>
                    <p className="text-base font-bold text-accent">₹{checkoutPreview.walletUsed.toLocaleString()}</p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-ink-muted">Paid</p>
                  <p className="text-base font-bold text-success">₹{salePaidDisplay.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-ink-muted">Remaining</p>
                  <p className={`text-base font-bold ${saleRemainingDisplay > 0 ? 'text-danger' : 'text-success'}`}>
                    ₹{saleRemainingDisplay.toLocaleString()}
                  </p>
                </div>
              </div>

              {checkoutPreview?.surplusToPrepaid > 0 && (
                <p className="mb-2 text-xs text-success">
                  ₹{checkoutPreview.surplusToPrepaid.toLocaleString()} will be added to prepaid credit
                </p>
              )}

              <Button className="w-full sm:w-auto" onClick={() => validate() && setConfirmOpen(true)}>
                Review & Save Sale
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title={`Confirm ${title}`}
        subtitle="Review details — bill opens after you confirm"
        rows={confirmRows}
        confirmLabel="Confirm & generate bill"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
      />

      <SaleBillModal
        open={billOpen}
        sale={lastSale}
        shopName={appName}
        customerPhone={
          lastSale?.salesCustomerId
            ? salesCustomers.find((c) => c.id === lastSale.salesCustomerId)?.phone
            : undefined
        }
        onClose={() => {
          setBillOpen(false);
          setLastSale(null);
        }}
      />
    </PageShell>
  );
}

export function FabricSalePage() {
  const { fabrics } = useStock();
  return (
    <SaleFormPage
      title="Fabric Sale"
      subtitle="Record a fabric sale"
      saleType="Fabric Sale"
      itemLabel="Fabric"
      qtyLabel="Meters"
      qtyField="meters"
      priceField="meter"
      getItems={() => fabrics}
      getPrice={(i) => i.pricePerMeter}
      getStock={(i) => i.stock}
    />
  );
}

export function MachinerySalePage() {
  const { machinery } = useStock();
  return (
    <SaleFormPage
      title="Machinery Sale"
      subtitle="Record a machinery sale"
      saleType="Machinery Sale"
      itemLabel="Machine"
      qtyLabel="Quantity"
      qtyField="quantity"
      priceField="unit"
      getItems={() => machinery}
      getPrice={(i) => i.unitPrice}
      getStock={(i) => i.stock}
    />
  );
}
