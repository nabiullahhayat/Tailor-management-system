import { ALL_MENU_ITEMS } from '../config/navConfig.js';

export function isNavItemActive(itemPath, pathname) {
  if (itemPath === '/') return pathname === '/';
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

/** Pick the single most specific menu item for the current path. */
export function getActiveNavItem(pathname, items = ALL_MENU_ITEMS) {
  const matches = items.filter((item) => isNavItemActive(item.path, pathname));
  if (!matches.length) return null;
  return matches.sort((a, b) => b.path.length - a.path.length)[0];
}
