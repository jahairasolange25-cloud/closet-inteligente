# API Endpoint Implementation Example — PATCH /garments/:id

> **Purpose:** Reference implementation for creating API endpoints in the Closet Inteligente Digital project.
> **Pattern:** DTO → Controller → Service → Guards → Interceptors → Filters → Logging → Audit → Cache → WebSocket → Tests
> **Stack:** NestJS, TypeScript, class-validator, Redis, Socket.IO, Jest

---

## Endpoint Specification

```
PATCH /api/v1/garments/:id

Authorization: Bearer <jwt>

Request Body:
{
  "name": "Updated Jacket",
  "color": "Red",
  "state": "ready"
}

Success Response (200):
{
  "data": {
    "id": "uuid",
    "name": "Updated Jacket",
    "color": "Red",
    "state": "ready",
    "updatedAt": "2026-05-25T12:00:00.000Z"
  },
  "meta": {
    "timestamp": "2026-05-25T12:00:00.000Z",
    "version": "1.0"
  }
}

Error Responses:
  400 - Validation Error
  401 - Unauthorized
  403 - Forbidden (not owner)
  404 - Not Found
  409 - Conflict (state transition)
  422 - Unprocessable Entity
```

---

## File 1: Update Garment DTO

```typescript
// backend/src/modules/garment/dto/update-garment.dto.ts

import {
  IsString,
  IsOptional,
  IsEnum,
  IsUrl,
  MinLength,
  MaxLength,
  IsObject,
  IsUUID,
  ValidateNested,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { GarmentType, GarmentCategory, GarmentState } from '../entities/garment.entity';

class PipelineStatusDto {
  @ApiPropertyOptional({ enum: ['pending', 'processing', 'completed', 'failed'] })
  @IsOptional()
  @IsString()
  segmentation?: string;

  @ApiPropertyOptional({ enum: ['pending', 'processing', 'completed', 'failed'] })
  @IsOptional()
  @IsString()
  colorAnalysis?: string;

  @ApiPropertyOptional({ enum: ['pending', 'processing', 'completed', 'failed'] })
  @IsOptional()
  @IsString()
  tagging?: string;

  @ApiPropertyOptional({ enum: ['pending', 'processing', 'completed', 'failed'] })
  @IsOptional()
  @IsString()
  qualityCheck?: string;
}

export class UpdateGarmentDto {
  @ApiPropertyOptional({ description: 'Garment name', minLength: 2, maxLength: 255 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Garment description', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ enum: GarmentType })
  @IsOptional()
  @IsEnum(GarmentType, { message: 'Type must be a valid garment type' })
  type?: GarmentType;

  @ApiPropertyOptional({ enum: GarmentCategory })
  @IsOptional()
  @IsEnum(GarmentCategory, { message: 'Category must be a valid garment category' })
  category?: GarmentCategory;

  @ApiPropertyOptional({ enum: GarmentState })
  @IsOptional()
  @IsEnum(GarmentState, { message: 'State must be a valid garment state' })
  state?: GarmentState;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  brand?: string;

  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;

  @ApiPropertyOptional({ pattern: '^#[0-9a-fA-F]{6}$' })
  @IsOptional()
  @IsString()
  @MaxLength(7)
  colorHex?: string;

  @ApiPropertyOptional({ maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  size?: string;

  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  material?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_tld: false }, { message: 'Image URL must be a valid URL' })
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_tld: false })
  thumbnailUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_tld: false })
  maskUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  aiTags?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => PipelineStatusDto)
  pipelineStatus?: PipelineStatusDto;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  position?: number;
}
```

---

## File 2: Controller with Full Decorators

