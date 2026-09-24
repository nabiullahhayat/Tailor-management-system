import { useTranslation } from 'react-i18next';
import { NavLink, useLocation } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useSettings } from '../context/SettingsContext.jsx';
import AppIconMark from './ui/AppIconMark.jsx';
import { fallbackLetterFromAppName } from '../utils/appIcon.js';
import { MENU_GROUPS } from '../config/navConfig.js';
import { getActiveNavItem } from '../utils/navActive.js';

function NavItem({ item, collapsed, onNavigate, isActive }) {
  const { t } = useTranslation();
  const Icon = Icons[item.icon] || Icons.Circle;
  const label = t(`nav.items.${item.id}`);

  return (
    <NavLink
      to={item.path}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium transition ${
        isActive
          ? 'bg-accent/20 text-white shadow-sm ring-1 ring-accent/30'
          : 'text-white/70 hover:bg-white/10 hover:text-white'
      } ${collapsed ? 'justify-center px-2' : ''}`}
    >
      <Icon size={20} className={`shrink-0 ${isActive ? 'text-secondary' : ''}`} />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  );
}

export default function Sidebar({ mobileOpen, onClose, collapsed, onToggleCollapse }) {
  const { t } = useTranslation();
  const { appName, appIconUrl } = useSettings();
  const { pathname } = useLocation();
  const activeItem = getActiveNavItem(pathname);

  const content = (
    <div className="flex h-full w-full min-w-0 flex-col bg-navy">
      <div className={`shrink-0 border-b border-white/10 ${collapsed ? 'px-3 py-4' : 'px-4 py-4'}`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <AppIconMark
            appIconUrl={appIconUrl}
            fallbackLetter={fallbackLetterFromAppName(appName)}
          />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-extrabold text-white">{appName}</h1>
              <p className="text-xs text-white/50">{t('nav.tailorErp')}</p>
            </div>
          )}
          {!collapsed && onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="rounded-lg p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white"
              title={t('nav.collapse')}
            >
              <PanelLeftClose size={16} />
            </button>
          )}
        </div>
        {collapsed && onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="mt-3 flex w-full justify-center rounded-lg p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white"
            title={t('nav.expand')}
          >
            <PanelLeftOpen size={16} />
          </button>
        )}
      </div>

      <nav className="sidebar-nav-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 py-3">
        {MENU_GROUPS.map((group) => (
          <div key={group.id} className="mb-2">
            {!collapsed && (
              <p className="px-3 pb-1 pt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">
                {t(`nav.groups.${group.id}`)}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem
                  key={item.id}
                  item={item}
                  collapsed={collapsed}
                  onNavigate={onClose}
                  isActive={activeItem?.id === item.id}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      <aside
        className={`sidebar-shell hidden transition-all duration-200 lg:flex ${
          collapsed ? 'w-[72px]' : 'w-[17.5rem]'
        }`}
      >
        {content}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/50" aria-label={t('nav.closeMenu')} onClick={onClose} />
          <aside className="sidebar-shell absolute start-0 top-0 w-[17.5rem] shadow-2xl">{content}</aside>
        </div>
      )}
    </>
  );
}
