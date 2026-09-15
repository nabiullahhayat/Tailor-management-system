/**
 * Transaction Service (Dakhal) — local storage
 */

import * as store from '../storage/localStore.js';

export const transactionService = {
  getAll: async () => store.getTransactions(),
  saveAll: async (transactions) => store.saveTransactions(transactions),
};
