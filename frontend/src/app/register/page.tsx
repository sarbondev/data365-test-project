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
import type { RegisterStartResponse } from '@/lib/types';

type Step = 'form' | 'verify';

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const { t } = useTranslation();
  const locale = useLocale();
  const [step, setStep] = useState<Step>('form');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pending, setPending] = useState<RegisterStartResponse | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) { setError(t('auth.errors.nameShort')); return; }
    if (!/^\+998\d{9}$/.test(phone)) { setError(t('auth.errors.phoneInvalid')); return; }
    if (password.length < 6) { setError(t('auth.errors.passwordShort')); return; }
    if (password !== confirm) { setError(t('auth.errors.passwordMismatch')); return; }
    setLoading(true);
    try {
      const res = await api.auth.register({ name: name.trim(), phone, password, locale });
      setPending(res);
      setStep('verify');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('auth.errors.registerGeneric'));
    } finally { setLoading(false); }
  };

  const submitVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pending) return;
    setError(null);
    if (!/^\d{6}$/.test(code)) { setError(t('auth.errors.codeLength')); return; }
    setLoading(true);
    try {
      const user = await api.auth.verify({ token: pending.token, code });
      setUser(user);
      router.replace('/');
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('auth.errors.verifyGeneric'));
    } finally { setLoading(false); }
  };

  const ErrorBox = ({ msg }: { msg: string }) => (
    <div className="flex items-start gap-2 bg-dangerSoft text-danger text-[12.5px] px-3 py-2.5 rounded-lg">
      <span className="shrink-0 mt-px">⚠</span>
      <span>{msg}</span>
    </div>
  );

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

          {step === 'form' ? (
            <>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-[22px] font-bold text-foreground">{t('auth.registerTitle')}</h1>
                  <p className="text-[13px] text-muted mt-1">{t('auth.registerSubtitle')}</p>
                </div>
                <LanguageSwitcher variant="pill" />
              </div>

              <form onSubmit={submitForm} className="space-y-4">
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

                {error && <ErrorBox msg={error} />}

                <Button type="submit" loading={loading} size="lg" className="w-full mt-2">
                  {t('common.continue')}
                </Button>
              </form>

              <p className="text-[13px] text-muted text-center mt-6">
                {t('auth.hasAccount')}{' '}
                <Link href="/login" className="text-accent font-semibold hover:underline">
                  {t('auth.login')}
                </Link>
              </p>
            </>
          ) : (
            <>
              <div className="mb-8">
                <div className="h-12 w-12 rounded-2xl bg-accentSoft grid place-items-center mb-4">
                  <span className="text-[22px]">{pending?.codeSentDirectly ? '💬' : '✈️'}</span>
                </div>
                <h1 className="text-[22px] font-bold text-foreground">
                  {pending?.codeSentDirectly ? t('auth.verifyTitleDirect') : t('auth.verifyTitle')}
                </h1>
                <p className="text-[13px] text-muted mt-1">
                  {pending?.codeSentDirectly ? t('auth.verifySubtitleDirect') : t('auth.verifySubtitle')}
                </p>
              </div>

              {!pending?.codeSentDirectly && (
                <a
                  href={pending?.telegramDeepLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-[#229ED9] text-white rounded-lg py-2.5 text-[13.5px] font-semibold hover:bg-[#1e8dc2] transition-colors mb-5"
                >
                  <span className="text-[16px]">📱</span>
                  {t('auth.openBot')}
                </a>
              )}

              <form onSubmit={submitVerify} className="space-y-4">
                <div>
                  <label htmlFor="code" className="block text-[12.5px] font-semibold text-foreground mb-1.5">
                    {t('auth.verifyCode')}
                  </label>
                  <Input
                    id="code" inputMode="numeric" maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="tracking-[0.5em] text-center text-[20px] font-bold h-12"
                    placeholder="• • • • • •"
                  />
                </div>

                {error && <ErrorBox msg={error} />}

                <Button type="submit" loading={loading} size="lg" className="w-full">
                  {t('auth.verifyBtn')}
                </Button>

                <button
                  type="button"
                  onClick={() => { setStep('form'); setCode(''); setError(null); }}
                  className="block w-full text-center text-[13px] text-muted hover:text-foreground transition-colors py-1"
                >
                  ← {t('common.back')}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
