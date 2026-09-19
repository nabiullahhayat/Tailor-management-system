const now = new Date();
const today = now.toISOString().split('T')[0];
const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

export const MOCK_CUSTOMERS = [
  {
    id: 'cust-1',
    tokenNumber: 'CUST-0001',
    name: 'Ahmad Raza',
    phone: '0712345678',
    addedDate: `${thisMonth}-01T10:00:00.000Z`,
    measurements: {
      height: '172', shoulder: '44', sleeves: '24', neck: '15', skirtLength: '',
      pantLength: '40', waist: '34', legsWidth: '22', sleeveHead: '16', armsLength: '23',
      pantFaq: '12', pantWidth: '18', chest: '40', hips: '38', legWidth: '20',
      color: 'Navy Blue', quantity: '2',
    },
    createdAt: `${thisMonth}-01T10:00:00.000Z`,
    updatedAt: `${thisMonth}-01T10:00:00.000Z`,
  },
  {
    id: 'cust-2',
    tokenNumber: 'CUST-0002',
    name: 'Sara Ahmed',
    phone: '0798765432',
    addedDate: `${thisMonth}-02T10:00:00.000Z`,
    measurements: {
      height: '160', shoulder: '38', sleeves: '21', neck: '13', skirtLength: '36',
      pantLength: '38', waist: '28', legsWidth: '18', sleeveHead: '14', armsLength: '20',
      pantFaq: '10', pantWidth: '16', chest: '34', hips: '36', legWidth: '17',
      color: 'White', quantity: '1',
    },
    createdAt: `${thisMonth}-02T10:00:00.000Z`,
    updatedAt: `${thisMonth}-02T10:00:00.000Z`,
  },
  {
    id: 'cust-3',
    tokenNumber: 'CUST-0003',
    name: 'Ali Khan',
    phone: '0756781234',
    addedDate: `${thisMonth}-03T10:00:00.000Z`,
    measurements: null,
    createdAt: `${thisMonth}-03T10:00:00.000Z`,
    updatedAt: `${thisMonth}-03T10:00:00.000Z`,
  },
];

export const MOCK_ORDER_TYPES = [
  {
    id: 'ot-1',
    name: 'Shirt',
    measurements: ['Height', 'Shoulder', 'Sleeve', 'Chest', 'Waist'],
    createdAt: `${thisMonth}-01T08:00:00.000Z`,
    updatedAt: `${thisMonth}-01T08:00:00.000Z`,
  },
  {
    id: 'ot-2',
    name: 'Pant',
    measurements: ['Waist', 'Hip', 'Pant Length', 'Leg Width'],
    createdAt: `${thisMonth}-01T08:00:00.000Z`,
    updatedAt: `${thisMonth}-01T08:00:00.000Z`,
  },
  {
    id: 'ot-3',
    name: 'Suit',
    measurements: ['Height', 'Shoulder', 'Chest', 'Sleeve', 'Waist', 'Pant Length'],
    createdAt: `${thisMonth}-01T08:00:00.000Z`,
    updatedAt: `${thisMonth}-01T08:00:00.000Z`,
  },
];

const cmfTs = `${thisMonth}-01T08:00:00.000Z`;
export const MOCK_CUSTOMER_MEASUREMENT_FIELDS = [
  'Height', 'Shoulder', 'Sleeves', 'Neck', 'Skirt Length', 'Pant Length', 'Waist',
  'Legs Width', 'Sleeve Head', 'Arms Length', 'Pant Faq', 'Pant Width', 'Chest', 'Hips', 'Leg Width',
].map((name, i) => ({
  id: `cmf-${i + 1}`,
  name,
  createdAt: cmfTs,
  updatedAt: cmfTs,
}));

export const MOCK_SALES_CUSTOMERS = [];

export const MOCK_EMPLOYEES = [
  {
    id: 'emp-1',
    name: 'Karimullah',
    phone: '0700111222',
    salary: 15000,
    createdAt: `${thisMonth}-01T08:00:00.000Z`,
    updatedAt: `${thisMonth}-01T08:00:00.000Z`,
  },
  {
    id: 'emp-2',
    name: 'Nasir',
    phone: '0700333444',
    salary: 12000,
    createdAt: `${thisMonth}-01T08:00:00.000Z`,
    updatedAt: `${thisMonth}-01T08:00:00.000Z`,
  },
];

