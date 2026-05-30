# Middleware

## Overview

NestJS middleware execution order and configuration for the API Gateway.

---

## Execution Order

```
Request
  |
  v
[1] LoggingInterceptor
[2] CacheInterceptor (GET only)
[3] AuthGuard (except public routes)
[4] RateLimitGuard
[5] ValidationPipe
[6] FileUploadInterceptor (multipart routes)
[7] AuditLogInterceptor (mutation routes)
  |
  v
Controller Handler
  |
  v
[8] TransformInterceptor
[9] ExceptionFilter (if error)
  |
  v
Response
```

---

## 1. LoggingInterceptor

**File:** `src/common/interceptors/logging.interceptor.ts`

### Purpose
Log all incoming requests and outgoing responses with timing.

### Configuration

```typescript
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: Logger,
    private readonly config: ConfigService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, ip, headers } = request;
    const startTime = Date.now();
    const requestId = headers['x-request-id'] || uuid();

    request.requestId = requestId;

    // Log request
    this.logger.log({
      type: 'request',
      requestId,
      method,
      url,
      ip,
      userId: request.user?.id,
      body: this.sanitizeBody(body),
      userAgent: headers['user-agent']
    });

    return next.handle().pipe(
      tap({
        next: (response) => {
          const duration = Date.now() - startTime;
          this.logger.log({
            type: 'response',
            requestId,
            method,
            url,
            statusCode: context.switchToHttp().getResponse().statusCode,
            duration: `${duration}ms`,
            userId: request.user?.id
          });
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error({
            type: 'error',
            requestId,
            method,
            url,
            error: error.message,
            statusCode: error.status || 500,
            duration: `${duration}ms`,
            userId: request.user?.id,
            stack: error.stack
          });
        }
      })
    );
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;
    const sanitized = { ...body };
    if (sanitized.password) sanitized.password = '[REDACTED]';
    if (sanitized.refreshToken) sanitized.refreshToken = '[REDACTED]';
    if (sanitized.token) sanitized.token = '[REDACTED]';
    return sanitized;
  }
}
```

### Configuration Options

```typescript
{
  logBody: boolean;            // default: true
  logHeaders: string[];        // default: ['user-agent', 'x-request-id']
  excludePaths: string[];      // default: ['/health', '/metrics']
  slowRequestThreshold: number; // ms, default: 1000 (logs warning)
}
```

---

## 2. CacheInterceptor

**File:** `src/common/interceptors/cache.interceptor.ts`

### Purpose
Cache GET responses in Redis to reduce database load.

### Configuration

```typescript
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private readonly redis: Redis,
    private readonly config: ConfigService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // Only cache GET requests
    if (request.method !== 'GET') return next.handle();

    // Skip cache for specific paths
    if (this.shouldSkip(request.url)) return next.handle();

    const cacheKey = this.buildCacheKey(request);
    const ttl = this.getTtl(request.url);

    return from(this.getFromCache(cacheKey)).pipe(
      switchMap((cached) => {
        if (cached) {
          return of(JSON.parse(cached));
        }
        return next.handle().pipe(
          tap((response) => {
            this.setCache(cacheKey, JSON.stringify(response), ttl);
          })
        );
      })
    );
  }

  private buildCacheKey(request: Request): string {
    const userId = request.user?.id || 'anonymous';
    return `cache:${request.method}:${userId}:${request.url}`;
  }

  private getTtl(url: string): number {
    if (url.includes('/analytics')) return 300; // 5 min
    if (url.includes('/search')) return 120;    // 2 min
    return 60; // 1 min default
  }

  private shouldSkip(url: string): boolean {
    const skipPaths = ['/health', '/metrics', '/storage/upload'];
    return skipPaths.some((p) => url.startsWith(p));
  }
}
```

### Cache TTL by Route

