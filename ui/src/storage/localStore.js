/**
 * Local data store backed by localStorage.
 * Replaces the backend API for frontend-only development.
 */

import AsyncStorage from './browserStorage.js';
import { STORAGE_KEYS } from './storageKeys.js';
import {
  MOCK_CUSTOMERS,
  MOCK_ORDERS,
  MOCK_SALES,
  MOCK_FABRICS,
  MOCK_MACHINERY,
  MOCK_STOCK_LOGS,
  MOCK_EXPENSES,
  MOCK_INCOME,
  MOCK_TRANSACTIONS,
  MOCK_SETTINGS,
  MOCK_ORDER_TYPES,
  MOCK_EMPLOYEES,
  MOCK_CUSTOMER_MEASUREMENT_FIELDS,
  MOCK_SALES_CUSTOMERS,
} from './mockData.js';

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const parseMeasurements = (value) => {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const stringifyMeasurements = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
};

const isSameDay = (dateStr, refDate) => {
  const d = new Date(dateStr);
  return (
    d.getFullYear() === refDate.getFullYear() &&
    d.getMonth() === refDate.getMonth() &&
    d.getDate() === refDate.getDate()
  );
};

const isSameMonth = (dateStr, refDate) => {
  const d = new Date(dateStr);
  return d.getFullYear() === refDate.getFullYear() && d.getMonth() === refDate.getMonth();
};

const sumAmounts = (items, dateField, amountField, filterFn) =>
  items.filter(filterFn).reduce((sum, item) => sum + (item[amountField] || 0), 0);

async function readCollection(key, fallback = []) {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeCollection(key, data) {
  await AsyncStorage.setItem(key, JSON.stringify(data));
}

let initPromise = null;

export async function initializeStore() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const initialized = await AsyncStorage.getItem(STORAGE_KEYS.initialized);
    if (initialized === 'true') return;

    await Promise.all([
      writeCollection(STORAGE_KEYS.customers, MOCK_CUSTOMERS),
      writeCollection(STORAGE_KEYS.salesCustomers, MOCK_SALES_CUSTOMERS),
      writeCollection(STORAGE_KEYS.orders, MOCK_ORDERS),
      writeCollection(STORAGE_KEYS.sales, MOCK_SALES),
      writeCollection(STORAGE_KEYS.fabrics, MOCK_FABRICS),
      writeCollection(STORAGE_KEYS.machinery, MOCK_MACHINERY),
      writeCollection(STORAGE_KEYS.stockLogs, MOCK_STOCK_LOGS),
      writeCollection(STORAGE_KEYS.expenses, MOCK_EXPENSES),
      writeCollection(STORAGE_KEYS.income, MOCK_INCOME),
      writeCollection(STORAGE_KEYS.transactions, MOCK_TRANSACTIONS),
      writeCollection(STORAGE_KEYS.orderTypes, MOCK_ORDER_TYPES),
      writeCollection(STORAGE_KEYS.employees, MOCK_EMPLOYEES),
      writeCollection(STORAGE_KEYS.customerMeasurementFields, MOCK_CUSTOMER_MEASUREMENT_FIELDS),
      AsyncStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(MOCK_SETTINGS)),
      AsyncStorage.setItem(STORAGE_KEYS.initialized, 'true'),
    ]);
  })();

  return initPromise;
}

function nextToken(prefix, items, field) {
  let max = 0;
  items.forEach((item) => {
    const token = item[field];
    if (!token) return;
    const num = parseInt(String(token).split('-')[1], 10);
    if (!Number.isNaN(num) && num > max) max = num;
  });
  return `${prefix}-${String(max + 1).padStart(4, '0')}`;
}

// ─── Customers ───────────────────────────────────────────────────────────────

export async function getCustomers() {
  await initializeStore();
  const customers = await readCollection(STORAGE_KEYS.customers);
  return customers.map((c) => ({
    ...c,
    measurements: parseMeasurements(c.measurements),
  }));
}

export async function getCustomerById(id) {
  const customers = await getCustomers();
  return customers.find((c) => c.id === id) || null;
}

export async function getCustomerByToken(tokenNumber) {
  const customers = await getCustomers();
  return customers.find((c) => c.tokenNumber === tokenNumber) || null;
}

export async function createCustomer({ name, phone, measurements }) {
  await initializeStore();
  const customers = await readCollection(STORAGE_KEYS.customers);
  const tokenNumber = nextToken('CUST', customers, 'tokenNumber');
  const now = new Date().toISOString();
  const customer = {
    id: generateId(),
    tokenNumber,
    name,
    phone,
    addedDate: now,
    measurements: parseMeasurements(measurements),
    createdAt: now,
    updatedAt: now,
  };
  customers.unshift(customer);
  await writeCollection(STORAGE_KEYS.customers, customers.map((c) => ({
    ...c,
    measurements: c.measurements,
  })));
  return customer;
}

