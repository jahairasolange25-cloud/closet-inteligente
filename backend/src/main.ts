import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { setDefaultResultOrder } from 'dns';
import { AppModule } from './app.module';
import { validateEnv } from './config/env-validation';

async function bootstrap(): Promise<void> {
  setDefaultResultOrder('ipv4first');
  validateEnv();

  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
    bodyParser: true,
  });

  // Cookie parser (needed for CSRF, refresh tokens)
  app.use(cookieParser());

  // Security headers — API-level CSP (frontend CSP is set via next.config.js headers)
  // Note: 'unsafe-eval' is NOT present here — only needed by Next.js dev mode.
  // Note: 'unsafe-inline' is kept for scripts only for WebSocket/Socket.IO error pages;
  //       production deployment should add nonce-based CSP via a reverse proxy.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: process.env.NODE_ENV === 'production'
            ? ["'self'"]
            : ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:', 'res.cloudinary.com', '*.cloudinary.com'],
          connectSrc: ["'self'", 'ws:', 'wss:'],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          ...(process.env.NODE_ENV === 'production' ? { upgradeInsecureRequests: [] } : {}),
          ...(process.env.CSP_REPORT_URI ? { reportTo: [process.env.CSP_REPORT_URI] } : {}),
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      permittedCrossDomainPolicies: { permittedPolicies: 'none' },
      xPoweredBy: false,
    }),
  );

  // Global body size limit (1MB)
  app.use((req: any, res: any, next: any) => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    if (contentLength > 1024 * 1024) {
      res.status(413).json({
        statusCode: 413,
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request body exceeds 1MB limit',
      });
      return;
    }
    next();
  });

  // CORS — supports comma-separated CORS_ORIGIN for multiple frontends
  const rawOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
  const corsOrigins = rawOrigin.split(',').map((o) => o.trim()).filter(Boolean);
  const defaultProductionOrigins = [
    'https://closet-inteligente-frontend.vercel.app',
    'https://closet-inteligente-backend.onrender.com',
  ];
  const allOrigins = [...new Set([...corsOrigins, ...defaultProductionOrigins])];
  app.enableCors({
    origin(origin, callback) {
      if (!origin || allOrigins.includes(origin) || allOrigins.includes('*')) {
        callback(null, origin || true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Platform', 'X-Client-Version', 'X-CSRF-Token'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  });

  // Graceful shutdown on SIGTERM/SIGINT (Docker stop, Kubernetes eviction)
  app.enableShutdownHooks();

  // Global prefix (health + metrics are excluded for healthcheck / prometheus scrape)
  app.setGlobalPrefix('api/v1', { exclude: ['health', 'health/live', 'health/ready', 'health/detailed', 'metrics'] });

  const port = parseInt(process.env.PORT || '4000', 10);
  await app.listen(port);

  logger.log(`Application running on port ${port}`);
  logger.log(`CORS origins: ${allOrigins.join(', ')}`);
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}

process.on('unhandledRejection', (reason) => {
  new Logger('Process').error('Unhandled promise rejection', String(reason));
});

process.on('uncaughtException', (error) => {
  new Logger('Process').error('Uncaught exception — forcing exit', error?.stack ?? String(error));
  process.exit(1);
});

bootstrap().catch((error) => {
  new Logger('Bootstrap').error('Fatal startup error', error?.stack ?? error);
  process.exit(1);
});
