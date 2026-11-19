import dotenv from 'dotenv';

dotenv.config();

function requireEnv(name: string, minLength = 1): string {
  const value = process.env[name];
  if (!value || value.length < minLength) {
    throw new Error(
      `${name} must be set${minLength > 1 ? ` to a random string of at least ${minLength} characters` : ''}. ` +
        `Generate one with: openssl rand -hex 32`,
    );
  }
  return value;
}

const nodeEnv = process.env['NODE_ENV'] ?? 'development';

// JWT_SECRET has no fallback. A weak or missing secret would let anyone
// forge tokens, so the app fails fast at startup instead of running insecure.
const jwtSecret =
  nodeEnv === 'test'
    ? (process.env['JWT_SECRET'] ?? 'test-only-secret-at-least-32-chars-long')
    : requireEnv('JWT_SECRET', 32);

export const ENV = {
  PORT: parseInt(process.env['PORT'] ?? '5000', 10),
  MONGO_URI: process.env['MONGO_URI'] ?? 'mongodb://localhost:27017/electropi_pm',
  JWT_SECRET: jwtSecret,
  JWT_EXPIRES_IN: process.env['JWT_EXPIRES_IN'] ?? '7d',
  NODE_ENV: nodeEnv,
  RESEND_API_KEY: process.env['RESEND_API_KEY'] ?? '',
  FROM_EMAIL: process.env['FROM_EMAIL'] ?? 'ElectroPi PM <onboarding@resend.dev>',
  FRONTEND_URL: process.env['FRONTEND_URL'] ?? 'http://localhost:3000',
  RESET_TOKEN_EXPIRES_MINUTES: parseInt(process.env['RESET_TOKEN_EXPIRES_MINUTES'] ?? '10', 10),
};
