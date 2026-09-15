/**
 * Sale Service — local storage
 */

import * as store from '../storage/localStore.js';

export const saleService = {
  getAll: async () => store.getSales(),
  getById: async (id) => store.getSaleById(id),
  getByInvoice: async (invoiceNumber) => store.getSaleByInvoice(invoiceNumber),
  create: async (saleData) => store.createSale(saleData),
  update: async (id, saleData) => store.updateSale(id, saleData),
  updatePayment: async (id, paymentData) => store.updateSalePayment(id, paymentData),
  recordPayment: async (id, paymentData) => store.recordSalePayment(id, paymentData),
  delete: async (id) => { await store.deleteSale(id); return { success: true }; },
  getStats: async () => store.getSaleStats(),
};
