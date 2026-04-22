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
      setError(e instanceof ApiError ? e.message : t('auth.errors.loginGeneric'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left decorative panel — hidden on mobile */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 bg-gradient-to-br from-accent to-primary-700 p-10 text-white">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-white/20 grid place-items-center font-bold text-[15px]">
            D
          </div>
          <span className="text-[15px] font-bold tracking-tight">data365</span>
        </div>
        <div>
          <p className="text-[28px] font-bold leading-snug mb-3">
            {t('auth.heroTitle')}
          </p>
          <p className="text-[14px] text-white/70 leading-relaxed">
            {t('auth.heroSubtitle')}
          </p>
        </div>
        <p className="text-[12px] text-white/40">© {new Date().getFullYear()} data365</p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-[380px]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-[22px] font-bold text-foreground">{t('auth.loginTitle')}</h1>
              <p className="text-[13px] text-muted mt-1">{t('auth.loginSubtitle')}</p>
            </div>
            <LanguageSwitcher variant="pill" />
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <PhoneInput label={t('auth.phone')} value={phone} onChange={setPhone} id="phone" />

            <div>
              <label htmlFor="password" className="block text-[12.5px] font-semibold text-foreground mb-1.5">
                {t('auth.password')}
              </label>
              <Input
                id="password" type="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-dangerSoft text-danger text-[12.5px] px-3 py-2.5 rounded-lg">
                <span className="shrink-0 mt-px">⚠</span>
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" loading={loading} size="lg" className="w-full mt-2">
              {t('auth.login')}
            </Button>
          </form>

          <p className="text-[13px] text-muted text-center mt-6">
            {t('auth.noAccount')}{' '}
            <Link href="/register" className="text-accent font-semibold hover:underline">
              {t('auth.register')}
            </Link>
          </p>
        </div>
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
