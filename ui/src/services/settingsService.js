/**
 * Settings Service — local storage
 */

import * as store from '../storage/localStore.js';

async function uploadAppIconToFolder(file) {
  const buffer = await file.arrayBuffer();
  const res = await fetch('/api/app-icon', {
    method: 'POST',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: buffer,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Could not save icon to icone folder');
  }
  return res.json();
}

export const settingsService = {
  get: async () => store.getSettings(),
  update: async (updates) => store.updateSettings(updates),
  uploadAppIcon: async (file) => {
    const { compressAppIconFile, isAppIconDataUrlTooLarge } = await import('../utils/appIcon.js');
    try {
      const { path, version } = await uploadAppIconToFolder(file);
      return store.updateSettings({
        appIconPath: path,
        appIconVersion: version,
        appIconDataUrl: '',
      });
    } catch (err) {
      console.warn('App icon folder upload unavailable, using compressed fallback:', err.message);
      const dataUrl = await compressAppIconFile(file);
      if (isAppIconDataUrlTooLarge(dataUrl)) {
        throw new Error(
          'Image is too large to store. Run the app with npm run dev so the icon can save to public/icone.',
        );
      }
      return store.updateSettings({
        appIconPath: '',
        appIconVersion: Date.now(),
        appIconDataUrl: dataUrl,
      });
    }
  },
  removeAppIcon: async () => {
    try {
      await fetch('/api/app-icon', { method: 'DELETE' });
    } catch {
      /* ignore */
    }
    return store.updateSettings({
      appIconPath: '',
      appIconVersion: 0,
      appIconDataUrl: '',
    });
  },
};
