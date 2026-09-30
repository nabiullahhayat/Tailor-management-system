import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import Sidebar from './Sidebar.jsx';
import TopBar from './desktop/TopBar.jsx';
import { initializeStore } from '../storage/localStore.js';

let initPromise = null;

function ensureStore() {
  if (!initPromise) initPromise = initializeStore();
  return initPromise;
}

export default function Layout() {
  const { t, i18n } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    ensureStore().finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-accent/20 border-t-accent" />
          <p className="mt-4 text-sm font-medium text-ink-muted">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-background">
        <TopBar onMenuClick={() => setMobileOpen(true)} />

        <main className="app-scroll flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      <Toaster
        position={i18n.dir() === 'rtl' ? 'top-left' : 'top-right'}
        richColors
        closeButton
        toastOptions={{ className: 'font-sans' }}
      />
    </div>
  );
}
