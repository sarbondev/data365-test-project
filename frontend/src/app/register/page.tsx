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

  // Step 1
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  // Step 2
  const [pending, setPending] = useState<RegisterStartResponse | null>(null);
  const [code, setCode] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) {
      setError(t('auth.errors.nameShort'));
      return;
    }
    if (!/^\+998\d{9}$/.test(phone)) {
      setError(t('auth.errors.phoneInvalid'));
      return;
    }
    if (password.length < 6) {
      setError(t('auth.errors.passwordShort'));
      return;
    }
    if (password !== confirm) {
      setError(t('auth.errors.passwordMismatch'));
      return;
    }
    setLoading(true);
    try {
      const res = await api.auth.register({
        name: name.trim(),
        phone,
        password,
        locale,
      });
      setPending(res);
      setStep('verify');
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : t('auth.errors.registerGeneric'),
      );
    } finally {
      setLoading(false);
    }
  };

  const submitVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pending) return;
    setError(null);
    if (!/^\d{6}$/.test(code)) {
      setError(t('auth.errors.codeLength'));
      return;
    }
    setLoading(true);
    try {
      const user = await api.auth.verify({ token: pending.token, code });
      setUser(user);
      router.replace('/');
      router.refresh();
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : t('auth.errors.verifyGeneric'),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-surfaceAlt">
      <div className="w-full max-w-sm bg-surface rounded-lg border border-border p-8">
        {step === 'form' ? (
          <>
            <div className="flex items-start justify-between mb-1 gap-3">
              <h1 className="text-xl font-semibold">
                {t('auth.registerTitle')}
              </h1>
              <LanguageSwitcher variant="pill" />
            </div>
            <p className="text-sm text-muted mb-6">
              {t('auth.registerSubtitle')}
            </p>
            <form onSubmit={submitForm} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t('auth.name')}
                </label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>

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
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label
                  htmlFor="confirm"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t('auth.passwordConfirm')}
                </label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              {error && (
                <p className="text-sm text-danger bg-danger/5 px-3 py-2 rounded">
                  {error}
                </p>
              )}

              <Button type="submit" loading={loading} className="w-full">
                {t('common.continue')}
              </Button>
            </form>

            <p className="text-sm text-muted text-center mt-6">
              {t('auth.hasAccount')}{' '}
              <Link
                href="/login"
                className="text-accent font-medium hover:underline"
              >
                {t('auth.login')}
              </Link>
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold mb-1">
              {t('auth.verifyTitle')}
            </h1>
            <p className="text-sm text-muted mb-4">{t('auth.verifySubtitle')}</p>

            <a
              href={pending?.telegramDeepLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-accent text-white rounded py-2 text-sm font-medium hover:bg-accent/90 mb-5"
            >
              {t('auth.openBot')}
            </a>

            <form onSubmit={submitVerify} className="space-y-4">
              <div>
                <label
                  htmlFor="code"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t('auth.verifyCode')}
                </label>
                <Input
                  id="code"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  className="tracking-[0.4em] text-center text-base"
                  placeholder="------"
                />
              </div>

              {error && (
                <p className="text-sm text-danger bg-danger/5 px-3 py-2 rounded">
                  {error}
                </p>
              )}

              <Button type="submit" loading={loading} className="w-full">
                {t('auth.verifyBtn')}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setStep('form');
                  setCode('');
                  setError(null);
                }}
                className="block w-full text-center text-sm text-muted hover:text-foreground"
              >
                {t('common.back')}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
