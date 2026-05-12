import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import mi from './locales/mi.json';

const LANGUAGE_DETECTOR = {
  type: 'languageDetector',
  async: true,
  detect: async (callback: (lang: string) => void) => {
    const savedDataJSON = await AsyncStorage.getItem('language');
    const lng = savedDataJSON || RNLocalize.getLocales()[0]?.languageCode || 'en';
    callback(lng);
  },
  init: () => {},
  cacheUserLanguage: (lng: string) => {
    AsyncStorage.setItem('language', lng);
  },
};

i18n
  .use(LANGUAGE_DETECTOR as any)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    resources: {
      en: { translation: en },
      mi: { translation: mi },
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
