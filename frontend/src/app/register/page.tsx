'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiError, api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { useTranslation, useLocale } from '@/contexts/i18n-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PhoneInput from '@/components/ui/phone-input';
import { LanguageSwitcher } from '@/components/language-switcher';

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const { t } = useTranslation();
  const locale = useLocale();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) { setError(t('auth.errors.nameShort')); return; }
    if (!/^\+998\d{9}$/.test(phone)) { setError(t('auth.errors.phoneInvalid')); return; }
    if (password.length < 6) { setError(t('auth.errors.passwordShort')); return; }
    if (password !== confirm) { setError(t('auth.errors.passwordMismatch')); return; }
    setLoading(true);
    try {
      const user = await api.auth.register({ name: name.trim(), phone, password, locale });
      setUser(user);
      router.replace('/');
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('auth.errors.registerGeneric'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 bg-gradient-to-br from-accent to-primary-700 p-10 text-white">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-white/20 grid place-items-center font-bold text-[15px]">D</div>
          <span className="text-[15px] font-bold tracking-tight">data365</span>
        </div>
        <div>
          <p className="text-[28px] font-bold leading-snug mb-3">{t('auth.heroTitle')}</p>
          <p className="text-[14px] text-white/70 leading-relaxed">{t('auth.heroSubtitle')}</p>
        </div>
        <p className="text-[12px] text-white/40">© {new Date().getFullYear()} data365</p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-[380px]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-[22px] font-bold text-foreground">{t('auth.registerTitle')}</h1>
              <p className="text-[13px] text-muted mt-1">{t('auth.registerSubtitle')}</p>
            </div>
            <LanguageSwitcher variant="pill" />
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-[12.5px] font-semibold text-foreground mb-1.5">
                {t('auth.name')}
              </label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </div>

            <PhoneInput label={t('auth.phone')} value={phone} onChange={setPhone} id="phone" />

            <div>
              <label htmlFor="password" className="block text-[12.5px] font-semibold text-foreground mb-1.5">
                {t('auth.password')}
              </label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
            </div>

            <div>
              <label htmlFor="confirm" className="block text-[12.5px] font-semibold text-foreground mb-1.5">
                {t('auth.passwordConfirm')}
              </label>
              <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-dangerSoft text-danger text-[12.5px] px-3 py-2.5 rounded-lg">
                <span className="shrink-0 mt-px">⚠</span>
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" loading={loading} size="lg" className="w-full mt-2">
              {t('auth.register')}
            </Button>
          </form>

          <p className="text-[13px] text-muted text-center mt-6">
            {t('auth.hasAccount')}{' '}
            <Link href="/login" className="text-accent font-semibold hover:underline">
              {t('auth.login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