export const MOCK_ORDERS = [
  {
    id: 'order-1',
    tokenNumber: 'ORD-0001',
    invoiceNumber: 'INV-0001',
    customerId: 'cust-1',
    customerName: 'Ahmad Raza',
    orderType: 'Shirt',
    measurements: JSON.stringify({ chest: '40', waist: '34', shoulder: '44', sleeves: '24' }),
    deliveryDate: `${thisMonth}-15T00:00:00.000Z`,
    totalAmount: 1200,
    notes: 'Blue color preferred',
    status: 'Delivered',
    orderDate: `${thisMonth}-05T09:00:00.000Z`,
    paymentStatus: 'Paid',
    paidAmount: 1200,
    createdAt: `${thisMonth}-05T09:00:00.000Z`,
    updatedAt: `${thisMonth}-05T09:00:00.000Z`,
  },
  {
    id: 'order-2',
    tokenNumber: 'ORD-0002',
    invoiceNumber: 'INV-0002',
    customerId: 'cust-2',
    customerName: 'Sara Ahmed',
    orderType: 'Suit',
    measurements: JSON.stringify({ chest: '36', waist: '30', shoulder: '38' }),
    deliveryDate: `${thisMonth}-20T00:00:00.000Z`,
    totalAmount: 3500,
    notes: '',
    status: 'Finding',
    orderDate: `${thisMonth}-08T09:00:00.000Z`,
    paymentStatus: 'Pending',
    paidAmount: 0,
    createdAt: `${thisMonth}-08T09:00:00.000Z`,
    updatedAt: `${thisMonth}-08T09:00:00.000Z`,
  },
  {
    id: 'order-3',
    tokenNumber: 'ORD-0003',
    invoiceNumber: 'INV-0003',
    customerId: 'cust-3',
    customerName: 'Ali Khan',
    orderType: 'Pant',
    measurements: JSON.stringify({ waist: '32', pantLength: '30', hips: '38' }),
    deliveryDate: `${thisMonth}-18T00:00:00.000Z`,
    totalAmount: 800,
    notes: '',
    status: 'Ready',
    orderDate: `${thisMonth}-10T09:00:00.000Z`,
    paymentStatus: 'Pending',
    paidAmount: 0,
    createdAt: `${thisMonth}-10T09:00:00.000Z`,
    updatedAt: `${thisMonth}-10T09:00:00.000Z`,
  },
];

export const MOCK_FABRICS = [
  { id: 'fabric-1', name: 'Cotton Fabric', pricePerMeter: 150, stock: 120, unit: 'meters', supplier: 'Karachi Mills', supplierContact: '', notes: '', dateAdded: `${thisMonth}-01T08:00:00.000Z`, createdAt: `${thisMonth}-01T08:00:00.000Z`, updatedAt: `${thisMonth}-01T08:00:00.000Z` },
  { id: 'fabric-2', name: 'Silk Fabric', pricePerMeter: 500, stock: 8, unit: 'meters', supplier: 'Lahore Textiles', supplierContact: '', notes: 'Premium quality', dateAdded: `${thisMonth}-01T08:00:00.000Z`, createdAt: `${thisMonth}-01T08:00:00.000Z`, updatedAt: `${thisMonth}-01T08:00:00.000Z` },
  { id: 'fabric-3', name: 'Denim Fabric', pricePerMeter: 200, stock: 45, unit: 'meters', supplier: 'Faisalabad Co.', supplierContact: '', notes: '', dateAdded: `${thisMonth}-01T08:00:00.000Z`, createdAt: `${thisMonth}-01T08:00:00.000Z`, updatedAt: `${thisMonth}-01T08:00:00.000Z` },
  { id: 'fabric-4', name: 'Linen Fabric', pricePerMeter: 180, stock: 60, unit: 'meters', supplier: 'Karachi Mills', supplierContact: '', notes: '', dateAdded: `${thisMonth}-01T08:00:00.000Z`, createdAt: `${thisMonth}-01T08:00:00.000Z`, updatedAt: `${thisMonth}-01T08:00:00.000Z` },
  { id: 'fabric-5', name: 'Woolen Fabric', pricePerMeter: 350, stock: 30, unit: 'meters', supplier: 'Islamabad Co.', supplierContact: '', notes: 'Winter stock', dateAdded: `${thisMonth}-01T08:00:00.000Z`, createdAt: `${thisMonth}-01T08:00:00.000Z`, updatedAt: `${thisMonth}-01T08:00:00.000Z` },
];