```typescript
// backend/src/modules/garment/controllers/garment.controller.ts (PATCH endpoint)

import {
  Controller,
  Patch,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UseFilters,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { OwnershipGuard } from '../../../common/guards/ownership.guard';
import { TransformInterceptor } from '../../../common/interceptors/transform.interceptor';
import { AuditInterceptor } from '../../../common/interceptors/audit.interceptor';
import { LoggingInterceptor } from '../../../common/interceptors/logging.interceptor';
import { HttpExceptionFilter } from '../../../common/filters/http-exception.filter';
import { ValidationErrorFilter } from '../../../common/filters/validation-error.filter';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { GarmentService } from '../services/garment.service';
import { UpdateGarmentDto } from '../dto/update-garment.dto';
import { GarmentOwnerGuard } from '../guards/garment-owner.guard';

@ApiTags('Garments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseInterceptors(TransformInterceptor, LoggingInterceptor, AuditInterceptor)
@UseFilters(HttpExceptionFilter, ValidationErrorFilter)
@Controller({ path: 'garments', version: '1' })
export class GarmentController {
  private readonly logger = new Logger(GarmentController.name);

  constructor(private readonly garmentService: GarmentService) {}

  @Patch(':id')
  @UseGuards(GarmentOwnerGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a garment',
    description: 'Updates one or more fields of a garment. Validates state transitions and ownership.',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid', description: 'Garment UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Garment updated successfully',
    schema: {
      properties: {
        data: { type: 'object' },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', format: 'date-time' },
            version: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Validation error' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Missing or invalid JWT' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Not the garment owner' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Garment not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Invalid state transition' })
  async update(
    @CurrentUser('id') userId: string,
    @CurrentUser('email') userEmail: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGarmentDto,
  ) {
    this.logger.log(
      `PATCH /garments/${id} - user: ${userId} (${userEmail})`,
    );

    const result = await this.garmentService.updateGarment(id, userId, dto);

    this.logger.log(
      `Garment ${id} updated successfully by user ${userId}`,
    );

    return {
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
    };
  }
}
```

---

## File 3: Service with Business Logic

