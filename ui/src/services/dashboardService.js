/**
 * Dashboard Service — local storage
 */

import * as store from '../storage/localStore.js';

export const dashboardService = {
  getOverview: async () => store.getDashboardOverview(),
  getSalesAnalytics: async (params = {}) => store.getSalesAnalytics(params.period),
  getRevenueAnalytics: async (params = {}) => store.getRevenueAnalytics(params.period),
  getTopCustomers: async (params = {}) => store.getTopCustomers(params.limit),
};
