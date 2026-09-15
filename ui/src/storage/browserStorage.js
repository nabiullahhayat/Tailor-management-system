/**
 * AsyncStorage-compatible wrapper around localStorage for the web app.
 */

export default {
  getItem(key) {
    try {
      return Promise.resolve(localStorage.getItem(key));
    } catch {
      return Promise.resolve(null);
    }
  },

  setItem(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (err) {
      console.error('localStorage setItem failed:', err);
    }
    return Promise.resolve();
  },

  removeItem(key) {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.error('localStorage removeItem failed:', err);
    }
    return Promise.resolve();
  },
};