```typescript
// backend/src/modules/garment/services/garment.service.ts (updateGarment method)

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { GarmentRepository } from '../repositories/garment.repository';
import { GarmentGateway } from '../gateways/garment.gateway';
import { AuditService } from '../../../common/services/audit.service';
import { Garment, GarmentState } from '../entities/garment.entity';
import type { GarmentData } from '../interfaces/garment.interface';
import { isValidStateTransition } from '../interfaces/garment.interface';
import { UpdateGarmentDto } from '../dto/update-garment.dto';

@Injectable()
export class GarmentService {
  private readonly logger = new Logger(GarmentService.name);

  constructor(
    private readonly garmentRepository: GarmentRepository,
    private readonly garmentGateway: GarmentGateway,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async updateGarment(
    id: string,
    userId: string,
    dto: UpdateGarmentDto,
  ): Promise<GarmentData> {
    this.logger.log(`Updating garment ${id} for user ${userId}`);

    const garment = await this.garmentRepository.findByIdAndUser(id, userId);
    if (!garment) {
      throw new NotFoundException(`Garment with id "${id}" not found`);
    }

    if (dto.state !== undefined && dto.state !== garment.state) {
      this.validateStateTransition(garment.state, dto.state);
    }

    this.checkVersionConflict(id, garment);

    const changes = this.buildUpdatePayload(garment, dto);

    if (Object.keys(changes).length === 0) {
      return this.toData(garment);
    }

    const updated = await this.garmentRepository.update(id, changes);
    if (!updated) {
      throw new ConflictException(`Failed to update garment ${id}`);
    }

    await this.clearGarmentCache(id);

    await this.auditService.log({
      action: 'GARMENT_UPDATED',
      resourceType: 'garment',
      resourceId: id,
      userId,
      changes: Object.keys(changes),
      previousState: garment.state,
      newState: updated.state,
      metadata: { changedFields: Object.keys(changes) },
    });

    this.garmentGateway.emitGarmentUpdated(id, userId, Object.keys(changes));

    this.eventEmitter.emit('garment:updated', {
      garmentId: id,
      userId,
      changes: Object.keys(changes),
      timestamp: new Date(),
    });

    this.logger.log(`Garment ${id} updated: ${Object.keys(changes).join(', ')}`);
    return this.toData(updated);
  }

  private validateStateTransition(current: GarmentState, next: GarmentState): void {
    if (!isValidStateTransition(current, next)) {
      throw new BadRequestException(
        `Cannot transition garment state from "${current}" to "${next}". ` +
        `Allowed transitions: ${this.getAllowedTransitions(current)}`,
      );
    }
  }

  private getAllowedTransitions(state: GarmentState): string {
    const transitions: Record<GarmentState, GarmentState[]> = {
      [GarmentState.Pending]: [GarmentState.Processing, GarmentState.Archived, GarmentState.Error],
      [GarmentState.Processing]: [GarmentState.Ready, GarmentState.Error],
      [GarmentState.Ready]: [GarmentState.Archived],
      [GarmentState.Archived]: [GarmentState.Ready],
      [GarmentState.Error]: [GarmentState.Processing, GarmentState.Archived],
    };
    return (transitions[state] ?? []).map((s) => `"${s}"`).join(', ');
  }

  private checkVersionConflict(id: string, garment: Garment): void {
    const updatedAt = garment.updatedAt.getTime();
    const staleThreshold = Date.now() - 300000;
    if (updatedAt > staleThreshold) {
      this.logger.warn(`Possible concurrent update for garment ${id}`);
    }
  }

  private buildUpdatePayload(
    garment: Garment,
    dto: UpdateGarmentDto,
  ): Partial<Garment> {
    const changes: Record<string, unknown> = {};

    const fields: Array<keyof UpdateGarmentDto> = [
      'name', 'description', 'type', 'category', 'state',
      'brand', 'color', 'colorHex', 'size', 'material',
      'imageUrl', 'thumbnailUrl', 'maskUrl', 'aiTags',
      'pipelineStatus', 'position',
    ];

    for (const field of fields) {
      const value = (dto as Record<string, unknown>)[field];
      if (value !== undefined) {
        changes[field] = value;
      }
    }

    return changes as Partial<Garment>;
  }

  private async clearGarmentCache(id: string): Promise<void> {
    try {
      await this.redis.del(`garment:${id}`);
      await this.redis.del('garments:list:*');
    } catch (error) {
      this.logger.error(
        `Failed to clear cache for garment ${id}: ${(error as Error).message}`,
      );
    }
  }

  private toData(garment: Garment): GarmentData {
    return {
      id: garment.id,
      userId: garment.userId,
      name: garment.name,
      description: garment.description,
      type: garment.type,
      category: garment.category,
      state: garment.state,
      brand: garment.brand,
      color: garment.color,
      colorHex: garment.colorHex,
      size: garment.size,
      material: garment.material,
      imageUrl: garment.imageUrl,
      thumbnailUrl: garment.thumbnailUrl,
      maskUrl: garment.maskUrl,
      aiTags: garment.aiTags,
      pipelineStatus: garment.pipelineStatus,
      position: garment.position,
      createdAt: garment.createdAt,
      updatedAt: garment.updatedAt,
    };
  }
}
```

---

## File 4: Ownership Guard

```typescript
// backend/src/modules/garment/guards/garment-owner.guard.ts

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Garment } from '../entities/garment.entity';

@Injectable()
export class GarmentOwnerGuard implements CanActivate {
  private readonly logger = new Logger(GarmentOwnerGuard.name);

  constructor(
    @InjectRepository(Garment)
    private readonly garmentRepository: Repository<Garment>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId: string | undefined = request.user?.id;
    const garmentId: string | undefined = request.params?.id;

    if (!userId) {
      this.logger.warn('Ownership guard: no user ID in request');
      return false;
    }

    if (!garmentId) {
      this.logger.warn('Ownership guard: no garment ID in params');
      return false;
    }

    const garment = await this.garmentRepository.findOne({
      where: { id: garmentId, userId },
      select: ['id', 'userId'],
    });

    if (!garment) {
      this.logger.warn(
        `Ownership guard: garment ${garmentId} not found for user ${userId}`,
      );
      throw new NotFoundException(`Garment with id "${garmentId}" not found`);
    }

    request.garment = garment;
    return true;
  }
}
```

