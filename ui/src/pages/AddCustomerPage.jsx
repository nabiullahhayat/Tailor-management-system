import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Phone } from 'lucide-react';
import PageShell from '../components/desktop/PageShell.jsx';
import SectionTitle from '../components/ui/SectionTitle.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import { CUSTOMER_OPTIONAL_MEASUREMENT_KEYS, useCustomers } from '../context/CustomerContext.jsx';
import { addsService } from '../services/index.js';
import { notify } from '../utils/toast.js';

function buildEmptyMeasurements(fieldNames) {
  const base = {};
  fieldNames.forEach((name) => {
    base[name] = '';
  });
  return base;
}

export default function AddCustomerPage() {
  const { addCustomer } = useCustomers();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [measurementFields, setMeasurementFields] = useState([]);
  const [fieldsLoading, setFieldsLoading] = useState(true);
  const [measurements, setMeasurements] = useState({});
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(null);

  const loadFields = useCallback(async () => {
    setFieldsLoading(true);
    try {
      const fields = await addsService.getCustomerMeasurementFields();
      setMeasurementFields(fields);
      setMeasurements(buildEmptyMeasurements(fields.map((f) => f.name)));
    } finally {
      setFieldsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFields();
  }, [loadFields]);

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Name is required.';
    if (!phone.trim()) e.phone = 'Phone is required.';
    else if (!/^\d+$/.test(phone)) e.phone = 'Digits only.';
    else if (phone.length !== 10) e.phone = 'Must be exactly 10 digits.';
    else if (!phone.startsWith('07')) e.phone = 'Must start with 07.';

    if (measurementFields.length === 0) {
      notify.warning(
        'No measurement fields',
        'Add customer measurement names in Adds → Customer Measurement first.',
      );
      return false;
    }

    measurementFields.forEach(({ name: fieldName }) => {
      const val = String(measurements[fieldName] ?? '').trim();
      if (!val) e[`m_${fieldName}`] = `${fieldName} is required.`;
      else if (Number.isNaN(Number(val))) e[`m_${fieldName}`] = `${fieldName} must be a number.`;
    });

    setErrors(e);
    if (Object.keys(e).length > 0) {
      const missingMeasure = measurementFields.some(({ name: fieldName }) => e[`m_${fieldName}`]);
      if (missingMeasure) {
        notify.warning('Measurements required', 'Fill all measurement fields before saving.');
      }
    }
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      const payload = { ...measurements };
      CUSTOMER_OPTIONAL_MEASUREMENT_KEYS.forEach((key) => {
        if (!payload[key]) payload[key] = measurements[key] || '';
      });
      const customer = await addCustomer(name.trim(), phone.trim(), payload);
      notify.success('Customer saved', `Token: ${customer.tokenNumber}`);
      setSaved(customer.tokenNumber);
      setName('');
      setPhone('');
      setMeasurements(buildEmptyMeasurements(measurementFields.map((f) => f.name)));
      setErrors({});
      setTimeout(() => setSaved(null), 4000);
    } catch (err) {
      notify.error('Could not save customer', err.message);
    }
  };

  return (
    <PageShell
      title="Add Customer"
      subtitle="Measurements come from Adds → Customer Measurement"
      breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Customers', to: '/customers' }, { label: 'Add Customer' }]}
    >
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="form-panel lg:col-span-2">
            {saved && (
              <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-success">
                Customer saved! Token: <strong>{saved}</strong>
              </div>
            )}

            <SectionTitle title="Basic Info" />
            <Input label="Customer Name *" icon={User} value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
            <Input label="Phone Number *" icon={Phone} value={phone} onChange={(e) => setPhone(e.target.value)} error={errors.phone} placeholder="e.g. 0712345678" />

            <Button className="mt-4 w-full sm:w-auto" onClick={handleSave} disabled={fieldsLoading}>
              Save Customer
            </Button>
          </div>

          <div className="form-panel lg:col-span-3">
            <SectionTitle title="Measurements *" subtitle="Field names are managed under Adds" />
            {fieldsLoading ? (
              <p className="text-sm text-ink-muted">Loading measurement fields…</p>
            ) : measurementFields.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-ink-secondary">
                No measurement fields yet.{' '}
                <Link to="/adds" className="font-semibold text-navy underline">
                  Open Adds → Customer Measurement
                </Link>{' '}
                to add names.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {measurementFields.map(({ id, name: fieldName }) => (
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
      </div>
    </PageShell>
  );
}
