import { useMemo, useState } from 'react';
import PageShell from '../components/desktop/PageShell.jsx';
import SectionTitle from '../components/ui/SectionTitle.jsx';
import Input from '../components/ui/Input.jsx';
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
  const [payFromCredit, setPayFromCredit] = useState('');
  const [cashPaid, setCashPaid] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [billOpen, setBillOpen] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [errors, setErrors] = useState({});

  const selectedItem = items.find((i) => i.id === itemId);
  const total = (parseFloat(qty) || 0) * (parseFloat(price) || 0);

  const selectedSalesCustomer = salesCustomerId
    ? salesCustomers.find((c) => c.id === salesCustomerId)
    : null;

  const balanceMap = useMemo(
    () => buildSalesCustomerBalanceMap(salesCustomers, sales),
    [salesCustomers, sales],
  );

  const checkoutCustomer = useMemo(() => {
    if (selectedSalesCustomer) return selectedSalesCustomer;
    return null;
  }, [selectedSalesCustomer]);

  const outstandingDebt = checkoutCustomer ? balanceMap[checkoutCustomer.id]?.creditRemaining ?? 0 : 0;
  const prepaidAvailable = checkoutCustomer ? Number(checkoutCustomer.creditBalance || 0) : 0;

  const checkoutPreview = useMemo(() => {
    if (!checkoutCustomer || total <= 0) return null;
    return previewSaleCheckout(
      checkoutCustomer,
      total,
      cashPaid,
      payFromCredit,
      sales,
      salesCustomers,
    );
  }, [checkoutCustomer, total, cashPaid, payFromCredit, sales, salesCustomers]);

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
    const wallet = Math.max(0, parseFloat(payFromCredit) || 0);
    if (payFromCredit !== '' && Number.isNaN(wallet)) e.payFromCredit = 'Enter a valid amount.';
    else if (wallet > prepaidAvailable) e.payFromCredit = 'Cannot use more than prepaid credit balance.';
    if (cashPaid !== '' && Number.isNaN(Number(cashPaid))) e.cashPaid = 'Enter a valid amount.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const resetForm = () => {
    setSalesCustomerId('');
    setCustomerName('');
    setItemId('');
    setQty('');
    setPrice('');
    setPayFromCredit('');
    setCashPaid('');
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
          walletUsed: payFromCredit,
          sales,
          salesCustomers,
          recordPayment: updatePaymentStatus,
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
    ...(checkoutPreview?.cashAppliedToDebt > 0
      ? [{ label: 'Cash to old remaining', value: `₹${checkoutPreview.cashAppliedToDebt.toLocaleString()}` }]
      : []),
    ...(checkoutPreview?.walletUsed > 0
      ? [{ label: 'Paid from prepaid credit', value: `₹${checkoutPreview.walletUsed.toLocaleString()}` }]
      : []),
    { label: 'Paid on this sale', value: `₹${salePaidDisplay.toLocaleString()}` },
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

  return (
    <PageShell
      title={title}
      subtitle={subtitle}
      breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Sales', to: '/sales' }, { label: title }]}
    >
      <div className="mx-auto max-w-3xl form-panel">
        <SectionTitle title="Sale Details" />
        <select
          value={salesCustomerId}
          onChange={(e) => {
            setSalesCustomerId(e.target.value);
            if (e.target.value) setCustomerName('');
          }}
          className="mb-4 w-full rounded-xl border-2 border-black/10 px-3 py-2.5 text-sm"
        >
          <option value="">Select sales customer…</option>
          {salesCustomers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <Input
          placeholder="Or enter customer name (saved to Sales Customers)"
          value={customerName}
          onChange={(e) => {
            setCustomerName(e.target.value);
            if (e.target.value.trim()) setSalesCustomerId('');
          }}
          error={errors.customer}
        />

        {checkoutCustomer && (
          <div className="mb-4 grid gap-2 rounded-xl border border-primary-soft bg-background px-4 py-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-ink-muted">Outstanding remaining (debt)</p>
              <p className={`font-bold ${outstandingDebt > 0 ? 'text-danger' : 'text-success'}`}>
                ₹{outstandingDebt.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">Prepaid credit (wallet)</p>
              <p className="font-bold text-success">₹{prepaidAvailable.toLocaleString()}</p>
            </div>
            <p className="sm:col-span-2 text-xs text-ink-muted">
              New cash pays old remaining first, then this sale. Use prepaid credit or cash below; extra cash is saved as prepaid credit.
            </p>
          </div>
        )}

        <select
          value={itemId}
          onChange={(e) => {
            const item = items.find((i) => i.id === e.target.value);
            setItemId(e.target.value);
            if (item) setPrice(String(getPrice(item)));
          }}
          className="mb-2 w-full rounded-xl border-2 border-black/10 px-3 py-2.5 text-sm"
        >
          <option value="">Select {itemLabel.toLowerCase()}…</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} — stock: {getStock(item)}
            </option>
          ))}
        </select>
        {errors.item && <p className="mb-3 text-xs text-danger">{errors.item}</p>}

        <Input label={`${qtyLabel} *`} type="number" value={qty} onChange={(e) => setQty(e.target.value)} error={errors.qty} />
        <Input label={`Price per ${priceField} (₹) *`} type="number" value={price} onChange={(e) => setPrice(e.target.value)} error={errors.price} />

        <Input
          label="Pay from prepaid credit (₹)"
          type="number"
          value={payFromCredit}
          onChange={(e) => {
            setPayFromCredit(e.target.value);
            setErrors((p) => ({ ...p, payFromCredit: '' }));
          }}
          error={errors.payFromCredit}
          placeholder={checkoutCustomer ? `Available ₹${prepaidAvailable.toLocaleString()}` : 'Select customer first'}
          disabled={!checkoutCustomer}
        />
        <Input
          label="New cash payment (₹)"
          type="number"
          value={cashPaid}
          onChange={(e) => {
            setCashPaid(e.target.value);
            setErrors((p) => ({ ...p, cashPaid: '' }));
          }}
          error={errors.cashPaid}
          placeholder="Cash received — applies to old debt first, then this sale"
        />

        <div className="mb-4 grid gap-2 rounded-xl bg-background px-4 py-3 sm:grid-cols-3">
          <div>
            <p className="text-xs text-ink-muted">Total</p>
            <p className="text-lg font-extrabold text-ink">₹{total.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-ink-muted">Paid on this sale</p>
            <p className="text-lg font-bold text-success">₹{salePaidDisplay.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-ink-muted">Remaining on sale</p>
            <p className={`text-lg font-bold ${saleRemainingDisplay > 0 ? 'text-danger' : 'text-success'}`}>
              ₹{saleRemainingDisplay.toLocaleString()}
            </p>
          </div>
        </div>

        <Button onClick={() => validate() && setConfirmOpen(true)}>Review & Save Sale</Button>
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