export async function updateCustomer(id, { name, phone, measurements }) {
  await initializeStore();
  const customers = await readCollection(STORAGE_KEYS.customers);
  const index = customers.findIndex((c) => c.id === id);
  if (index === -1) throw new Error(`Customer not found with id: ${id}`);

  const updated = {
    ...customers[index],
    ...(name !== undefined && { name }),
    ...(phone !== undefined && { phone }),
    ...(measurements !== undefined && { measurements: parseMeasurements(measurements) }),
    updatedAt: new Date().toISOString(),
  };
  customers[index] = updated;
  await writeCollection(STORAGE_KEYS.customers, customers);
  return { ...updated, measurements: parseMeasurements(updated.measurements) };
}

export async function deleteCustomer(id) {
  await initializeStore();
  const customers = await readCollection(STORAGE_KEYS.customers);
  await writeCollection(STORAGE_KEYS.customers, customers.filter((c) => c.id !== id));
}

export async function getCustomerStats() {
  const customers = await getCustomers();
  return { total: customers.length };
}

// ─── Sales customers (fabric / machinery) ────────────────────────────────────

export async function getSalesCustomers() {
  await initializeStore();
  let list = await readCollection(STORAGE_KEYS.salesCustomers);
  if (list.length === 0) {
    const exists = await AsyncStorage.getItem(STORAGE_KEYS.salesCustomers);
    if (exists === null) {
      list = [...MOCK_SALES_CUSTOMERS];
      await writeCollection(STORAGE_KEYS.salesCustomers, list);
    }
  }
  return list.map((c) => ({
    ...c,
    creditBalance: Number(c.creditBalance || 0),
  }));
}

export async function adjustSalesCustomerCreditBalance(id, delta) {
  await initializeStore();
  const list = await readCollection(STORAGE_KEYS.salesCustomers);
  const index = list.findIndex((c) => c.id === id);
  if (index === -1) throw new Error('Sales customer not found');
  const next = Math.max(0, Number(list[index].creditBalance || 0) + Number(delta || 0));
  const updated = {
    ...list[index],
    creditBalance: next,
    updatedAt: new Date().toISOString(),
  };
  list[index] = updated;
  await writeCollection(STORAGE_KEYS.salesCustomers, list);
  return updated;
}

export async function createSalesCustomer({ name, phone = '' }) {
  await initializeStore();
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Customer name is required');
  const list = await getSalesCustomers();
  const duplicate = list.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
  if (duplicate) return { ...duplicate, creditBalance: Number(duplicate.creditBalance || 0) };
  const now = new Date().toISOString();
  const item = {
    id: generateId(),
    name: trimmed,
    phone: phone?.trim() || '',
    creditBalance: 0,
    addedDate: now,
    createdAt: now,
    updatedAt: now,
  };
  list.unshift(item);
  await writeCollection(STORAGE_KEYS.salesCustomers, list);
  return item;
}

export async function updateSalesCustomer(id, { name, phone }) {
  await initializeStore();
  const list = await getSalesCustomers();
  const index = list.findIndex((c) => c.id === id);
  if (index === -1) throw new Error('Sales customer not found');
  const nextName = name !== undefined ? name.trim() : list[index].name;
  const duplicate = list.some(
    (c) => c.id !== id && c.name.toLowerCase() === nextName.toLowerCase(),
  );
  if (duplicate) throw new Error('A sales customer with this name already exists');
  const updated = {
    ...list[index],
    ...(name !== undefined && { name: nextName }),
    ...(phone !== undefined && { phone: phone.trim() }),
    updatedAt: new Date().toISOString(),
  };
  list[index] = updated;
  await writeCollection(STORAGE_KEYS.salesCustomers, list);
  return updated;
}

export async function deleteSalesCustomer(id) {
  await initializeStore();
  const list = await getSalesCustomers();
  await writeCollection(
    STORAGE_KEYS.salesCustomers,
    list.filter((c) => c.id !== id),
  );
}

export async function findOrCreateSalesCustomer(name) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Customer name is required');
  const list = await getSalesCustomers();
  const found = list.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
  if (found) return found;
  return createSalesCustomer({ name: trimmed });
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export async function getOrders() {
  await initializeStore();
  return readCollection(STORAGE_KEYS.orders);
}

export async function getOrderById(id) {
  const orders = await getOrders();
  return orders.find((o) => o.id === id) || null;
}

export async function getOrderByToken(tokenNumber) {
  const orders = await getOrders();
  return orders.find((o) => o.tokenNumber === tokenNumber) || null;
}

export async function createOrder(orderData) {
  await initializeStore();
  const orders = await readCollection(STORAGE_KEYS.orders);
  const orderNum = orders.length + 1;
  const tokenNumber = nextToken('ORD', orders, 'tokenNumber');
  const invoiceNumber = `INV-${String(orderNum).padStart(4, '0')}`;
  const now = new Date().toISOString();

  const order = {
    id: generateId(),
    tokenNumber,
    invoiceNumber,
    customerId: orderData.customerId || null,
    customerName: orderData.customerName,
    orderType: orderData.orderType,
    orderTypeId: orderData.orderTypeId || null,
    measurements: stringifyMeasurements(orderData.measurements),
    color: orderData.color || '',
    pricePerOne: parseFloat(orderData.pricePerOne || 0),
    quantity: parseFloat(orderData.quantity || 1),
    employeeId: orderData.employeeId || null,
    employeeName: orderData.employeeName || '',
    orderDateSolar: orderData.orderDateSolar || '',
    deliveryDate: orderData.deliveryDate,
    totalAmount: parseFloat(orderData.totalAmount),
    notes: orderData.notes || '',
    status: 'Finding',
    orderDate: now,
    paymentStatus: orderData.paymentStatus || 'Pending',
    paidAmount: parseFloat(orderData.paidAmount || 0),
    createdAt: now,
    updatedAt: now,
  };

  orders.unshift(order);
  await writeCollection(STORAGE_KEYS.orders, orders);
  return order;
}

