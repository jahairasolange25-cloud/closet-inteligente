import { Logger } from '@nestjs/common';

interface EnvVar {
  name: string;
  required: boolean;
  secret: boolean;
  validator?: (value: string) => boolean;
}

const ENV_VARS: EnvVar[] = [
  { name: 'NODE_ENV', required: false, secret: false },
  { name: 'PORT', required: false, secret: false },
  { name: 'DB_HOST', required: false, secret: false },
  { name: 'DB_PORT', required: false, secret: false },
  { name: 'DB_NAME', required: false, secret: false },
  { name: 'DB_USER', required: false, secret: false },
  { name: 'DB_PASSWORD', required: false, secret: true },
  { name: 'DATABASE_URL', required: false, secret: true },
  { name: 'JWT_SECRET', required: true, secret: true, validator: (v) => v.length >= 32 },
  { name: 'JWT_REFRESH_SECRET', required: true, secret: true, validator: (v) => v.length >= 32 },
  { name: 'JWT_EXPIRES_IN', required: false, secret: false },
  { name: 'JWT_REFRESH_EXPIRES_IN', required: false, secret: false },
  { name: 'REDIS_HOST', required: false, secret: false },
  { name: 'REDIS_PORT', required: false, secret: false },
  { name: 'REDIS_PASSWORD', required: false, secret: true },
  { name: 'REDIS_DB', required: false, secret: false },
  { name: 'REDIS_KEY_PREFIX', required: false, secret: false },
  { name: 'CORS_ORIGIN', required: false, secret: false },
  { name: 'CLOUDINARY_CLOUD_NAME', required: false, secret: false },
  { name: 'CLOUDINARY_API_KEY', required: false, secret: true },
  { name: 'CLOUDINARY_API_SECRET', required: false, secret: true },
  { name: 'AI_SERVICE_URL', required: false, secret: false },
  { name: 'BACKEND_PUBLIC_URL', required: false, secret: false },
  { name: 'AI_STEP_TIMEOUT_MS', required: false, secret: false },
  { name: 'AI_GLOBAL_TIMEOUT_MS', required: false, secret: false },
  { name: 'AI_MAX_RETRIES', required: false, secret: false },
  { name: 'SUPABASE_URL', required: false, secret: false },
  { name: 'SUPABASE_ANON_KEY', required: false, secret: true },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', required: false, secret: true },
  { name: 'RATE_LIMIT_DEFAULT_LIMIT', required: false, secret: false },
  { name: 'RATE_LIMIT_DEFAULT_TTL', required: false, secret: false },
  { name: 'REQUEST_TIMEOUT_MS', required: false, secret: false },
];

export function validateEnv(): void {
  const logger = new Logger('EnvValidation');
  const isProduction = process.env.NODE_ENV === 'production';
  let hasErrors = false;

  for (const envVar of ENV_VARS) {
    const value = process.env[envVar.name];

    if (envVar.required && !value) {
      logger.error(`Missing required environment variable: ${envVar.name}`);
      hasErrors = true;
      continue;
    }

    if (isProduction && envVar.secret && value && value.length < 8) {
      logger.warn(`Environment variable ${envVar.name} appears too short for production`);
    }

    if (value && envVar.validator && !envVar.validator(value)) {
      logger.error(`Environment variable ${envVar.name} failed validation`);
      hasErrors = true;
    }
  }

  if (hasErrors) {
    logger.error('FATAL: Environment validation failed — aborting startup');
    process.exit(1);
  }

  if (isProduction && !process.env.CLOUDINARY_CLOUD_NAME) {
    logger.warn('CLOUDINARY_CLOUD_NAME not set — file upload will fail');
  }

  if (isProduction && !process.env.DATABASE_URL && !process.env.DB_HOST) {
    logger.error('No database configuration found');
    process.exit(1);
  }

  logger.log('Environment variables validated successfully');
}
