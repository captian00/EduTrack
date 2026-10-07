import { describe, expect, it } from 'vitest';
import { loginSchema } from './login.schema';
describe('loginSchema', () => {
  it('accepts a valid login', () =>
    expect(
      loginSchema.safeParse({
        email: 'owner@example.com',
        password: 'secret123',
      }).success,
    ).toBe(true));
  it('rejects invalid credentials', () =>
    expect(
      loginSchema.safeParse({ email: 'invalid', password: '1' }).success,
    ).toBe(false));
});