export async function updateOrder(id, data) {
  await initializeStore();
  const orders = await readCollection(STORAGE_KEYS.orders);
  const index = orders.findIndex((o) => o.id === id);
  if (index === -1) throw new Error(`Order not found with id: ${id}`);

  const updated = {
    ...orders[index],
    ...data,
    ...(data.measurements !== undefined && { measurements: stringifyMeasurements(data.measurements) }),
    updatedAt: new Date().toISOString(),
  };
  orders[index] = updated;
  await writeCollection(STORAGE_KEYS.orders, orders);
  return updated;
}

export async function updateOrderStatus(id, status) {
  return updateOrder(id, { status });
}

export async function updateOrderPayment(id, paymentData) {
  return updateOrder(id, paymentData);
}

export async function deleteOrder(id) {
  await initializeStore();
  const orders = await readCollection(STORAGE_KEYS.orders);
  await writeCollection(STORAGE_KEYS.orders, orders.filter((o) => o.id !== id));
}

export async function getOrderStats() {
  const orders = await getOrders();
  return { total: orders.length };
}

// ─── Order Types & Employees (Adds) ─────────────────────────────────────────

export async function getOrderTypes() {
  await initializeStore();
  let types = await readCollection(STORAGE_KEYS.orderTypes);
  if (types.length === 0) {
    const exists = await AsyncStorage.getItem(STORAGE_KEYS.orderTypes);
    if (exists === null) {
      types = [...MOCK_ORDER_TYPES];
      await writeCollection(STORAGE_KEYS.orderTypes, types);
    }
  }
  return types;
}

export async function createOrderType(data) {
  await initializeStore();
  const types = await getOrderTypes();
  const now = new Date().toISOString();
  const item = {
    id: generateId(),
    name: data.name.trim(),
    measurements: (data.measurements || []).filter((m) => m && m.trim()).map((m) => m.trim()),
    createdAt: now,
    updatedAt: now,
  };
  types.unshift(item);
  await writeCollection(STORAGE_KEYS.orderTypes, types);
  return item;
}

export async function updateOrderType(id, data) {
  await initializeStore();
  const types = await getOrderTypes();
  const index = types.findIndex((t) => t.id === id);
  if (index === -1) throw new Error('Order type not found');
  const updated = {
    ...types[index],
    ...data,
    name: data.name !== undefined ? data.name.trim() : types[index].name,
    measurements: data.measurements !== undefined
      ? data.measurements.filter((m) => m && m.trim()).map((m) => m.trim())
      : types[index].measurements,
    updatedAt: new Date().toISOString(),
  };
  types[index] = updated;
  await writeCollection(STORAGE_KEYS.orderTypes, types);
  return updated;
}

export async function deleteOrderType(id) {
  await initializeStore();
  const types = await getOrderTypes();
  await writeCollection(STORAGE_KEYS.orderTypes, types.filter((t) => t.id !== id));
}

export async function getEmployees() {
  await initializeStore();
  let employees = await readCollection(STORAGE_KEYS.employees);
  if (employees.length === 0) {
    const exists = await AsyncStorage.getItem(STORAGE_KEYS.employees);
    if (exists === null) {
      employees = [...MOCK_EMPLOYEES];
      await writeCollection(STORAGE_KEYS.employees, employees);
    }
  }
  return employees;
}

export async function createEmployee(data) {
  await initializeStore();
  const employees = await getEmployees();
  const now = new Date().toISOString();
  const item = {
    id: generateId(),
    name: data.name.trim(),
    phone: data.phone.trim(),
    salary: parseFloat(data.salary || 0),
    createdAt: now,
    updatedAt: now,
  };
  employees.unshift(item);
  await writeCollection(STORAGE_KEYS.employees, employees);
  return item;
}

export async function updateEmployee(id, data) {
  await initializeStore();
  const employees = await getEmployees();
  const index = employees.findIndex((e) => e.id === id);
  if (index === -1) throw new Error('Employee not found');
  const updated = {
    ...employees[index],
    ...data,
    name: data.name !== undefined ? data.name.trim() : employees[index].name,
    phone: data.phone !== undefined ? data.phone.trim() : employees[index].phone,
    salary: data.salary !== undefined ? parseFloat(data.salary) : employees[index].salary,
    updatedAt: new Date().toISOString(),
  };
  employees[index] = updated;
  await writeCollection(STORAGE_KEYS.employees, employees);
  return updated;
}

export async function deleteEmployee(id) {
  await initializeStore();
  const employees = await getEmployees();
  await writeCollection(STORAGE_KEYS.employees, employees.filter((e) => e.id !== id));
}

