import { useTranslation as useI18nTranslation } from 'react-i18next';
import { TranslationKeys, SupportedLanguages, TranslationParams } from '@/lib/i18n/types';

export function useTranslation() {
  const { t, i18n, ready } = useI18nTranslation();

  const changeLanguage = (language: SupportedLanguages) => {
    i18n.changeLanguage(language);
  };

  const getCurrentLanguage = (): SupportedLanguages => {
    return i18n.language as SupportedLanguages;
  };

  const isRussian = () => {
    return i18n.language === 'ru';
  };

  const isEnglish = () => {
    return i18n.language === 'en';
  };

  // Helper function for pluralization in Russian
  const pluralize = (count: number, singular: string, plural: string, genitive?: string) => {
    if (isRussian()) {
      if (count === 1) return singular;
      if (count >= 2 && count <= 4) return plural;
      if (genitive) return genitive;
      return plural;
    }
    return count === 1 ? singular : plural;
  };

  // Helper function for session text pluralization
  const getSessionText = (count: number) => {
    return t('calendar.sessions.session', { count });
  };

  // Helper function for day text pluralization
  const getDayText = (count: number) => {
    return t('common.day', { count });
  };

  // Type-safe translation function
  const translate = (key: TranslationKeys, params?: TranslationParams) => {
    return t(key, params);
  };

  return {
    t: translate,
    ready,
    changeLanguage,
    getCurrentLanguage,
    isRussian,
    isEnglish,
    pluralize,
    getSessionText,
    getDayText,
  };
}

export type TranslationFunction = ReturnType<typeof useTranslation>;
