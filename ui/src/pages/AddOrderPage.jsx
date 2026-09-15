import { useEffect, useState } from 'react';
import PageShell from '../components/desktop/PageShell.jsx';
import SectionTitle from '../components/ui/SectionTitle.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import { useCustomers } from '../context/CustomerContext.jsx';
import { useOrders } from '../context/OrderContext.jsx';
import { addsService } from '../services/index.js';
import { getTodaySolar } from '../utils/solarDate.js';
import { notify } from '../utils/toast.js';

export default function AddOrderPage() {
  const { customers } = useCustomers();
  const { orders, addOrder } = useOrders();
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

  useEffect(() => {
    Promise.all([addsService.getOrderTypes(), addsService.getEmployees()]).then(
      ([types, emps]) => {
        setOrderTypes(types);
        setEmployees(emps);
      },
    );
  }, []);

  const selectedType = orderTypes.find((t) => t.id === orderTypeId);
  const totalAmount = (parseFloat(pricePerOne) || 0) * (parseFloat(quantity) || 0);

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
    (selectedType?.measurements || []).forEach((m) => {
      if (!measurements[m]) e[`m_${m}`] = `${m} is required.`;
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleConfirm = async () => {
    const emp = employees.find((e) => e.id === employeeId);
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
    notify.success('Order created', `${selectedType?.name || 'Order'} saved successfully`);
  };

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
              onChange={(e) => setCustomerId(e.target.value)}
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
              onChange={(e) => setCustomerName(e.target.value)}
              error={errors.customer}
            />
          </div>

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
        rows={[
          { label: 'Customer', value: resolveCustomerName() },
          { label: 'Order Type', value: selectedType?.name || '—' },
          { label: 'Quantity', value: quantity },
          { label: 'Price / One', value: `₹${pricePerOne}` },
          { label: 'Delivery Date', value: deliveryDate },
          { label: 'Total Amount', value: `₹${totalAmount.toLocaleString()}`, highlight: true },
        ]}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
      />
    </PageShell>
  );
}
