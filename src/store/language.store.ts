import { create } from 'zustand';
import { changeLanguage, i18n, SupportedLanguage } from '../i18n';

interface LanguageState {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  syncFromI18n: () => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: (i18n.language as SupportedLanguage) || 'es',

  setLanguage: async (lang) => {
    await changeLanguage(lang);
    set({ language: lang });
  },

  syncFromI18n: () => {
    set({ language: (i18n.language as SupportedLanguage) || 'es' });
  },
}));
