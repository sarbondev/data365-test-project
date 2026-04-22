'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiError, api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { useTranslation } from '@/contexts/i18n-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PhoneInput from '@/components/ui/phone-input';
import { LanguageSwitcher } from '@/components/language-switcher';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { setUser } = useAuth();
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^\+998\d{9}$/.test(phone)) {
      setError(t('auth.errors.phoneInvalid'));
      return;
    }
    if (password.length < 6) {
      setError(t('auth.errors.passwordShort'));
      return;
    }
    setLoading(true);
    try {
      const user = await api.auth.login({ phone, password });
      setUser(user);
      const next = params.get('next') ?? '/';
      router.replace(next);
      router.refresh();
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : t('auth.errors.loginGeneric'),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-surfaceAlt">
      <div className="w-full max-w-sm bg-surface rounded-lg border border-border p-8">
        <div className="flex items-start justify-between mb-1 gap-3">
          <h1 className="text-xl font-semibold">{t('auth.loginTitle')}</h1>
          <LanguageSwitcher variant="pill" />
        </div>
        <p className="text-sm text-muted mb-6">{t('auth.loginSubtitle')}</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <PhoneInput
            label={t('auth.phone')}
            value={phone}
            onChange={setPhone}
            id="phone"
          />

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t('auth.password')}
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-sm text-danger bg-danger/5 px-3 py-2 rounded">
              {error}
            </p>
          )}

          <Button type="submit" loading={loading} className="w-full">
            {t('auth.login')}
          </Button>
        </form>

        <p className="text-sm text-muted text-center mt-6">
          {t('auth.noAccount')}{' '}
          <Link
            href="/register"
            className="text-accent font-medium hover:underline"
          >
            {t('auth.register')}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
