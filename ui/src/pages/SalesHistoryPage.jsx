import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import PageShell from '../components/desktop/PageShell.jsx';
import DataTable from '../components/desktop/DataTable.jsx';
import SearchInput from '../components/ui/SearchInput.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import Button from '../components/ui/Button.jsx';
import TableRowActions from '../components/ui/TableRowActions.jsx';
import SaleDetailModal from '../components/modals/SaleDetailModal.jsx';
import { useSales } from '../context/SaleContext.jsx';
import { formatCurrency } from '../utils/chartData.js';
import { formatSolarDisplay } from '../utils/solarDate.js';
import { notify } from '../utils/toast.js';

const FILTERS = ['All', 'Fabric', 'Machinery'];

export default function SalesHistoryPage() {
  const { t } = useTranslation();
  const { sales, updatePaymentStatus } = useSales();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    return sales.filter((s) => {
      const matchSearch =
        !query ||
        s.customerName.toLowerCase().includes(query.toLowerCase()) ||
        s.saleType.toLowerCase().includes(query.toLowerCase());
      const matchFilter =
        filter === 'All' ||
        (filter === 'Fabric' && s.saleType === 'Fabric Sale') ||
        (filter === 'Machinery' && s.saleType === 'Machinery Sale');
      return matchSearch && matchFilter;
    });
  }, [sales, query, filter]);

  const columns = [
    { key: 'invoice', label: t('sales.invoice'), render: (r) => <span className="font-semibold text-accent">{r.invoiceNumber}</span> },
    { key: 'customer', label: t('sales.customer'), render: (r) => <span className="font-medium text-ink">{r.customerName}</span> },
    { key: 'type', label: t('common.type'), render: (r) => t(`ledger.${r.saleType}`, { defaultValue: r.saleType }) },
    { key: 'product', label: t('sales.product'), render: (r) => r.productName },
    { key: 'amount', label: t('common.amount'), render: (r) => formatCurrency(r.totalAmount) },
    { key: 'date', label: t('common.date'), render: (r) => formatSolarDisplay(r.date || r.saleDate) },
    { key: 'status', label: t('common.payment'), render: (r) => <StatusBadge status={r.paymentStatus || 'Pending'} /> },
    {
      key: 'actions',
      label: t('common.actions'),
      className: 'w-28',
      render: (r) => <TableRowActions onView={() => setSelected(r)} />,
    },
  ];

  return (
    <>
      <PageShell
        title={t('sales.historyTitle')}
        subtitle={t('sales.historySubtitle', { count: filtered.length })}
        breadcrumbs={[{ label: t('common.home'), to: '/' }, { label: t('sales.historyTitle') }]}
        actions={
          <div className="flex gap-2">
            <Link to="/sales/fabric"><Button variant="outline">{t('sales.fabricTitle')}</Button></Link>
            <Link to="/sales/machinery"><Button><Plus size={16} /> {t('sales.machineTitle')}</Button></Link>
          </div>
        }
      >
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-md flex-1">
            <SearchInput value={query} onChange={setQuery} placeholder={t('sales.search')} />
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button key={f} type="button" onClick={() => setFilter(f)} className={`filter-chip ${filter === f ? 'filter-chip-active' : ''}`}>{t(`filters.${f}`)}</button>
            ))}
          </div>
        </div>
        <DataTable columns={columns} rows={filtered} onRowClick={setSelected} emptyMessage={t('salesExtra.empty')} />
      </PageShell>

      <SaleDetailModal
        open={!!selected}
        sale={selected}
        onClose={() => setSelected(null)}
        onMarkPaid={async (...args) => {
          await updatePaymentStatus(...args);
          notify.success(t('toasts.paymentMarkedPaid'));
        }}
      />
    </>
  );
}
