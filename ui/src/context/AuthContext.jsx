import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { settingsService } from '../services/index.js';

const SESSION_KEY = 'toiler_auth_session';
const DEFAULT_EMAIL = 'admin@gmail.com';
const DEFAULT_PASSWORD = 'nabiullahadmin@2070';

const AuthContext = createContext(null);

function readSession() {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

function writeSession(active) {
  try {
    if (active) sessionStorage.setItem(SESSION_KEY, '1');
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function AuthProvider({ children }) {
  const [authenticated, setAuthenticated] = useState(readSession);
  const [credentialsLoaded, setCredentialsLoaded] = useState(false);
  const [adminEmail, setAdminEmail] = useState(DEFAULT_EMAIL);
  const [adminPassword, setAdminPassword] = useState(DEFAULT_PASSWORD);

  const refreshCredentials = useCallback(async () => {
    try {
      const settings = await settingsService.get();
      setAdminEmail(settings.adminEmail?.trim() || DEFAULT_EMAIL);
      setAdminPassword(settings.adminPassword ?? DEFAULT_PASSWORD);
    } catch {
      setAdminEmail(DEFAULT_EMAIL);
      setAdminPassword(DEFAULT_PASSWORD);
    } finally {
      setCredentialsLoaded(true);
    }
  }, []);

  useEffect(() => {
    refreshCredentials();
  }, [refreshCredentials]);

  const login = useCallback(
    async (email, password) => {
      await refreshCredentials();
      const settings = await settingsService.get();
      const expectedEmail = (settings.adminEmail?.trim() || DEFAULT_EMAIL).toLowerCase();
      const expectedPassword = settings.adminPassword ?? DEFAULT_PASSWORD;
      const ok =
        String(email).trim().toLowerCase() === expectedEmail &&
        String(password) === expectedPassword;
      if (ok) {
        writeSession(true);
        setAuthenticated(true);
      }
      return ok;
    },
    [refreshCredentials],
  );

  const logout = useCallback(() => {
    writeSession(false);
    setAuthenticated(false);
  }, []);

  const value = useMemo(
    () => ({
      authenticated,
      credentialsLoaded,
      adminEmail,
      login,
      logout,
      refreshCredentials,
    }),
    [authenticated, credentialsLoaded, adminEmail, login, logout, refreshCredentials],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { DEFAULT_EMAIL, DEFAULT_PASSWORD };
