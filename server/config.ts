/**
 * Server Configuration
 * Mirrors backend/app/config.py
 */
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  PORT: Number(process.env.PORT) || 3000,
  HOST: '0.0.0.0',
  JWT_SECRET: process.env.JWT_SECRET || 'fullstack-nexus-production-secret-key-987654321',
  JWT_EXPIRES_IN: '7d',
  APP_ENV: process.env.NODE_ENV || 'development',
  API_PREFIX: '/api',
  CORS_ORIGIN: '*',
};
