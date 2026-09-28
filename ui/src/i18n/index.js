import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './locales/en.js';
import { ps } from './locales/ps.js';
import { fa } from './locales/fa.js';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ps: { translation: ps },
    fa: { translation: fa },
  },
  lng: 'ps',
  fallbackLng: 'ps',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
