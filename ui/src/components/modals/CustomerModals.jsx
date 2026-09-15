import { useCallback, useEffect, useMemo, useState } from 'react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import { CUSTOMER_OPTIONAL_MEASUREMENT_KEYS } from '../../context/CustomerContext.jsx';
import { addsService } from '../../services/index.js';
import { notify } from '../../utils/toast.js';

function useMeasurementFieldNames(open) {
  const [fields, setFields] = useState([]);

  useEffect(() => {
    if (!open) return;
    addsService.getCustomerMeasurementFields().then(setFields).catch(() => setFields([]));
  }, [open]);

  return fields;
}

function buildMeasurementRows(customer, fieldDefs) {
  const m = customer?.measurements || {};
  const configured = fieldDefs.map((f) => ({
    key: f.name,
    label: f.name,
    value: m[f.name] != null && String(m[f.name]).trim() !== '' ? String(m[f.name]) : '—',
  }));

  const configuredKeys = new Set([
    ...fieldDefs.map((f) => f.name),
    ...CUSTOMER_OPTIONAL_MEASUREMENT_KEYS,
  ]);
  const legacy = Object.entries(m)
    .filter(([key]) => !configuredKeys.has(key))
    .map(([key, value]) => ({
      key,
      label: key,
      value: value != null && String(value).trim() !== '' ? String(value) : '—',
    }));

  const optional = CUSTOMER_OPTIONAL_MEASUREMENT_KEYS.map((key) => ({
    key,
    label: key.charAt(0).toUpperCase() + key.slice(1),
    value: m[key] != null && String(m[key]).trim() !== '' ? String(m[key]) : '—',
  }));

  return [...configured, ...legacy, ...optional];
}

