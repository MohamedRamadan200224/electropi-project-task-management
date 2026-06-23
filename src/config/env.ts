import dotenv from 'dotenv';

dotenv.config();

export const ENV = {
  PORT: parseInt(process.env['PORT'] ?? '5000', 10),
  MONGO_URI: process.env['MONGO_URI'] ?? 'mongodb://localhost:27017/electropi_pm',
  JWT_SECRET: process.env['JWT_SECRET'] ?? 'change_this_secret',
  JWT_EXPIRES_IN: process.env['JWT_EXPIRES_IN'] ?? '7d',
  NODE_ENV: process.env['NODE_ENV'] ?? 'development',
  RESEND_API_KEY: process.env['RESEND_API_KEY'] ?? '',
  FROM_EMAIL: process.env['FROM_EMAIL'] ?? 'ElectroPi PM <onboarding@resend.dev>',
  FRONTEND_URL: process.env['FRONTEND_URL'] ?? 'http://localhost:3000',
  RESET_TOKEN_EXPIRES_MINUTES: parseInt(process.env['RESET_TOKEN_EXPIRES_MINUTES'] ?? '10', 10),
};
