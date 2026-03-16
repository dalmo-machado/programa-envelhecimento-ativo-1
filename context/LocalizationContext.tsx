
import React, { createContext, useContext } from 'react';
import { Language } from '../types';
import { pt } from '../localization/pt';
import { es, I18nKeys } from '../localization/es';

interface LocalizationContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: keyof I18nKeys, replacements?: Record<string, string | number>) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
}

const translations: Record<Language, I18nKeys> = {
  'pt-BR': pt,
  'es-ES': es,
};

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export const LocalizationProvider = LocalizationContext.Provider;

export const useLocalization = (): LocalizationContextType => {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }

  const { language } = context;

  const t = (key: keyof I18nKeys, replacements?: Record<string, string | number>): string => {
    let translation = translations[language][key] || key;
    if (replacements) {
      Object.entries(replacements).forEach(([placeholder, value]) => {
        translation = translation.replace(`{${placeholder}}`, String(value));
      });
    }
    return translation;
  };
  
  const formatNumber = (value: number, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat(language, options).format(value);
  };
  
  const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions) => {
    return new Intl.DateTimeFormat(language, options).format(date);
  };

  return { ...context, t, formatNumber, formatDate };
};
