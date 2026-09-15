/**
 * Settings Service — local storage
 */

import * as store from '../storage/localStore.js';

export const settingsService = {
  get: async () => store.getSettings(),
  update: async (updates) => store.updateSettings(updates),
};
