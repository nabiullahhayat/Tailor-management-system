import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
              [t('detail.orderTypes'), displayOrder.orderType],
              [t('common.employee'), displayOrder.employeeName || '—'],
              ...(fabricMeters !== undefined && fabricMeters !== '' && fabricMeters != null
                ? [[t('detail.fabricMeters'), String(fabricMeters)]]
                : []),
              [t('detail.totalAmount'), `₹${total.toLocaleString()}`],
              ...(bookingCash > 0
                ? [[t('detail.cashBooking'), `₹${bookingCash.toLocaleString()}`]]
                : []),
              [t('detail.paidOnOrder'), `₹${paid.toLocaleString()}`],
              ...(bookingToDebt > 0
                ? [[t('detail.fromDebt'), `₹${bookingToDebt.toLocaleString()}`]]
                : []),
              ...(bookingToPrepaid > 0
                ? [[t('detail.fromPrepaid'), `₹${bookingToPrepaid.toLocaleString()}`]]
                : []),
              [t('detail.remainingOrder'), `₹${orderRemaining.toLocaleString()}`],
              [t('common.deliveryDate'), displayOrder.deliveryDate || '—'],
              [t('common.color'), displayOrder.color || '—'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-background px-3 py-2">
                <p className="text-xs text-ink-muted">{label}</p>
                <p className="text-sm font-semibold text-ink">{value}</p>
              </div>
            ))}
          </div>

          {lineItems.length > 0 && (
            <div className="rounded-xl border border-black/5 bg-background px-4 py-3">
              <p className="mb-2 text-sm font-semibold text-ink">{t('modals.typesPrices')}</p>
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
                <p className="text-xs text-ink-muted">{t('detail.customerDebt')}</p>
                <p className={`font-bold ${customerBalance.debt > 0 ? 'text-danger' : 'text-success'}`}>
                  ₹{Number(customerBalance.debt || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-ink-muted">{t('detail.customerPrepaid')}</p>
                <p className="font-bold text-success">₹{Number(customerBalance.credit || 0).toLocaleString()}</p>
              </div>
            </div>
          )}

          {Object.keys(measurements).length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-ink">{t('modals.measurements')}</p>
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
                {t('detail.mark', { status: t(`status.${status}`) })}
              </Button>
            ))}
          </div>

          {isDelivered && (
            <>
              <div className="rounded-2xl border border-black/5 bg-background p-4">
                <p className="mb-3 text-sm font-bold text-ink">{t('modals.recordedPayment')}</p>
                {orderRemaining <= 0 && paid > 0 ? (
                  <p className="mb-3 text-sm text-success">
                    {t('detail.paidInFull')}{' '}
                    {t('detail.useRecord')}
                  </p>
                ) : null}
                <Input
                  label={t('modals.amount')}
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
                  {t('detail.paymentReceived')}
                </label>
                <Button type="button" onClick={handlePayment}>
                  {paymentReceived
                    ? orderRemaining <= 0 && paid > 0
                      ? t('detail.confirmClose')
                      : t('detail.recordPayment')
                    : t('detail.saveWithout')}
                </Button>
              </div>

              <Button type="button" variant="outline" onClick={() => setInvoiceOpen(true)}>
                <FileText size={16} /> {t('detail.generateInvoice')}
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
