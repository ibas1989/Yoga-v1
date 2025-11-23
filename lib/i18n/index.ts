import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { safeStorage } from '../hydrationUtils';

// Import translation files
import enTranslations from './en.json';
import ruTranslations from './ru.json';

const resources = {
  en: {
    translation: enTranslations,
  },
  ru: {
    translation: ruTranslations,
  },
};

// Initialize i18n only if not already initialized and we're on the client
if (typeof window !== 'undefined' && !i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: 'en',
      debug: process.env.NODE_ENV === 'development',
      
      interpolation: {
        escapeValue: false, // React already does escaping
      },
      
      detection: {
        order: safeStorage.isAvailable() ? ['localStorage', 'navigator', 'htmlTag'] : ['navigator', 'htmlTag'],
        caches: safeStorage.isAvailable() ? ['localStorage'] : [],
      },
    });
}

export default i18n;