'use client';
import type { ComponentProps } from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';

export function sanitizeCurrencyInput(value: string) {
  return value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
}
export function formatCurrencyInput(value: string) {
  const digits = sanitizeCurrencyInput(value);
  return digits ? new Intl.NumberFormat('vi-VN').format(Number(digits)) : '';
}
export function CurrencyInput({ value, onValueChange, className, ...props }: Omit<ComponentProps<typeof Input>, 'value' | 'onChange' | 'type'> & { value: string; onValueChange: (raw: string) => void }) {
  return <div className={cn('relative', className)}><Input {...props} value={formatCurrencyInput(value)} onChange={(event) => onValueChange(sanitizeCurrencyInput(event.target.value))} inputMode="numeric" autoComplete="off" className="mt-0 pr-10 text-right font-semibold tabular-nums" /><span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-medium text-slate-400">₫</span></div>;
}