export async function getCustomerMeasurementFields() {
  await initializeStore();
  let fields = await readCollection(STORAGE_KEYS.customerMeasurementFields);
  if (fields.length === 0) {
    const exists = await AsyncStorage.getItem(STORAGE_KEYS.customerMeasurementFields);
    if (exists === null) {
      fields = [...MOCK_CUSTOMER_MEASUREMENT_FIELDS];
      await writeCollection(STORAGE_KEYS.customerMeasurementFields, fields);
    }
  }
  return fields;
}

export async function createCustomerMeasurementField(data) {
  await initializeStore();
  const fields = await getCustomerMeasurementFields();
  const name = data.name.trim();
  const duplicate = fields.some((f) => f.name.toLowerCase() === name.toLowerCase());
  if (duplicate) throw new Error('A measurement with this name already exists.');
  const now = new Date().toISOString();
  const item = { id: generateId(), name, createdAt: now, updatedAt: now };
  fields.unshift(item);
  await writeCollection(STORAGE_KEYS.customerMeasurementFields, fields);
  return item;
}

export async function updateCustomerMeasurementField(id, data) {
  await initializeStore();
  const fields = await getCustomerMeasurementFields();
  const index = fields.findIndex((f) => f.id === id);
  if (index === -1) throw new Error('Measurement field not found');
  const name = data.name !== undefined ? data.name.trim() : fields[index].name;
  const duplicate = fields.some(
    (f) => f.id !== id && f.name.toLowerCase() === name.toLowerCase(),
  );
  if (duplicate) throw new Error('A measurement with this name already exists.');
  const updated = {
    ...fields[index],
    name,
    updatedAt: new Date().toISOString(),
  };
  fields[index] = updated;
  await writeCollection(STORAGE_KEYS.customerMeasurementFields, fields);
  return updated;
}

export async function deleteCustomerMeasurementField(id) {
  await initializeStore();
  const fields = await getCustomerMeasurementFields();
  await writeCollection(
    STORAGE_KEYS.customerMeasurementFields,
    fields.filter((f) => f.id !== id),
  );
}

// ─── Sales ───────────────────────────────────────────────────────────────────

export async function getSales() {
  await initializeStore();
  return readCollection(STORAGE_KEYS.sales);
}

export async function getSaleById(id) {
  const sales = await getSales();
  return sales.find((s) => s.id === id) || null;
}

export async function getSaleByInvoice(invoiceNumber) {
  const sales = await getSales();
  return sales.find((s) => s.invoiceNumber === invoiceNumber) || null;
}

export async function createSale(saleData) {
  await initializeStore();

  if (saleData.saleType === 'Fabric Sale' && saleData.fabricId) {
    const fabric = await getFabricById(saleData.fabricId);
    if (!fabric) throw new Error('Fabric not found');
    const meters = parseFloat(saleData.meters || 0);
    if (meters <= 0) throw new Error('Invalid fabric quantity');
    if (meters > parseFloat(fabric.stock || 0)) {
      throw new Error(`Insufficient fabric stock. Available: ${fabric.stock}m`);
    }
  }

  if (saleData.saleType === 'Machinery Sale' && saleData.machineryId) {
    const item = await getMachineryById(saleData.machineryId);
    if (!item) throw new Error('Machinery not found');
    const qty = parseFloat(saleData.quantity || 0);
    if (qty <= 0) throw new Error('Invalid machinery quantity');
    if (qty > parseFloat(item.stock || 0)) {
      throw new Error(`Insufficient machinery stock. Available: ${item.stock} units`);
    }
  }

  const sales = await readCollection(STORAGE_KEYS.sales);
  const invoiceNumber = nextToken('SINV', sales, 'invoiceNumber');
  const now = new Date().toISOString();

  const sale = {
    id: generateId(),
    invoiceNumber,
    customerId: saleData.customerId || null,
    salesCustomerId: saleData.salesCustomerId || null,
    customerName: saleData.customerName,
    saleType: saleData.saleType,
    productName: saleData.productName,
    fabricId: saleData.fabricId || null,
    machineryId: saleData.machineryId || null,
    meters: saleData.meters ?? null,
    quantity: saleData.quantity ?? null,
    unitPrice: parseFloat(saleData.unitPrice),
    totalAmount: parseFloat(saleData.totalAmount),
    paymentStatus: saleData.paymentStatus || 'Pending',
    paidAmount: parseFloat(saleData.paidAmount || 0),
    notes: saleData.notes || '',
    saleDate: now,
    createdAt: now,
    updatedAt: now,
  };

  sales.unshift(sale);
  await writeCollection(STORAGE_KEYS.sales, sales);

  if (sale.saleType === 'Fabric Sale' && sale.fabricId) {
    await adjustFabric(sale.fabricId, {
      quantity: parseFloat(sale.meters),
      transactionType: 'out',
      notes: `Sale ${invoiceNumber}`,
    });
  }

  if (sale.saleType === 'Machinery Sale' && sale.machineryId) {
    await adjustMachinery(sale.machineryId, {
      quantity: parseFloat(sale.quantity),
      transactionType: 'out',
      notes: `Sale ${invoiceNumber}`,
    });
  }

  return sale;
}

