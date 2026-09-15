/**
 * Expense Service — local storage
 */

import * as store from '../storage/localStore.js';

export const expenseService = {
  getAll: async () => store.getExpenses(),
  add: async (expense) => store.addExpense(expense),
  update: async (id, data) => store.updateExpense(id, data),
  delete: async (id) => store.deleteExpense(id),
  saveAll: async (expenses) => store.saveExpenses(expenses),
};
