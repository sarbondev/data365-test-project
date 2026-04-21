'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { uz } from '@/locales/uz';
import { ru } from '@/locales/ru';

export type Locale = 'uz' | 'ru';
export const SUPPORTED_LOCALES: Locale[] = ['uz', 'ru'];
export const DEFAULT_LOCALE: Locale = 'uz';
export const LOCALE_STORAGE_KEY = 'locale';
export const LOCALE_COOKIE_KEY = 'locale';

const BUNDLES = { uz, ru } as const;

export type TranslationBundle = typeof uz;

type Path<T> = T extends object
  ?
      {
        [K in keyof T & string]: T[K] extends object
          ? `${K}` | `${K}.${Path<T[K]>}`
          : `${K}`;
      }[keyof T & string]
  : never;

export type TranslationKey = Path<TranslationBundle>;

function walk(bundle: TranslationBundle, key: string): string {
  const segs = key.split('.');
  let node: unknown = bundle;
  for (const s of segs) {
    if (node && typeof node === 'object' && s in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[s];
    } else {
      return key;
    }
  }
  return typeof node === 'string' ? node : key;
}

export function normalizeLocale(v: unknown): Locale {
  if (typeof v === 'string') {
    const short = v.toLowerCase().slice(0, 2);
    if (short === 'ru') return 'ru';
    if (short === 'uz') return 'uz';
  }
  return DEFAULT_LOCALE;
}

function readInitialLocale(): Locale {
  if (typeof document === 'undefined') return DEFAULT_LOCALE;
  try {
    const ls = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (ls) return normalizeLocale(ls);
  } catch {
    // ignore
  }
  const cookieMatch = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/);
  if (cookieMatch) return normalizeLocale(decodeURIComponent(cookieMatch[1]));
  return DEFAULT_LOCALE;
}

function persistLocale(locale: Locale) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // ignore
  }
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${LOCALE_COOKIE_KEY}=${locale}; path=/; max-age=${maxAge}; SameSite=Lax`;
  document.documentElement.lang = locale;
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (key: TranslationKey | string, vars?: Record<string, string | number>) => string;
  bundle: TranslationBundle;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const initial = readInitialLocale();
    setLocaleState(initial);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = initial;
    }
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    persistLocale(next);
  }, []);

  const bundle = BUNDLES[locale];

  const t = useCallback(
    (key: TranslationKey | string, vars?: Record<string, string | number>) => {
      let value = walk(bundle, key as string);
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          value = value.replace(new RegExp(`{${k}}`, 'g'), String(v));
        }
      }
      return value;
    },
    [bundle],
  );

  const value = useMemo<I18nContextValue>(
    () => ({ locale, setLocale, t, bundle }),
    [locale, setLocale, t, bundle],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}

export function useTranslation() {
  const { t, locale } = useI18n();
  return { t, locale };
}

export function useLocale(): Locale {
  return useI18n().locale;
}

export function useSetLocale() {
  return useI18n().setLocale;
}
