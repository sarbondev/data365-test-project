'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, api } from '@/lib/api';
import type { AuthUser } from '@/lib/types';
import { useI18n } from '@/contexts/i18n-context';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  setUser: (u: AuthUser | null) => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { locale, setLocale } = useI18n();
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const lastSyncedLocale = useRef<string | null>(null);

  const setUser = useCallback(
    (u: AuthUser | null) => {
      setUserState(u);
      if (u && u.locale && u.locale !== locale) {
        setLocale(u.locale);
        lastSyncedLocale.current = u.locale;
      }
    },
    [locale, setLocale],
  );

  const refresh = useCallback(async () => {
    try {
      const me = await api.auth.me();
      setUser(me);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setUserState(null);
      }
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user) return;
    if (user.locale === locale) return;
    if (lastSyncedLocale.current === locale) return;
    lastSyncedLocale.current = locale;
    api.auth
      .updateLocale(locale)
      .then((updated) => setUserState(updated))
      .catch(() => {
        lastSyncedLocale.current = user.locale;
      });
  }, [locale, user]);

  const logout = useCallback(async () => {
    await api.auth.logout();
    setUserState(null);
    router.replace('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, setUser, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
