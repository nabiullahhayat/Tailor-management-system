export const MENU_GROUPS = [
  {
    id: 'main',
    label: 'MAIN',
    items: [
      { id: 'overview', label: 'Dashboard', icon: 'LayoutGrid', path: '/' },
    ],
  },
  {
    id: 'orders',
    label: 'ORDERS',
    items: [
      { id: 'addOrder', label: 'New Order', icon: 'CirclePlus', path: '/orders/new' },
      { id: 'orders', label: 'All Orders', icon: 'Receipt', path: '/orders' },
    ],
  },
  {
    id: 'customers',
    label: 'CUSTOMERS',
    items: [
      { id: 'addCustomer', label: 'Add Customer', icon: 'UserPlus', path: '/customers/new' },
      { id: 'customers', label: 'Customers', icon: 'Users', path: '/customers' },
    ],
  },
  {
    id: 'adds',
    label: 'ADDS',
    items: [
      { id: 'adds', label: 'Adds', icon: 'Library', path: '/adds' },
    ],
  },
  {
    id: 'sales',
    label: 'SALES',
    items: [
      { id: 'fabricSale', label: 'Fabric Sale', icon: 'Scissors', path: '/sales/fabric' },
      { id: 'machinerySale', label: 'Machinery Sale', icon: 'Wrench', path: '/sales/machinery' },
      { id: 'sales', label: 'Sales History', icon: 'TrendingUp', path: '/sales' },
      { id: 'stock', label: 'Stock Management', icon: 'Package', path: '/stock' },
    ],
  },
  {
    id: 'finance',
    label: 'FINANCE',
    items: [
      { id: 'dakhal', label: 'Dakhal', icon: 'Wallet', path: '/dakhal' },
      { id: 'expenses', label: 'Expenses', icon: 'TrendingDown', path: '/expenses' },
    ],
  },
  {
    id: 'settings',
    label: 'SETTINGS',
    items: [
      { id: 'settings', label: 'Settings', icon: 'Settings', path: '/settings' },
    ],
  },
];

export const ALL_MENU_ITEMS = MENU_GROUPS.flatMap((g) => g.items);
