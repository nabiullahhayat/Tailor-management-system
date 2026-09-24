import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../ui/Modal.jsx';
import Input from '../ui/Input.jsx';
import Button from '../ui/Button.jsx';
import { notify } from '../../utils/toast.js';
import { getLineItemAmount, parseOrderLineItems } from '../../utils/orderDisplay.js';
import { getTodaySolar, normalizeSolarDateString } from '../../utils/solarDate.js';

export default function EditOrderModal({ open, order, onClose, onSave }) {
  const { t } = useTranslation();
  const [deliveryDate, setDeliveryDate] = useState('');
  const [pricePerOne, setPricePerOne] = useState('');
  const [quantity, setQuantity] = useState('');
  const [color, setColor] = useState('');
  const [notes, setNotes] = useState('');
  const [customerFabricMeters, setCustomerFabricMeters] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!order) return;
    setDeliveryDate(order.deliveryDate?.split('T')[0] || order.deliveryDate || '');
    setPricePerOne(String(order.pricePerOne ?? ''));
    setQuantity(String(order.quantity ?? '1'));
    setColor(order.color || '');
    setNotes(order.notes || '');
    setCustomerFabricMeters(String(order.customerFabricMeters ?? ''));
  }, [order, open]);

  if (!order) return null;

  const lineItems = parseOrderLineItems(order);
  const totalAmount =
    lineItems.length > 0
      ? lineItems.reduce((s, l) => s + getLineItemAmount(l), 0)
      : (parseFloat(pricePerOne) || 0) * (parseFloat(quantity) || 0);

  const handleSave = async () => {
    if (!deliveryDate.trim()) {
      notify.warning('Delivery date required', 'Enter a delivery date.');
      return;
    }
    if (!pricePerOne || Number(pricePerOne) <= 0) {
      notify.warning('Invalid price', 'Enter a valid price per item.');
      return;
    }
    if (!quantity || Number(quantity) <= 0) {
      notify.warning('Invalid quantity', 'Enter a valid quantity.');
      return;
    }
    setSaving(true);
    try {
      await onSave(order.id, {
        deliveryDate: normalizeSolarDateString(deliveryDate) || deliveryDate.trim(),
        pricePerOne: parseFloat(pricePerOne),
        quantity: parseFloat(quantity),
        totalAmount,
        color,
        notes,
        customerFabricMeters,
      });
      notify.success('Order updated', order.tokenNumber);
      onClose();
    } catch (err) {
      notify.error('Update failed', err.message || 'Could not update order.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t('modals.editOrder')} subtitle={order.tokenNumber} size="md">
      <div className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl bg-background px-3 py-2 text-sm">
            <p className="text-xs text-ink-muted">{t('common.customer')}</p>
            <p className="font-semibold text-ink">{order.customerName}</p>
          </div>
          <div className="rounded-xl bg-background px-3 py-2 text-sm">
            <p className="text-xs text-ink-muted">{t('common.employee')}</p>
            <p className="font-semibold text-ink">{order.employeeName || '—'}</p>
          </div>
        </div>
        {lineItems.length > 0 && (
          <div className="rounded-xl bg-background px-3 py-2 text-sm">
            <p className="mb-1 text-xs font-semibold text-ink-muted">{t('modals.orderTypes')}</p>
            <ul className="space-y-1">
              {lineItems.map((line, i) => {
                const qty = Number(line.quantity ?? 1) || 1;
                const unit = Number(line.price || 0);
                return (
                  <li key={line.orderTypeId || i} className="flex justify-between gap-2">
                    <span>
                      {line.orderType}
                      {qty > 1 ? ` (${qty} × ₹${unit.toLocaleString()})` : ''}
                    </span>
                    <span className="font-semibold">₹{getLineItemAmount(line).toLocaleString()}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        <Input
          label={t('newOrder.fabricMeters')}
          type="number"
          value={customerFabricMeters}
          onChange={(e) => setCustomerFabricMeters(e.target.value)}
        />
        <Input
          label={t('newOrder.delivery')}
          value={deliveryDate}
          onChange={(e) => setDeliveryDate(e.target.value)}
          placeholder={getTodaySolar()}
        />
        <Input label={t('common.color')} value={color} onChange={(e) => setColor(e.target.value)} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label={t('modals.pricePerOne')} type="number" value={pricePerOne} onChange={(e) => setPricePerOne(e.target.value)} />
          <Input label={t('common.quantity')} type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </div>
        <div className="rounded-xl bg-emerald-50 px-4 py-2 text-sm">
          {t('modals.totalPrefix')}: <strong>₹{totalAmount.toLocaleString()}</strong>
          {totalAmount !== Number(order.totalAmount || 0) && (
            <span className="ml-2 text-xs text-ink-muted">{t('modals.was', { amount: Number(order.totalAmount || 0).toLocaleString() })}</span>
          )}
        </div>
        <Input label={t('common.notes')} value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {t('modals.saveChanges')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
