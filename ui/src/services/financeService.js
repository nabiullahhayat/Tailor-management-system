/**
 * Finance Service — income & Dakhal transaction recording
 */

import * as store from '../storage/localStore.js';

export const financeService = {
  recordIncomePayment: (data) => store.recordIncomePayment(data),
  recordExpensePayment: (data) => store.recordExpensePayment(data),
  recordOrderPayment: (id, data) => store.recordOrderPayment(id, data),
  recordSalePayment: (id, data) => store.recordSalePayment(id, data),
  getTransactions: () => store.getTransactions(),
  getIncome: () => store.getIncome(),
};
