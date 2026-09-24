import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { settingsService } from '../services/index.js';
import { resolveAppIconDisplayUrl } from '../utils/appIcon.js';
import i18n from '../i18n/index.js';
import { applyDocumentLanguage, toI18nCode } from '../i18n/languages.js';

const DEFAULT_APP_NAME = 'Khayati';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [appName, setAppName] = useState(DEFAULT_APP_NAME);
  const [language, setLanguage] = useState('pashto');
  const [appIconUrl, setAppIconUrl] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const applySettings = useCallback((settings) => {
    if (settings.appName?.trim()) setAppName(settings.appName.trim());
    if (settings.language) setLanguage(settings.language);
    setAppIconUrl(resolveAppIconDisplayUrl(settings));
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      const settings = await settingsService.get();
      applySettings(settings);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoaded(true);
    }
  }, [applySettings]);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  useEffect(() => {
    const { code } = applyDocumentLanguage(language);
    if (i18n.language !== code) i18n.changeLanguage(toI18nCode(language));
  }, [language]);

  const saveSettings = useCallback(
    async (updates) => {
      const updated = await settingsService.update(updates);
      applySettings(updated);
    },
    [applySettings],
  );

  const uploadAppIcon = useCallback(
    async (file) => {
      const updated = await settingsService.uploadAppIcon(file);
      applySettings(updated);
      return updated;
    },
    [applySettings],
  );

  const removeAppIcon = useCallback(async () => {
    const updated = await settingsService.removeAppIcon();
    applySettings(updated);
    return updated;
  }, [applySettings]);

  return (
    <SettingsContext.Provider
      value={{
        appName,
        language,
        appIconUrl,
        loaded,
        refreshSettings,
        saveSettings,
        uploadAppIcon,
        removeAppIcon,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
