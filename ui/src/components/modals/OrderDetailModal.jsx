import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import StatusBadge from '../ui/StatusBadge.jsx';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import OrderInvoiceModal from './OrderInvoiceModal.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { notify } from '../../utils/toast.js';
import { getLineItemAmount, parseOrderLineItems } from '../../utils/orderDisplay.js';

export default function OrderDetailModal({
  open,
  order,
  customerBalance,
  customerPhone,
  onClose,
  onStatusChange,
  onRecordPayment,
  onPaymentComplete,
}) {
  const { appName } = useSettings();
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentReceived, setPaymentReceived] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [localStatus, setLocalStatus] = useState(order?.status);
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  const displayOrder = order ? { ...order, status: localStatus ?? order.status } : null;
  const total = Number(displayOrder?.totalAmount || 0);
  const paid = Number(displayOrder?.paidAmount || 0);
  const orderRemaining = Math.max(0, total - paid);
  const bookingCash = Number(displayOrder?.bookingCashReceived || 0);
  const bookingToDebt = Number(displayOrder?.bookingAppliedToDebt || 0);
  const bookingToPrepaid = Number(displayOrder?.bookingPrepaidAdded || 0);
  const isDelivered = displayOrder?.status === 'Delivered';

  useEffect(() => {
    setLocalStatus(order?.status);
    setPaymentReceived(true);
    setInvoiceOpen(false);
  }, [order?.id, order?.status, open]);

  useEffect(() => {
    if (!open || !isDelivered) {
      setPaymentAmount('');
      return;
    }
    if (orderRemaining > 0) {
      setPaymentAmount(String(orderRemaining));
    } else {
      setPaymentAmount('');
    }
  }, [open, isDelivered, orderRemaining, order?.id]);

  if (!order || !displayOrder) return null;

  const lineItems = parseOrderLineItems(displayOrder);
  const fabricMeters = displayOrder.customerFabricMeters;

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

  const finishPaymentFlow = () => {
    onPaymentComplete?.();
    onClose?.();
  };

  const handleStatusClick = async (status) => {
    if (displayOrder.status === status || statusUpdating) return;
    setStatusUpdating(true);
    try {
      const updated = await onStatusChange(displayOrder.id, status);
      const nextStatus = updated?.status ?? status;
      setLocalStatus(nextStatus);
      if (nextStatus === 'Delivered') {
        const rem = Math.max(
          0,
          Number(updated?.totalAmount ?? displayOrder.totalAmount ?? 0) -
            Number(updated?.paidAmount ?? displayOrder.paidAmount ?? 0),
        );
        if (rem <= 0 && paid > 0) {
          notify.success('Status updated', 'Delivered — order was already paid when created.');
        } else {
          notify.success('Status updated', `Order is now ${nextStatus}`);
        }
      } else {
        notify.success('Status updated', `Order is now ${nextStatus}`);
      }
    } catch (err) {
      notify.error('Status update failed', err.message || 'Could not update order status.');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handlePayment = async () => {
    const amount = parseFloat(paymentAmount) || 0;

    if (paymentReceived) {
      if (orderRemaining <= 0) {
        notify.success('Payment complete', 'This order was already paid in full (including at booking).');
        finishPaymentFlow();
        return;
      }
      if (!amount || amount <= 0) {
        notify.warning('Invalid amount', 'Enter the payment received or uncheck Payment Received.');
        return;
      }
    }

    try {
      await onRecordPayment(displayOrder.id, {
        paymentAmount: paymentReceived ? amount : 0,
        paymentReceived,
        markDelivered: false,
      });
      if (paymentReceived && amount > 0) {
        notify.success('Payment recorded', `₹${amount.toLocaleString()} applied to customer balance`);
      } else if (!paymentReceived) {
        notify.info('Saved without payment', 'Remaining amount stays as debt on this order.');
      }
      finishPaymentFlow();
    } catch (err) {
      notify.error('Payment failed', err.message || 'Could not record payment.');
    }
  };

  return (
    <>
      <Modal open={open} onClose={onClose} title={displayOrder.tokenNumber} subtitle={displayOrder.customerName} size="lg">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={displayOrder.status} />
            <StatusBadge status={displayOrder.paymentStatus || 'Pending'} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['Order Type(s)', displayOrder.orderType],
              ['Employee', displayOrder.employeeName || '—'],
              ...(fabricMeters !== undefined && fabricMeters !== '' && fabricMeters != null
                ? [['Customer fabric (m)', String(fabricMeters)]]
                : []),
              ['Total Amount', `₹${total.toLocaleString()}`],
              ...(bookingCash > 0
                ? [['Cash received (booking)', `₹${bookingCash.toLocaleString()}`]]
                : []),
              ['Paid on this order', `₹${paid.toLocaleString()}`],
              ...(bookingToDebt > 0
                ? [['From booking → old remaining', `₹${bookingToDebt.toLocaleString()}`]]
                : []),
              ...(bookingToPrepaid > 0
                ? [['From booking → prepaid credit', `₹${bookingToPrepaid.toLocaleString()}`]]
                : []),
              ['Remaining on this order', `₹${orderRemaining.toLocaleString()}`],
              ['Delivery Date', displayOrder.deliveryDate || '—'],
              ['Color', displayOrder.color || '—'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-background px-3 py-2">
                <p className="text-xs text-ink-muted">{label}</p>
                <p className="text-sm font-semibold text-ink">{value}</p>
              </div>
            ))}
          </div>

          {lineItems.length > 0 && (
            <div className="rounded-xl border border-black/5 bg-background px-4 py-3">
              <p className="mb-2 text-sm font-semibold text-ink">Types & prices</p>
              <div className="space-y-1 text-sm">
                {lineItems.map((line, i) => {
                  const qty = Number(line.quantity ?? 1) || 1;
                  const unit = Number(line.price || 0);
                  return (
                    <div key={line.orderTypeId || i} className="flex justify-between gap-2">
                      <span className="text-ink-muted">
                        {line.orderType}
                        {qty > 1 || unit > 0 ? (
                          <span className="text-xs"> ({qty} × ₹{unit.toLocaleString()})</span>
                        ) : null}
                      </span>
                      <span className="font-semibold text-ink">
                        ₹{getLineItemAmount(line).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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

          {isDelivered && (
            <>
              <div className="rounded-2xl border border-black/5 bg-background p-4">
                <p className="mb-3 text-sm font-bold text-ink">Recorded Payment</p>
                {orderRemaining <= 0 && paid > 0 ? (
                  <p className="mb-3 text-sm text-success">
                    Paid in full when the order was created
                    {bookingCash > paid
                      ? ` (₹${bookingCash.toLocaleString()} received; ₹${paid.toLocaleString()} on this order`
                      : ''}
                    {bookingToDebt > 0 ? `; ₹${bookingToDebt.toLocaleString()} to old remaining` : ''}
                    {bookingToPrepaid > 0 ? `; ₹${bookingToPrepaid.toLocaleString()} to prepaid credit` : ''}
                    {bookingCash > paid || bookingToDebt > 0 || bookingToPrepaid > 0 ? ').' : '.'}{' '}
                    Use Record Payment to confirm delivery collection, or Generate Invoice below.
                  </p>
                ) : null}
                <Input
                  label="Amount (₹)"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  disabled={orderRemaining <= 0 && paid > 0}
                />
                <label className="mb-4 flex items-center gap-2 text-sm text-ink-secondary">
                  <input
                    type="checkbox"
                    checked={paymentReceived}
                    onChange={(e) => setPaymentReceived(e.target.checked)}
                  />
                  Payment received (uncheck to save without payment / keep as debt)
                </label>
                <Button type="button" onClick={handlePayment}>
                  {paymentReceived
                    ? orderRemaining <= 0 && paid > 0
                      ? 'Confirm & close'
                      : 'Record Payment'
                    : 'Save without payment'}
                </Button>
              </div>

              <Button type="button" variant="outline" onClick={() => setInvoiceOpen(true)}>
                <FileText size={16} /> Generate Invoice
              </Button>
            </>
          )}
        </div>
      </Modal>

      <OrderInvoiceModal
        open={invoiceOpen}
        order={displayOrder}
        shopName={appName || 'Khayati'}
        customerPhone={customerPhone}
        onClose={() => setInvoiceOpen(false)}
      />
    </>
  );
}