export const MOCK_MACHINERY = [
  { id: 'mach-1', name: 'Sewing Machine', unitPrice: 25000, stock: 5, unit: 'units', supplier: 'Tech Traders', supplierContact: '', notes: '', dateAdded: `${thisMonth}-01T08:00:00.000Z`, createdAt: `${thisMonth}-01T08:00:00.000Z`, updatedAt: `${thisMonth}-01T08:00:00.000Z` },
  { id: 'mach-2', name: 'Overlock Machine', unitPrice: 30000, stock: 2, unit: 'units', supplier: 'Machine World', supplierContact: '', notes: 'Low stock', dateAdded: `${thisMonth}-01T08:00:00.000Z`, createdAt: `${thisMonth}-01T08:00:00.000Z`, updatedAt: `${thisMonth}-01T08:00:00.000Z` },
  { id: 'mach-3', name: 'Embroidery Machine', unitPrice: 45000, stock: 3, unit: 'units', supplier: 'Tech Traders', supplierContact: '', notes: '', dateAdded: `${thisMonth}-01T08:00:00.000Z`, createdAt: `${thisMonth}-01T08:00:00.000Z`, updatedAt: `${thisMonth}-01T08:00:00.000Z` },
  { id: 'mach-4', name: 'Button Machine', unitPrice: 8000, stock: 8, unit: 'units', supplier: 'Local Supplier', supplierContact: '', notes: '', dateAdded: `${thisMonth}-01T08:00:00.000Z`, createdAt: `${thisMonth}-01T08:00:00.000Z`, updatedAt: `${thisMonth}-01T08:00:00.000Z` },
];

export const MOCK_SALES = [
  {
    id: 'sale-1',
    invoiceNumber: 'SINV-0001',
    customerId: null,
    customerName: 'Ali Raza',
    saleType: 'Fabric Sale',
    productName: 'Cotton Fabric',
    meters: 5,
    quantity: null,
    unitPrice: 150,
    totalAmount: 750,
    paymentStatus: 'Paid',
    paidAmount: 750,
    notes: '',
    saleDate: `${thisMonth}-06T11:00:00.000Z`,
    createdAt: `${thisMonth}-06T11:00:00.000Z`,
    updatedAt: `${thisMonth}-06T11:00:00.000Z`,
  },
  {
    id: 'sale-2',
    invoiceNumber: 'SINV-0002',
    customerId: null,
    customerName: 'Sara Ahmad',
    saleType: 'Machinery Sale',
    productName: 'Sewing Machine',
    meters: null,
    quantity: 1,
    unitPrice: 25000,
    totalAmount: 25000,
    paymentStatus: 'Pending',
    paidAmount: 0,
    notes: 'Delivery next week',
    saleDate: `${thisMonth}-07T11:00:00.000Z`,
    createdAt: `${thisMonth}-07T11:00:00.000Z`,
    updatedAt: `${thisMonth}-07T11:00:00.000Z`,
  },
];

export const MOCK_STOCK_LOGS = [
  { id: 'log-1', fabricId: 'fabric-1', machineryId: null, category: 'fabric', transactionType: 'in', quantity: 100, notes: 'Initial stock purchase', date: `${thisMonth}-01T08:00:00.000Z`, createdAt: `${thisMonth}-01T08:00:00.000Z` },
  { id: 'log-2', fabricId: 'fabric-2', machineryId: null, category: 'fabric', transactionType: 'in', quantity: 20, notes: 'Premium silk import', date: `${thisMonth}-02T08:00:00.000Z`, createdAt: `${thisMonth}-02T08:00:00.000Z` },
  { id: 'log-3', fabricId: 'fabric-1', machineryId: null, category: 'fabric', transactionType: 'out', quantity: 5, notes: 'Sale to Ali Raza', date: `${thisMonth}-06T11:00:00.000Z`, createdAt: `${thisMonth}-06T11:00:00.000Z` },
];

export const MOCK_EXPENSES = [
  { id: 'exp-1', name: 'Cotton Fabric Roll', category: 'Fabric', amount: 4500, date: today, description: 'Premium cotton, 50 meters', fromStock: true },
  { id: 'exp-2', name: 'Sewing Machine Oil', category: 'Machinery', amount: 350, date: `${thisMonth}-22`, description: 'Maintenance lubricant', fromStock: false },
  { id: 'exp-3', name: 'Office Stationery', category: 'Other', amount: 220, date: `${thisMonth}-20`, description: 'Pens, notebooks etc.', fromStock: false },
  { id: 'exp-4', name: 'Linen Fabric', category: 'Fabric', amount: 3200, date: `${thisMonth}-18`, description: 'Linen 30 meters', fromStock: true },
  { id: 'exp-5', name: 'Needle Set', category: 'Machinery', amount: 180, date: `${thisMonth}-15`, description: 'Industrial needles pack', fromStock: false },
  { id: 'exp-6', name: 'Electricity Bill', category: 'Other', amount: 950, date: `${thisMonth}-10`, description: 'Monthly utility bill', fromStock: false },
];