---

## File 5: Transform Interceptor

```typescript
// backend/src/common/interceptors/transform.interceptor.ts

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

export interface TransformedResponse<T> {
  data: T;
  meta: {
    timestamp: string;
    version: string;
  };
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, TransformedResponse<T>>
{
  private readonly logger = new Logger(TransformInterceptor.name);

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<TransformedResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;

    return next.handle().pipe(
      map((response) => {
        if (this.isAlreadyFormatted(response)) {
          return response as unknown as TransformedResponse<T>;
        }

        const transformed: TransformedResponse<T> = {
          data: response as T,
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0',
          },
        };

        this.logger.debug(
          `Response transformed: ${method} ${url} -> status ${context.switchToHttp().getResponse().statusCode}`,
        );

        return transformed;
      }),
    );
  }

  private isAlreadyFormatted(
    response: unknown,
  ): response is TransformedResponse<unknown> {
    if (typeof response !== 'object' || response === null) return false;
    const obj = response as Record<string, unknown>;
    return 'data' in obj && 'meta' in obj;
  }
}
```

---

## File 6: Audit Interceptor

```typescript
// backend/src/common/interceptors/audit.interceptor.ts

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from '../services/audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, params, body, ip } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (response: unknown) => {
          const duration = Date.now() - startTime;
          const statusCode = context.switchToHttp().getResponse().statusCode;

          this.auditService.logRequest({
            method,
            url,
            userId: user?.id,
            userEmail: user?.email,
            statusCode,
            duration,
            ip,
            resourceId: params?.id,
            requestBody: this.sanitizeBody(body),
          }).catch((err: Error) => {
            this.logger.error(`Audit log failed: ${err.message}`);
          });
        },
        error: (error: Error) => {
          const duration = Date.now() - startTime;
          this.logger.warn(
            `Request failed: ${method} ${url} (${duration}ms): ${error.message}`,
          );
        },
      }),
    );
  }

  private sanitizeBody(body: unknown): Record<string, unknown> | undefined {
    if (!body || typeof body !== 'object') return undefined;
    const sanitized = { ...body as Record<string, unknown> };
    const sensitiveFields = ['password', 'token', 'secret', 'authorization'];
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }
    return sanitized;
  }
}
```

---

## File 7: HTTP Exception Filter

```typescript
// backend/src/common/filters/http-exception.filter.ts

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown[];
    timestamp: string;
    path: string;
  };
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorResponse: ErrorResponse = {
      error: {
        code: this.getErrorCode(status),
        message: this.getErrorMessage(exceptionResponse),
        details: this.getErrorDetails(exceptionResponse),
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    };

    this.logger.warn(
      `${request.method} ${request.url} -> ${status} ${errorResponse.error.code}: ${errorResponse.error.message}`,
    );

    response.status(status).json(errorResponse);
  }

  private getErrorCode(status: number): string {
    const codeMap: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'VALIDATION_ERROR',
      [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
      [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
      [HttpStatus.CONFLICT]: 'CONFLICT',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_ENTITY',
      [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMITED',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_ERROR',
    };
    return codeMap[status] ?? 'UNKNOWN_ERROR';
  }

  private getErrorMessage(exceptionResponse: string | object): string {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }
    const obj = exceptionResponse as Record<string, unknown>;
    if (typeof obj.message === 'string') return obj.message;
    if (Array.isArray(obj.message)) return (obj.message as string[]).join('; ');
    return 'An error occurred';
  }

  private getErrorDetails(exceptionResponse: string | object): unknown[] | undefined {
    if (typeof exceptionResponse === 'object') {
      const obj = exceptionResponse as Record<string, unknown>;
      if (Array.isArray(obj.message)) {
        return obj.message.map((msg: string) => ({ message: msg }));
      }
    }
    return undefined;
  }
}
```

