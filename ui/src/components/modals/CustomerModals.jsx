import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { User, Phone } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import { CUSTOMER_OPTIONAL_MEASUREMENT_KEYS } from '../../context/CustomerContext.jsx';
import { addsService } from '../../services/index.js';
import { notify } from '../../utils/toast.js';

function buildEmptyMeasurements(fieldNames) {
  const base = {};
  fieldNames.forEach((name) => {
    base[name] = '';
  });
  return base;
}

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
  const { t } = useTranslation();
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
            <p className="text-xs text-ink-muted">{t('common.phone')}</p>
            <p className="font-semibold">{customer.phone}</p>
          </div>
          <div className="rounded-xl bg-background px-3 py-2">
            <p className="text-xs text-ink-muted">{t('customers.added')}</p>
            <p className="font-semibold">
              {customer.addedDate ? new Date(customer.addedDate).toLocaleDateString() : '—'}
            </p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-ink">{t('modals.allMeasurements')}</p>
          {rows.length === 0 ? (
            <p className="text-sm text-ink-muted">{t('modals.noMeasurements')}</p>
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

export function EditCustomerModal({
  open,
  customer,
  creditRemaining = 0,
  prepaidCredit = 0,
  onClose,
  onSave,
}) {
  const { t } = useTranslation();
  const fieldDefs = useMeasurementFieldNames(open);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [measurements, setMeasurements] = useState({});
  const [remainingDebt, setRemainingDebt] = useState('');
  const [creditBalance, setCreditBalance] = useState('');
  const [sendToDakhal, setSendToDakhal] = useState(true);
  const [initialDebt, setInitialDebt] = useState(0);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!customer) return;
    setName(customer.name || '');
    setPhone(customer.phone || '');
    const m = customer.measurements || {};
    const next = {};
    fieldDefs.forEach((f) => {
      next[f.name] = m[f.name] ?? '';
    });
    Object.keys(m).forEach((k) => {
      if (!(k in next)) next[k] = m[k];
    });
    setMeasurements(next);
    const debt = Number(creditRemaining) || 0;
    setInitialDebt(debt);
    setRemainingDebt(String(debt));
    setCreditBalance(String(Number(prepaidCredit) || Number(customer.creditBalance || 0)));
    setSendToDakhal(true);
    setErrors({});
  }, [customer, fieldDefs, creditRemaining, prepaidCredit, open]);

  const validate = useCallback(() => {
    const e = {};
    if (!name.trim()) e.name = 'Name is required.';
    if (!phone.trim()) e.phone = 'Phone is required.';
    const nextRem = parseFloat(remainingDebt);
    if (Number.isNaN(nextRem) || nextRem < 0) e.remaining = 'Enter a valid remaining amount.';
    else if (nextRem > initialDebt + 0.001) {
      e.remaining = 'To record money received, enter a remaining amount lower than the current total.';
    }
    const nextCredit = parseFloat(creditBalance);
    if (Number.isNaN(nextCredit) || nextCredit < 0) e.credit = 'Enter a valid credit balance.';
    fieldDefs.forEach(({ name: fieldName }) => {
      const val = String(measurements[fieldName] ?? '').trim();
      if (!val) e[`m_${fieldName}`] = `${fieldName} is required.`;
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [name, phone, measurements, fieldDefs, remainingDebt, creditBalance, initialDebt]);

  if (!customer) return null;

  const nextRemaining = Math.max(0, parseFloat(remainingDebt) || 0);
  const collectedAmount = Math.max(0, initialDebt - nextRemaining);

  return (
    <Modal open={open} onClose={onClose} title={t('modals.editOrderCustomer')} subtitle={customer.tokenNumber} size="lg">
      <Input label={t('addsExtra.nameRequired')} value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
      <Input label={t('addsExtra.phoneRequired')} value={phone} onChange={(e) => setPhone(e.target.value)} error={errors.phone} />

      <div className="my-4 rounded-xl border border-primary-soft bg-background p-4">
        <p className="mb-3 text-sm font-semibold text-ink">{t('common.balance')}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label={t('customers.remainingDebt')}
            type="number"
            min="0"
            value={remainingDebt}
            onChange={(e) => {
              setRemainingDebt(e.target.value);
              setErrors((p) => ({ ...p, remaining: '' }));
            }}
            error={errors.remaining}
          />
          <Input
            label={t('customers.prepaidCredit')}
            type="number"
            min="0"
            value={creditBalance}
            onChange={(e) => {
              setCreditBalance(e.target.value);
              setErrors((p) => ({ ...p, credit: '' }));
            }}
            error={errors.credit}
          />
        </div>
        {collectedAmount > 0 && (
          <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm">
            <p className="text-ink-secondary">
              Lowering remaining records <strong>₹{collectedAmount.toLocaleString()}</strong> received from
              the customer.
            </p>
            <label className="mt-2 flex items-center gap-2 font-medium text-ink">
              <input
                type="checkbox"
                checked={sendToDakhal}
                onChange={(e) => setSendToDakhal(e.target.checked)}
              />
              Add this amount to Dakhal (income)
            </label>
          </div>
        )}
      </div>

      <p className="mb-2 text-sm font-semibold text-ink">{t('modals.measurements')}</p>
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
      </div>

      <Button
        className="mt-4"
        disabled={saving}
        onClick={async () => {
          if (!validate()) {
            notify.warning('Fix errors', 'Check the form and try again.');
            return;
          }
          setSaving(true);
          try {
            await onSave({
              id: customer.id,
              name: name.trim(),
              phone: phone.trim(),
              measurements,
              remainingDebt: nextRemaining,
              creditBalance: parseFloat(creditBalance) || 0,
              initialDebt,
              initialCredit: Number(prepaidCredit) || Number(customer.creditBalance || 0),
              collectedAmount,
              sendToDakhal: collectedAmount > 0 ? sendToDakhal : false,
            });
            onClose();
          } catch (err) {
            notify.error('Could not save', err.message);
          } finally {
            setSaving(false);
          }
        }}
      >
        {saving ? t('addsExtra.saving') : t('modals.saveChanges')}
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
  const { t } = useTranslation();
  if (!customer) return null;
  const total = balance?.totalAmount ?? 0;
  const paid = balance?.paidAmount ?? 0;
  const credit = balance?.creditRemaining ?? 0;
  const prepaid = balance?.prepaidCredit ?? Number(customer.creditBalance || 0);

  return (
    <Modal open={open} onClose={onClose} title={customer.name} subtitle={t('modals.salesCustomer')} size="lg">
      <div className="space-y-3 text-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-background px-3 py-2">
            <p className="text-xs text-ink-muted">{t('common.phone')}</p>
            <p className="font-semibold">{customer.phone || '—'}</p>
          </div>
          <div className="rounded-xl bg-background px-3 py-2">
            <p className="text-xs text-ink-muted">{t('customers.added')}</p>
            <p className="font-semibold">
              {customer.addedDate ? new Date(customer.addedDate).toLocaleDateString() : '—'}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-primary-soft bg-background p-4">
          <p className="mb-3 text-sm font-semibold text-ink">{t('modals.paymentSummary')}</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-ink-muted">{t('customers.totalSales')}</p>
              <p className="text-lg font-bold text-ink">{formatRupee(total)}</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">{t('common.paid')}</p>
              <p className="text-lg font-bold text-success">{formatRupee(paid)}</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">{t('customers.remainingDebt')}</p>
              <p className={`text-lg font-bold ${credit > 0 ? 'text-danger' : 'text-success'}`}>
                {formatRupee(credit)}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">{t('customers.prepaidCredit')}</p>
              <p className="text-lg font-bold text-success">{formatRupee(prepaid)}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-ink-muted">
            {t('sales.historySubtitle', { count: balance?.saleCount ?? 0 })}
          </p>
        </div>

        {recentSales.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">{t('modals.recentSales')}</p>
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
                    <p className="text-ink-muted">{sale.productName} · {t(`ledger.${sale.saleType}`, { defaultValue: sale.saleType })}</p>
                    <div className="mt-1 flex justify-between text-ink-muted">
                      <span>{t('common.paid')} {formatRupee(salePaid)}</span>
                      <span className={saleCredit > 0 ? 'font-semibold text-danger' : 'text-success'}>
                        {t('common.remaining')} {formatRupee(saleCredit)}
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
        <Button onClick={() => onEdit(customer)}>{t('common.edit')}</Button>
        <Button variant="danger" onClick={() => onDelete(customer)}>
          {t('common.delete')}
        </Button>
      </div>
    </Modal>
  );
}

export function AddOrderCustomerModal({ open, onClose, onSave }) {
  const { t } = useTranslation();
  const fieldDefs = useMeasurementFieldNames(open);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [measurements, setMeasurements] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName('');
    setPhone('');
    setMeasurements(buildEmptyMeasurements(fieldDefs.map((f) => f.name)));
    setErrors({});
  }, [open, fieldDefs]);

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Name is required.';
    if (!phone.trim()) e.phone = 'Phone is required.';
    else if (!/^\d+$/.test(phone)) e.phone = 'Digits only.';
    else if (phone.length !== 10) e.phone = 'Must be exactly 10 digits.';
    else if (!phone.startsWith('07')) e.phone = 'Must start with 07.';
    if (fieldDefs.length === 0) {
      notify.warning(
        'No measurement fields',
        'Add customer measurement names in Adds → Customer Measurement first.',
      );
      return false;
    }
    fieldDefs.forEach(({ name: fieldName }) => {
      const val = String(measurements[fieldName] ?? '').trim();
      if (!val) e[`m_${fieldName}`] = `${fieldName} is required.`;
      else if (Number.isNaN(Number(val))) e[`m_${fieldName}`] = `${fieldName} must be a number.`;
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...measurements };
      const customer = await onSave(name.trim(), phone.trim(), payload);
      notify.success('Customer saved', `Token: ${customer.tokenNumber}`);
      onClose();
    } catch (err) {
      notify.error('Could not save customer', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t('modals.addCustomer')} subtitle={t('modals.addCustomerHint')} size="xl">
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <Input label={t('addsExtra.nameRequired')} icon={User} value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
          <Input
            label={t('addsExtra.phoneRequired')}
            icon={Phone}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={errors.phone}
            placeholder="e.g. 0712345678"
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold text-ink">{t('modals.measurements')} *</p>
          {fieldDefs.length === 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-ink-secondary">
              No measurement fields yet.{' '}
              <Link to="/adds" className="font-semibold text-navy underline" onClick={onClose}>
                Open Adds → Customer Measurement
              </Link>
            </div>
          ) : (
            <div className="grid max-h-[50vh] gap-3 overflow-y-auto sm:grid-cols-2">
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
            </div>
          )}
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button type="button" onClick={handleSave} disabled={saving || fieldDefs.length === 0}>
          {saving ? t('addsExtra.saving') : t('modals.saveCustomer')}
        </Button>
      </div>
    </Modal>
  );
}

export function AddSalesCustomerModal({ open, onClose, onSave }) {
  const { t } = useTranslation();
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
    <Modal open={open} onClose={onClose} title={t('modals.addSalesCustomer')} size="md">
      <Input label={t('addsExtra.nameRequired')} value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
      <Input label={`${t('common.phone')} (${t('common.optional')})`} value={phone} onChange={(e) => setPhone(e.target.value)} />
      <Button className="mt-2" onClick={handleSave}>
        {t('modals.saveCustomer')}
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
  const { t } = useTranslation();
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
    <Modal open={open} onClose={onClose} title={t('modals.editSalesCustomer')} subtitle={t('modals.editSalesHint')} size="md">
      <Input label={t('common.name')} value={name} onChange={(e) => setName(e.target.value)} />
      <Input label={`${t('common.phone')} (${t('common.optional')})`} value={phone} onChange={(e) => setPhone(e.target.value)} />

      <div className="my-4 rounded-xl border border-primary-soft bg-background p-4">
        <p className="mb-3 text-sm font-semibold text-ink">{t('modals.creditPayment')}</p>
        <div className="mb-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-surface px-3 py-2">
            <p className="text-xs text-ink-muted">{t('modals.remainingDebt')}</p>
            <p className={`text-lg font-bold ${debt > 0 ? 'text-danger' : 'text-success'}`}>
              {formatRupee(debt)}
            </p>
          </div>
          <div className="rounded-lg bg-surface px-3 py-2">
            <p className="text-xs text-ink-muted">{t('modals.prepaidNow')}</p>
            <p className="text-lg font-bold text-success">{formatRupee(prepaid)}</p>
          </div>
          <div className="rounded-lg bg-surface px-3 py-2">
            <p className="text-xs text-ink-muted">{t('modals.afterDebt')}</p>
            <p className={`text-lg font-bold ${newDebt > 0 ? 'text-danger' : 'text-success'}`}>
              {formatRupee(newDebt)}
            </p>
          </div>
          <div className="rounded-lg bg-surface px-3 py-2">
            <p className="text-xs text-ink-muted">{t('modals.afterPrepaid')}</p>
            <p className="text-lg font-bold text-success">{formatRupee(newPrepaid)}</p>
          </div>
        </div>
        <Input
          label={t('sales.cash')}
          type="number"
          min="0"
          value={paymentAmount}
          onChange={(e) => {
            setPaymentAmount(e.target.value);
            setPayError('');
          }}
          error={payError}
          placeholder={t('newOrder.paymentHint')}
        />
        <p className="mt-1 text-xs text-ink-muted">
          {t('sales.paymentHint')}
        </p>
      </div>

      <Button disabled={saving} onClick={handleSave}>
        {saving ? t('addsExtra.saving') : t('modals.saveChanges')}
      </Button>
    </Modal>
  );
}

export function DeleteConfirmModal({ open, name, onCancel, onConfirm }) {
  const { t } = useTranslation();
  return (
    <Modal open={open} onClose={onCancel} title={t('modals.deleteRecord')} size="sm">
      <p className="text-sm text-ink-muted">
        {t('modals.deleteHint', { name })}
      </p>
      <div className="mt-6 flex gap-3">
        <Button variant="outline" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          {t('common.delete')}
        </Button>
      </div>
    </Modal>
  );
}
