/**
 * Adds Service — order types, employees & customer measurement fields
 */

import * as store from '../storage/localStore.js';

export const addsService = {
  getOrderTypes: async () => store.getOrderTypes(),
  createOrderType: async (data) => store.createOrderType(data),
  updateOrderType: async (id, data) => store.updateOrderType(id, data),
  deleteOrderType: async (id) => store.deleteOrderType(id),

  getEmployees: async () => store.getEmployees(),
  createEmployee: async (data) => store.createEmployee(data),
  updateEmployee: async (id, data) => store.updateEmployee(id, data),
  deleteEmployee: async (id) => store.deleteEmployee(id),

  getCustomerMeasurementFields: async () => store.getCustomerMeasurementFields(),
  createCustomerMeasurementField: async (data) => store.createCustomerMeasurementField(data),
  updateCustomerMeasurementField: async (id, data) => store.updateCustomerMeasurementField(id, data),
  deleteCustomerMeasurementField: async (id) => store.deleteCustomerMeasurementField(id),
};