---

## File 8: Logging Interceptor

```typescript
// backend/src/common/interceptors/logging.interceptor.ts

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user } = request;
    const userId = user?.id ?? 'anonymous';
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = context.switchToHttp().getResponse().statusCode;
          this.logger.log(
            `${method} ${url} ${statusCode} ${duration}ms [user:${userId}]`,
          );
        },
        error: (error: Error) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            `${method} ${url} ${duration}ms [user:${userId}] - ${error.message}`,
          );
        },
      }),
    );
  }
}
```

---

## File 9: Controller Integration Test

```typescript
// backend/test/garment/garment-update.e2e-spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { createTestUser, getTestJwt } from '../helpers/auth.helper';
import { createTestGarment } from '../helpers/garment.helper';

describe('PATCH /api/v1/garments/:id', () => {
  let app: INestApplication;
  let jwtToken: string;
  let userId: string;
  let garmentId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    const user = await createTestUser(app);
    userId = user.id;
    jwtToken = await getTestJwt(app, user);

    const garment = await createTestGarment(app, jwtToken);
    garmentId = garment.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 401 without authentication', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/garments/${garmentId}`)
      .send({ name: 'Test' })
      .expect(401);
  });

  it('should return 404 for non-existent garment', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/garments/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ name: 'Test' })
      .expect(404);
  });

  it('should update a garment name successfully', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/garments/${garmentId}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ name: 'Updated Garment Name' })
      .expect(200);

    expect(response.body.data).toBeDefined();
    expect(response.body.data.name).toBe('Updated Garment Name');
    expect(response.body.data.id).toBe(garmentId);
    expect(response.body.meta).toBeDefined();
    expect(response.body.meta.timestamp).toBeDefined();
  });

  it('should update multiple fields at once', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/garments/${garmentId}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        brand: 'Nike',
        color: 'Red',
        size: 'L',
        material: 'Cotton',
      })
      .expect(200);

    expect(response.body.data.brand).toBe('Nike');
    expect(response.body.data.color).toBe('Red');
    expect(response.body.data.size).toBe('L');
    expect(response.body.data.material).toBe('Cotton');
  });

  it('should reject invalid state transitions', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/garments/${garmentId}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ state: 'archived' })
      .expect(409);
  });

  it('should validate field constraints', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/garments/${garmentId}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ name: '' })
      .expect(400);
  });

  it('should reject non-whitelisted fields', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/garments/${garmentId}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ invalidField: 'test' })
      .expect(400);
  });

  it('should refuse update by other user', async () => {
    const otherUserJwt = await getTestJwt(app, await createTestUser(app));

    await request(app.getHttpServer())
      .patch(`/api/v1/garments/${garmentId}`)
      .set('Authorization', `Bearer ${otherUserJwt}`)
      .send({ name: 'Hacked' })
      .expect(404);
  });

  it('should return consistent response format', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/garments/${garmentId}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ name: 'Consistent Format' })
      .expect(200);

    expect(response.body).toMatchObject({
      data: expect.any(Object),
      meta: {
        timestamp: expect.any(String),
        version: '1.0',
      },
    });
  });

  it('should not update if no changes provided', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/garments/${garmentId}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({})
      .expect(200);

    expect(response.body.data.id).toBe(garmentId);
  });
});
```

---

## File 10: Service Unit Test

```typescript
// backend/src/modules/garment/services/garment.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GarmentService } from './garment.service';
import { GarmentRepository } from '../repositories/garment.repository';
import { GarmentGateway } from '../gateways/garment.gateway';
import { AuditService } from '../../../common/services/audit.service';
import { Garment, GarmentState, GarmentType, GarmentCategory } from '../entities/garment.entity';

