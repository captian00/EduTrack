import { validateEnvironment } from './env.validation.js';

const validEnvironment = {
  NODE_ENV: 'development',
  PORT: '3001',
  DATABASE_URL: 'postgresql://postgres:password@localhost:5432/edutrack',
  DIRECT_URL: 'postgresql://postgres:password@localhost:5432/edutrack',
  SUPABASE_URL: 'http://localhost:54321',
  SUPABASE_ANON_KEY: 'publishable-key',
  CORS_ORIGIN: 'http://localhost:3000',
};

describe('validateEnvironment', () => {
  it('converts PORT from an environment string to a number', () => {
    const environment = validateEnvironment(validEnvironment);

    expect(environment.PORT).toBe(3001);
  });

  it('rejects a port outside the valid range', () => {
    expect(() =>
      validateEnvironment({ ...validEnvironment, PORT: '70000' }),
    ).toThrow();
  });

  it('requires a cron secret in production', () => {
    expect(() =>
      validateEnvironment({ ...validEnvironment, NODE_ENV: 'production' }),
    ).toThrow('CRON_SECRET is required in production');
  });

  it('accepts a production environment with a strong cron secret', () => {
    expect(
      validateEnvironment({
        ...validEnvironment,
        NODE_ENV: 'production',
        CRON_SECRET: 'a-production-secret-with-32-chars',
      }).NODE_ENV,
    ).toBe('production');
  });
});
