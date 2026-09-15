/**
 * Stock Service — local storage
 */

import * as store from '../storage/localStore.js';

export const stockService = {
  getStats: async () => store.getStockStats(),
  getLogs: async () => store.getStockLogs(),

  fabric: {
    getAll: async () => store.getFabrics(),
    getById: async (id) => store.getFabricById(id),
    create: async (fabricData) => store.createFabric(fabricData),
    update: async (id, fabricData) => store.updateFabric(id, fabricData),
    adjust: async (id, adjustmentData) => store.adjustFabric(id, adjustmentData),
    purchaseStock: async (entry) => store.purchaseFabricStock(entry),
    delete: async (id) => { await store.deleteFabric(id); return { success: true }; },
  },

  machinery: {
    getAll: async () => store.getMachinery(),
    getById: async (id) => store.getMachineryById(id),
    create: async (machineryData) => store.createMachinery(machineryData),
    update: async (id, machineryData) => store.updateMachinery(id, machineryData),
    adjust: async (id, adjustmentData) => store.adjustMachinery(id, adjustmentData),
    purchaseStock: async (entry) => store.purchaseMachineryStock(entry),
    delete: async (id) => { await store.deleteMachinery(id); return { success: true }; },
  },
};
