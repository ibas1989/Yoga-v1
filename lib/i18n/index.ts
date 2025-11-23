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

// Initialize i18n - handle both server and client side
if (!i18n.isInitialized) {
  // For server-side rendering, use minimal config without LanguageDetector
  if (typeof window === 'undefined') {
    i18n
      .use(initReactI18next)
      .init({
        resources,
        fallbackLng: 'en',
        lng: 'en', // Default to English on server
        debug: false,
        interpolation: {
          escapeValue: false,
        },
        // No detection on server side
        detection: {
          order: ['htmlTag'],
          caches: [],
        },
      });
  } else {
    // Client-side: use full config with LanguageDetector
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
}

export default i18n;