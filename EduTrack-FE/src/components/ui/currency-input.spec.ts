import { describe, expect, it } from 'vitest';
import { formatCurrencyInput, sanitizeCurrencyInput } from './currency-input';

describe('CurrencyInput helpers', () => {
  it('formats integer VND with Vietnamese thousands separators', () => {
    expect(formatCurrencyInput('500000')).toBe('500.000');
  });
  it('normalizes pasted currency and removes non-digits', () => {
    expect(sanitizeCurrencyInput('₫ 500.000 abc')).toBe('500000');
  });
});