export const MOCK_INCOME = [
  { id: 'inc-1', source: 'Order Payment', description: 'Payment for ORD-0001', amount: 1200, paymentMethod: 'Cash', incomeDate: `${thisMonth}-05T12:00:00.000Z`, notes: 'Full payment received', createdAt: `${thisMonth}-05T12:00:00.000Z`, updatedAt: `${thisMonth}-05T12:00:00.000Z` },
  { id: 'inc-2', source: 'Fabric Sale', description: 'Cotton fabric sale', amount: 750, paymentMethod: 'Cash', incomeDate: `${thisMonth}-06T12:00:00.000Z`, notes: '', createdAt: `${thisMonth}-06T12:00:00.000Z`, updatedAt: `${thisMonth}-06T12:00:00.000Z` },
];

export const MOCK_TRANSACTIONS = [
  { id: 'tx-1', icon: 'receipt-outline', title: 'Order Payment', type: 'Customer Order Payment', category: 'income', amount: 3500, date: today, status: 'Completed' },
  { id: 'tx-2', icon: 'cut-outline', title: 'Fabric Sale', type: 'Fabric Sale', category: 'income', amount: 1800, date: `${thisMonth}-24`, status: 'Completed' },
  { id: 'tx-3', icon: 'layers-outline', title: 'Fabric Purchase', type: 'Fabric Purchase', category: 'expense', amount: 2200, date: `${thisMonth}-23`, status: 'Paid' },
  { id: 'tx-4', icon: 'construct-outline', title: 'Machinery Sale', type: 'Machinery Sale', category: 'income', amount: 8000, date: `${thisMonth}-22`, status: 'Completed' },
  { id: 'tx-5', icon: 'settings-outline', title: 'Machinery Purchase', type: 'Machinery Purchase', category: 'expense', amount: 5000, date: `${thisMonth}-21`, status: 'Paid' },
  { id: 'tx-6', icon: 'receipt-outline', title: 'Order Payment', type: 'Customer Order Payment', category: 'income', amount: 1500, date: `${thisMonth}-20`, status: 'Pending' },
  { id: 'tx-7', icon: 'ellipsis-horizontal-outline', title: 'Office Supplies', type: 'Other Expense', category: 'expense', amount: 400, date: `${thisMonth}-19`, status: 'Paid' },
  { id: 'tx-8', icon: 'cut-outline', title: 'Fabric Sale', type: 'Fabric Sale', category: 'income', amount: 2600, date: `${thisMonth}-18`, status: 'Completed' },
];

export const MOCK_SETTINGS = {
  language: 'pashto',
  appName: 'Khayati',
  shopName: 'Khayati Tailor Shop',
  shopPhone: '0712345678',
  shopAddress: 'Main Market, City Center',
  currency: 'PKR',
};

/** Default settings for new installs (no demo shop details). */
export const DEFAULT_APP_SETTINGS = {
  language: 'pashto',
  appName: 'Khayati',
  shopName: '',
  shopPhone: '',
  shopAddress: '',
  currency: 'PKR',
};

/** IDs of sample records seeded in early app versions — stripped on load. */
export function collectDemoRecordIds() {
  const ids = (arr) => (arr || []).map((x) => x.id).filter(Boolean);
  return new Set([
    ...ids(MOCK_CUSTOMERS),
    ...ids(MOCK_ORDERS),
    ...ids(MOCK_SALES),
    ...ids(MOCK_FABRICS),
    ...ids(MOCK_MACHINERY),
    ...ids(MOCK_STOCK_LOGS),
    ...ids(MOCK_EXPENSES),
    ...ids(MOCK_INCOME),
    ...ids(MOCK_TRANSACTIONS),
    ...ids(MOCK_ORDER_TYPES),
    ...ids(MOCK_EMPLOYEES),
    ...ids(MOCK_CUSTOMER_MEASUREMENT_FIELDS),
  ]);
}