| Route Pattern | TTL (seconds) |
|---------------|---------------|
| GET /analytics/* | 300 |
| GET /garments/search | 120 |
| GET /garments | 120 |
| GET /garments/:id | 300 |
| GET /outfits | 120 |
| GET /outfits/:id | 300 |
| GET /avatars | 300 |
| GET /calendar | 300 |
| GET /notifications | 60 |
| GET /auth/me | 60 |

---

## 3. AuthGuard

**File:** `src/common/guards/auth.guard.ts`

### Purpose
Validate JWT token and attach user to request.

### Configuration

```typescript
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly redis: Redis,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Token de autenticación requerido');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.config.get('JWT_ACCESS_SECRET')
      });

      // Check if token is blacklisted
      const isBlacklisted = await this.redis.exists(`blacklist:${payload.jti}`);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token revocado');
      }

      request.user = payload;
      request.tokenId = payload.jti;
      return true;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token expirado');
      }
      throw new UnauthorizedException('Token inválido');
    }
  }

  private extractToken(request: Request): string | null {
    const auth = request.headers.authorization;
    if (!auth) return null;

    const [type, token] = auth.split(' ');
    if (type !== 'Bearer') return null;

    return token;
  }
}
```

### Public Route Decorator

```typescript
export const Public = () => SetMetadata(PUBLIC_KEY, true);
```

### Routes Excluded from Auth

```typescript
const PUBLIC_ROUTES = [
  'POST /auth/register',
  'POST /auth/login',
  'POST /auth/refresh',
  'POST /auth/forgot-password',
  'POST /auth/reset-password',
  'GET /health',
  'GET /metrics'
];
```

---

## 4. RateLimitGuard

**File:** `src/common/guards/rate-limit.guard.ts`

### Purpose
Enforce rate limits per user/IP per endpoint group.

### Configuration

```typescript
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly redis: Redis,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const rateLimitMeta = this.reflector.get<RateLimitOptions>(
      RATE_LIMIT_KEY,
      context.getHandler()
    );

    const points = rateLimitMeta?.points || 60;
    const duration = rateLimitMeta?.duration || 60;
    const key = this.buildKey(request);

    const current = await this.redis.incr(key);

    if (current === 1) {
      await this.redis.expire(key, duration);
    }

    if (current > points) {
      const ttl = await this.redis.ttl(key);
      const response = context.switchToHttp().getResponse();
      response.setHeader('Retry-After', ttl.toString());
      response.setHeader('X-RateLimit-Limit', points.toString());
      response.setHeader('X-RateLimit-Remaining', '0');
      response.setHeader('X-RateLimit-Reset', Math.floor(Date.now() / 1000) + ttl);

      throw new HttpException({
        statusCode: 429,
        message: 'Demasiadas solicitudes. Intenta de nuevo más tarde.',
        error: 'RATE_LIMITED',
        retryAfter: ttl
      }, 429);
    }

    const remaining = points - current;
    response.setHeader('X-RateLimit-Limit', points.toString());
    response.setHeader('X-RateLimit-Remaining', remaining.toString());

    return true;
  }

  private buildKey(request: Request): string {
    const userId = request.user?.id;
    const ip = request.ip;
    const route = request.route.path;
    const identifier = userId || ip;
    return `ratelimit:${identifier}:${route}:${Math.floor(Date.now() / 60000)}`;
  }
}
```

### Rate Limit Decorator

```typescript
export const RateLimit = (points: number, duration: number) =>
  SetMetadata(RATE_LIMIT_KEY, { points, duration });
```

### Rate Limit Table

| Endpoint Group | Points | Duration (s) |
|----------------|--------|--------------|
| Auth | 10 | 60 |
| Garments | 60 | 60 |
| Garments (upload) | 10 | 60 |
| Outfits | 30 | 60 |
| Outfits (recommend) | 10 | 60 |
| Avatars | 10 | 60 |
| Avatars (generate) | 3 | 300 |
| Calendar | 60 | 60 |
| Notifications | 30 | 60 |
| Analytics | 20 | 60 |
| Storage | 30 | 60 |
| Storage (upload) | 10 | 60 |
| Export | 5 | 60 |
| AI endpoints | 10 | 60 |

---

## 5. ValidationPipe

**File:** `src/common/pipes/validation.pipe.ts`

### Purpose
Validate incoming request bodies using class-validator + class-transformer.

### Configuration

```typescript
@Injectable()
export class GlobalValidationPipe implements PipeTransform<any> {
  constructor(
    private readonly config: ConfigService
  ) {}

  async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
    if (!value || this.isPrimitive(value)) return value;

    const metatype = metadata.metatype;
    if (!metatype || !this.toValidate(metatype)) return value;

    const object = plainToInstance(metatype, value, {
      enableImplicitConversion: true,
      exposeDefaultValues: true,
      excludeExtraneousValues: true
    });

    const errors = await validate(object, {
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      validationError: {
        target: false,
        value: false
      }
    });

    if (errors.length > 0) {
      const formattedErrors = this.formatErrors(errors);
      throw new BadRequestException({
        statusCode: 400,
        message: 'Error de validación',
        error: 'VALIDATION_ERROR',
        details: formattedErrors
      });
    }

    return object;
  }

  private formatErrors(errors: ValidationError[]): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    for (const error of errors) {
      const constraints = Object.values(error.constraints || {});
      result[error.property] = constraints;
      if (error.children?.length) {
        const childErrors = this.formatErrors(error.children);
        for (const [key, value] of Object.entries(childErrors)) {
          result[`${error.property}.${key}`] = value;
        }
      }
    }
    return result;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private isPrimitive(value: any): boolean {
    return typeof value !== 'object' || value === null;
  }
}
```

### Global Validation Pipe Registration

```typescript
// main.ts
app.useGlobalPipes(new GlobalValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true
}));
```

---

## 6. FileUploadInterceptor

**File:** `src/common/interceptors/file-upload.interceptor.ts`

### Purpose
Handle multipart file uploads with validation.

### Configuration

```typescript
@Injectable()
export class FileUploadInterceptor implements NestInterceptor {
  constructor(
    private readonly config: ConfigService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    if (!request.is('multipart/form-data')) {
      return next.handle();
    }

    // File validation is handled by FileInterceptor from @nestjs/platform-express
    // This interceptor handles post-upload validation
    return next.handle();
  }
}
```

### Multer Configuration

```typescript
// File interceptor registration in controllers
@UseInterceptors(
  FileInterceptor('image', {
    storage: memoryStorage(),
    limits: {
      fileSize: 15 * 1024 * 1024, // 15MB for images
      files: 1
    },
    fileFilter: (req, file, cb) => {
      const allowedMimes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'video/mp4'
      ];

      if (!allowedMimes.includes(file.mimetype)) {
        return cb(new BadRequestException(
          `Tipo de archivo no soportado: ${file.mimetype}. Formatos permitidos: JPEG, PNG, WebP, MP4`
        ), false);
      }

      cb(null, true);
    }
  })
)
```

### File Validation Rules

| Resource | Max Size | Allowed Types | Min Dimensions |
|----------|----------|---------------|----------------|
| Garment image | 15 MB | JPEG, PNG, WebP | 300x300px |
| Avatar video | 200 MB | MP4 (H.264) | 854x480px |
| 3D model | 50 MB | GLTF, GLB | N/A |

---

## 7. AuditLogInterceptor

**File:** `src/common/interceptors/audit-log.interceptor.ts`

### Purpose
Record all mutation operations (POST, PATCH, DELETE) for audit trail.

### Configuration

```typescript
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user, ip, headers } = request;

    // Only log mutations
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return next.handle();
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (response) => {
          // Don't wait for audit log write
          this.writeAuditLog({
            userId: user?.id,
            action: this.resolveAction(method),
            entityType: this.resolveEntityType(url),
            entityId: this.extractEntityId(url, response),
            oldValues: null, // Would need to query before state
            newValues: body,
            ip,
            userAgent: headers['user-agent']
          }).catch((err) => console.error('Audit log error:', err));
        },
        error: (error) => {
          // Log failed attempts too
          this.writeAuditLog({
            userId: user?.id,
            action: `${this.resolveAction(method)}_FAILED`,
            entityType: this.resolveEntityType(url),
            entityId: this.extractEntityId(url),
            oldValues: null,
            newValues: body,
            ip,
            userAgent: headers['user-agent'],
            metadata: { error: error.message }
          }).catch((err) => console.error('Audit log error:', err));
        }
      })
    );
  }

  private resolveAction(method: string): string {
    const map = { POST: 'CREATE', PATCH: 'UPDATE', DELETE: 'DELETE' };
    return map[method] || method;
  }

  private resolveEntityType(url: string): string {
    const segments = url.split('/').filter(Boolean);
    // e.g., /v1/garments/123 -> garments
    // /v1/garments/123/upload -> garments
    return segments[1] || 'unknown';
  }

  private extractEntityId(url: string, response?: any): string | null {
    const segments = url.split('/').filter(Boolean);
    return segments[2] || response?.id || null;
  }

  private async writeAuditLog(data: AuditLogData): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        oldValues: data.oldValues ? JSON.parse(JSON.stringify(data.oldValues)) : undefined,
        newValues: data.newValues ? JSON.parse(JSON.stringify(data.newValues)) : undefined,
        ipAddress: data.ip,
        userAgent: data.userAgent
      }
    }).catch(() => {}); // Silently fail - audit is non-critical
  }
}
```

---

## 8. TransformInterceptor

**File:** `src/common/interceptors/transform.interceptor.ts`

### Purpose
Standardize all API responses into a consistent envelope format.

### Configuration

```typescript
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.requestId,
          version: '1.0'
        },
        ...(data?.meta ? { pagination: data.meta } : {})
      }))
    );
  }
}
```

### Response Envelope Structure

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
  pagination?: PaginationMeta;
}
```

### Paginated Response

```typescript
interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

---

## 9. ExceptionFilter

**File:** `src/common/filters/exception.filter.ts`

### Purpose
Catch all exceptions and return standardized error responses.

### Configuration

```typescript
@Catch()
@Injectable()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly logger: Logger,
    private readonly config: ConfigService
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';
    let message = 'Error interno del servidor';
    let details: any = null;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as any;
        errorCode = resp.error || this.mapHttpStatusToCode(statusCode);
        message = resp.message || exception.message;
        details = resp.details || null;
      } else {
        message = exceptionResponse as string;
        errorCode = this.mapHttpStatusToCode(statusCode);
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      statusCode = this.mapPrismaError(exception);
      errorCode = 'DATABASE_ERROR';
      message = this.getPrismaErrorMessage(exception);
    } else if (exception instanceof Error) {
      message = this.config.get('NODE_ENV') === 'production'
        ? 'Error interno del servidor'
        : exception.message;
    }

    this.logger.error({
      type: 'exception',
      requestId: request.requestId,
      statusCode,
      errorCode,
      message,
      path: request.url,
      method: request.method,
      userId: request.user?.id,
      stack: exception instanceof Error ? exception.stack : undefined
    });

    response.status(statusCode).json({
      success: false,
      error: {
        code: errorCode,
        message,
        details,
        requestId: request.requestId,
        timestamp: new Date().toISOString()
      }
    });
  }

  private mapHttpStatusToCode(status: number): string {
    const map: Record<number, string> = {
      400: 'VALIDATION_ERROR',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      413: 'PAYLOAD_TOO_LARGE',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'RATE_LIMITED',
      500: 'INTERNAL_ERROR',
      503: 'SERVICE_UNAVAILABLE'
    };
    return map[status] || 'UNKNOWN_ERROR';
  }

  private mapPrismaError(error: Prisma.PrismaClientKnownRequestError): number {
    switch (error.code) {
      case 'P2002': return 409; // Unique constraint
      case 'P2025': return 404; // Record not found
      case 'P2003': return 400; // Foreign key violation
      default: return 500;
    }
  }

  private getPrismaErrorMessage(error: Prisma.PrismaClientKnownRequestError): string {
    switch (error.code) {
      case 'P2002': return 'El recurso ya existe';
      case 'P2025': return 'Recurso no encontrado';
      case 'P2003': return 'Referencia inválida';
      default: return 'Error de base de datos';
    }
  }
}
```

---

## Middleware Registration (main.ts)

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-Id',
      'X-Client-Version',
      'X-Platform',
      'Accept-Language'
    ],
    exposedHeaders: [
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
      'Retry-After'
    ]
  });

  // Global pipes
  app.useGlobalPipes(new GlobalValidationPipe());

  // Global interceptors (order matters)
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new CacheInterceptor(),
    new TransformInterceptor(),
    new AuditLogInterceptor()
  );

  // Global guards
  app.useGlobalGuards(
    new AuthGuard(),
    new RateLimitGuard()
  );

  // Global filters
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Closet Inteligente Digital API')
    .setDescription('API para plataforma de armario digital')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT || 4000);
}
```