export default function CustomerDetailsModal({ open, customer, onClose }) {
  const fieldDefs = useMeasurementFieldNames(open);
  const rows = useMemo(
    () => (customer ? buildMeasurementRows(customer, fieldDefs) : []),
    [customer, fieldDefs],
  );

  if (!customer) return null;

  return (
    <Modal open={open} onClose={onClose} title={customer.name} subtitle={customer.tokenNumber} size="xl">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-background px-3 py-2">
            <p className="text-xs text-ink-muted">Phone</p>
            <p className="font-semibold">{customer.phone}</p>
          </div>
          <div className="rounded-xl bg-background px-3 py-2">
            <p className="text-xs text-ink-muted">Added</p>
            <p className="font-semibold">
              {customer.addedDate ? new Date(customer.addedDate).toLocaleDateString() : '—'}
            </p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-ink">All measurements</p>
          {rows.length === 0 ? (
            <p className="text-sm text-ink-muted">No measurement fields configured in Adds.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {rows.map(({ key, label, value }) => (
                <div key={key} className="rounded-lg bg-background px-3 py-2 text-sm">
                  <span className="text-ink-muted">{label}: </span>
                  <span className="font-semibold">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

export function EditCustomerModal({ open, customer, onClose, onSave }) {
  const fieldDefs = useMeasurementFieldNames(open);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [measurements, setMeasurements] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!customer) return;
    setName(customer.name || '');
    setPhone(customer.phone || '');
    const m = customer.measurements || {};
    const next = { color: m.color ?? '', quantity: m.quantity ?? '' };
    fieldDefs.forEach((f) => {
      next[f.name] = m[f.name] ?? '';
    });
    Object.keys(m).forEach((k) => {
      if (!(k in next)) next[k] = m[k];
    });
    setMeasurements(next);
    setErrors({});
  }, [customer, fieldDefs]);

  const validate = useCallback(() => {
    const e = {};
    if (!name.trim()) e.name = 'Name is required.';
    if (!phone.trim()) e.phone = 'Phone is required.';
    fieldDefs.forEach(({ name: fieldName }) => {
      const val = String(measurements[fieldName] ?? '').trim();
      if (!val) e[`m_${fieldName}`] = `${fieldName} is required.`;
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [name, phone, measurements, fieldDefs]);

  if (!customer) return null;

  return (
    <Modal open={open} onClose={onClose} title="Edit Order Customer" subtitle={customer.tokenNumber} size="lg">
      <Input label="Name *" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
      <Input label="Phone *" value={phone} onChange={(e) => setPhone(e.target.value)} error={errors.phone} />

      <p className="mb-2 mt-4 text-sm font-semibold text-ink">Measurements</p>
      <div className="grid max-h-[40vh] gap-3 overflow-y-auto sm:grid-cols-2">
        {fieldDefs.map(({ id, name: fieldName }) => (
          <Input
            key={id}
            label={fieldName}
            value={measurements[fieldName] || ''}
            onChange={(e) => {
              setMeasurements((prev) => ({ ...prev, [fieldName]: e.target.value }));
              setErrors((prev) => {
                const next = { ...prev };
                delete next[`m_${fieldName}`];
                return next;
              });
            }}
            error={errors[`m_${fieldName}`]}
          />
        ))}
        <Input
          label="Color"
          value={measurements.color || ''}
          onChange={(e) => setMeasurements((prev) => ({ ...prev, color: e.target.value }))}
        />
        <Input
          label="Quantity"
          value={measurements.quantity || ''}
          onChange={(e) => setMeasurements((prev) => ({ ...prev, quantity: e.target.value }))}
        />
      </div>

      <Button
        className="mt-4"
        onClick={async () => {
          if (!validate()) {
            notify.warning('Fix errors', 'Fill required measurement fields.');
            return;
          }
          await onSave(customer.id, name, phone, measurements);
          onClose();
        }}
      >
        Save Changes
      </Button>
    </Modal>
  );
}

function formatRupee(n) {
  return `₹${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function SalesCustomerDetailsModal({
  open,
  customer,
  balance,
  recentSales = [],
  onClose,
  onEdit,
  onDelete,
}) {
  if (!customer) return null;
  const total = balance?.totalAmount ?? 0;
  const paid = balance?.paidAmount ?? 0;
  const credit = balance?.creditRemaining ?? 0;
  const prepaid = balance?.prepaidCredit ?? Number(customer.creditBalance || 0);

  return (
    <Modal open={open} onClose={onClose} title={customer.name} subtitle="Sales customer" size="lg">
      <div className="space-y-3 text-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-background px-3 py-2">
            <p className="text-xs text-ink-muted">Phone</p>
            <p className="font-semibold">{customer.phone || '—'}</p>
          </div>
          <div className="rounded-xl bg-background px-3 py-2">
            <p className="text-xs text-ink-muted">Added</p>
            <p className="font-semibold">
              {customer.addedDate ? new Date(customer.addedDate).toLocaleDateString() : '—'}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-primary-soft bg-background p-4">
          <p className="mb-3 text-sm font-semibold text-ink">Payment summary</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-ink-muted">Total sales</p>
              <p className="text-lg font-bold text-ink">{formatRupee(total)}</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">Paid</p>
              <p className="text-lg font-bold text-success">{formatRupee(paid)}</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">Remaining (debt)</p>
              <p className={`text-lg font-bold ${credit > 0 ? 'text-danger' : 'text-success'}`}>
                {formatRupee(credit)}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">Prepaid credit</p>
              <p className="text-lg font-bold text-success">{formatRupee(prepaid)}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-ink-muted">
            {balance?.saleCount ?? 0} sale(s) linked to this customer
          </p>
        </div>

        {recentSales.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">Recent sales</p>
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {recentSales.map((sale) => {
                const saleTotal = Number(sale.totalAmount || 0);
                const salePaid = Number(sale.paidAmount || 0);
                const saleCredit = Math.max(0, saleTotal - salePaid);
                return (
                  <div key={sale.id} className="rounded-lg bg-background px-3 py-2 text-xs">
                    <div className="flex justify-between gap-2 font-semibold text-ink">
                      <span>{sale.invoiceNumber}</span>
                      <span>{formatRupee(saleTotal)}</span>
                    </div>
                    <p className="text-ink-muted">{sale.productName} · {sale.saleType}</p>
                    <div className="mt-1 flex justify-between text-ink-muted">
                      <span>Paid {formatRupee(salePaid)}</span>
                      <span className={saleCredit > 0 ? 'font-semibold text-danger' : 'text-success'}>
                        Remaining {formatRupee(saleCredit)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={() => onEdit(customer)}>Edit</Button>
        <Button variant="danger" onClick={() => onDelete(customer)}>
          Delete
        </Button>
      </div>
    </Modal>
  );
}

export function AddSalesCustomerModal({ open, onClose, onSave }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setName('');
      setPhone('');
      setErrors({});
    }
  }, [open]);

  const handleSave = async () => {
    const e = {};
    if (!name.trim()) e.name = 'Name is required.';
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    await onSave(name.trim(), phone.trim());
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Sales Customer" size="md">
      <Input label="Name *" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
      <Input label="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <Button className="mt-2" onClick={handleSave}>
        Save Customer
      </Button>
    </Modal>
  );
}

export function EditSalesCustomerModal({
  open,
  customer,
  creditRemaining = 0,
  prepaidCredit = 0,
  onClose,
  onSave,
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [payError, setPayError] = useState('');
  const [saving, setSaving] = useState(false);

  const debt = Number(creditRemaining) || 0;
  const prepaid = Number(prepaidCredit) || 0;
  const payNow = Math.max(0, parseFloat(paymentAmount) || 0);
  const toDebt = Math.min(payNow, debt);
  const toPrepaid = Math.max(0, payNow - debt);
  const newDebt = Math.max(0, debt - payNow);
  const newPrepaid = prepaid + toPrepaid;

  useEffect(() => {
    if (customer) {
      setName(customer.name || '');
      setPhone(customer.phone || '');
      setPaymentAmount('');
      setPayError('');
    }
  }, [customer, open]);

  if (!customer) return null;

  const handleSave = async () => {
    if (payNow <= 0 && !name.trim()) {
      setPayError('Enter a payment or update name/phone.');
      return;
    }
    setSaving(true);
    try {
      await onSave(customer.id, name, phone, payNow);
      onClose();
    } catch (err) {
      notify.error('Could not save', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit Sales Customer" subtitle="Update details or record a payment" size="md">
      <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <Input label="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />

      <div className="my-4 rounded-xl border border-primary-soft bg-background p-4">
        <p className="mb-3 text-sm font-semibold text-ink">Credit / payment</p>
        <div className="mb-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-surface px-3 py-2">
            <p className="text-xs text-ink-muted">Remaining debt</p>
            <p className={`text-lg font-bold ${debt > 0 ? 'text-danger' : 'text-success'}`}>
              {formatRupee(debt)}
            </p>
          </div>
          <div className="rounded-lg bg-surface px-3 py-2">
            <p className="text-xs text-ink-muted">Prepaid credit now</p>
            <p className="text-lg font-bold text-success">{formatRupee(prepaid)}</p>
          </div>
          <div className="rounded-lg bg-surface px-3 py-2">
            <p className="text-xs text-ink-muted">After payment — debt</p>
            <p className={`text-lg font-bold ${newDebt > 0 ? 'text-danger' : 'text-success'}`}>
              {formatRupee(newDebt)}
            </p>
          </div>
          <div className="rounded-lg bg-surface px-3 py-2">
            <p className="text-xs text-ink-muted">After payment — prepaid</p>
            <p className="text-lg font-bold text-success">{formatRupee(newPrepaid)}</p>
          </div>
        </div>
        <Input
          label="Cash payment (₹)"
          type="number"
          min="0"
          value={paymentAmount}
          onChange={(e) => {
            setPaymentAmount(e.target.value);
            setPayError('');
          }}
          error={payError}
          placeholder="Pays old remaining first; extra saved as prepaid credit"
        />
        <p className="mt-1 text-xs text-ink-muted">
          Payment clears oldest unpaid sales first. Any amount left after debt is added to prepaid credit.
        </p>
      </div>

      <Button disabled={saving} onClick={handleSave}>
        {saving ? 'Saving…' : 'Save Changes'}
      </Button>
    </Modal>
  );
}

export function DeleteConfirmModal({ open, name, onCancel, onConfirm }) {
  return (
    <Modal open={open} onClose={onCancel} title="Delete Record?" size="sm">
      <p className="text-sm text-ink-muted">
        Are you sure you want to delete <strong>{name}</strong>? This cannot be undone.
      </p>
      <div className="mt-6 flex gap-3">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          Delete
        </Button>
      </div>
    </Modal>
  );
}
