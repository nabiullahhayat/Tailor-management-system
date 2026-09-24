import { useTranslation } from 'react-i18next';
import { Printer } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';

function formatMoney(n) {
  return `₹${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function line(char = '-', width = 32) {
  return char.repeat(width);
}

export default function OrderInvoiceModal({
  open,
  order,
  shopName = 'Khayati',
  customerPhone,
  onClose,
}) {
  const { t } = useTranslation();
  if (!order) return null;

  const total = Number(order.totalAmount || 0);
  const paid = Number(order.paidAmount || 0);
  const remaining = Math.max(0, total - paid);
  const qty = order.quantity ?? 1;
  const unit = Number(order.pricePerOne || 0);

  let measurements = order.measurements || {};
  if (typeof measurements === 'string') {
    try {
      measurements = JSON.parse(measurements);
    } catch {
      measurements = {};
    }
  }

  const dateStr = order.orderDate
    ? new Date(order.orderDate).toLocaleString()
    : order.orderDateSolar || new Date().toLocaleString();

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal open={open} onClose={onClose} title={t('modals.orderInvoice')} subtitle={order.tokenNumber} size="md">
      <div id="order-invoice-print" className="order-invoice-root mx-auto max-w-[80mm] font-mono text-[13px] leading-snug text-black">
        <div className="text-center">
          <p className="text-base font-bold uppercase">{shopName}</p>
          <p className="text-xs">{t('modals.tailoringInvoice')}</p>
          <p className="text-xs">{line('=')}</p>
        </div>

        <p className="mt-2">{t('detail.order')}: {order.tokenNumber}</p>
        <p>{t('detail.inv')}: {order.invoiceNumber || '—'}</p>
        <p>{t('common.date')}: {dateStr}</p>
        <p className="text-xs">{line('-')}</p>

        <p>{t('common.customer')}: {order.customerName}</p>
        {customerPhone ? <p>{t('common.phone')}: {customerPhone}</p> : null}
        <p>{t('common.type')}: {order.orderType}</p>
        {order.color ? <p>{t('common.color')}: {order.color}</p> : null}
        {order.deliveryDate ? <p>{t('common.deliveryDate')}: {String(order.deliveryDate).split('T')[0]}</p> : null}
        <p className="text-xs">{line('-')}</p>

        <p className="font-bold">{t('modals.item')}</p>
        <p>
          {order.orderType} x{qty} @ {formatMoney(unit)}
        </p>
        <p className="text-right font-bold">{t('common.total')}: {formatMoney(total)}</p>

        {Object.keys(measurements).length > 0 && (
          <>
            <p className="mt-2 text-xs">{line('-')}</p>
            <p className="font-bold">{t('modals.measurements')}</p>
            {Object.entries(measurements).map(([k, v]) => (
              <p key={k}>
                {k}: {v}
              </p>
            ))}
          </>
        )}

        <p className="mt-2 text-xs">{line('-')}</p>
        {Number(order.bookingCashReceived || 0) > 0 ? (
          <p>{t('detail.cashReceived')}: {formatMoney(order.bookingCashReceived)}</p>
        ) : null}
        <p>{t('detail.paidOnOrderShort')}: {formatMoney(paid)}</p>
        {Number(order.bookingAppliedToDebt || 0) > 0 ? (
          <p>{t('detail.toOld')}: {formatMoney(order.bookingAppliedToDebt)}</p>
        ) : null}
        <p>{t('common.remaining')}: {formatMoney(remaining)}</p>
        <p>{t('common.status')}: {t(`status.${order.paymentStatus || 'Pending'}`)}</p>

        {order.notes ? (
          <>
            <p className="text-xs">{line('-')}</p>
            <p>{t('common.notes')}: {order.notes}</p>
          </>
        ) : null}

        <p className="mt-3 text-center text-xs">{line('=')}</p>
        <p className="text-center text-xs">{t('detail.thankYou')}</p>
      </div>

      <div className="order-invoice-actions mt-6 flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          {t('modals.close')}
        </Button>
        <Button type="button" onClick={handlePrint}>
          <Printer size={16} /> {t('salesExtra.printInvoice')}
        </Button>
      </div>
    </Modal>
  );
}