describe('GarmentService - updateGarment', () => {
  let service: GarmentService;
  let repository: jest.Mocked<GarmentRepository>;
  let gateway: jest.Mocked<GarmentGateway>;
  let auditService: jest.Mocked<AuditService>;

  const mockGarment: Garment = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    userId: 'user-1',
    name: 'Blue Denim Jacket',
    description: null,
    type: GarmentType.Outerwear,
    category: GarmentCategory.Jacket,
    state: GarmentState.Ready,
    brand: 'Levi',
    color: 'Blue',
    colorHex: '#1a5c8a',
    size: 'M',
    material: 'Denim',
    imageUrl: 'https://example.com/jacket.jpg',
    thumbnailUrl: null,
    maskUrl: null,
    aiTags: null,
    pipelineStatus: null,
    position: 0,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-15'),
    user: null as any,
  };

  beforeEach(async () => {
    const repositoryMock = {
      findByIdAndUser: jest.fn(),
      update: jest.fn(),
    };

    const gatewayMock = {
      emitGarmentUpdated: jest.fn(),
    };

    const auditServiceMock = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const eventEmitterMock = {
      emit: jest.fn(),
    };

    const redisMock = {
      del: jest.fn().mockResolvedValue(1),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GarmentService,
        { provide: GarmentRepository, useValue: repositoryMock },
        { provide: GarmentGateway, useValue: gatewayMock },
        { provide: AuditService, useValue: auditServiceMock },
        { provide: EventEmitter2, useValue: eventEmitterMock },
        { provide: 'default:IORedisModuleConnectionToken', useValue: redisMock },
      ],
    }).compile();

    service = module.get<GarmentService>(GarmentService);
    repository = module.get(GarmentRepository) as jest.Mocked<GarmentRepository>;
    gateway = module.get(GarmentGateway) as jest.Mocked<GarmentGateway>;
    auditService = module.get(AuditService) as jest.Mocked<AuditService>;
  });

  it('should update a garment successfully', async () => {
    repository.findByIdAndUser.mockResolvedValue(mockGarment);
    repository.update.mockResolvedValue({ ...mockGarment, name: 'Updated Name' });

    const result = await service.updateGarment('garment-id', 'user-1', {
      name: 'Updated Name',
    });

    expect(result.name).toBe('Updated Name');
    expect(gateway.emitGarmentUpdated).toHaveBeenCalledWith(
      'garment-id',
      'user-1',
      expect.arrayContaining(['name']),
    );
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'GARMENT_UPDATED',
        resourceId: 'garment-id',
      }),
    );
  });

  it('should throw NotFoundException when garment not found', async () => {
    repository.findByIdAndUser.mockResolvedValue(null);

    await expect(
      service.updateGarment('nonexistent', 'user-1', { name: 'Test' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException for invalid state transition', async () => {
    repository.findByIdAndUser.mockResolvedValue({
      ...mockGarment,
      state: GarmentState.Ready,
    });

    await expect(
      service.updateGarment('garment-id', 'user-1', {
        state: GarmentState.Pending,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw ConflictException when update fails', async () => {
    repository.findByIdAndUser.mockResolvedValue(mockGarment);
    repository.update.mockResolvedValue(null);

    await expect(
      service.updateGarment('garment-id', 'user-1', { name: 'Test' }),
    ).rejects.toThrow(ConflictException);
  });

  it("should return unchanged garment when no fields provided", async () => {
    repository.findByIdAndUser.mockResolvedValue(mockGarment);

    const result = await service.updateGarment('garment-id', 'user-1', {});

    expect(result.name).toBe('Blue Denim Jacket');
    expect(repository.update).not.toHaveBeenCalled();
  });

  it("should emit WebSocket event on update", async () => {
    repository.findByIdAndUser.mockResolvedValue(mockGarment);
    repository.update.mockResolvedValue({
      ...mockGarment,
      brand: 'New Brand',
      color: 'Red',
    });

    await service.updateGarment('garment-id', 'user-1', {
      brand: 'New Brand',
      color: 'Red',
    });

    expect(gateway.emitGarmentUpdated).toHaveBeenCalledWith(
      'garment-id',
      'user-1',
      expect.arrayContaining(['brand', 'color']),
    );
  });

  it("should log audit entry on successful update", async () => {
    repository.findByIdAndUser.mockResolvedValue(mockGarment);
    repository.update.mockResolvedValue({
      ...mockGarment,
      name: 'Audited Name',
    });

    await service.updateGarment('garment-id', 'user-1', {
      name: 'Audited Name',
    });

    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'GARMENT_UPDATED',
        resourceId: 'garment-id',
        changes: ['name'],
      }),
    );
  });
});
```

---

## Full Request/Response Flow

```
Client                   Controller                Service                 Repository
  │                         │                         │                        │
  │  PATCH /garments/:id    │                         │                        │
  │  Authorization: Bearer  │                         │                        │
  │────────────────────────►│                         │                        │
  │                         │                         │                        │
  │  ┌─ JwtAuthGuard        │                         │                        │
  │  │  Verify JWT token    │                         │                        │
  │  └─────────────────────│                         │                        │
  │                         │                         │                        │
  │  ┌─ GarmentOwnerGuard   │                         │                        │
  │  │  Find garment by ID  │── findByIdAndUser ──────►──────────────────────►│
  │  │  Compare userId      │◄────── garment ────────│◄──────────────────────│
  │  └─────────────────────│                         │                        │
  │                         │                         │                        │
  │  ┌─ ValidationPipe      │                         │                        │
  │  │  Validate DTO        │                         │                        │
  │  └─────────────────────│                         │                        │
  │                         │                         │                        │
  │                         │── updateGarment ───────►│                        │
  │                         │                         │                        │
  │                         │                         │  ┌─ Validate state     │
  │                         │                         │  └─ transition        │
  │                         │                         │                        │
  │                         │                         │── update ────────────►│
  │                         │                         │◄── updated ──────────│
  │                         │                         │                        │
  │                         │                         │  ┌─ Clear cache       │
  │                         │                         │  ├─ Log audit         │
  │                         │                         │  ├─ Emit WebSocket    │
  │                         │                         │  └─ Emit event        │
  │                         │                         │                        │
  │                         │◄────── result ─────────│                        │
  │                         │                         │                        │
  │  ┌─ TransformInterceptor│                         │                        │
  │  │  Wrap in {data,meta} │                         │                        │
  │  └─────────────────────│                         │                        │
  │                         │                         │                        │
  │◄── 200 {data, meta} ───│                         │                        │
  │                         │                         │                        │
```

---

## Key Patterns Demonstrated

| Pattern | Implementation |
|---------|---------------|
| **DTO with class-validator** | Full validation decorators on `UpdateGarmentDto` |
| **Controller Decorators** | `@Patch`, `@UseGuards`, `@UseInterceptors`, `@UseFilters` |
| **JWT Authentication** | `@UseGuards(JwtAuthGuard)` |
| **Resource Ownership** | `@UseGuards(GarmentOwnerGuard)` with DB lookup |
| **Response Transformation** | `TransformInterceptor` wrapping in `{data, meta}` envelope |
| **Exception Handling** | `HttpExceptionFilter` with typed error codes |
| **Audit Logging** | `AuditInterceptor` + `AuditService` for state change tracking |
| **Cache Invalidation** | Redis cache clear on successful update |
| **WebSocket Emission** | `emitGarmentUpdated()` via gateway |
| **Event-Driven** | `EventEmitter2` for decoupled side effects |
| **Validation Error Handling** | `ValidationErrorFilter` for consistent 400 responses |
| **E2E Testing** | Supertest with authenticated requests and assertions |
| **Unit Testing** | Mocked dependencies covering all error paths |
