import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageShell from '../components/desktop/PageShell.jsx';
import SectionTitle from '../components/ui/SectionTitle.jsx';
import Input from '../components/ui/Input.jsx';
import SolarDatePicker from '../components/ui/SolarDatePicker.jsx';
import Button from '../components/ui/Button.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import { useCustomers } from '../context/CustomerContext.jsx';
import { useOrders } from '../context/OrderContext.jsx';
import { addsService, orderService } from '../services/index.js';
import { getTodaySolar, isSolarDateBefore, normalizeSolarDateString } from '../utils/solarDate.js';
import { notify } from '../utils/toast.js';
import {
  buildOrderCustomerBalanceMap,
  executeOrderCheckout,
  previewOrderCheckout,
} from '../utils/orderCustomerBalance.js';

export default function AddOrderPage() {
  const { t } = useTranslation();
  const { customers, adjustCreditBalance, refreshCustomers } = useCustomers();
  const { orders, addOrder, refreshOrders } = useOrders();
  const [orderTypes, setOrderTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [errors, setErrors] = useState({});

  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [selectedTypeIds, setSelectedTypeIds] = useState([]);
  const [typePrices, setTypePrices] = useState({});
  const [typeQuantities, setTypeQuantities] = useState({});
  const [measurements, setMeasurements] = useState({});
  /** typeId → selected shape option names */
  const [typeShapeSelection, setTypeShapeSelection] = useState({});
  const [color, setColor] = useState('');
  const [customerFabricMeters, setCustomerFabricMeters] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [solarDate, setSolarDate] = useState(getTodaySolar());
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [hasCustomerPaid, setHasCustomerPaid] = useState('');
  const [cashPaid, setCashPaid] = useState('');
  useEffect(() => {
    Promise.all([addsService.getOrderTypes(), addsService.getEmployees()]).then(
      ([types, emps]) => {
        setOrderTypes(types);
        setEmployees(emps);
      },
    );
  }, []);

  const selectedCustomer = customerId ? customers.find((c) => c.id === customerId) : null;

  const selectedTypes = useMemo(
    () => orderTypes.filter((t) => selectedTypeIds.includes(t.id)),
    [orderTypes, selectedTypeIds],
  );

  const typeMeasurementKey = (typeId, fieldName) => `${typeId}__${fieldName}`;

  const buildMeasurementsPayload = () => {
    const out = {};
    const shaklLabel = t('addsExtra.shakl');
    selectedTypes.forEach((type) => {
      (type.measurements || []).forEach((m) => {
        const val = measurements[typeMeasurementKey(type.id, m)];
        if (val !== undefined && val !== '') out[`${type.name} — ${m}`] = val;
      });
      (typeShapeSelection[type.id] || []).forEach((shape) => {
        out[`${type.name} — ${shaklLabel} (${shape})`] = '✓';
      });
    });
    return out;
  };

  const toggleShapeOption = (typeId, shapeName) => {
    setTypeShapeSelection((prev) => {
      const list = prev[typeId] || [];
      const nextList = list.includes(shapeName)
        ? list.filter((s) => s !== shapeName)
        : [...list, shapeName];
      return { ...prev, [typeId]: nextList };
    });
  };

  const lineTotalForType = (typeId) => {
    const unit = parseFloat(typePrices[typeId]) || 0;
    const qty = Math.max(1, parseInt(typeQuantities[typeId], 10) || 1);
    return unit * qty;
  };

  const totalAmount = useMemo(
    () => selectedTypeIds.reduce((sum, id) => sum + lineTotalForType(id), 0),
    [selectedTypeIds, typePrices, typeQuantities],
  );

  const toggleOrderType = (typeId) => {
    setSelectedTypeIds((prev) => {
      if (prev.includes(typeId)) {
        setTypePrices((p) => {
          const next = { ...p };
          delete next[typeId];
          return next;
        });
        setTypeQuantities((q) => {
          const next = { ...q };
          delete next[typeId];
          return next;
        });
        setMeasurements((m) => {
          const prefix = `${typeId}__`;
          const next = { ...m };
          Object.keys(next).forEach((k) => {
            if (k.startsWith(prefix)) delete next[k];
          });
          return next;
        });
        setTypeShapeSelection((prev) => {
          const next = { ...prev };
          delete next[typeId];
          return next;
        });
        return prev.filter((id) => id !== typeId);
      }
      setTypeQuantities((q) => ({ ...q, [typeId]: q[typeId] ?? '1' }));
      return [...prev, typeId];
    });
    setErrors((e) => ({ ...e, orderType: '', [`price_${typeId}`]: '', [`qty_${typeId}`]: '' }));
  };

  const checkoutCustomer = useMemo(() => {
    if (customerId) return customers.find((c) => c.id === customerId) ?? null;
    const name = customerName.trim().toLowerCase();
    if (!name) return null;
    return customers.find((c) => c.name.toLowerCase() === name) ?? null;
  }, [customerId, customerName, customers]);

  const balanceMap = useMemo(
    () => buildOrderCustomerBalanceMap(customers, orders),
    [customers, orders],
  );

  const outstandingDebt = checkoutCustomer ? balanceMap[checkoutCustomer.id]?.creditRemaining ?? 0 : 0;
  const prepaidAvailable = checkoutCustomer ? Number(checkoutCustomer.creditBalance || 0) : 0;

  const checkoutPreview = useMemo(() => {
    if (!checkoutCustomer || totalAmount <= 0) return null;
    const cash = hasCustomerPaid === 'yes' ? cashPaid : '0';
    return previewOrderCheckout(
      checkoutCustomer,
      totalAmount,
      cash,
      undefined,
      orders,
      customers,
    );
  }, [checkoutCustomer, totalAmount, hasCustomerPaid, cashPaid, orders, customers]);

  useEffect(() => {
    if (!selectedCustomer || selectedTypes.length === 0) return;
    const saved = selectedCustomer.measurements || {};
    setMeasurements((prev) => {
      const next = { ...prev };
      selectedTypes.forEach((t) => {
        (t.measurements || []).forEach((m) => {
          const key = typeMeasurementKey(t.id, m);
          if (saved[m] !== undefined && saved[m] !== '' && !next[key]) {
            next[key] = String(saved[m]);
          }
        });
      });
      return next;
    });
  }, [customerId, selectedCustomer, selectedTypes]);

  const resolveCustomerName = () => {
    if (customerId) return customers.find((c) => c.id === customerId)?.name || '';
    return customerName;
  };

  const validate = () => {
    const e = {};
    if (!customerId && !customerName.trim()) e.customer = t('newOrder.customerRequired');
    if (selectedTypeIds.length === 0) e.orderType = t('newOrder.typeRequired');
    selectedTypeIds.forEach((id) => {
      const p = parseFloat(typePrices[id]);
      if (!p || p <= 0) e[`price_${id}`] = t('newOrder.priceRequired');
      const qRaw = typeQuantities[id];
      const q = parseInt(qRaw, 10);
      if (qRaw === '' || qRaw === undefined || Number.isNaN(q) || q < 1) {
        e[`qty_${id}`] = t('newOrder.qtyRequired');
      }
    });
    if (totalAmount <= 0 && selectedTypeIds.length > 0) e.orderType = t('newOrder.priceRequired');
    if (!solarDate.trim()) e.solarDate = t('newOrder.dateRequired');
    if (!deliveryDate.trim()) e.delivery = t('newOrder.deliveryRequired');
    else if (isSolarDateBefore(deliveryDate, getTodaySolar())) {
      e.delivery = t('newOrder.deliveryMinToday');
    }
    if (!hasCustomerPaid) e.hasPaid = t('newOrder.paidRequired');
    if (hasCustomerPaid === 'yes' && cashPaid !== '' && Number.isNaN(Number(cashPaid))) {
      e.cashPaid = t('newOrder.paidRequired');
    }
    if (hasCustomerPaid === 'yes') {
      const cash = Math.max(0, parseFloat(cashPaid) || 0);
      if (cash > totalAmount && !checkoutCustomer) {
        e.customer = t('newOrder.customerRequired');
      }
    }
    selectedTypes.forEach((type) => {
      (type.measurements || []).forEach((m) => {
        const key = typeMeasurementKey(type.id, m);
        if (!measurements[key]) e[`m_${key}`] = t('newOrder.fieldRequired', { field: m });
      });
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleConfirm = async () => {
    const emp = employees.find((e) => e.id === employeeId);
    let checkout = null;

    if (checkoutCustomer) {
      const cash = hasCustomerPaid === 'yes' ? cashPaid : '0';
      checkout = await executeOrderCheckout({
        customer: checkoutCustomer,
        orderTotal: totalAmount,
        cashPaid: cash,
        walletUsed: undefined,
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

    if (!checkoutCustomer && hasCustomerPaid === 'yes') {
      orderPaid = Math.min(totalAmount, Math.max(0, parseFloat(cashPaid) || 0));
      if (orderPaid >= totalAmount && totalAmount > 0) paymentStatus = 'Paid';
      else if (orderPaid > 0) paymentStatus = 'Partial';
    }

    const linkedCustomerId = customerId || checkoutCustomer?.id || '';

    const bookingCash =
      hasCustomerPaid === 'yes' ? Math.max(0, parseFloat(cashPaid) || 0) : 0;

    const lineItems = selectedTypeIds.map((id) => {
      const t = orderTypes.find((x) => x.id === id);
      const unitPrice = parseFloat(typePrices[id]) || 0;
      const quantity = Math.max(1, parseInt(typeQuantities[id], 10) || 1);
      return {
        orderTypeId: id,
        orderType: t?.name || '',
        price: unitPrice,
        quantity,
        lineTotal: unitPrice * quantity,
      };
    });
    const orderQuantity = lineItems.reduce((s, l) => s + l.quantity, 0);
    const orderTypeLabel = lineItems.map((l) => l.orderType).filter(Boolean).join(', ');

    await addOrder({
      customerId: linkedCustomerId,
      customerName: resolveCustomerName(),
      orderType: orderTypeLabel,
      orderTypeId: lineItems[0]?.orderTypeId || null,
      orderLineItems: lineItems,
      measurements: buildMeasurementsPayload(),
      color,
      pricePerOne: totalAmount,
      quantity: orderQuantity,
      customerFabricMeters,
      totalAmount: String(totalAmount),
      paidAmount: orderPaid,
      paymentStatus,
      bookingCashReceived: bookingCash,
      bookingAppliedToDebt: checkout?.cashAppliedToDebt ?? 0,
      bookingPrepaidAdded: checkout?.surplusToPrepaid ?? 0,
      employeeId: employeeId || null,
      employeeName: emp?.name || '',
      orderDateSolar: solarDate,
      deliveryDate: normalizeSolarDateString(deliveryDate) || deliveryDate.trim(),
      notes,
    });

    setConfirmOpen(false);
    setCustomerId('');
    setCustomerName('');
    setSelectedTypeIds([]);
    setTypePrices({});
    setTypeQuantities({});
    setMeasurements({});
    setTypeShapeSelection({});
    setColor('');
    setCustomerFabricMeters('');
    setEmployeeId('');
    setDeliveryDate('');
    setNotes('');
    setHasCustomerPaid('');
    setCashPaid('');
    let creditMsg = '';
    if (checkout?.cashAppliedToDebt > 0) {
      creditMsg += t('newOrder.creditAppliedDebt', { amount: checkout.cashAppliedToDebt.toLocaleString() });
    }
    if (checkout?.surplusToPrepaid > 0) {
      creditMsg += t('newOrder.creditPrepaid', { amount: checkout.surplusToPrepaid.toLocaleString() });
    }
    notify.success(
      t('newOrder.created'),
      t('newOrder.createdDesc', {
        label: orderTypeLabel || t('ledger.Order'),
        credit: creditMsg,
      }),
    );
  };

  const orderPaidDisplay = checkoutPreview?.orderPaidAmount ?? 0;
  const orderRemainingDisplay = checkoutPreview?.orderRemaining ?? totalAmount;

  const confirmRows = [
    { label: t('common.customer'), value: resolveCustomerName() },
    ...selectedTypes.flatMap((type) => {
      const qty = Math.max(1, parseInt(typeQuantities[type.id], 10) || 1);
      const unit = Number(typePrices[type.id] || 0);
      return [
        {
          label: type.name,
          value: `${qty} × ؋${unit.toLocaleString()} = ؋${lineTotalForType(type.id).toLocaleString()}`,
        },
      ];
    }),
    ...(customerFabricMeters.trim()
      ? [{ label: t('detail.fabricMeters'), value: customerFabricMeters }]
      : []),
    { label: t('common.deliveryDate'), value: deliveryDate },
    { label: t('detail.totalAmount'), value: `؋${totalAmount.toLocaleString()}`, highlight: true },
    ...(checkoutPreview?.walletUsed > 0
      ? [{ label: t('salesExtra.prepaidApplied'), value: `؋${checkoutPreview.walletUsed.toLocaleString()}` }]
      : []),
    ...(checkoutPreview?.walletUsed > 0 && checkoutPreview.orderRemaining >= 0
      ? [
          {
            label: t('salesExtra.dueAfter'),
            value: `؋${Math.max(0, totalAmount - (checkoutPreview.walletUsed || 0)).toLocaleString()}`,
          },
        ]
      : []),
    ...(checkoutPreview?.cashAppliedToDebt > 0
      ? [{ label: t('detail.cashToDebt'), value: `؋${checkoutPreview.cashAppliedToDebt.toLocaleString()}` }]
      : []),
    { label: t('detail.paidOnOrder'), value: `؋${orderPaidDisplay.toLocaleString()}` },
    {
      label: t('detail.remainingOrder'),
      value: `؋${orderRemainingDisplay.toLocaleString()}`,
      highlight: orderRemainingDisplay > 0,
    },
    ...(checkoutPreview?.surplusToPrepaid > 0
      ? [{ label: t('salesExtra.addedPrepaid'), value: `؋${checkoutPreview.surplusToPrepaid.toLocaleString()}` }]
      : []),
    { label: t('salesExtra.paymentStatus'), value: t(`status.${checkoutPreview?.paymentStatus || paymentStatusLabel()}`) },
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

  const selectClass =
    'w-full rounded-xl border-2 border-black/10 px-3 py-2 text-sm';

  return (
    <PageShell
      title={t('newOrder.title')}
      subtitle={t('newOrder.subtitle')}
      breadcrumbs={[{ label: t('common.home'), to: '/' }, { label: t('orders.title'), to: '/orders' }, { label: t('common.newOrder') }]}
    >
      <div className="mx-auto w-full max-w-[1440px]">
        <div className="grid items-start gap-5 xl:grid-cols-12">
          <div className="space-y-5 xl:col-span-7">
            <div className="form-panel p-4 lg:p-5">
              <SectionTitle title={t('newOrder.customer')} />
              <div className="grid gap-3 md:grid-cols-2">
                <select
                  value={customerId}
                  onChange={(e) => {
                    setCustomerId(e.target.value);
                    if (e.target.value) setCustomerName('');
                  }}
                  className={selectClass}
                >
                  <option value="">{t('newOrder.selectCustomer')}</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.tokenNumber})
                    </option>
                  ))}
                </select>
                <Input
                  placeholder={t('newOrder.newCustomer')}
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    if (e.target.value.trim()) setCustomerId('');
                  }}
                  error={errors.customer}
                />
              </div>

              {checkoutCustomer && (
                <div className="mt-3 grid gap-2 rounded-xl border border-black/5 bg-background px-3 py-2 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-ink-muted">{t('newOrder.debt')}</p>
                    <p className={`text-base font-bold ${outstandingDebt > 0 ? 'text-danger' : 'text-success'}`}>
                      ؋{outstandingDebt.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-muted">{t('newOrder.prepaid')}</p>
                    <p className="text-base font-bold text-success">؋{prepaidAvailable.toLocaleString()}</p>
                  </div>
                </div>
              )}

              <div className="mt-3">
                <Input
                  label={t('newOrder.fabricMeters')}
                  type="number"
                  value={customerFabricMeters}
                  onChange={(e) => setCustomerFabricMeters(e.target.value)}
                  placeholder={t('newOrder.fabricPlaceholder')}
                />
              </div>

              {selectedCustomer && Object.keys(savedMeasurements).length > 0 && (
                <div className="mt-3 rounded-xl border border-primary-soft/80 bg-background px-3 py-2">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    {t('newOrder.savedMeasurements')}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(savedMeasurements).map(([key, value]) => (
                      <span
                        key={key}
                        className="rounded-md bg-surface px-2 py-0.5 text-xs text-ink-secondary"
                      >
                        {key}: <strong className="text-ink">{value || '—'}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="form-panel p-4 lg:p-5">
              <SectionTitle title={t('newOrder.orderTypes')} subtitle={t('newOrder.orderTypesHint')} />
              {orderTypes.length === 0 ? (
                <div className="rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-800">
                  {t('newOrder.noTypes')}
                </div>
              ) : (
                <div className="space-y-2">
                  {orderTypes.map((type) => {
                    const checked = selectedTypeIds.includes(type.id);
                    const typeFields = type.measurements || [];
                    const shapeFields = type.shapes || [];
                    return (
                      <div
                        key={type.id}
                        className={`rounded-xl border px-3 py-3 ${
                          checked ? 'border-accent/40 bg-primary-soft/30' : 'border-black/10 bg-surface'
                        }`}
                      >
                        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-ink">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleOrderType(type.id)}
                          />
                          {type.name}
                        </label>
                        {checked && (
                          <div className="mt-3 space-y-3 border-t border-black/5 pt-3">
                            <div className="grid max-w-md gap-3 sm:grid-cols-2">
                              <Input
                                label={t('newOrder.pricePerItem')}
                                type="number"
                                value={typePrices[type.id] ?? ''}
                                onChange={(e) => {
                                  setTypePrices((p) => ({ ...p, [type.id]: e.target.value }));
                                  setErrors((err) => ({ ...err, [`price_${type.id}`]: '' }));
                                }}
                                error={errors[`price_${type.id}`]}
                              />
                              <Input
                                label={t('newOrder.quantity')}
                                type="number"
                                min={1}
                                value={typeQuantities[type.id] ?? '1'}
                                onChange={(e) => {
                                  setTypeQuantities((q) => ({ ...q, [type.id]: e.target.value }));
                                  setErrors((err) => ({ ...err, [`qty_${type.id}`]: '' }));
                                }}
                                error={errors[`qty_${type.id}`]}
                              />
                            </div>
                            {typeFields.length > 0 && (
                              <div>
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                                  {t('newOrder.measurementsFor', { name: type.name })}
                                </p>
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                  {typeFields.map((m) => {
                                    const mKey = typeMeasurementKey(type.id, m);
                                    return (
                                      <Input
                                        key={mKey}
                                        label={`${m} *`}
                                        value={measurements[mKey] || ''}
                                        onChange={(e) =>
                                          setMeasurements((prev) => ({
                                            ...prev,
                                            [mKey]: e.target.value,
                                          }))
                                        }
                                        error={errors[`m_${mKey}`]}
                                      />
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            {shapeFields.length > 0 && (
                              <div>
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                                  {t('newOrder.shaklFor', { name: type.name })}
                                </p>
                                <div className="flex flex-wrap gap-3">
                                  {shapeFields.map((shape) => {
                                    const checked = (typeShapeSelection[type.id] || []).includes(shape);
                                    return (
                                      <label
                                        key={`${type.id}-shape-${shape}`}
                                        className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                                          checked
                                            ? 'border-accent bg-primary-soft/40 font-semibold text-ink'
                                            : 'border-black/10 bg-surface text-ink-secondary'
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          onChange={() => toggleShapeOption(type.id, shape)}
                                          className="h-4 w-4 rounded border-black/20 text-accent"
                                        />
                                        {shape}
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {errors.orderType && <p className="mt-1 text-xs text-danger">{errors.orderType}</p>}

              {selectedTypeIds.length > 0 && (
                <div className="mt-4 max-w-xs">
                  <Input label={t('common.color')} value={color} onChange={(e) => setColor(e.target.value)} />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-5 xl:col-span-5">
            <div className="form-panel p-4 lg:p-5 xl:sticky xl:top-4">
              <SectionTitle title={t('newOrder.totalPayment')} />
              {selectedTypes.length > 0 && (
                <ul className="mb-2 space-y-1 text-sm text-ink-secondary">
                  {selectedTypes.map((type) => {
                    const qty = Math.max(1, parseInt(typeQuantities[type.id], 10) || 1);
                    const unit = Number(typePrices[type.id] || 0);
                    return (
                      <li key={type.id} className="flex justify-between gap-2">
                        <span>
                          {type.name}{' '}
                          <span className="text-ink-muted">
                            ({qty} × ؋{unit.toLocaleString()})
                          </span>
                        </span>
                        <span className="font-semibold text-ink">
                          ؋{lineTotalForType(type.id).toLocaleString()}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="my-3 rounded-xl bg-emerald-50 px-4 py-2">
                <p className="text-xs text-ink-muted">{t('newOrder.totalAmount')}</p>
                <p className="text-xl font-extrabold text-success">؋{totalAmount.toLocaleString()}</p>
              </div>

              <p className="mb-2 text-xs text-ink-muted">
                {t('newOrder.paymentHint')}
              </p>
              {checkoutCustomer && prepaidAvailable > 0 && totalAmount > 0 && (
                <p className="mb-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-900">
                  {t('newOrder.creditWillUse', {
                    amount: Math.min(prepaidAvailable, totalAmount).toLocaleString(),
                    balance: prepaidAvailable.toLocaleString(),
                  })}
                </p>
              )}
              <div className="mb-2">
                <p className="mb-1 text-sm font-medium text-ink">{t('newOrder.hasPaid')}</p>
                <div className="flex gap-4">
                  {[
                    ['yes', t('common.yes')],
                    ['no', t('common.no')],
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

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                {hasCustomerPaid === 'yes' && (
                  <Input
                    label={t('newOrder.paymentAmount')}
                    type="number"
                    value={cashPaid}
                    onChange={(e) => setCashPaid(e.target.value)}
                    error={errors.cashPaid}
                    placeholder={t('newOrder.amountNow')}
                  />
                )}
              </div>

              {checkoutPreview && totalAmount > 0 && (
                <div className="mt-3 rounded-xl border border-black/5 bg-background px-3 py-2 text-xs leading-relaxed">
                  {checkoutPreview.walletUsed > 0 && (
                    <p>
                      {t('salesExtra.prepaidApplied')}: <strong>؋{checkoutPreview.walletUsed.toLocaleString()}</strong>
                    </p>
                  )}
                  <p>
                    {t('detail.paidOnOrder')}: <strong>؋{orderPaidDisplay.toLocaleString()}</strong>
                  </p>
                  <p>
                    {t('common.remaining')}:{' '}
                    <strong className={orderRemainingDisplay > 0 ? 'text-danger' : 'text-success'}>
                      ؋{orderRemainingDisplay.toLocaleString()}
                    </strong>
                  </p>
                  {checkoutPreview.cashAppliedToDebt > 0 && (
                    <p className="mt-1 text-success">
                      {t('newOrder.extraDebt', { amount: checkoutPreview.cashAppliedToDebt.toLocaleString() })}
                    </p>
                  )}
                  {checkoutPreview.surplusToPrepaid > 0 && (
                    <p className="text-success">
                      {t('newOrder.extraCredit', { amount: checkoutPreview.surplusToPrepaid.toLocaleString() })}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                {employees.length > 0 && (
                  <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className={selectClass}>
                    <option value="">{t('newOrder.employee')}</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                )}
                <SolarDatePicker
                  label={t('newOrder.orderDate')}
                  value={solarDate}
                  onChange={setSolarDate}
                  error={errors.solarDate}
                  allowEmpty={false}
                />
                <SolarDatePicker
                  label={t('newOrder.delivery')}
                  value={deliveryDate}
                  onChange={setDeliveryDate}
                  placeholder={getTodaySolar()}
                  minDate={getTodaySolar()}
                  error={errors.delivery}
                  allowEmpty
                />
                <Input label={t('common.notes')} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-blue-50 px-3 py-2 text-sm text-blue-800">
                <span>{t('newOrder.tokenPreview', { token: `ORD-${String(orders.length + 1).padStart(4, '0')}` })}</span>
                <Button className="shrink-0" onClick={() => validate() && setConfirmOpen(true)}>
                  {t('newOrder.review')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title={t('newOrder.confirmTitle')}
        subtitle={t('newOrder.confirmSubtitle')}
        rows={confirmRows}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
      />
    </PageShell>
  );
}
