import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, Bell, Calendar, Menu, Moon, Plus, Search, Sun, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import AppIconMark from '../ui/AppIconMark.jsx';
import { fallbackLetterFromAppName } from '../../utils/appIcon.js';
import { useStock } from '../../context/StockContext.jsx';
import { useOrders } from '../../context/OrderContext.jsx';
import { getActiveNavItem } from '../../utils/navActive.js';
import { collectStockWarnings } from '../../utils/stockWarnings.js';
import {
  formatOrderWarningLabel,
  getTomorrowDateKey,
  isOrderDeliveryTomorrow,
} from '../../utils/orderDelivery.js';
import {
  deliveryNotificationKey,
  loadDismissedNotificationKeys,
  saveDismissedNotificationKeys,
  stockNotificationKey,
} from '../../utils/notificationDismiss.js';
import { getTodaySolar } from '../../utils/solarDate.js';

export default function TopBar({ onMenuClick }) {
  const { t } = useTranslation();
  const { appName, appIconUrl } = useSettings();
  const { theme, toggleTheme } = useTheme();
  const { fabrics, machinery } = useStock();
  const { orders } = useOrders();
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [dismissedKeys, setDismissedKeys] = useState(() => loadDismissedNotificationKeys());
  const notificationsRef = useRef(null);

  const currentPage = useMemo(() => {
    const item = getActiveNavItem(location.pathname);
    return item ? t(`nav.items.${item.id}`) : t('nav.items.overview');
  }, [location.pathname, t]);

  const stockWarnings = useMemo(
    () => collectStockWarnings(fabrics, machinery),
    [fabrics, machinery],
  );

  const deliveryTomorrowOrders = useMemo(
    () => orders.filter((o) => isOrderDeliveryTomorrow(o)),
    [orders],
  );

  const visibleDeliveryAlerts = useMemo(() => {
    const tomorrowKey = getTomorrowDateKey();
    return deliveryTomorrowOrders.filter(
      (o) => !dismissedKeys.has(deliveryNotificationKey(o.id, tomorrowKey)),
    );
  }, [deliveryTomorrowOrders, dismissedKeys]);

  const visibleStockWarnings = useMemo(
    () =>
      stockWarnings.filter(
        (a) => !dismissedKeys.has(stockNotificationKey(a.kind, a.id, a.stock)),
      ),
    [stockWarnings, dismissedKeys],
  );

  const notificationCount = visibleStockWarnings.length + visibleDeliveryAlerts.length;

  const dismissNotification = (key) => {
    setDismissedKeys((prev) => {
      const next = new Set(prev);
      next.add(key);
      saveDismissedNotificationKeys(next);
      return next;
    });
  };

  useEffect(() => {
    if (!notificationsOpen) return;
    const onDocClick = (e) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [notificationsOpen]);

  const solarDate = getTodaySolar();

  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim().toLowerCase();
    if (!q) return;
    if (q.includes('order')) navigate('/orders');
    else if (q.includes('customer')) navigate('/customers');
    else if (q.includes('sale')) navigate('/sales');
    else if (q.includes('stock')) navigate('/stock');
    else if (q.includes('expense')) navigate('/expenses');
    else navigate('/orders');
  };

  return (
    <header className="topbar-shell z-30 flex h-14 shrink-0 items-center gap-4 px-4 lg:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg border border-primary-soft p-2 text-ink-muted hover:bg-primary-soft lg:hidden"
      >
        <Menu size={18} />
      </button>

      <div className="hidden min-w-0 lg:block">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">{appName}</p>
        <p className="truncate text-sm font-bold text-ink">{currentPage}</p>
      </div>

      <form onSubmit={handleSearch} className="mx-auto hidden max-w-xl flex-1 md:block">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('topbar.searchPlaceholder')}
            className="input-field w-full rounded-lg border-2 bg-background py-2 pl-9 pr-4 text-base outline-none transition"
          />
        </div>
      </form>

      <div className="flex items-center gap-2">
        <div className="relative" ref={notificationsRef}>
          <button
            type="button"
            onClick={() => setNotificationsOpen((o) => !o)}
            className="relative rounded-lg border border-primary-soft p-2 text-ink-muted hover:bg-primary-soft"
            aria-label={t('topbar.notifications')}
            aria-expanded={notificationsOpen}
          >
            <Bell size={18} />
            {notificationCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="fixed sm:absolute right-2 sm:right-0 left-2 sm:left-auto top-16 sm:top-full z-50 sm:mt-2 w-auto sm:w-[min(90vw,22rem)] max-h-[calc(100vh-5rem)] sm:max-h-[min(80vh,32rem)] overflow-hidden rounded-xl border border-primary-soft bg-surface shadow-lg flex flex-col">
              <div className="border-b border-primary-soft px-4 py-3 shrink-0">
                <p className="text-sm font-bold text-ink">{t('topbar.notifications')}</p>
                <p className="text-xs text-ink-muted">{t('topbar.deliveryAndStock')}</p>
              </div>

              {notificationCount === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-ink-muted">{t('topbar.none')}</p>
              ) : (
                <>
                  <ul className="app-scroll overflow-y-auto py-1 flex-1">
                    {visibleDeliveryAlerts.map((order) => {
                      const dismissKey = deliveryNotificationKey(order.id, getTomorrowDateKey());
                      return (
                        <li key={`delivery-${order.id}`} className="flex items-start gap-0.5 pr-1">
                          <button
                            type="button"
                            onClick={() => {
                              setNotificationsOpen(false);
                              navigate('/orders');
                            }}
                            className="flex min-w-0 flex-1 items-start gap-2 px-4 py-2.5 text-left transition hover:bg-primary-soft/40"
                          >
                            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-500" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-ink">
                                {t('topbar.deliveryTomorrow', { token: formatOrderWarningLabel(order) })}
                              </p>
                              <p className="truncate text-xs text-ink-muted">{order.customerName}</p>
                            </div>
                          </button>
                          <button
                            type="button"
                            aria-label={t('topbar.dismiss')}
                            onClick={() => dismissNotification(dismissKey)}
                            className="mt-2 shrink-0 rounded-lg p-1.5 text-ink-muted transition hover:bg-primary-soft hover:text-ink"
                          >
                            <X size={16} />
                          </button>
                        </li>
                      );
                    })}
                    {visibleStockWarnings.map((alert) => {
                      const dismissKey = stockNotificationKey(alert.kind, alert.id, alert.stock);
                      return (
                        <li key={`${alert.kind}-${alert.id}`} className="flex items-start gap-0.5 pr-1">
                          <button
                            type="button"
                            onClick={() => {
                              setNotificationsOpen(false);
                              navigate('/stock');
                            }}
                            className="flex min-w-0 flex-1 items-start gap-2 px-4 py-2.5 text-left transition hover:bg-primary-soft/40"
                          >
                            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-danger" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-ink">{alert.name}</p>
                              <p className="text-xs text-ink-muted">
                                {t('topbar.lowStock', {
                                stock: alert.stock,
                                unit: alert.unitLabel,
                                warn: alert.warningQuantity,
                              })}
                              </p>
                            </div>
                          </button>
                          <button
                            type="button"
                            aria-label={t('topbar.dismiss')}
                            onClick={() => dismissNotification(dismissKey)}
                            className="mt-2 shrink-0 rounded-lg p-1.5 text-ink-muted transition hover:bg-primary-soft hover:text-ink"
                          >
                            <X size={16} />
                          </button>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="flex flex-wrap gap-3 border-t border-primary-soft px-4 py-2.5 shrink-0">
                    {visibleDeliveryAlerts.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setNotificationsOpen(false);
                          navigate('/orders');
                        }}
                        className="text-xs font-semibold text-accent hover:underline"
                      >
                        {t('topbar.allOrders')}
                      </button>
                    )}
                    {visibleStockWarnings.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setNotificationsOpen(false);
                          navigate('/stock');
                        }}
                        className="text-xs font-semibold text-accent hover:underline"
                      >
                        {t('topbar.stockManagement')}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-lg border border-primary-soft p-2 text-ink-muted hover:bg-primary-soft"
          aria-label={theme === 'dark' ? t('topbar.lightMode') : t('topbar.darkMode')}
          title={theme === 'dark' ? t('topbar.lightMode') : t('topbar.darkMode')}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="hidden items-center gap-2 rounded-lg bg-primary-soft/80 px-3 py-2 text-sm font-medium text-ink-secondary xl:flex">
          <Calendar size={16} className="text-accent" />
          {solarDate}
        </div>

        <button
          type="button"
          onClick={() => navigate('/orders/new')}
          className="hidden items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white shadow-md transition hover:bg-accent/90 sm:flex"
        >
          <Plus size={16} />
          {t('common.newOrder')}
        </button>
        <AppIconMark
          appIconUrl={appIconUrl}
          fallbackLetter={fallbackLetterFromAppName(appName)}
          className="h-9 w-9"
          letterClassName="text-sm font-bold text-white"
          roundedClassName="rounded-full"
          showGradientFallback
        />
      </div>
    </header>
  );
}
