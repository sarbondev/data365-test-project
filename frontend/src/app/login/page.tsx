'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiError, api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PhoneInput from '@/components/ui/phone-input';

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { setUser } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^\+998\d{9}$/.test(phone)) {
      setError("Telefon raqami noto'g'ri");
      return;
    }
    if (password.length < 6) {
      setError("Parol kamida 6 belgidan iborat bo'lishi kerak");
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
        e instanceof ApiError ? e.message : 'Tizimga kirishda xatolik',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-surfaceAlt">
      <div className="w-full max-w-sm bg-surface rounded-lg border border-border p-8">
        <h1 className="text-xl font-semibold mb-1">Tizimga kirish</h1>
        <p className="text-sm text-muted mb-6">
          Telefon raqamingiz va parolingizni kiriting
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <PhoneInput
            label="Telefon raqam"
            value={phone}
            onChange={setPhone}
            id="phone"
          />

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Parol
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
            Kirish
          </Button>
        </form>

        <p className="text-sm text-muted text-center mt-6">
          Hisobingiz yo'qmi?{' '}
          <Link
            href="/register"
            className="text-accent font-medium hover:underline"
          >
            Ro'yxatdan o'ting
          </Link>
        </p>
      </div>
    </div>
  );
}
