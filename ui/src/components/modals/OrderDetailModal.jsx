import { useEffect, useState } from 'react';
import Modal from '../ui/Modal.jsx';
import StatusBadge from '../ui/StatusBadge.jsx';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import { notify } from '../../utils/toast.js';

export default function OrderDetailModal({
  open,
  order,
  customerBalance,
  onClose,
  onStatusChange,
  onRecordPayment,
}) {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentReceived, setPaymentReceived] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [localStatus, setLocalStatus] = useState(order?.status);

  useEffect(() => {
    setLocalStatus(order?.status);
    setPaymentAmount('');
    setPaymentReceived(true);
  }, [order?.id, order?.status, open]);

  if (!order) return null;

  const displayOrder = { ...order, status: localStatus ?? order.status };
  const total = Number(displayOrder.totalAmount || 0);
  const paid = Number(displayOrder.paidAmount || 0);
  const orderRemaining = Math.max(0, total - paid);

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
    const amount = parseFloat(paymentAmount) || 0;
    if (paymentReceived && (!amount || amount <= 0)) {
      notify.warning('Invalid amount', 'Enter a valid payment amount or uncheck Payment Received.');
      return;
    }
    try {
      const updated = await onRecordPayment(displayOrder.id, {
        paymentAmount: amount,
        paymentReceived,
        markDelivered: false,
      });
      if (updated?.status) setLocalStatus(updated.status);
      setPaymentAmount('');
      setPaymentReceived(true);
      if (paymentReceived && amount > 0) {
        notify.success('Payment recorded', `₹${amount.toLocaleString()} applied to customer balance`);
      } else if (!paymentReceived) {
        notify.info('Not recorded as payment', 'Remaining stays as debt on this order.');
      }
    } catch (err) {
      notify.error('Payment failed', err.message || 'Could not record payment.');
    }
  };

  const showPaymentBlock = displayOrder.status === 'Delivered';

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
            ['Total Amount', `₹${total.toLocaleString()}`],
            ['Paid on this order', `₹${paid.toLocaleString()}`],
            ['Remaining on this order', `₹${orderRemaining.toLocaleString()}`],
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

        {customerBalance && (
          <div className="grid gap-2 rounded-xl border border-black/5 bg-background px-4 py-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-ink-muted">Customer total remaining (debt)</p>
              <p className={`font-bold ${customerBalance.debt > 0 ? 'text-danger' : 'text-success'}`}>
                ₹{Number(customerBalance.debt || 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">Customer prepaid credit</p>
              <p className="font-bold text-success">₹{Number(customerBalance.credit || 0).toLocaleString()}</p>
            </div>
          </div>
        )}

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

        {showPaymentBlock && (
          <div className="rounded-2xl border border-black/5 bg-background p-4">
            <p className="mb-3 text-sm font-bold text-ink">Recorded Payment</p>
            <Input
              label="Amount (₹)"
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
            />
            <label className="mb-4 flex items-center gap-2 text-sm text-ink-secondary">
              <input
                type="checkbox"
                checked={paymentReceived}
                onChange={(e) => setPaymentReceived(e.target.checked)}
              />
              Payment received (uncheck to leave as debt / remaining)
            </label>
            <Button type="button" onClick={handlePayment}>
              {paymentReceived ? 'Record Payment' : 'Save without payment'}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
