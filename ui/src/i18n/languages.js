/** App language ids stored in settings → i18next codes. */
export const APP_LANGUAGES = {
  pashto: { code: 'ps', dir: 'rtl', label: 'Pashto', native: 'پښتو' },
  dari: { code: 'fa', dir: 'rtl', label: 'Dari', native: 'دری' },
};

export function toI18nCode(appLanguage) {
  return APP_LANGUAGES[appLanguage]?.code || 'ps';
}

export function toTextDirection(appLanguage) {
  return APP_LANGUAGES[appLanguage]?.dir || 'rtl';
}

export function applyDocumentLanguage(appLanguage) {
  const code = toI18nCode(appLanguage);
  const dir = toTextDirection(appLanguage);
  document.documentElement.lang = code === 'fa' ? 'fa-AF' : 'ps';
  document.documentElement.dir = dir;
  return { code, dir };
}
