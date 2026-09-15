import Modal from '../ui/Modal.jsx';
import StatusBadge from '../ui/StatusBadge.jsx';
import Button from '../ui/Button.jsx';

export default function SaleDetailModal({ open, sale, onClose, onMarkPaid }) {
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
            ['Sale Type', sale.saleType],
            ['Product', sale.productName],
            ['Unit Price', `₹${Number(sale.unitPrice || 0).toLocaleString()}`],
            ['Total', `₹${Number(sale.totalAmount || 0).toLocaleString()}`],
            ['Paid', `₹${Number(sale.paidAmount || 0).toLocaleString()}`],
            [
              'Credit / remaining',
              `₹${Math.max(0, Number(sale.totalAmount || 0) - Number(sale.paidAmount || 0)).toLocaleString()}`,
            ],
            ['Meters', sale.meters ?? '—'],
            ['Quantity', sale.quantity ?? '—'],
            ['Date', sale.date || sale.saleDate?.split('T')[0] || '—'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-background px-3 py-2">
              <p className="text-xs text-ink-muted">{label}</p>
              <p className="text-sm font-semibold text-ink">{value}</p>
            </div>
          ))}
        </div>
        {sale.paymentStatus !== 'Paid' && (
          <Button variant="success" onClick={handleMarkPaid}>
            Mark as Paid
          </Button>
        )}
      </div>
    </Modal>
  );
}
