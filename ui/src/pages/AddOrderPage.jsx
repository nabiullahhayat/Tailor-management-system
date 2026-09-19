import { useEffect, useMemo, useState } from 'react';
import PageShell from '../components/desktop/PageShell.jsx';
import SectionTitle from '../components/ui/SectionTitle.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import { useCustomers } from '../context/CustomerContext.jsx';
import { useOrders } from '../context/OrderContext.jsx';
import { addsService, orderService } from '../services/index.js';
import { getTodaySolar } from '../utils/solarDate.js';
import { notify } from '../utils/toast.js';
import {
  buildOrderCustomerBalanceMap,
  executeOrderCheckout,
  previewOrderCheckout,
} from '../utils/orderCustomerBalance.js';

export default function AddOrderPage() {
  const { customers, adjustCreditBalance, refreshCustomers } = useCustomers();
  const { orders, addOrder, refreshOrders } = useOrders();
  const [orderTypes, setOrderTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [errors, setErrors] = useState({});

  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [orderTypeId, setOrderTypeId] = useState('');
  const [measurements, setMeasurements] = useState({});
  const [color, setColor] = useState('');
  const [pricePerOne, setPricePerOne] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [employeeId, setEmployeeId] = useState('');
  const [solarDate, setSolarDate] = useState(getTodaySolar());
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [hasCustomerPaid, setHasCustomerPaid] = useState('');
  const [cashPaid, setCashPaid] = useState('');
  const [payFromCredit, setPayFromCredit] = useState('');

  useEffect(() => {
    Promise.all([addsService.getOrderTypes(), addsService.getEmployees()]).then(
      ([types, emps]) => {
        setOrderTypes(types);
        setEmployees(emps);
      },
    );
  }, []);

  const selectedCustomer = customerId ? customers.find((c) => c.id === customerId) : null;
  const selectedType = orderTypes.find((t) => t.id === orderTypeId);
  const totalAmount = (parseFloat(pricePerOne) || 0) * (parseFloat(quantity) || 0);

  const balanceMap = useMemo(
    () => buildOrderCustomerBalanceMap(customers, orders),
    [customers, orders],
  );

  const outstandingDebt = selectedCustomer ? balanceMap[selectedCustomer.id]?.creditRemaining ?? 0 : 0;
  const prepaidAvailable = selectedCustomer ? Number(selectedCustomer.creditBalance || 0) : 0;

  const checkoutPreview = useMemo(() => {
    if (!selectedCustomer || totalAmount <= 0) return null;
    const cash = hasCustomerPaid === 'yes' ? cashPaid : '0';
    return previewOrderCheckout(
      selectedCustomer,
      totalAmount,
      cash,
      payFromCredit,
      orders,
      customers,
    );
  }, [selectedCustomer, totalAmount, hasCustomerPaid, cashPaid, payFromCredit, orders, customers]);

  useEffect(() => {
    if (!selectedCustomer || !selectedType) return;
    const saved = selectedCustomer.measurements || {};
    setMeasurements((prev) => {
      const next = { ...prev };
      (selectedType.measurements || []).forEach((m) => {
        if (saved[m] !== undefined && saved[m] !== '') {
          next[m] = String(saved[m]);
        }
      });
      return next;
    });
  }, [customerId, orderTypeId, selectedCustomer, selectedType]);

  const resolveCustomerName = () => {
    if (customerId) return customers.find((c) => c.id === customerId)?.name || '';
    return customerName;
  };

  const validate = () => {
    const e = {};
    if (!customerId && !customerName.trim()) e.customer = 'Customer is required.';
    if (!orderTypeId) e.orderType = 'Select an order type from Adds menu.';
    if (!solarDate.trim()) e.solarDate = 'Order date is required.';
    if (!deliveryDate.trim()) e.delivery = 'Delivery date is required.';
    if (!pricePerOne || Number(pricePerOne) <= 0) e.price = 'Enter a valid price.';
    if (!quantity || Number(quantity) <= 0) e.quantity = 'Enter a valid quantity.';
    if (!hasCustomerPaid) e.hasPaid = 'Select whether the customer has paid.';
    if (hasCustomerPaid === 'yes' && cashPaid !== '' && Number.isNaN(Number(cashPaid))) {
      e.cashPaid = 'Enter a valid payment amount.';
    }
    const wallet = Math.max(0, parseFloat(payFromCredit) || 0);
    if (payFromCredit !== '' && Number.isNaN(wallet)) e.payFromCredit = 'Enter a valid amount.';
    else if (wallet > prepaidAvailable) e.payFromCredit = 'Cannot use more than prepaid credit.';
    (selectedType?.measurements || []).forEach((m) => {
      if (!measurements[m]) e[`m_${m}`] = `${m} is required.`;
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleConfirm = async () => {
    const emp = employees.find((e) => e.id === employeeId);
    let checkout = null;

    if (selectedCustomer) {
      const cash = hasCustomerPaid === 'yes' ? cashPaid : '0';
      checkout = await executeOrderCheckout({
        customer: selectedCustomer,
        orderTotal: totalAmount,
        cashPaid: cash,
        walletUsed: payFromCredit,
        orders,
        customers,
        applyOrderPayment: (orderId, data) => orderService.setPaidAmount(orderId, data),
        adjustWallet: adjustCreditBalance,
      });
      await refreshCustomers();
      await refreshOrders();
    }

    let orderPaid = checkout?.orderPaidAmount ?? 0;
    let paymentStatus = checkout?.paymentStatus ?? 'Pending';

    if (!selectedCustomer && hasCustomerPaid === 'yes') {
      orderPaid = Math.min(totalAmount, Math.max(0, parseFloat(cashPaid) || 0));
      if (orderPaid >= totalAmount && totalAmount > 0) paymentStatus = 'Paid';
      else if (orderPaid > 0) paymentStatus = 'Partial';
    }

    await addOrder({
      customerId,
      customerName: resolveCustomerName(),
      orderType: selectedType?.name || '',
      orderTypeId,
      measurements,
      color,
      pricePerOne,
      quantity,
      totalAmount: String(totalAmount),
      paidAmount: orderPaid,
      paymentStatus,
      employeeId: employeeId || null,
      employeeName: emp?.name || '',
      orderDateSolar: solarDate,
      deliveryDate,
      notes,
    });

    setConfirmOpen(false);
    setCustomerId('');
    setCustomerName('');
    setOrderTypeId('');
    setMeasurements({});
    setColor('');
    setPricePerOne('');
    setQuantity('1');
    setEmployeeId('');
    setDeliveryDate('');
    setNotes('');
    setHasCustomerPaid('');
    setCashPaid('');
    setPayFromCredit('');
    notify.success('Order created', `${selectedType?.name || 'Order'} saved successfully`);
  };

  const orderPaidDisplay = checkoutPreview?.orderPaidAmount ?? 0;
  const orderRemainingDisplay = checkoutPreview?.orderRemaining ?? totalAmount;

  const confirmRows = [
    { label: 'Customer', value: resolveCustomerName() },
    { label: 'Order Type', value: selectedType?.name || '—' },
    { label: 'Quantity', value: quantity },
    { label: 'Price / One', value: `₹${pricePerOne}` },
    { label: 'Delivery Date', value: deliveryDate },
    { label: 'Total Amount', value: `₹${totalAmount.toLocaleString()}`, highlight: true },
    ...(checkoutPreview?.cashAppliedToDebt > 0
      ? [{ label: 'Cash to old remaining', value: `₹${checkoutPreview.cashAppliedToDebt.toLocaleString()}` }]
      : []),
    ...(checkoutPreview?.walletUsed > 0
      ? [{ label: 'Paid from prepaid credit', value: `₹${checkoutPreview.walletUsed.toLocaleString()}` }]
      : []),
    { label: 'Paid on this order', value: `₹${orderPaidDisplay.toLocaleString()}` },
    {
      label: 'Remaining on this order',
      value: `₹${orderRemainingDisplay.toLocaleString()}`,
      highlight: orderRemainingDisplay > 0,
    },
    ...(checkoutPreview?.surplusToPrepaid > 0
      ? [{ label: 'Added to prepaid credit', value: `₹${checkoutPreview.surplusToPrepaid.toLocaleString()}` }]
      : []),
    { label: 'Payment status', value: checkoutPreview?.paymentStatus || paymentStatusLabel() },
  ];

  function paymentStatusLabel() {
    if (!selectedCustomer && hasCustomerPaid === 'yes') {
      const p = Math.min(totalAmount, parseFloat(cashPaid) || 0);
      if (p >= totalAmount && totalAmount > 0) return 'Paid';
      if (p > 0) return 'Partial';
    }
    if (hasCustomerPaid === 'no') return 'Pending';
    return 'Pending';
  }

  const savedMeasurements = selectedCustomer?.measurements || {};

  return (
    <PageShell
      title="New Tailoring Order"
      subtitle="Book a new garment order with measurements and delivery date"
      breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Orders', to: '/orders' }, { label: 'New Order' }]}
    >
      <div className="mx-auto max-w-4xl form-panel">
          <SectionTitle title="Customer" />
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <select
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
                if (e.target.value) setCustomerName('');
              }}
              className="rounded-xl border-2 border-black/10 px-3 py-2.5 text-sm"
            >
              <option value="">Select existing customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.tokenNumber})
                </option>
              ))}
            </select>
            <Input
              placeholder="Or enter new customer name"
              value={customerName}
              onChange={(e) => {
                setCustomerName(e.target.value);
                if (e.target.value.trim()) setCustomerId('');
              }}
              error={errors.customer}
            />
          </div>

          {selectedCustomer && Object.keys(savedMeasurements).length > 0 && (
            <div className="mb-4 rounded-xl border border-primary-soft bg-background px-4 py-3">
              <p className="mb-2 text-sm font-semibold text-ink">Saved customer measurements</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {Object.entries(savedMeasurements).map(([key, value]) => (
                  <div key={key} className="rounded-lg bg-white px-3 py-2 text-sm">
                    <span className="text-ink-muted">{key}: </span>
                    <span className="font-semibold">{value || '—'}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-ink-muted">
                Matching fields below are pre-filled from this profile when you select an order type.
              </p>
            </div>
          )}

          {selectedCustomer && (
            <div className="mb-4 grid gap-2 rounded-xl border border-black/5 bg-background px-4 py-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-ink-muted">Outstanding remaining (debt)</p>
                <p className={`font-bold ${outstandingDebt > 0 ? 'text-danger' : 'text-success'}`}>
                  ₹{outstandingDebt.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-ink-muted">Prepaid credit</p>
                <p className="font-bold text-success">₹{prepaidAvailable.toLocaleString()}</p>
              </div>
            </div>
          )}

          <SectionTitle title="Order Details" />
          {orderTypes.length === 0 ? (
            <div className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              No order types yet. Go to Adds menu and create order types first.
            </div>
          ) : (
            <select
              value={orderTypeId}
              onChange={(e) => {
                const type = orderTypes.find((t) => t.id === e.target.value);
                setOrderTypeId(e.target.value);
                const initial = {};
                (type?.measurements || []).forEach((m) => {
                  initial[m] = '';
                });
                setMeasurements(initial);
              }}
              className="mb-4 w-full rounded-xl border-2 border-black/10 px-3 py-2.5 text-sm"
            >
              <option value="">Select order type…</option>
              {orderTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
          {errors.orderType && <p className="mb-3 text-xs text-danger">{errors.orderType}</p>}

          {(selectedType?.measurements || []).map((m) => (
            <Input
              key={m}
              label={`${m} *`}
              value={measurements[m] || ''}
              onChange={(e) => setMeasurements((prev) => ({ ...prev, [m]: e.target.value }))}
              error={errors[`m_${m}`]}
            />
          ))}

          <Input label="Color" value={color} onChange={(e) => setColor(e.target.value)} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Price per One (₹) *" type="number" value={pricePerOne} onChange={(e) => setPricePerOne(e.target.value)} error={errors.price} />
            <Input label="Quantity *" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} error={errors.quantity} />
          </div>

          <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3">
            <p className="text-sm text-ink-muted">Total Amount</p>
            <p className="text-2xl font-extrabold text-success">₹{totalAmount.toLocaleString()}</p>
          </div>

          <SectionTitle title="Payment" subtitle="Cash pays old debt first, then this order" />
          <div className="mb-3">
            <p className="mb-2 text-sm font-medium text-ink">Has the customer paid?</p>
            <div className="flex flex-wrap gap-4">
              {[
                ['yes', 'Yes'],
                ['no', 'No'],
              ].map(([val, label]) => (
                <label key={val} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="hasPaid"
                    value={val}
                    checked={hasCustomerPaid === val}
                    onChange={() => {
                      setHasCustomerPaid(val);
                      if (val === 'no') setCashPaid('');
                    }}
                  />
                  {label}
                </label>
              ))}
            </div>
            {errors.hasPaid && <p className="mt-1 text-xs text-danger">{errors.hasPaid}</p>}
          </div>

          {hasCustomerPaid === 'yes' && (
            <Input
              label="Payment amount (₹)"
              type="number"
              value={cashPaid}
              onChange={(e) => setCashPaid(e.target.value)}
              error={errors.cashPaid}
              placeholder="Amount received now"
            />
          )}

          {selectedCustomer && prepaidAvailable > 0 && (
            <Input
              label="Pay from prepaid credit (₹)"
              type="number"
              value={payFromCredit}
              onChange={(e) => setPayFromCredit(e.target.value)}
              error={errors.payFromCredit}
              placeholder={`Available ₹${prepaidAvailable.toLocaleString()}`}
            />
          )}

          {checkoutPreview && totalAmount > 0 && (
            <div className="mb-4 rounded-xl border border-black/5 bg-background px-4 py-3 text-sm">
              <p>
                Paid on this order: <strong>₹{orderPaidDisplay.toLocaleString()}</strong>
              </p>
              <p>
                Remaining on this order:{' '}
                <strong className={orderRemainingDisplay > 0 ? 'text-danger' : 'text-success'}>
                  ₹{orderRemainingDisplay.toLocaleString()}
                </strong>
              </p>
            </div>
          )}

          {employees.length > 0 && (
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="mb-4 w-full rounded-xl border-2 border-black/10 px-3 py-2.5 text-sm"
            >
              <option value="">Select employee (optional)…</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          )}

          <Input label="Order Date (Solar) *" value={solarDate} onChange={(e) => setSolarDate(e.target.value)} error={errors.solarDate} />
          <Input label="Delivery Date *" type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} error={errors.delivery} />
          <Input label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />

          <div className="mb-4 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800">
            Auto token preview: ORD-{String(orders.length + 1).padStart(4, '0')}
          </div>

          <Button onClick={() => validate() && setConfirmOpen(true)}>Review & Create Order</Button>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Confirm Order"
        subtitle="Review all details before saving"
        rows={confirmRows}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
      />
    </PageShell>
  );
}