export async function updateSale(id, data) {
  await initializeStore();
  const sales = await readCollection(STORAGE_KEYS.sales);
  const index = sales.findIndex((s) => s.id === id);
  if (index === -1) throw new Error(`Sale not found with id: ${id}`);

  const updated = { ...sales[index], ...data, updatedAt: new Date().toISOString() };
  sales[index] = updated;
  await writeCollection(STORAGE_KEYS.sales, sales);
  return updated;
}

export async function updateSalePayment(id, paymentData) {
  return updateSale(id, paymentData);
}

export async function deleteSale(id) {
  await initializeStore();
  const sales = await readCollection(STORAGE_KEYS.sales);
  await writeCollection(STORAGE_KEYS.sales, sales.filter((s) => s.id !== id));
}

export async function getSaleStats() {
  const sales = await getSales();
  return { total: sales.length };
}

// ─── Stock ───────────────────────────────────────────────────────────────────

export async function getFabrics() {
  await initializeStore();
  return readCollection(STORAGE_KEYS.fabrics);
}

export async function getFabricById(id) {
  const fabrics = await getFabrics();
  return fabrics.find((f) => f.id === id) || null;
}

export async function createFabric(fabricData) {
  await initializeStore();
  const fabrics = await readCollection(STORAGE_KEYS.fabrics);
  const now = new Date().toISOString();
  const fabric = {
    id: generateId(),
    ...fabricData,
    unit: 'meters',
    dateAdded: now,
    createdAt: now,
    updatedAt: now,
  };
  fabrics.unshift(fabric);
  await writeCollection(STORAGE_KEYS.fabrics, fabrics);
  return fabric;
}

export async function updateFabric(id, fabricData) {
  await initializeStore();
  const fabrics = await readCollection(STORAGE_KEYS.fabrics);
  const index = fabrics.findIndex((f) => f.id === id);
  if (index === -1) throw new Error(`Fabric not found with id: ${id}`);
  const updated = { ...fabrics[index], ...fabricData, updatedAt: new Date().toISOString() };
  fabrics[index] = updated;
  await writeCollection(STORAGE_KEYS.fabrics, fabrics);
  return updated;
}

export async function adjustFabric(id, { quantity, transactionType, notes }) {
  const fabric = await getFabricById(id);
  if (!fabric) throw new Error(`Fabric not found with id: ${id}`);
  const delta = transactionType === 'out' ? -Math.abs(quantity) : Math.abs(quantity);
  return updateFabric(id, { stock: Math.max(0, fabric.stock + delta), notes: notes || fabric.notes });
}

export async function deleteFabric(id) {
  await initializeStore();
  const fabrics = await readCollection(STORAGE_KEYS.fabrics);
  await writeCollection(STORAGE_KEYS.fabrics, fabrics.filter((f) => f.id !== id));
}

export async function getMachinery() {
  await initializeStore();
  return readCollection(STORAGE_KEYS.machinery);
}

export async function getMachineryById(id) {
  const machinery = await getMachinery();
  return machinery.find((m) => m.id === id) || null;
}

export async function createMachinery(machineryData) {
  await initializeStore();
  const machinery = await readCollection(STORAGE_KEYS.machinery);
  const now = new Date().toISOString();
  const item = {
    id: generateId(),
    ...machineryData,
    unit: 'units',
    dateAdded: now,
    createdAt: now,
    updatedAt: now,
  };
  machinery.unshift(item);
  await writeCollection(STORAGE_KEYS.machinery, machinery);
  return item;
}

export async function updateMachinery(id, machineryData) {
  await initializeStore();
  const machinery = await readCollection(STORAGE_KEYS.machinery);
  const index = machinery.findIndex((m) => m.id === id);
  if (index === -1) throw new Error(`Machinery not found with id: ${id}`);
  const updated = { ...machinery[index], ...machineryData, updatedAt: new Date().toISOString() };
  machinery[index] = updated;
  await writeCollection(STORAGE_KEYS.machinery, machinery);
  return updated;
}

export async function adjustMachinery(id, { quantity, transactionType, notes }) {
  const item = await getMachineryById(id);
  if (!item) throw new Error(`Machinery not found with id: ${id}`);
  const delta = transactionType === 'out' ? -Math.abs(quantity) : Math.abs(quantity);
  return updateMachinery(id, { stock: Math.max(0, item.stock + delta), notes: notes || item.notes });
}

export async function deleteMachinery(id) {
  await initializeStore();
  const machinery = await readCollection(STORAGE_KEYS.machinery);
  await writeCollection(STORAGE_KEYS.machinery, machinery.filter((m) => m.id !== id));
}

export async function getStockLogs() {
  await initializeStore();
  return readCollection(STORAGE_KEYS.stockLogs);
}

export async function getStockStats() {
  const [fabrics, machinery] = await Promise.all([getFabrics(), getMachinery()]);
  return {
    fabricCount: fabrics.length,
    machineryCount: machinery.length,
    lowFabricStock: fabrics.filter((f) => f.stock < 10),
    lowMachineryStock: machinery.filter((m) => m.stock < 3),
  };
}

// ─── Expenses ────────────────────────────────────────────────────────────────

export async function getExpenses() {
  await initializeStore();
  return readCollection(STORAGE_KEYS.expenses);
}

export async function saveExpenses(expenses) {
  await writeCollection(STORAGE_KEYS.expenses, expenses);
}

