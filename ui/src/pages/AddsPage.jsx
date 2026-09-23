import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import PageShell from '../components/desktop/PageShell.jsx';
import SectionTitle from '../components/ui/SectionTitle.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import TableRowActions from '../components/ui/TableRowActions.jsx';
import TablePagination, { usePagination } from '../components/desktop/TablePagination.jsx';
import { DeleteConfirmModal } from '../components/modals/CustomerModals.jsx';
import { addsService } from '../services/index.js';
import { notify } from '../utils/toast.js';

export default function AddsPage() {
  const [tab, setTab] = useState('orderTypes');
  const [orderTypes, setOrderTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [otName, setOtName] = useState('');
  const [otMeasurements, setOtMeasurements] = useState(['']);
  const [editingTypeId, setEditingTypeId] = useState(null);
  const [typeErrors, setTypeErrors] = useState({});

  const [empName, setEmpName] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empSalary, setEmpSalary] = useState('');
  const [editingEmpId, setEditingEmpId] = useState(null);
  const [empErrors, setEmpErrors] = useState({});

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);
  const [savingType, setSavingType] = useState(false);
  const [savingEmp, setSavingEmp] = useState(false);

  const [customerMeasurements, setCustomerMeasurements] = useState([]);
  const [cmName, setCmName] = useState('');
  const [editingCmId, setEditingCmId] = useState(null);
  const [cmErrors, setCmErrors] = useState({});
  const [savingCm, setSavingCm] = useState(false);

  const loadData = useCallback(async () => {
    const [types, emps, cmFields] = await Promise.all([
      addsService.getOrderTypes(),
      addsService.getEmployees(),
      addsService.getCustomerMeasurementFields(),
    ]);
    setOrderTypes(types);
    setEmployees(emps);
    setCustomerMeasurements(cmFields);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const cmPagination = usePagination(customerMeasurements);

  const validateOrderType = () => {
    const e = {};
    if (!otName.trim()) e.name = 'Order type name is required.';
    const trimmed = otMeasurements.map((m) => m.trim());
    if (trimmed.every((m) => !m)) {
      e.measurements = 'Add at least one measurement name.';
    } else if (trimmed.some((m) => !m)) {
      e.measurements = 'Fill every measurement field or remove empty rows.';
    }
    setTypeErrors(e);
    if (Object.keys(e).length > 0) {
      notify.warning('Cannot save order type', e.measurements || e.name);
    }
    return Object.keys(e).length === 0;
  };

  const saveOrderType = async () => {
    if (!validateOrderType()) return;
    setSavingType(true);
    try {
      const measurements = otMeasurements.map((m) => m.trim()).filter(Boolean);
      if (editingTypeId) {
        await addsService.updateOrderType(editingTypeId, { name: otName.trim(), measurements });
      } else {
        await addsService.createOrderType({ name: otName.trim(), measurements });
      }
      setOtName('');
      setOtMeasurements(['']);
      setEditingTypeId(null);
      setTypeErrors({});
      await loadData();
      notify.success('Order type saved');
    } catch (err) {
      notify.error('Could not save order type', err.message);
    } finally {
      setSavingType(false);
    }
  };

  const addMeasurementField = () => {
    setOtMeasurements((prev) => [...prev, '']);
  };

  const removeMeasurementField = (index) => {
    setOtMeasurements((prev) => {
      if (prev.length <= 1) return [''];
      return prev.filter((_, i) => i !== index);
    });
    setTypeErrors((p) => ({ ...p, measurements: '' }));
  };

  const validateEmployee = () => {
    const e = {};
    if (!empName.trim()) e.name = 'Employee name is required.';
    if (!empPhone.trim()) e.phone = 'Phone is required.';
    else if (!/^\d+$/.test(empPhone)) e.phone = 'Digits only.';
    else if (empPhone.length !== 10) e.phone = 'Must be exactly 10 digits.';
    else if (!empPhone.startsWith('07')) e.phone = 'Must start with 07.';
    setEmpErrors(e);
    if (Object.keys(e).length > 0) {
      notify.warning('Cannot save employee', 'Fill name and a valid phone (07xxxxxxxx).');
    }
    return Object.keys(e).length === 0;
  };

  const validateCustomerMeasurement = () => {
    const e = {};
    if (!cmName.trim()) e.name = 'Measurement name is required.';
    setCmErrors(e);
    if (Object.keys(e).length > 0) {
      notify.warning('Cannot save', 'Enter a measurement name.');
    }
    return Object.keys(e).length === 0;
  };

  const saveCustomerMeasurement = async () => {
    if (!validateCustomerMeasurement()) return;
    setSavingCm(true);
    try {
      if (editingCmId) {
        await addsService.updateCustomerMeasurementField(editingCmId, { name: cmName.trim() });
      } else {
        await addsService.createCustomerMeasurementField({ name: cmName.trim() });
      }
      setCmName('');
      setEditingCmId(null);
      setCmErrors({});
      await loadData();
      notify.success('Customer measurement saved');
    } catch (err) {
      notify.error('Could not save', err.message);
    } finally {
      setSavingCm(false);
    }
  };

  const saveEmployee = async () => {
    if (!validateEmployee()) return;
    setSavingEmp(true);
    try {
      if (editingEmpId) {
        await addsService.updateEmployee(editingEmpId, {
          name: empName.trim(),
          phone: empPhone.trim(),
          salary: empSalary,
        });
      } else {
        await addsService.createEmployee({
          name: empName.trim(),
          phone: empPhone.trim(),
          salary: empSalary,
        });
      }
      setEmpName('');
      setEmpPhone('');
      setEmpSalary('');
      setEditingEmpId(null);
      setEmpErrors({});
      await loadData();
      notify.success('Employee saved');
    } catch (err) {
      notify.error('Could not save employee', err.message);
    } finally {
      setSavingEmp(false);
    }
  };

  return (
    <PageShell
      title="Adds"
      subtitle="Order types, employees, and customer measurement field names"
      breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Adds' }]}
    >
      <div className="mb-4 flex max-w-2xl flex-wrap gap-2">
        {[
          { key: 'orderTypes', label: 'Order Types' },
          { key: 'employees', label: 'Employees' },
          { key: 'customerMeasurements', label: 'Customer Measurement' },
        ].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`filter-chip flex-1 ${tab === key ? 'filter-chip-active' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'orderTypes' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="form-panel">
            <SectionTitle title={editingTypeId ? 'Edit Order Type' : 'Add Order Type'} />
            <Input
              label="Type Name *"
              value={otName}
              onChange={(e) => {
                setOtName(e.target.value);
                setTypeErrors((p) => ({ ...p, name: '' }));
              }}
              error={typeErrors.name}
            />
            <p className="mb-2 text-sm font-semibold text-ink-secondary">Measurement Names *</p>
            {typeErrors.measurements && (
              <p className="mb-2 text-xs text-danger">{typeErrors.measurements}</p>
            )}
            {otMeasurements.map((m, i) => (
              <div key={`ot-measure-${i}`} className="mb-2 flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <Input
                    placeholder={`Measurement ${i + 1}`}
                    value={m}
                    onChange={(e) => {
                      const next = [...otMeasurements];
                      next[i] = e.target.value;
                      setOtMeasurements(next);
                      setTypeErrors((p) => ({ ...p, measurements: '' }));
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeMeasurementField(i)}
                  className="mt-1 rounded-md p-2 text-ink-muted transition hover:bg-red-50 hover:text-danger"
                  aria-label="Remove measurement row"
                  title="Remove row"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            <Button type="button" variant="outline" className="mb-4" onClick={addMeasurementField}>
              <Plus size={16} /> Add Field
            </Button>
            <Button type="button" disabled={savingType} onClick={saveOrderType}>
              {savingType ? 'Saving…' : 'Save Order Type'}
            </Button>
          </div>
          <div className="space-y-3">
            {orderTypes.map((type) => (
              <div key={type.id} className="panel p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-ink">{type.name}</p>
                    <p className="mt-1 text-sm text-ink-muted">{(type.measurements || []).join(', ')}</p>
                  </div>
                  <TableRowActions
                    onView={() => setViewRecord({ kind: 'orderType', data: type })}
                    onEdit={() => {
                      setEditingTypeId(type.id);
                      setOtName(type.name);
                      setOtMeasurements(type.measurements?.length ? [...type.measurements] : ['']);
                      setTypeErrors({});
                    }}
                    onDelete={() => setDeleteTarget({ kind: 'orderType', id: type.id, name: type.name })}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'customerMeasurements' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="form-panel">
            <SectionTitle
              title={editingCmId ? 'Edit Measurement Name' : 'Add Measurement Name'}
              subtitle="These names appear as inputs on Add Customer"
            />
            <Input
              label="Name *"
              value={cmName}
              onChange={(e) => {
                setCmName(e.target.value);
                setCmErrors((p) => ({ ...p, name: '' }));
              }}
              error={cmErrors.name}
              placeholder="e.g. Chest, Waist, Sleeve"
            />
            <div className="flex flex-wrap gap-2">
              <Button type="button" disabled={savingCm} onClick={saveCustomerMeasurement}>
                {savingCm ? 'Saving…' : editingCmId ? 'Update Name' : 'Save Name'}
              </Button>
              {editingCmId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingCmId(null);
                    setCmName('');
                    setCmErrors({});
                  }}
                >
                  Cancel edit
                </Button>
              )}
            </div>
          </div>
          <div className="min-w-0">
            <SectionTitle title="Saved measurement names" />
            <div className="panel overflow-hidden">
              <table className="measurement-names-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th className="measurement-names-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customerMeasurements.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="py-10 text-center text-sm text-ink-muted">
                        No measurement names yet. Add one on the left.
                      </td>
                    </tr>
                  ) : (
                    cmPagination.pageItems.map((row) => (
                      <tr key={row.id}>
                        <td className="font-medium text-ink">{row.name}</td>
                        <td className="measurement-names-actions">
                          <div className="flex justify-end">
                            <TableRowActions
                              onView={() => setViewRecord({ kind: 'customerMeasurement', data: row })}
                              onEdit={() => {
                                setEditingCmId(row.id);
                                setCmName(row.name);
                                setCmErrors({});
                              }}
                              onDelete={() =>
                                setDeleteTarget({
                                  kind: 'customerMeasurement',
                                  id: row.id,
                                  name: row.name,
                                })
                              }
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <TablePagination
                page={cmPagination.page}
                totalPages={cmPagination.totalPages}
                totalItems={cmPagination.totalItems}
                pageSize={cmPagination.pageSize}
                start={cmPagination.start}
                end={cmPagination.end}
                onPageChange={cmPagination.setPage}
              />
            </div>
          </div>
        </div>
      )}

      {tab === 'employees' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="form-panel">
            <SectionTitle title={editingEmpId ? 'Edit Employee' : 'Add Employee'} />
            <Input
              label="Name *"
              value={empName}
              onChange={(e) => {
                setEmpName(e.target.value);
                setEmpErrors((p) => ({ ...p, name: '' }));
              }}
              error={empErrors.name}
            />
            <Input
              label="Phone *"
              value={empPhone}
              onChange={(e) => {
                setEmpPhone(e.target.value);
                setEmpErrors((p) => ({ ...p, phone: '' }));
              }}
              error={empErrors.phone}
              placeholder="07xxxxxxxx"
            />
            <Input
              label="Salary (₹)"
              type="number"
              value={empSalary}
              onChange={(e) => setEmpSalary(e.target.value)}
            />
            <Button type="button" disabled={savingEmp} onClick={saveEmployee}>
              {savingEmp ? 'Saving…' : 'Save Employee'}
            </Button>
          </div>
          <div className="space-y-3">
            {employees.map((emp) => (
              <div key={emp.id} className="panel p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-ink">{emp.name}</p>
                    <p className="text-sm text-ink-muted">{emp.phone}</p>
                    <p className="text-sm font-semibold text-success">₹{Number(emp.salary || 0).toLocaleString()}</p>
                  </div>
                  <TableRowActions
                    onView={() => setViewRecord({ kind: 'employee', data: emp })}
                    onEdit={() => {
                      setEditingEmpId(emp.id);
                      setEmpName(emp.name);
                      setEmpPhone(emp.phone);
                      setEmpSalary(String(emp.salary || ''));
                      setEmpErrors({});
                    }}
                    onDelete={() => setDeleteTarget({ kind: 'employee', id: emp.id, name: emp.name })}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        open={!!viewRecord}
        onClose={() => setViewRecord(null)}
        title={
          viewRecord?.kind === 'orderType'
            ? viewRecord.data?.name
            : viewRecord?.kind === 'employee'
              ? viewRecord.data?.name
              : viewRecord?.data?.name
        }
        subtitle="Details"
      >
        {viewRecord?.kind === 'orderType' && (
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-ink">Measurement names</p>
            <p className="text-ink-muted">{(viewRecord.data.measurements || []).join(', ') || '—'}</p>
          </div>
        )}
        {viewRecord?.kind === 'employee' && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between rounded-lg bg-background px-3 py-2">
              <span className="text-ink-muted">Phone</span>
              <span className="font-semibold">{viewRecord.data.phone}</span>
            </div>
            <div className="flex justify-between rounded-lg bg-background px-3 py-2">
              <span className="text-ink-muted">Salary</span>
              <span className="font-semibold">₹{Number(viewRecord.data.salary || 0).toLocaleString()}</span>
            </div>
          </div>
        )}
        {viewRecord?.kind === 'customerMeasurement' && (
          <p className="text-sm text-ink-muted">Used on Add Customer as a measurement field.</p>
        )}
      </Modal>

      <DeleteConfirmModal
        open={!!deleteTarget}
        name={deleteTarget?.name}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          try {
            if (deleteTarget.kind === 'orderType') await addsService.deleteOrderType(deleteTarget.id);
            else if (deleteTarget.kind === 'customerMeasurement') {
              await addsService.deleteCustomerMeasurementField(deleteTarget.id);
            } else await addsService.deleteEmployee(deleteTarget.id);
            setDeleteTarget(null);
            await loadData();
            notify.success('Record deleted');
          } catch (err) {
            notify.error('Delete failed', err.message);
          }
        }}
      />
    </PageShell>
  );
}
