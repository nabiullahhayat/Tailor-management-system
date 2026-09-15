import { Printer } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import StatusBadge from '../ui/StatusBadge.jsx';

function formatMoney(n) {
  return `₹${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export default function SaleBillModal({ open, sale, shopName = 'Khayati', customerPhone, onClose }) {
  if (!sale) return null;

  const total = Number(sale.totalAmount || 0);
  const paid = Number(sale.paidAmount || 0);
  const remaining = Math.max(0, total - paid);
  const qtyLabel = sale.saleType === 'Fabric Sale' ? 'Meters' : 'Quantity';
  const qtyValue = sale.meters ?? sale.quantity ?? '—';
  const dateStr = sale.saleDate
    ? new Date(sale.saleDate).toLocaleString()
    : sale.date || new Date().toLocaleString();

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Sale Bill"
      subtitle={sale.invoiceNumber}
      size="lg"
    >
      <div id="sale-bill-print" className="sale-bill-root space-y-5 rounded-xl border border-black/10 bg-white p-6 text-ink">
        <div className="border-b border-black/10 pb-4 text-center">
          <p className="text-xl font-extrabold tracking-tight">{shopName}</p>
          <p className="mt-1 text-sm text-ink-muted">Sales Invoice</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase text-ink-muted">Invoice</p>
            <p className="font-bold">{sale.invoiceNumber}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-semibold uppercase text-ink-muted">Date</p>
            <p className="font-semibold">{dateStr}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-ink-muted">Customer</p>
            <p className="font-semibold">{sale.customerName || '—'}</p>
            {customerPhone && <p className="text-sm text-ink-muted">{customerPhone}</p>}
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-semibold uppercase text-ink-muted">Payment</p>
            <StatusBadge status={sale.paymentStatus || 'Pending'} />
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left text-xs uppercase text-ink-muted">
              <th className="py-2 pr-2">Item</th>
              <th className="py-2 pr-2">Type</th>
              <th className="py-2 pr-2">{qtyLabel}</th>
              <th className="py-2 pr-2">Unit price</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-black/5">
              <td className="py-3 pr-2 font-semibold">{sale.productName}</td>
              <td className="py-3 pr-2">{sale.saleType}</td>
              <td className="py-3 pr-2">{qtyValue}</td>
              <td className="py-3 pr-2">{formatMoney(sale.unitPrice)}</td>
              <td className="py-3 text-right font-bold">{formatMoney(total)}</td>
            </tr>
          </tbody>
        </table>

        <div className="ml-auto max-w-xs space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-muted">Total amount</span>
            <span className="font-bold">{formatMoney(total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-muted">Paid</span>
            <span className="font-semibold text-success">{formatMoney(paid)}</span>
          </div>
          <div className="flex justify-between border-t border-black/10 pt-2">
            <span className="font-semibold text-ink-muted">
              {remaining > 0 ? 'Credit / remaining' : 'Remaining'}
            </span>
            <span className={`font-extrabold ${remaining > 0 ? 'text-danger' : 'text-success'}`}>
              {formatMoney(remaining)}
            </span>
          </div>
        </div>

        {sale.notes ? (
          <p className="text-sm text-ink-muted">
            <span className="font-semibold text-ink">Notes: </span>
            {sale.notes}
          </p>
        ) : null}

        <p className="text-center text-xs text-ink-muted">Thank you for your business.</p>
      </div>

      <div className="sale-bill-actions mt-6 flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button type="button" onClick={handlePrint}>
          <Printer size={16} /> Print bill
        </Button>
      </div>
    </Modal>
  );
}
