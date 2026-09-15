import { useEffect, useState } from 'react';
import Modal from '../ui/Modal.jsx';
import StatusBadge from '../ui/StatusBadge.jsx';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import { notify } from '../../utils/toast.js';

export default function OrderDetailModal({
  open,
  order,
  onClose,
  onStatusChange,
  onRecordPayment,
}) {
  const [paidAmount, setPaidAmount] = useState('');
  const [markDelivered, setMarkDelivered] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [localStatus, setLocalStatus] = useState(order?.status);

  useEffect(() => {
    setLocalStatus(order?.status);
    setPaidAmount('');
    setMarkDelivered(false);
  }, [order?.id, order?.status, open]);

  if (!order) return null;

  const displayOrder = { ...order, status: localStatus ?? order.status };

  const measurements =
    typeof displayOrder.measurements === 'string'
      ? (() => {
          try {
            return JSON.parse(displayOrder.measurements);
          } catch {
            return {};
          }
        })()
      : displayOrder.measurements || {};

  const handleStatusClick = async (status) => {
    if (displayOrder.status === status || statusUpdating) return;
    setStatusUpdating(true);
    try {
      const updated = await onStatusChange(displayOrder.id, status);
      const nextStatus = updated?.status ?? status;
      setLocalStatus(nextStatus);
      notify.success('Status updated', `Order is now ${nextStatus}`);
    } catch (err) {
      notify.error('Status update failed', err.message || 'Could not update order status.');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handlePayment = async () => {
    const amount = parseFloat(paidAmount);
    if (!amount || amount <= 0) {
      notify.warning('Invalid amount', 'Enter a valid payment amount.');
      return;
    }
    try {
      const updated = await onRecordPayment(displayOrder.id, {
        paidAmount: amount,
        markDelivered,
      });
      if (updated?.status) setLocalStatus(updated.status);
      setPaidAmount('');
      setMarkDelivered(false);
    } catch (err) {
      notify.error('Payment failed', err.message || 'Could not record payment.');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={displayOrder.tokenNumber} subtitle={displayOrder.customerName} size="lg">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={displayOrder.status} />
          <StatusBadge status={displayOrder.paymentStatus || 'Pending'} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ['Order Type', displayOrder.orderType],
            ['Total Amount', `₹${Number(displayOrder.totalAmount || 0).toLocaleString()}`],
            ['Paid Amount', `₹${Number(displayOrder.paidAmount || 0).toLocaleString()}`],
            ['Delivery Date', displayOrder.deliveryDate || '—'],
            ['Employee', displayOrder.employeeName || '—'],
            ['Color', displayOrder.color || '—'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-background px-3 py-2">
              <p className="text-xs text-ink-muted">{label}</p>
              <p className="text-sm font-semibold text-ink">{value}</p>
            </div>
          ))}
        </div>

        {Object.keys(measurements).length > 0 && (
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">Measurements</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Object.entries(measurements).map(([key, value]) => (
                <div key={key} className="rounded-lg bg-background px-3 py-2 text-sm">
                  <span className="text-ink-muted">{key}: </span>
                  <span className="font-semibold">{value || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {['Finding', 'Ready', 'Delivered'].map((status) => (
            <Button
              key={status}
              type="button"
              disabled={statusUpdating}
              variant={displayOrder.status === status ? 'primary' : 'outline'}
              onClick={() => handleStatusClick(status)}
            >
              Mark {status}
            </Button>
          ))}
        </div>

        <div className="rounded-2xl border border-black/5 bg-background p-4">
          <p className="mb-3 text-sm font-bold text-ink">Record Payment</p>
          <Input
            label="Paid Amount (₹)"
            type="number"
            value={paidAmount}
            onChange={(e) => setPaidAmount(e.target.value)}
          />
          <label className="mb-4 flex items-center gap-2 text-sm text-ink-secondary">
            <input
              type="checkbox"
              checked={markDelivered}
              onChange={(e) => setMarkDelivered(e.target.checked)}
            />
            Mark as delivered when payment is recorded
          </label>
          <Button type="button" onClick={handlePayment}>Record Payment</Button>
        </div>
      </div>
    </Modal>
  );
}
