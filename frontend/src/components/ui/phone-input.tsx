'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { cn } from '../../lib/cn';

export interface PhoneInputProps {
  label?: string;
  error?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  id?: string;
  disabled?: boolean;
}

/** Har qanday formatdan faqat raqamlar olish, 998 prefix bilan */
function normalize(raw: string): string {
  const d = raw.replace(/\D/g, '');
  if (d.startsWith('998') && d.length >= 3) return d.slice(0, 12);
  if (d.length <= 9) return '998' + d;
  return d.slice(0, 12);
}

/** 998XXXXXXXXX → +998 XX XXX XX XX */
function format(digits: string): string {
  if (!digits || digits.length < 3) return '+998 ';
  const local = digits.slice(3);
  let s = '+998';
  if (local.length > 0) s += ' ' + local.slice(0, 2);
  if (local.length > 2) s += ' ' + local.slice(2, 5);
  if (local.length > 5) s += ' ' + local.slice(5, 7);
  if (local.length > 7) s += ' ' + local.slice(7, 9);
  return s;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  label,
  error,
  value = '',
  onChange,
  className,
  id,
  disabled,
}) => {
  const ref = useRef<HTMLInputElement>(null);

  const [raw, setRaw] = useState(() => {
    const d = value.replace(/\D/g, '');
    return d.startsWith('998') ? d.slice(0, 12) : d.length <= 9 ? '998' + d : '998';
  });

  useEffect(() => {
    if (!value) {
      setRaw('998');
      return;
    }
    const d = value.replace(/\D/g, '');
    const n = d.startsWith('998') ? d.slice(0, 12) : '998' + d.slice(0, 9);
    setRaw(n);
  }, [value]);

  const display = format(raw);

  const emit = useCallback(
    (digits: string) => {
      setRaw(digits);
      onChange?.(digits.length > 3 ? `+${digits}` : '');
    },
    [onChange],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      const allDigits = input.replace(/\D/g, '');

      if (!allDigits.startsWith('998')) {
        const local = allDigits.slice(0, 9);
        emit('998' + local);
        return;
      }

      emit(allDigits.slice(0, 12));
    },
    [emit],
  );

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const el = ref.current;
    if (!el) return;
    const cursor = el.selectionStart ?? 0;

    if (e.key === 'Backspace' && cursor <= 5 && el.selectionStart === el.selectionEnd) {
      e.preventDefault();
      return;
    }
    if (e.key === 'Delete' && cursor < 5 && el.selectionStart === el.selectionEnd) {
      e.preventDefault();
      return;
    }
  }, []);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text');
      const digits = normalize(pasted);
      emit(digits);
      requestAnimationFrame(() => {
        const pos = format(digits).length;
        ref.current?.setSelectionRange(pos, pos);
      });
    },
    [emit],
  );

  const handleFocus = useCallback(() => {
    requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      const pos = el.value.length;
      el.setSelectionRange(pos, pos);
    });
  }, []);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        disabled={disabled}
        value={display}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onFocus={handleFocus}
        className={cn(
          'w-full h-10 px-3.5 rounded-xl border bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/40 focus:border-primary-400 transition-all',
          error ? 'border-red-400 focus:ring-red-400/40 focus:border-red-400' : 'border-gray-200 hover:border-gray-300',
          disabled && 'bg-gray-50 text-gray-500 cursor-not-allowed',
          className,
        )}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

PhoneInput.displayName = 'PhoneInput';
export default PhoneInput;
