import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [tab, setTab] = useState('orderTypes');
  const [orderTypes, setOrderTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [otName, setOtName] = useState('');
  const [otMeasurements, setOtMeasurements] = useState(['']);
  const [otShapes, setOtShapes] = useState(['']);
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
    if (!otName.trim()) e.name = t('validation.orderTypeNameRequired');
    const trimmed = otMeasurements.map((m) => m.trim());
    if (trimmed.every((m) => !m)) {
      e.measurements = t('addsExtra.measurementOneRequired');
    } else if (trimmed.some((m) => !m)) {
      e.measurements = t('addsExtra.fillAllMeasurements');
    }
    setTypeErrors(e);
    if (Object.keys(e).length > 0) {
      notify.warning(t('toasts.cannotSaveOrderType'), e.measurements || e.name);
    }
    return Object.keys(e).length === 0;
  };

  const saveOrderType = async () => {
    if (!validateOrderType()) return;
    setSavingType(true);
    try {
      const measurements = otMeasurements.map((m) => m.trim()).filter(Boolean);
      const shapes = otShapes.map((s) => s.trim()).filter(Boolean);
      if (editingTypeId) {
        await addsService.updateOrderType(editingTypeId, { name: otName.trim(), measurements, shapes });
      } else {
        await addsService.createOrderType({ name: otName.trim(), measurements, shapes });
      }
      setOtName('');
      setOtMeasurements(['']);
      setOtShapes(['']);
      setEditingTypeId(null);
      setTypeErrors({});
      await loadData();
      notify.success(t('toasts.orderTypeSaved'));
    } catch (err) {
      notify.error(t('toasts.couldNotSaveOrderType'), err.message);
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

  const addShapeField = () => {
    setOtShapes((prev) => [...prev, '']);
  };

  const removeShapeField = (index) => {
    setOtShapes((prev) => {
      if (prev.length <= 1) return [''];
      return prev.filter((_, i) => i !== index);
    });
  };

  const validateEmployee = () => {
    const e = {};
    if (!empName.trim()) e.name = t('validation.employeeNameRequired');
    if (!empPhone.trim()) e.phone = t('validation.phoneRequired');
    else if (!/^\d+$/.test(empPhone)) e.phone = t('validation.digitsOnly');
    else if (empPhone.length !== 10) e.phone = t('validation.phoneTenDigits');
    else if (!empPhone.startsWith('07')) e.phone = t('validation.phoneStarts07');
    setEmpErrors(e);
    if (Object.keys(e).length > 0) {
      notify.warning(t('toasts.cannotSaveEmployee'), t('toasts.cannotSaveEmployeeDesc'));
    }
    return Object.keys(e).length === 0;
  };

  const validateCustomerMeasurement = () => {
    const e = {};
    if (!cmName.trim()) e.name = t('validation.measurementNameRequired');
    setCmErrors(e);
    if (Object.keys(e).length > 0) {
      notify.warning(t('toasts.cannotSave'), t('toasts.enterMeasurementName'));
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
      notify.success(t('toasts.measurementSaved'));
    } catch (err) {
      notify.error(t('toasts.couldNotSave'), err.message);
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
      notify.success(t('toasts.employeeSaved'));
    } catch (err) {
      notify.error(t('toasts.couldNotSaveEmployee'), err.message);
    } finally {
      setSavingEmp(false);
    }
  };

  return (
    <PageShell
      title={t('adds.title')}
      subtitle={t('adds.subtitle')}
      breadcrumbs={[{ label: t('common.home'), to: '/' }, { label: t('adds.title') }]}
    >
      <div className="mb-4 flex max-w-2xl flex-wrap gap-2">
        {[
          { key: 'orderTypes', label: t('adds.orderTypes') },
          { key: 'employees', label: t('adds.employees') },
          { key: 'customerMeasurements', label: t('addsExtra.customerMeasurement') },
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
            <SectionTitle title={editingTypeId ? t('addsExtra.editType') : t('addsExtra.addType')} />
            <Input
              label={t('addsExtra.typeName')}
              value={otName}
              onChange={(e) => {
                setOtName(e.target.value);
                setTypeErrors((p) => ({ ...p, name: '' }));
              }}
              error={typeErrors.name}
            />
            <p className="mb-2 text-sm font-semibold text-ink-secondary">{t('addsExtra.measurementNames')}</p>
            {typeErrors.measurements && (
              <p className="mb-2 text-xs text-danger">{typeErrors.measurements}</p>
            )}
            {otMeasurements.map((m, i) => (
              <div key={`ot-measure-${i}`} className="mb-2 flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <Input
                    placeholder={t('addsExtra.measurementN', { n: i + 1 })}
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
                  title={t('addsExtra.removeRow')}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            <Button type="button" variant="outline" className="mb-4" onClick={addMeasurementField}>
              <Plus size={16} /> {t('addsExtra.addField')}
            </Button>

            <p className="mb-1 text-sm font-semibold text-ink-secondary">{t('addsExtra.shakl')}</p>
            <p className="mb-2 text-xs text-ink-muted">{t('addsExtra.shaklHint')}</p>
            {otShapes.map((s, i) => (
              <div key={`ot-shape-${i}`} className="mb-2 flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <Input
                    placeholder={t('addsExtra.shaklN', { n: i + 1 })}
                    value={s}
                    onChange={(e) => {
                      const next = [...otShapes];
                      next[i] = e.target.value;
                      setOtShapes(next);
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeShapeField(i)}
                  className="mt-1 rounded-md p-2 text-ink-muted transition hover:bg-red-50 hover:text-danger"
                  aria-label={t('addsExtra.removeRow')}
                  title={t('addsExtra.removeRow')}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            <Button type="button" variant="outline" className="mb-4" onClick={addShapeField}>
              <Plus size={16} /> {t('addsExtra.addField')}
            </Button>

            <Button type="button" disabled={savingType} onClick={saveOrderType}>
              {savingType ? t('addsExtra.saving') : t('addsExtra.saveType')}
            </Button>
          </div>
          <div className="space-y-3">
            {orderTypes.map((type) => (
              <div
                key={type.id}
                role="button"
                tabIndex={0}
                className="panel cursor-pointer p-4 transition hover:bg-primary-soft/20"
                onClick={() => setViewRecord({ kind: 'orderType', data: type })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setViewRecord({ kind: 'orderType', data: type });
                  }
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-ink">{type.name}</p>
                    <p className="mt-1 text-sm text-ink-muted">{(type.measurements || []).join(', ')}</p>
                    {(type.shapes || []).length > 0 && (
                      <p className="mt-1 text-sm text-ink-muted">
                        {t('addsExtra.shakl')}: {(type.shapes || []).join(', ')}
                      </p>
                    )}
                  </div>
                  <TableRowActions
                    onEdit={() => {
                      setEditingTypeId(type.id);
                      setOtName(type.name);
                      setOtMeasurements(type.measurements?.length ? [...type.measurements] : ['']);
                      setOtShapes(type.shapes?.length ? [...type.shapes] : ['']);
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
              title={editingCmId ? t('addsExtra.editMeasurement') : t('addsExtra.addMeasurement')}
              subtitle={t('addsExtra.measurementHint')}
            />
            <Input
              label={t('addsExtra.nameRequired')}
              value={cmName}
              onChange={(e) => {
                setCmName(e.target.value);
                setCmErrors((p) => ({ ...p, name: '' }));
              }}
              error={cmErrors.name}
              placeholder={t('addsExtra.placeholderExample')}
            />
            <div className="flex flex-wrap gap-2">
              <Button type="button" disabled={savingCm} onClick={saveCustomerMeasurement}>
                {savingCm ? t('addsExtra.saving') : editingCmId ? t('addsExtra.updateName') : t('addsExtra.saveName')}
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
                  {t('addsExtra.cancelEdit')}
                </Button>
              )}
            </div>
          </div>
          <div className="min-w-0 overflow-hidden">
            <SectionTitle title={t('addsExtra.savedNames')} />
            <div className="panel min-w-0 overflow-hidden">
              <table className="measurement-names-table">
                <thead>
                  <tr>
                    <th>{t('common.name')}</th>
                    <th className="measurement-names-actions">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {customerMeasurements.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="py-10 text-center text-sm text-ink-muted">
                        {t('addsExtra.emptyNames')}
                      </td>
                    </tr>
                  ) : (
                    cmPagination.pageItems.map((row) => (
                      <tr
                        key={row.id}
                        className="cursor-pointer transition hover:bg-primary-soft/30"
                        onClick={() => setViewRecord({ kind: 'customerMeasurement', data: row })}
                      >
                        <td className="font-medium text-ink">{row.name}</td>
                        <td className="measurement-names-actions">
                          <div className="flex justify-center">
                            <TableRowActions
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
            <SectionTitle title={editingEmpId ? t('addsExtra.editEmployee') : t('addsExtra.addEmployee')} />
            <Input
              label={t('addsExtra.nameRequired')}
              value={empName}
              onChange={(e) => {
                setEmpName(e.target.value);
                setEmpErrors((p) => ({ ...p, name: '' }));
              }}
              error={empErrors.name}
            />
            <Input
              label={t('addsExtra.phoneRequired')}
              value={empPhone}
              onChange={(e) => {
                setEmpPhone(e.target.value);
                setEmpErrors((p) => ({ ...p, phone: '' }));
              }}
              error={empErrors.phone}
              placeholder="07xxxxxxxx"
            />
            <Input
              label={t('addsExtra.salary')}
              type="number"
              value={empSalary}
              onChange={(e) => setEmpSalary(e.target.value)}
            />
            <Button type="button" disabled={savingEmp} onClick={saveEmployee}>
              {savingEmp ? t('addsExtra.saving') : t('addsExtra.saveEmployee')}
            </Button>
          </div>
          <div className="space-y-3">
            {employees.map((emp) => (
              <div
                key={emp.id}
                role="button"
                tabIndex={0}
                className="panel cursor-pointer p-4 transition hover:bg-primary-soft/20"
                onClick={() => setViewRecord({ kind: 'employee', data: emp })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setViewRecord({ kind: 'employee', data: emp });
                  }
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-ink">{emp.name}</p>
                    <p className="text-sm text-ink-muted">{emp.phone}</p>
                    <p className="text-sm font-semibold text-success">؋{Number(emp.salary || 0).toLocaleString()}</p>
                  </div>
                  <TableRowActions
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
        subtitle={t('addsExtra.details')}
      >
        {viewRecord?.kind === 'orderType' && (
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-ink">{t('adds.measurements')}</p>
            <p className="text-ink-muted">{(viewRecord.data.measurements || []).join(', ') || '—'}</p>
            <p className="mt-3 font-semibold text-ink">{t('addsExtra.shakl')}</p>
            <p className="text-ink-muted">{(viewRecord.data.shapes || []).join(', ') || '—'}</p>
          </div>
        )}
        {viewRecord?.kind === 'employee' && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between rounded-lg bg-background px-3 py-2">
              <span className="text-ink-muted">{t('common.phone')}</span>
              <span className="font-semibold">{viewRecord.data.phone}</span>
            </div>
            <div className="flex justify-between rounded-lg bg-background px-3 py-2">
              <span className="text-ink-muted">{t('addsExtra.salary')}</span>
              <span className="font-semibold">؋{Number(viewRecord.data.salary || 0).toLocaleString()}</span>
            </div>
          </div>
        )}
        {viewRecord?.kind === 'customerMeasurement' && (
          <p className="text-sm text-ink-muted">{t('addsExtra.usedOnCustomer')}</p>
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
            notify.success(t('toasts.recordDeleted'));
          } catch (err) {
            notify.error(t('toasts.deleteFailed'), err.message);
          }
        }}
      />
    </PageShell>
  );
}