export async function addExpenseRecord(expense) {
  await initializeStore();
  const expenses = await getExpenses();
  const newExpense = { ...expense, id: expense.id || generateId() };
  expenses.unshift(newExpense);
  await saveExpenses(expenses);
  return newExpense;
}

const EXPENSE_TYPE_MAP = {
  Fabric: 'Fabric Purchase',
  Machinery: 'Machinery Purchase',
  Other: 'Other Expense',
};

const EXPENSE_ICON_MAP = {
  Fabric: 'layers-outline',
  Machinery: 'settings-outline',
  Other: 'ellipsis-horizontal-outline',
  'Fabric Purchase': 'layers-outline',
  'Machinery Purchase': 'settings-outline',
  'Other Expense': 'ellipsis-horizontal-outline',
};

export async function recordExpensePayment({
  category,
  title,
  type,
  amount,
  referenceId = null,
  referenceType = null,
  date,
  description = '',
  status = 'Paid',
  expenseId = null,
}) {
  const expenseAmount = parseFloat(amount);
  if (!expenseAmount || expenseAmount <= 0) return null;

  const expenseDate = date || new Date().toISOString().split('T')[0];
  const typeLabel = type || EXPENSE_TYPE_MAP[category] || 'Other Expense';

  const expense = await addExpenseRecord({
    id: expenseId || undefined,
    name: title,
    category: category || 'Other',
    amount: expenseAmount,
    date: expenseDate,
    description,
    fromStock: referenceType === 'stock',
  });

  const transactions = await getTransactions();
  const transaction = {
    id: generateId(),
    icon: EXPENSE_ICON_MAP[category] || EXPENSE_ICON_MAP[typeLabel] || 'cash-outline',
    title,
    type: typeLabel,
    category: 'expense',
    amount: expenseAmount,
    date: expenseDate,
    status,
    referenceId: referenceId || expense.id,
    referenceType: referenceType || 'expense',
  };
  transactions.unshift(transaction);
  await saveTransactions(transactions);

  return { expense, transaction };
}

export async function addExpense(expense) {
  return recordExpensePayment({
    category: expense.category,
    title: expense.name,
    type: EXPENSE_TYPE_MAP[expense.category],
    amount: expense.amount,
    date: expense.date,
    description: expense.description || '',
    expenseId: expense.id,
    referenceType: expense.fromStock ? 'stock' : 'expense',
  });
}

export async function updateExpense(id, data) {
  await initializeStore();
  const expenses = await getExpenses();
  const index = expenses.findIndex((e) => e.id === id);
  if (index === -1) throw new Error('Expense not found');
  const updated = { ...expenses[index], ...data };
  expenses[index] = updated;
  await saveExpenses(expenses);
  return updated;
}

export async function deleteExpense(id) {
  await initializeStore();
  const expenses = await getExpenses();
  await saveExpenses(expenses.filter((e) => e.id !== id));
}

export async function purchaseFabricStock(entry) {
  const { fabricId, itemName, supplier, quantity, purchasePrice, totalCost, date, notes } = entry;
  await adjustFabric(fabricId, {
    quantity,
    transactionType: 'in',
    notes: notes || (supplier ? `Purchased from ${supplier}` : 'Stock purchase'),
  });
  const amount = totalCost || Number(quantity) * Number(purchasePrice);
  return recordExpensePayment({
    category: 'Fabric',
    title: itemName,
    type: 'Fabric Purchase',
    amount,
    date,
    description: `${quantity} @ ₹${purchasePrice}${supplier ? ` from ${supplier}` : ''}${notes ? `. ${notes}` : ''}`,
    referenceId: fabricId,
    referenceType: 'stock',
  });
}

export async function purchaseMachineryStock(entry) {
  const { machineryId, itemName, supplier, quantity, purchasePrice, totalCost, date, notes } = entry;
  await adjustMachinery(machineryId, {
    quantity,
    transactionType: 'in',
    notes: notes || (supplier ? `Purchased from ${supplier}` : 'Stock purchase'),
  });
  const amount = totalCost || Number(quantity) * Number(purchasePrice);
  return recordExpensePayment({
    category: 'Machinery',
    title: itemName,
    type: 'Machinery Purchase',
    amount,
    date,
    description: `${quantity} @ ₹${purchasePrice}${supplier ? ` from ${supplier}` : ''}${notes ? `. ${notes}` : ''}`,
    referenceId: machineryId,
    referenceType: 'stock',
  });
}

// ─── Income ──────────────────────────────────────────────────────────────────

export async function getIncome() {
  await initializeStore();
  return readCollection(STORAGE_KEYS.income);
}

export async function addIncomeRecord(incomeData) {
  await initializeStore();
  const income = await readCollection(STORAGE_KEYS.income);
  const now = new Date().toISOString();
  const record = {
    id: generateId(),
    source: incomeData.source,
    description: incomeData.description,
    amount: parseFloat(incomeData.amount),
    paymentMethod: incomeData.paymentMethod || 'Cash',
    incomeDate: incomeData.incomeDate || now,
    orderId: incomeData.orderId || null,
    saleId: incomeData.saleId || null,
    notes: incomeData.notes || '',
    createdAt: now,
    updatedAt: now,
  };
  income.unshift(record);
  await writeCollection(STORAGE_KEYS.income, income);
  return record;
}

