import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageShell from '../components/desktop/PageShell.jsx';
import DataTable from '../components/desktop/DataTable.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import TableRowActions from '../components/ui/TableRowActions.jsx';
import { DeleteConfirmModal } from '../components/modals/CustomerModals.jsx';
import { notify } from '../utils/toast.js';
import { formatCurrency } from '../utils/chartData.js';
import { useStock } from '../context/StockContext.jsx';
import { getWarningQuantity, isStockAtOrBelowWarning } from '../utils/stockWarnings.js';

export default function StockPage() {
  const { t } = useTranslation();
  const {
    fabrics,
    machinery,
    createFabricItem,
    createMachineryItem,
    addFabricStock,
    addMachineryStock,
    updateFabric,
    updateMachinery,
    deleteFabric,
    deleteMachinery,
  } = useStock();

  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({});

  const openCreate = (category) => {
    setForm({ name: '', price: '', stock: '', supplier: '', warningQuantity: '', quantity: '', purchasePrice: '' });
    setModal({ type: 'create', category });
  };

  const openPurchase = (category) => {
    setForm({ itemId: '', quantity: '', purchasePrice: '', date: new Date().toISOString().split('T')[0] });
    setModal({ type: 'purchase', category });
  };

  const openEdit = (category, item) => {
    setForm({
      id: item.id,
      name: item.name,
      price: String(category === 'fabric' ? item.pricePerMeter : item.unitPrice),
      stock: String(item.stock),
      supplier: item.supplier || '',
      warningQuantity: item.warningQuantity != null ? String(item.warningQuantity) : '',
    });
    setModal({ type: 'edit', category });
  };

  const purchaseItems = modal?.category === 'fabric' ? fabrics : machinery;
  const selectedPurchaseItem = purchaseItems.find((i) => i.id === form.itemId);

  const handleSave = async () => {
    if (modal.type === 'create') {
      if (modal.category === 'fabric') {
        await createFabricItem({
          name: form.name,
          pricePerMeter: form.price,
          stock: form.stock,
          supplier: form.supplier,
          warningQuantity: form.warningQuantity,
        });
      } else {
        await createMachineryItem({
          name: form.name,
          unitPrice: form.price,
          stock: form.stock,
          supplier: form.supplier,
          warningQuantity: form.warningQuantity,
        });
      }
    } else if (modal.type === 'purchase') {
      const entry = {
        quantity: form.quantity,
        purchasePrice: form.purchasePrice,
        date: form.date,
        totalCost: Number(form.quantity) * Number(form.purchasePrice),
      };
      if (modal.category === 'fabric') {
        const item = fabrics.find((f) => f.id === form.itemId);
        await addFabricStock({ ...entry, fabricId: form.itemId, itemName: item?.name || 'Fabric' });
      } else {
        const item = machinery.find((m) => m.id === form.itemId);
        await addMachineryStock({ ...entry, machineryId: form.itemId, itemName: item?.name || 'Machinery' });
      }
    } else if (modal.type === 'edit') {
      if (modal.category === 'fabric') {
        await updateFabric(form.id, {
          name: form.name,
          pricePerMeter: form.price,
          stock: form.stock,
          supplier: form.supplier,
          warningQuantity: form.warningQuantity,
        });
      } else {
        await updateMachinery(form.id, {
          name: form.name,
          unitPrice: form.price,
          stock: form.stock,
          supplier: form.supplier,
          warningQuantity: form.warningQuantity,
        });
      }
    }
    setModal(null);
    notify.success('Stock updated');
  };

  const stockActions = (category, item) => (
    <TableRowActions
      onView={() => setViewTarget({ category, item })}
      onEdit={() => openEdit(category, item)}
      onDelete={() => setDeleteTarget({ category, item })}
    />
  );

  const fabricColumns = [
    { key: 'name', label: t('stock.fabric'), render: (r) => <span className="font-medium text-ink">{r.name}</span> },
    { key: 'price', label: t('stock.priceMeter'), render: (r) => formatCurrency(r.pricePerMeter) },
    {
      key: 'stock',
      label: t('stock.stockM'),
      render: (r) => (
        <span className={isStockAtOrBelowWarning(r, 'fabric') ? 'font-bold text-danger' : 'font-semibold'}>
          {r.stock}
        </span>
      ),
    },
    {
      key: 'warningQuantity',
      label: t('stock.warningAt'),
      render: (r) => getWarningQuantity(r, 'fabric'),
    },
    { key: 'actions', label: t('common.actions'), className: 'w-28', render: (r) => stockActions('fabric', r) },
  ];

  const machineryColumns = [
    { key: 'name', label: t('stock.machine'), render: (r) => <span className="font-medium text-ink">{r.name}</span> },
    { key: 'price', label: t('stock.unitPrice'), render: (r) => formatCurrency(r.unitPrice) },
    {
      key: 'stock',
      label: t('stock.stock'),
      render: (r) => (
        <span className={isStockAtOrBelowWarning(r, 'machinery') ? 'font-bold text-danger' : 'font-semibold'}>
          {r.stock}
        </span>
      ),
    },
    {
      key: 'warningQuantity',
      label: t('stock.warningAt'),
      render: (r) => getWarningQuantity(r, 'machinery'),
    },
    { key: 'actions', label: t('common.actions'), className: 'w-28', render: (r) => stockActions('machinery', r) },
  ];

  const showFabric = filter !== 'machinery';
  const showMachinery = filter !== 'fabric';

  const viewItem = viewTarget?.item;
  const isFabricView = viewTarget?.category === 'fabric';

  return (
    <PageShell
      title={t('stock.title')}
      subtitle={t('stock.subtitle')}
      breadcrumbs={[{ label: t('common.home'), to: '/' }, { label: t('stock.title') }]}
    >
        <div className="mb-4 flex flex-wrap gap-2">
          {[['all', t('stock.all')], ['fabric', t('stock.fabric')], ['machinery', t('stock.machinery')]].map(([key, label]) => (
            <button key={key} type="button" onClick={() => setFilter(key)} className={`rounded-xl px-4 py-2 text-sm font-bold ${filter === key ? 'bg-navy text-white' : 'bg-surface border border-black/10 text-ink-muted'}`}>
              {label}
            </button>
          ))}
        </div>

        {filter === 'fabric' && (
          <div className="mb-4 flex flex-wrap gap-2">
            <Button onClick={() => openCreate('fabric')}>{t('stock.newFabric')}</Button>
            <Button variant="outline" onClick={() => openPurchase('fabric')}>{t('stock.buyFabric')}</Button>
          </div>
        )}
        {filter === 'machinery' && (
          <div className="mb-4 flex flex-wrap gap-2">
            <Button onClick={() => openCreate('machinery')}>{t('stock.newMachine')}</Button>
            <Button variant="outline" onClick={() => openPurchase('machinery')}>{t('stock.buyMachine')}</Button>
          </div>
        )}

        {showFabric && (
          <section className="mb-8">
            <h3 className="mb-3 text-lg font-bold">{t('stock.fabricStock')}</h3>
            <DataTable columns={fabricColumns} rows={fabrics} emptyMessage={t('stock.emptyFabric')} />
          </section>
        )}

        {showMachinery && (
          <section>
            <h3 className="mb-3 text-lg font-bold">{t('stock.machineryStock')}</h3>
            <DataTable columns={machineryColumns} rows={machinery} emptyMessage={t('stock.emptyMachine')} />
          </section>
        )}

      <Modal
        open={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title={viewItem?.name}
        subtitle={isFabricView ? t('stockExtra.fabricItem') : t('stockExtra.machineItem')}
      >
        {viewItem && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between rounded-lg bg-background px-3 py-2">
              <span className="text-ink-muted">{isFabricView ? t('stockExtra.pricePerMeter') : t('stock.unitPrice')}</span>
              <span className="font-semibold">
                {formatCurrency(isFabricView ? viewItem.pricePerMeter : viewItem.unitPrice)}
              </span>
            </div>
            <div className="flex justify-between rounded-lg bg-background px-3 py-2">
              <span className="text-ink-muted">{t('stock.stock')}</span>
              <span className="font-semibold">{viewItem.stock}</span>
            </div>
            <div className="flex justify-between rounded-lg bg-background px-3 py-2">
              <span className="text-ink-muted">{t('stock.warningQty')}</span>
              <span className="font-semibold">
                {getWarningQuantity(viewItem, isFabricView ? 'fabric' : 'machinery')}
              </span>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={
          modal?.type === 'create'
            ? (modal.category === 'fabric' ? t('stock.newFabric') : t('stock.newMachine'))
            : modal?.type === 'purchase'
              ? (modal.category === 'fabric' ? t('stock.buyFabric') : t('stock.buyMachine'))
              : t('stockExtra.editItem')
        }
      >
        {modal?.type === 'purchase' ? (
          <>
            <select value={form.itemId} onChange={(e) => setForm((p) => ({ ...p, itemId: e.target.value }))} className="mb-2 w-full rounded-xl border px-3 py-2.5 text-sm">
              <option value="">{t('stock.selectItem')}</option>
              {purchaseItems.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
            {selectedPurchaseItem && (
              <div className="mb-4 rounded-xl border border-primary-soft bg-background px-3 py-2 text-sm">
                <span className="text-ink-muted">{t('stock.currentStock')}: </span>
                <span className="font-bold text-ink">
                  {selectedPurchaseItem.stock}
                  {modal.category === 'fabric' ? ` ${t('stockExtra.meters')}` : ` ${t('stockExtra.units')}`}
                </span>
              </div>
            )}
            <Input label={t('common.quantity')} type="number" value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))} />
            <Input label={t('stock.purchasePrice')} type="number" value={form.purchasePrice} onChange={(e) => setForm((p) => ({ ...p, purchasePrice: e.target.value }))} />
            <Input label={t('common.date')} type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
          </>
        ) : (
          <>
            <Input label={t('common.name')} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            <Input label={modal?.category === 'fabric' ? t('stock.priceMeter') : t('stock.unitPrice')} type="number" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} />
            <Input label={t('stock.stock')} type="number" value={form.stock} onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))} />
            <Input
              label={modal?.category === 'fabric' ? t('stockExtra.warningMeters') : t('stockExtra.warningUnits')}
              type="number"
              value={form.warningQuantity}
              onChange={(e) => setForm((p) => ({ ...p, warningQuantity: e.target.value }))}
              placeholder={t('stockExtra.warningPlaceholder')}
            />
            {modal?.type === 'edit' && (
              <Input label={t('stock.supplier')} value={form.supplier} onChange={(e) => setForm((p) => ({ ...p, supplier: e.target.value }))} />
            )}
          </>
        )}
        <Button className="mt-4" onClick={handleSave}>{t('common.save')}</Button>
      </Modal>

      <DeleteConfirmModal
        open={!!deleteTarget}
        name={deleteTarget?.item?.name}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget.category === 'fabric') deleteFabric(deleteTarget.item.id);
          else deleteMachinery(deleteTarget.item.id);
          setDeleteTarget(null);
          notify.success('Item deleted');
        }}
      />
    </PageShell>
  );
}
