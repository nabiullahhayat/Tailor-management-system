import { useEffect, useState } from 'react';
import Modal from '../ui/Modal.jsx';
import Input from '../ui/Input.jsx';
import Button from '../ui/Button.jsx';
import { notify } from '../../utils/toast.js';

export default function EditOrderModal({ open, order, onClose, onSave }) {
  const [deliveryDate, setDeliveryDate] = useState('');
  const [pricePerOne, setPricePerOne] = useState('');
  const [quantity, setQuantity] = useState('');
  const [color, setColor] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!order) return;
    setDeliveryDate(order.deliveryDate?.split('T')[0] || order.deliveryDate || '');
    setPricePerOne(String(order.pricePerOne ?? ''));
    setQuantity(String(order.quantity ?? '1'));
    setColor(order.color || '');
    setNotes(order.notes || '');
  }, [order, open]);

  if (!order) return null;

  const totalAmount =
    (parseFloat(pricePerOne) || 0) * (parseFloat(quantity) || 0);

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
        deliveryDate,
        pricePerOne: parseFloat(pricePerOne),
        quantity: parseFloat(quantity),
        totalAmount,
        color,
        notes,
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
    <Modal open={open} onClose={onClose} title="Edit Order" subtitle={order.tokenNumber} size="md">
      <div className="space-y-3">
        <p className="text-sm text-ink-muted">
          Customer: <span className="font-semibold text-ink">{order.customerName}</span>
        </p>
        <Input label="Delivery Date *" type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
        <Input label="Color" value={color} onChange={(e) => setColor(e.target.value)} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Price per One (₹)" type="number" value={pricePerOne} onChange={(e) => setPricePerOne(e.target.value)} />
          <Input label="Quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </div>
        <div className="rounded-xl bg-emerald-50 px-4 py-2 text-sm">
          Total: <strong>₹{totalAmount.toLocaleString()}</strong>
          {totalAmount !== Number(order.totalAmount || 0) && (
            <span className="ml-2 text-xs text-ink-muted">(was ₹{Number(order.totalAmount || 0).toLocaleString()})</span>
          )}
        </div>
        <Input label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            Save changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}