const INCOME_ICON_MAP = {
  'Order Payment': 'receipt-outline',
  'Fabric Sale': 'cut-outline',
  'Machinery Sale': 'construct-outline',
};

export async function recordIncomePayment({
  source,
  title,
  type,
  amount,
  referenceId = null,
  referenceType = null,
  status = 'Completed',
}) {
  const paidAmount = parseFloat(amount);
  if (!paidAmount || paidAmount <= 0) return null;

  const today = new Date().toISOString().split('T')[0];
  const income = await addIncomeRecord({
    source,
    description: title,
    amount: paidAmount,
    orderId: referenceType === 'order' ? referenceId : null,
    saleId: referenceType === 'sale' ? referenceId : null,
  });

  const transactions = await getTransactions();
  const transaction = {
    id: generateId(),
    icon: INCOME_ICON_MAP[source] || 'cash-outline',
    title: source,
    type: type || source,
    category: 'income',
    amount: paidAmount,
    date: today,
    status,
    referenceId,
    referenceType,
  };
  transactions.unshift(transaction);
  await saveTransactions(transactions);

  return { income, transaction };
}

export async function recordOrderPayment(id, { paidAmount, markDelivered = false }) {
  const orders = await readCollection(STORAGE_KEYS.orders);
  const index = orders.findIndex((o) => o.id === id);
  if (index === -1) throw new Error(`Order not found with id: ${id}`);

  const order = orders[index];
  const newPaid = parseFloat(paidAmount);
  const previousPaid = parseFloat(order.paidAmount || 0);
  const delta = newPaid - previousPaid;
  const total = parseFloat(order.totalAmount || 0);

  let paymentStatus = 'Pending';
  if (newPaid >= total && total > 0) paymentStatus = 'Paid';
  else if (newPaid > 0) paymentStatus = 'Partial';

  const updated = {
    ...order,
    paidAmount: newPaid,
    paymentStatus,
    ...(markDelivered ? { status: 'Delivered' } : {}),
    updatedAt: new Date().toISOString(),
  };
  orders[index] = updated;
  await writeCollection(STORAGE_KEYS.orders, orders);

  if (delta > 0) {
    await recordIncomePayment({
      source: 'Order Payment',
      title: `Payment for ${order.tokenNumber} — ${order.customerName}`,
      type: 'Customer Order Payment',
      amount: delta,
      referenceId: id,
      referenceType: 'order',
      status: markDelivered ? 'Completed' : 'Pending',
    });
  }

  return updated;
}

export async function recordSalePayment(id, { paidAmount, markPaid = true }) {
  const sales = await readCollection(STORAGE_KEYS.sales);
  const index = sales.findIndex((s) => s.id === id);
  if (index === -1) throw new Error(`Sale not found with id: ${id}`);

  const sale = sales[index];
  const newPaid = parseFloat(paidAmount);
  const previousPaid = parseFloat(sale.paidAmount || 0);
  const delta = newPaid - previousPaid;
  const total = parseFloat(sale.totalAmount || 0);

  let paymentStatus = sale.paymentStatus || 'Pending';
  if (markPaid || (newPaid >= total && total > 0)) paymentStatus = 'Paid';
  else if (newPaid > 0) paymentStatus = 'Partial';

  const updated = {
    ...sale,
    paidAmount: newPaid,
    paymentStatus,
    updatedAt: new Date().toISOString(),
  };
  sales[index] = updated;
  await writeCollection(STORAGE_KEYS.sales, sales);

  if (delta > 0) {
    await recordIncomePayment({
      source: sale.saleType,
      title: `${sale.saleType} — ${sale.productName}`,
      type: sale.saleType,
      amount: delta,
      referenceId: id,
      referenceType: 'sale',
    });
  }

  return updated;
}

// ─── Transactions (Dakhal) ───────────────────────────────────────────────────

export async function getTransactions() {
  await initializeStore();
  return readCollection(STORAGE_KEYS.transactions);
}

export async function saveTransactions(transactions) {
  await writeCollection(STORAGE_KEYS.transactions, transactions);
}

// ─── Settings ────────────────────────────────────────────────────────────────

export async function getSettings() {
  await initializeStore();
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.settings);
  if (!raw) return { ...MOCK_SETTINGS };
  try {
    return JSON.parse(raw);
  } catch {
    return { ...MOCK_SETTINGS };
  }
}

