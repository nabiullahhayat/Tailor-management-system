/**
 * Customer Service — local storage
 */

import * as store from '../storage/localStore.js';

export const customerService = {
  getAll: async () => store.getCustomers(),
  getById: async (id) => store.getCustomerById(id),
  getByToken: async (tokenNumber) => store.getCustomerByToken(tokenNumber),
  create: async (customerData) => store.createCustomer(customerData),
  update: async (id, customerData) => store.updateCustomer(id, customerData),
  delete: async (id) => { await store.deleteCustomer(id); return { success: true }; },
  adjustCreditBalance: async (id, delta) => store.adjustCustomerCreditBalance(id, delta),
  getStats: async () => store.getCustomerStats(),
};
