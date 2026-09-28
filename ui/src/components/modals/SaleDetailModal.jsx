import { useTranslation } from 'react-i18next';
import Modal from '../ui/Modal.jsx';
import StatusBadge from '../ui/StatusBadge.jsx';
import Button from '../ui/Button.jsx';

export default function SaleDetailModal({ open, sale, onClose, onMarkPaid }) {
  const { t } = useTranslation();
  if (!sale) return null;

  const handleMarkPaid = async () => {
    await onMarkPaid(sale.id, {
      paidAmount: sale.totalAmount,
      paymentStatus: 'Paid',
    });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={sale.invoiceNumber} subtitle={sale.customerName} size="md">
      <div className="space-y-4">
        <StatusBadge status={sale.paymentStatus || 'Pending'} />
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            [t('salesExtra.saleType'), t(`ledger.${sale.saleType}`, { defaultValue: sale.saleType })],
            [t('sales.product'), sale.productName],
            [t('stock.unitPrice'), `؋${Number(sale.unitPrice || 0).toLocaleString()}`],
            [t('common.total'), `؋${Number(sale.totalAmount || 0).toLocaleString()}`],
            [t('common.paid'), `؋${Number(sale.paidAmount || 0).toLocaleString()}`],
            [
              t('salesExtra.creditRemaining'),
              `؋${Math.max(0, Number(sale.totalAmount || 0) - Number(sale.paidAmount || 0)).toLocaleString()}`,
            ],
            [t('salesExtra.meters'), sale.meters ?? '—'],
            [t('common.quantity'), sale.quantity ?? '—'],
            [t('common.date'), sale.date || sale.saleDate?.split('T')[0] || '—'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-background px-3 py-2">
              <p className="text-xs text-ink-muted">{label}</p>
              <p className="text-sm font-semibold text-ink">{value}</p>
            </div>
          ))}
        </div>
        {sale.paymentStatus !== 'Paid' && (
          <Button variant="success" onClick={handleMarkPaid}>
            {t('salesExtra.markPaid')}
          </Button>
        )}
      </div>
    </Modal>
  );
}
