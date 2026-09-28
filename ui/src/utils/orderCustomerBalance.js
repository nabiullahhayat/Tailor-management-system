/**
 * Order customer balances: debt from unpaid orders + prepaid credit on customer record.
 */

function matchCustomerId(order, customers) {
  if (order.customerId) return order.customerId;
  const name = (order.customerName || '').trim().toLowerCase();
  if (!name) return null;
  const found = customers.find((c) => c.name.toLowerCase() === name);
  return found?.id ?? null;
}

export function buildOrderCustomerBalanceMap(customers, orders) {
  const map = {};
  (customers || []).forEach((c) => {
    map[c.id] = {
      totalAmount: 0,
      paidAmount: 0,
      creditRemaining: 0,
      prepaidCredit: Number(c.creditBalance || 0),
      orderCount: 0,
    };
  });

  (orders || []).forEach((order) => {
    const id = matchCustomerId(order, customers);
    if (!id || !map[id]) return;
    const total = Number(order.totalAmount || 0);
    const paid = Number(order.paidAmount || 0);
    const remaining = Math.max(0, total - paid);
    map[id].totalAmount += total;
    map[id].paidAmount += paid;
    map[id].creditRemaining += remaining;
    map[id].orderCount += 1;
  });

  return map;
}

export function getOrdersForCustomer(customerId, customerName, orders, customers) {
  const nameLower = (customerName || '').trim().toLowerCase();
  return (orders || []).filter((order) => {
    if (order.customerId === customerId) return true;
    if (!order.customerId && nameLower && order.customerName?.toLowerCase() === nameLower) {
      return true;
    }
    return matchCustomerId(order, customers) === customerId;
  });
}

export function getOrdersWithDebt(customerOrders) {
  return (customerOrders || [])
    .map((order) => ({
      order,
      remaining: Math.max(0, Number(order.totalAmount || 0) - Number(order.paidAmount || 0)),
    }))
    .filter((row) => row.remaining > 0)
    .sort((a, b) => new Date(a.order.orderDate || 0) - new Date(b.order.orderDate || 0));
}

export function allocateOrderDebtPayment(customerOrders, paymentAmount, priorityOrderId = null) {
  const amount = Math.max(0, parseFloat(paymentAmount) || 0);
  if (amount === 0) return { allocations: [], applied: 0, unapplied: 0 };

  let withDebt = getOrdersWithDebt(customerOrders);
  if (priorityOrderId) {
    const priority = withDebt.find((row) => row.order.id === priorityOrderId);
    const rest = withDebt.filter((row) => row.order.id !== priorityOrderId);
    withDebt = priority ? [priority, ...rest] : withDebt;
  }

  let left = amount;
  const allocations = [];
  for (const { order, remaining } of withDebt) {
    if (left <= 0) break;
    const apply = Math.min(left, remaining);
    const newPaid = Number(order.paidAmount || 0) + apply;
    const total = Number(order.totalAmount || 0);
    allocations.push({
      order,
      newPaidAmount: newPaid,
      markPaid: newPaid >= total && total > 0,
    });
    left -= apply;
  }

  return {
    allocations,
    applied: amount - left,
    unapplied: left,
  };
}

function paymentStatusFor(total, paid) {
  if (total > 0 && paid >= total) return 'Paid';
  if (paid > 0) return 'Partial';
  return 'Pending';
}

/**
 * Preview new order checkout:
 * 1) Wallet + cash pay this order (up to order total)
 * 2) Leftover cash reduces old order debt
 * 3) Any cash still left → prepaid credit
 */
export function previewOrderCheckout(customer, orderTotal, cashPaid, walletUsed, orders, customers) {
  const total = Math.max(0, Number(orderTotal) || 0);
  const cash = Math.max(0, parseFloat(cashPaid) || 0);
  const prepaid = Number(customer?.creditBalance || 0);
  const manualWallet = parseFloat(walletUsed);
  let wallet =
    walletUsed !== undefined && walletUsed !== '' && !Number.isNaN(manualWallet)
      ? Math.min(Math.max(0, manualWallet), prepaid)
      : Math.min(prepaid, total);

  const towardOrder = wallet + cash;
  const orderPaid = Math.min(total, towardOrder);
  const walletUsedOnOrder = Math.min(wallet, orderPaid);
  const cashUsedOnOrder = orderPaid - walletUsedOnOrder;

  const cashForDebt = cash - cashUsedOnOrder;
  const customerOrders = getOrdersForCustomer(customer.id, customer.name, orders, customers);
  const debtResult = allocateOrderDebtPayment(customerOrders, cashForDebt);
  const cashAppliedToDebt = debtResult.applied;
  const surplusToPrepaid = debtResult.unapplied;
  const walletDelta = -walletUsedOnOrder + surplusToPrepaid;

  return {
    cashUsedOnOrder,
    cashAppliedToDebt,
    walletUsed: walletUsedOnOrder,
    orderPaidAmount: orderPaid,
    orderRemaining: total - orderPaid,
    paymentStatus: paymentStatusFor(total, orderPaid),
    surplusToPrepaid,
    newPrepaidCredit: Math.max(0, prepaid + walletDelta),
    debtAllocations: debtResult.allocations,
  };
}

export async function executeOrderCheckout({
  customer,
  orderTotal,
  cashPaid,
  walletUsed,
  orders,
  customers,
  applyOrderPayment,
  adjustWallet,
}) {
  const preview = previewOrderCheckout(customer, orderTotal, cashPaid, walletUsed, orders, customers);

  for (const { order, newPaidAmount, markPaid } of preview.debtAllocations || []) {
    await applyOrderPayment(order.id, {
      paidAmount: newPaidAmount,
      paymentStatus: markPaid ? 'Paid' : 'Partial',
    });
  }

  const walletDelta = -preview.walletUsed + preview.surplusToPrepaid;
  if (walletDelta !== 0) {
    await adjustWallet(customer.id, walletDelta);
  }

  return preview;
}

export async function applyOrderCustomerCashPayment(
  customer,
  paymentAmount,
  orders,
  customers,
  applyOrderPayment,
  adjustWallet,
  priorityOrderId = null,
) {
  const customerOrders = getOrdersForCustomer(customer.id, customer.name, orders, customers);
  const { allocations, unapplied } = allocateOrderDebtPayment(
    customerOrders,
    paymentAmount,
    priorityOrderId,
  );

  for (const { order, newPaidAmount, markPaid } of allocations) {
    await applyOrderPayment(order.id, {
      paidAmount: newPaidAmount,
      paymentStatus: markPaid ? 'Paid' : 'Partial',
    });
  }

  if (unapplied > 0 && adjustWallet) {
    await adjustWallet(customer.id, unapplied);
  }

  return { applied: paymentAmount - unapplied, addedToPrepaid: unapplied };
}
