/**
 * Sales customer balances: outstanding debt (per sale) + prepaid credit wallet.
 */

function matchSalesCustomerId(sale, salesCustomers) {
  if (sale.salesCustomerId) return sale.salesCustomerId;
  const name = (sale.customerName || '').trim().toLowerCase();
  if (!name) return null;
  const found = salesCustomers.find((c) => c.name.toLowerCase() === name);
  return found?.id ?? null;
}

export function buildSalesCustomerBalanceMap(salesCustomers, sales) {
  const map = {};
  (salesCustomers || []).forEach((c) => {
    map[c.id] = {
      totalAmount: 0,
      paidAmount: 0,
      creditRemaining: 0,
      prepaidCredit: Number(c.creditBalance || 0),
      saleCount: 0,
    };
  });

  (sales || []).forEach((sale) => {
    const id = matchSalesCustomerId(sale, salesCustomers);
    if (!id || !map[id]) return;
    const total = Number(sale.totalAmount || 0);
    const paid = Number(sale.paidAmount || 0);
    const remaining = Math.max(0, total - paid);
    map[id].totalAmount += total;
    map[id].paidAmount += paid;
    map[id].creditRemaining += remaining;
    map[id].saleCount += 1;
  });

  return map;
}

export function getSalesForCustomer(salesCustomerId, customerName, sales, salesCustomers) {
  const nameLower = (customerName || '').trim().toLowerCase();
  return (sales || []).filter((sale) => {
    if (sale.salesCustomerId === salesCustomerId) return true;
    if (!sale.salesCustomerId && nameLower && sale.customerName?.toLowerCase() === nameLower) {
      return true;
    }
    const matched = matchSalesCustomerId(sale, salesCustomers);
    return matched === salesCustomerId;
  });
}

export function getSalesWithCredit(customerSales) {
  return (customerSales || [])
    .map((sale) => ({
      sale,
      remaining: Math.max(0, Number(sale.totalAmount || 0) - Number(sale.paidAmount || 0)),
    }))
    .filter((row) => row.remaining > 0)
    .sort((a, b) => new Date(a.sale.saleDate || 0) - new Date(b.sale.saleDate || 0));
}

export function allocateCreditPayment(customerSales, paymentAmount) {
  const amount = Math.max(0, parseFloat(paymentAmount) || 0);
  if (amount === 0) return { allocations: [], applied: 0, unapplied: amount };

  let left = amount;
  const allocations = [];
  for (const { sale, remaining } of getSalesWithCredit(customerSales)) {
    if (left <= 0) break;
    const apply = Math.min(left, remaining);
    const newPaid = Number(sale.paidAmount || 0) + apply;
    const total = Number(sale.totalAmount || 0);
    allocations.push({
      sale,
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
 * Prepaid credit applies to this sale first (up to total), then cash on the balance;
 * cash beyond what's due → prepaid credit again.
 */
export function previewSaleCheckout(customer, saleTotal, cashPaid) {
  const total = Math.max(0, Number(saleTotal) || 0);
  const cash = Math.max(0, parseFloat(cashPaid) || 0);
  const prepaid = Number(customer?.creditBalance || 0);
  const walletUsed = Math.min(prepaid, total);
  const dueAfterCredit = total - walletUsed;
  const cashOnSale = Math.min(cash, dueAfterCredit);
  const salePaid = walletUsed + cashOnSale;
  const surplus = Math.max(0, cash - dueAfterCredit);

  return {
    cashAppliedToDebt: 0,
    walletUsed,
    amountDueAfterCredit: dueAfterCredit,
    cashOnThisSale: cashOnSale,
    salePaidAmount: salePaid,
    saleRemaining: total - salePaid,
    paymentStatus: paymentStatusFor(total, salePaid),
    surplusToPrepaid: surplus,
    newPrepaidCredit: Math.max(0, prepaid - walletUsed + surplus),
    debtAllocations: [],
  };
}

export async function executeSaleCheckout({ customer, saleTotal, cashPaid, adjustWallet }) {
  const preview = previewSaleCheckout(customer, saleTotal, cashPaid);
  const walletDelta = -preview.walletUsed + preview.surplusToPrepaid;

  if (walletDelta !== 0 && adjustWallet) {
    await adjustWallet(customer.id, walletDelta);
  }

  return preview;
}

export async function applySalesCustomerCreditPayment(
  customer,
  paymentAmount,
  sales,
  salesCustomers,
  recordPayment,
  adjustWallet,
) {
  const customerSales = getSalesForCustomer(customer.id, customer.name, sales, salesCustomers);
  const { allocations, unapplied } = allocateCreditPayment(customerSales, paymentAmount);

  for (const { sale, newPaidAmount, markPaid } of allocations) {
    await recordPayment(sale.id, {
      paidAmount: newPaidAmount,
      paymentStatus: markPaid ? 'Paid' : 'Partial',
    });
  }

  if (unapplied > 0 && adjustWallet) {
    await adjustWallet(customer.id, unapplied);
  }

  return { applied: paymentAmount - unapplied, addedToPrepaid: unapplied };
}
