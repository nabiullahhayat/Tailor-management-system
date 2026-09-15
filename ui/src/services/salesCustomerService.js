/**
 * Sales customers — fabric & machinery buyers (no measurements)
 */

import * as store from '../storage/localStore.js';

export const salesCustomerService = {
  getAll: async () => store.getSalesCustomers(),
  create: async (data) => store.createSalesCustomer(data),
  update: async (id, data) => store.updateSalesCustomer(id, data),
  delete: async (id) => {
    await store.deleteSalesCustomer(id);
    return { success: true };
  },
  findOrCreateByName: async (name) => store.findOrCreateSalesCustomer(name),
  adjustCreditBalance: async (id, delta) => store.adjustSalesCustomerCreditBalance(id, delta),
};
