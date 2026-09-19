/**
 * Order Service — local storage
 */

import * as store from '../storage/localStore.js';

export const orderService = {
  getAll: async () => store.getOrders(),
  getById: async (id) => store.getOrderById(id),
  getByToken: async (tokenNumber) => store.getOrderByToken(tokenNumber),
  create: async (orderData) => store.createOrder(orderData),
  update: async (id, orderData) => store.updateOrder(id, orderData),
  updateStatus: async (id, status) => store.updateOrderStatus(id, status),
  updatePayment: async (id, paymentData) => store.updateOrderPayment(id, paymentData),
  recordPayment: async (id, paymentData) => store.recordOrderPayment(id, paymentData),
  setPaidAmount: async (id, data) => store.setOrderPaidAmount(id, data),
  delete: async (id) => { await store.deleteOrder(id); return { success: true }; },
  getStats: async () => store.getOrderStats(),
};
