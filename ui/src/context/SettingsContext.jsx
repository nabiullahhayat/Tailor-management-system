import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { settingsService } from '../services/index.js';

const DEFAULT_APP_NAME = 'Khayati';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [appName, setAppName] = useState(DEFAULT_APP_NAME);
  const [language, setLanguage] = useState('pashto');
  const [loaded, setLoaded] = useState(false);

  const refreshSettings = useCallback(async () => {
    try {
      const settings = await settingsService.get();
      if (settings.appName?.trim()) setAppName(settings.appName.trim());
      if (settings.language) setLanguage(settings.language);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const saveSettings = useCallback(async (updates) => {
    await settingsService.update(updates);
    if (updates.appName?.trim()) setAppName(updates.appName.trim());
    if (updates.language) setLanguage(updates.language);
  }, []);

  return (
    <SettingsContext.Provider value={{ appName, language, loaded, refreshSettings, saveSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
