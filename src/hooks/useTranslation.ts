import { useContext, useMemo } from 'react';
import en from '@/locales/en.json';
import es from '@/locales/es.json';
import { LanguageContext } from '@/contexts/LanguageContext';

// Helper for interpolation
function interpolate(str: string, params?: Record<string, string | number>) {
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (_, key) => params[key] !== undefined ? String(params[key]) : `{${key}}`);
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useTranslation must be used within a LanguageProvider');
  const { language } = context;

  const translations = useMemo(() => {
    switch (language) {
      case 'es':
        return es;
      case 'en':
      default:
        return en;
    }
  }, [language]);

  function t(key: string, params?: Record<string, string | number>): string {
    const value = key.split('.').reduce((obj, k) => (obj && obj[k] !== undefined ? obj[k] : undefined), translations as any);
    if (typeof value === 'string') {
      return interpolate(value, params);
    }
    return key;
  }

  return { t, language };
} 