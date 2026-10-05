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
    expect(() => validateEnvironment({ ...validEnvironment, PORT: '70000' })).toThrow();
  });
});
