import { useState } from 'react';
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

export default function StockPage() {
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
    setForm({ name: '', price: '', stock: '', supplier: '', quantity: '', purchasePrice: '' });
    setModal({ type: 'create', category });
  };

  const openPurchase = (category) => {
    setForm({ itemId: '', quantity: '', purchasePrice: '', supplier: '', date: new Date().toISOString().split('T')[0] });
    setModal({ type: 'purchase', category });
  };

  const openEdit = (category, item) => {
    setForm({
      id: item.id,
      name: item.name,
      price: String(category === 'fabric' ? item.pricePerMeter : item.unitPrice),
      stock: String(item.stock),
      supplier: item.supplier || '',
    });
    setModal({ type: 'edit', category });
  };

  const handleSave = async () => {
    if (modal.type === 'create') {
      if (modal.category === 'fabric') {
        await createFabricItem({
          name: form.name,
          pricePerMeter: form.price,
          stock: form.stock,
          supplier: form.supplier,
        });
      } else {
        await createMachineryItem({
          name: form.name,
          unitPrice: form.price,
          stock: form.stock,
          supplier: form.supplier,
        });
      }
    } else if (modal.type === 'purchase') {
      const entry = {
        quantity: form.quantity,
        purchasePrice: form.purchasePrice,
        supplier: form.supplier,
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
        });
      } else {
        await updateMachinery(form.id, {
          name: form.name,
          unitPrice: form.price,
          stock: form.stock,
          supplier: form.supplier,
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
    { key: 'name', label: 'Fabric', render: (r) => <span className="font-medium text-ink">{r.name}</span> },
    { key: 'price', label: 'Price/Meter', render: (r) => formatCurrency(r.pricePerMeter) },
    { key: 'stock', label: 'Stock (m)', render: (r) => <span className={r.stock < 10 ? 'font-bold text-danger' : 'font-semibold'}>{r.stock}</span> },
    { key: 'supplier', label: 'Supplier', render: (r) => r.supplier || '—' },
    { key: 'actions', label: 'Actions', className: 'w-28', render: (r) => stockActions('fabric', r) },
  ];

  const machineryColumns = [
    { key: 'name', label: 'Machine', render: (r) => <span className="font-medium text-ink">{r.name}</span> },
    { key: 'price', label: 'Unit Price', render: (r) => formatCurrency(r.unitPrice) },
    { key: 'stock', label: 'Stock', render: (r) => <span className={r.stock < 3 ? 'font-bold text-danger' : 'font-semibold'}>{r.stock}</span> },
    { key: 'supplier', label: 'Supplier', render: (r) => r.supplier || '—' },
    { key: 'actions', label: 'Actions', className: 'w-28', render: (r) => stockActions('machinery', r) },
  ];

  const showFabric = filter !== 'machinery';
  const showMachinery = filter !== 'fabric';

  const viewItem = viewTarget?.item;
  const isFabricView = viewTarget?.category === 'fabric';

  return (
    <PageShell
      title="Stock Management"
      subtitle="Fabric and machinery inventory with purchase tracking"
      breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Stock' }]}
    >
        <div className="mb-4 flex flex-wrap gap-2">
          {[['all', 'All Stock'], ['fabric', 'Fabric'], ['machinery', 'Machinery']].map(([key, label]) => (
            <button key={key} type="button" onClick={() => setFilter(key)} className={`rounded-xl px-4 py-2 text-sm font-bold ${filter === key ? 'bg-navy text-white' : 'bg-surface border border-black/10 text-ink-muted'}`}>
              {label}
            </button>
          ))}
        </div>

        {filter === 'fabric' && (
          <div className="mb-4 flex flex-wrap gap-2">
            <Button onClick={() => openCreate('fabric')}>New Fabric</Button>
            <Button variant="outline" onClick={() => openPurchase('fabric')}>Buy Fabric</Button>
          </div>
        )}
        {filter === 'machinery' && (
          <div className="mb-4 flex flex-wrap gap-2">
            <Button onClick={() => openCreate('machinery')}>New Machine</Button>
            <Button variant="outline" onClick={() => openPurchase('machinery')}>Buy Machine</Button>
          </div>
        )}

        {showFabric && (
          <section className="mb-8">
            <h3 className="mb-3 text-lg font-bold">Fabric Stock</h3>
            <DataTable columns={fabricColumns} rows={fabrics} emptyMessage="No fabric items in inventory." />
          </section>
        )}

        {showMachinery && (
          <section>
            <h3 className="mb-3 text-lg font-bold">Machinery Stock</h3>
            <DataTable columns={machineryColumns} rows={machinery} emptyMessage="No machinery items in inventory." />
          </section>
        )}

      <Modal
        open={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title={viewItem?.name}
        subtitle={isFabricView ? 'Fabric item' : 'Machinery item'}
      >
        {viewItem && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between rounded-lg bg-background px-3 py-2">
              <span className="text-ink-muted">{isFabricView ? 'Price per meter' : 'Unit price'}</span>
              <span className="font-semibold">
                {formatCurrency(isFabricView ? viewItem.pricePerMeter : viewItem.unitPrice)}
              </span>
            </div>
            <div className="flex justify-between rounded-lg bg-background px-3 py-2">
              <span className="text-ink-muted">Stock</span>
              <span className="font-semibold">{viewItem.stock}</span>
            </div>
            <div className="flex justify-between rounded-lg bg-background px-3 py-2">
              <span className="text-ink-muted">Supplier</span>
              <span className="font-semibold">{viewItem.supplier || '—'}</span>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={
          modal?.type === 'create'
            ? `New ${modal.category === 'fabric' ? 'Fabric' : 'Machine'}`
            : modal?.type === 'purchase'
              ? `Buy ${modal.category === 'fabric' ? 'Fabric' : 'Machine'}`
              : 'Edit Item'
        }
      >
        {modal?.type === 'purchase' ? (
          <>
            <select value={form.itemId} onChange={(e) => setForm((p) => ({ ...p, itemId: e.target.value }))} className="mb-4 w-full rounded-xl border px-3 py-2.5 text-sm">
              <option value="">Select item…</option>
              {(modal.category === 'fabric' ? fabrics : machinery).map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
            <Input label="Quantity" type="number" value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))} />
            <Input label="Purchase Price" type="number" value={form.purchasePrice} onChange={(e) => setForm((p) => ({ ...p, purchasePrice: e.target.value }))} />
            <Input label="Supplier" value={form.supplier} onChange={(e) => setForm((p) => ({ ...p, supplier: e.target.value }))} />
            <Input label="Date" type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
          </>
        ) : (
          <>
            <Input label="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            <Input label={modal?.category === 'fabric' ? 'Price per Meter' : 'Unit Price'} type="number" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} />
            <Input label="Stock" type="number" value={form.stock} onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))} />
            <Input label="Supplier" value={form.supplier} onChange={(e) => setForm((p) => ({ ...p, supplier: e.target.value }))} />
          </>
        )}
        <Button className="mt-4" onClick={handleSave}>Save</Button>
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