export async function updateSettings(updates) {
  const current = await getSettings();
  const updated = { ...current, ...updates };
  await AsyncStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(updated));
  return updated;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export async function getDashboardOverview() {
  await initializeStore();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [customers, orders, sales, income, expenses, fabrics, machinery] = await Promise.all([
    getCustomers(),
    getOrders(),
    getSales(),
    getIncome(),
    getExpenses(),
    getFabrics(),
    getMachinery(),
  ]);

  const todayOrders = orders.filter((o) => isSameDay(o.orderDate, today)).length;

  const todayIncomeFromRecords = sumAmounts(income, 'incomeDate', 'amount', (i) =>
    isSameDay(i.incomeDate, today)
  );
  const todayIncomeFromSales = sumAmounts(sales, 'saleDate', 'totalAmount', (s) =>
    isSameDay(s.saleDate, today) && s.paymentStatus === 'Paid'
  );
  const todayIncome = todayIncomeFromRecords + todayIncomeFromSales;

  const todayExpensesFromRecords = sumAmounts(
    expenses.map((e) => ({ ...e, expenseDate: e.date })),
    'expenseDate',
    'amount',
    (e) => isSameDay(e.date, today)
  );

  const monthlyIncomeFromRecords = sumAmounts(income, 'incomeDate', 'amount', (i) =>
    isSameMonth(i.incomeDate, today)
  );
  const monthlyIncomeFromSales = sumAmounts(sales, 'saleDate', 'totalAmount', (s) =>
    isSameMonth(s.saleDate, today) && s.paymentStatus === 'Paid'
  );
  const monthlyIncome = monthlyIncomeFromRecords + monthlyIncomeFromSales;

  const monthlyExpenses = sumAmounts(
    expenses.map((e) => ({ ...e, expenseDate: e.date })),
    'expenseDate',
    'amount',
    (e) => isSameMonth(e.date, today)
  );

  const pendingOrders = orders.filter((o) => ['Finding', 'Ready'].includes(o.status)).length;

  const ordersByStatus = ['Finding', 'Ready', 'Delivered'].map((status) => ({
    status,
    count: orders.filter((o) => o.status === status).length,
  }));

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
    .slice(0, 5);

  const recentCustomers = [...customers]
    .sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate))
    .slice(0, 5)
    .map(({ id, tokenNumber, name, phone, addedDate }) => ({
      id, tokenNumber, name, phone, addedDate,
    }));

  const pendingOrderPayments = orders
    .filter((o) => o.paymentStatus === 'Pending')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const pendingSalePayments = sales
    .filter((s) => s.paymentStatus === 'Pending')
    .reduce((sum, s) => sum + (s.totalAmount || 0), 0);

  const lowFabricStock = fabrics
    .filter((f) => f.stock < 10)
    .map(({ id, name, stock, pricePerMeter }) => ({ id, name, stock, pricePerMeter }));

  const lowMachineryStock = machinery
    .filter((m) => m.stock < 3)
    .map(({ id, name, stock, unitPrice }) => ({ id, name, stock, unitPrice }));

  return {
    today: {
      orders: todayOrders,
      income: todayIncome,
      expenses: todayExpensesFromRecords,
      profit: todayIncome - todayExpensesFromRecords,
    },
    overview: {
      totalCustomers: customers.length,
      pendingOrders,
      ordersByStatus,
    },
    monthly: {
      income: monthlyIncome,
      expenses: monthlyExpenses,
      profit: monthlyIncome - monthlyExpenses,
    },
    payments: {
      pendingOrders: pendingOrderPayments,
      pendingSales: pendingSalePayments,
      total: pendingOrderPayments + pendingSalePayments,
    },
    recent: {
      orders: recentOrders,
      customers: recentCustomers,
    },
    stockAlerts: {
      fabric: lowFabricStock,
      machinery: lowMachineryStock,
      totalAlerts: lowFabricStock.length + lowMachineryStock.length,
    },
  };
}

export async function getSalesAnalytics(period = '7days') {
  const sales = await getSales();
  const startDate = new Date();
  switch (period) {
    case '30days': startDate.setDate(startDate.getDate() - 30); break;
    case 'thisMonth': startDate.setDate(1); break;
    default: startDate.setDate(startDate.getDate() - 7);
  }
  const filtered = sales.filter((s) => new Date(s.saleDate) >= startDate);
  return { salesByType: [], dailySales: filtered };
}

export async function getRevenueAnalytics(period = '7days') {
  const [income, expenses] = await Promise.all([getIncome(), getExpenses()]);
  const startDate = new Date();
  switch (period) {
    case '30days': startDate.setDate(startDate.getDate() - 30); break;
    case 'thisMonth': startDate.setDate(1); break;
    default: startDate.setDate(startDate.getDate() - 7);
  }
  const filteredIncome = income.filter((i) => new Date(i.incomeDate) >= startDate);
  const filteredExpenses = expenses.filter((e) => new Date(e.date) >= startDate);
  const totalIncome = filteredIncome.reduce((s, i) => s + i.amount, 0);
  const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  return {
    summary: { totalIncome, totalExpenses, profit: totalIncome - totalExpenses },
    breakdown: { incomeBySource: [], expensesByCategory: [] },
  };
}

export async function getTopCustomers(limit = 10) {
  const customers = await getCustomers();
  const [orders, sales] = await Promise.all([getOrders(), getSales()]);

  return customers
    .map((customer) => {
      const customerOrders = orders.filter((o) => o.customerId === customer.id);
      const customerSales = sales.filter((s) => s.customerId === customer.id);
      const orderTotal = customerOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const saleTotal = customerSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
      return {
        id: customer.id,
        tokenNumber: customer.tokenNumber,
        name: customer.name,
        phone: customer.phone,
        orderCount: customerOrders.length,
        saleCount: customerSales.length,
        totalSpent: orderTotal + saleTotal,
        orderTotal,
        saleTotal,
      };
    })
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, parseInt(limit, 10));
}
