# Backend Testing — Closet Inteligente Digital

## 1. NestJS Testing Setup

### 1.1 Dependencies

```json
{
  "devDependencies": {
    "@nestjs/testing": "^10.x",
    "@types/jest": "^29.x",
    "@types/supertest": "^6.x",
    "jest": "^29.x",
    "supertest": "^6.x",
    "ts-jest": "^29.x",
    "testcontainers": "^10.x",
    "nock": "^13.x",
    "redis-mock": "^0.56.x"
  }
}
```

### 1.2 Jest configuration

```ts
// jest.backend.config.ts
import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  collectCoverageFrom: ['**/*.(t|j)s', '!**/*.module.ts', '!**/main.ts'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  setupFilesAfterSetup: ['<rootDir>/../test/jest.setup.ts'],
};

export default config;
```

### 1.3 Global setup file

```ts
// test/jest.setup.ts
import { GenericContainer, StartedTestContainer } from 'testcontainers';

let postgresContainer: StartedTestContainer;
let redisContainer: StartedTestContainer;

beforeAll(async () => {
  postgresContainer = await new GenericContainer('postgres:16')
    .withEnvironment({
      POSTGRES_DB: 'closet_test',
      POSTGRES_USER: 'test',
      POSTGRES_PASSWORD: 'test',
    })
    .withExposedPorts(5432)
    .start();

  process.env.DATABASE_URL = `postgresql://test:test@localhost:${postgresContainer.getMappedPort(5432)}/closet_test`;

  redisContainer = await new GenericContainer('redis:7')
    .withExposedPorts(6379)
    .start();

  process.env.REDIS_URL = `redis://localhost:${redisContainer.getMappedPort(6379)}`;
}, 60000);

afterAll(async () => {
  await postgresContainer?.stop();
  await redisContainer?.stop();
});
```

## 2. Unit Testing Services

### 2.1 Mock Repository Pattern

Create a reusable mock factory for TypeORM repositories:

```ts
// test/mocks/repository.mock.ts
import { Repository } from 'typeorm';
import { DeepPartial } from 'typeorm/common/DeepPartial';

export type MockRepository<T> = {
  [K in keyof Repository<T>]: jest.Mock;
};

export function createMockRepository<T>(): MockRepository<T> {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    softDelete: jest.fn(),
    restore: jest.fn(),
    count: jest.fn(),
    exists: jest.fn(),
    query: jest.fn(),
    createQueryBuilder: jest.fn(),
    manager: {} as any,
    metadata: {} as any,
    target: {} as any,
    hasId: jest.fn(),
    getId: jest.fn(),
    preload: jest.fn(),
    insert: jest.fn(),
    upsert: jest.fn(),
    remove: jest.fn(),
    softRemove: jest.fn(),
    recover: jest.fn(),
    increment: jest.fn(),
    decrement: jest.fn(),
    merge: jest.fn(),
    findOneOrFail: jest.fn(),
    findByIds: jest.fn(),
  } as unknown as MockRepository<T>;
}
```

### 2.2 Stubbing External Services

```ts
// test/stubs/supabase-client.stub.ts
export const createSupabaseClientStub = () => ({
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    refreshSession: jest.fn(),
    getUser: jest.fn(),
    resetPasswordForEmail: jest.fn(),
    updateUser: jest.fn(),
  },
  storage: {
    from: jest.fn().mockReturnThis(),
    upload: jest.fn(),
    download: jest.fn(),
    remove: jest.fn(),
    getPublicUrl: jest.fn(),
    createSignedUrl: jest.fn(),
  },
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn(),
  maybeSingle: jest.fn(),
  throwOnError: jest.fn(),
});
```

### 2.3 Testing Error Paths

Every service test must cover:

1. **Happy path** — operation succeeds, correct result returned.
2. **Validation failure** — invalid input throws `BadRequestException`.
3. **Not found** — entity lookup returns `null`, throws `NotFoundException`.
4. **Conflict** — duplicate key throws `ConflictException`.
5. **Authorization** — insufficient role throws `ForbiddenException`.
6. **External service failure** — Supabase/Redis call throws, catches and re-throws `InternalServerErrorException`.
7. **Database constraint violation** — `save()` throws `QueryFailedError`, maps to appropriate HTTP exception.

## 3. Integration Testing Controllers

### 3.1 Basic setup pattern

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('[Integration] GarmentController', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    dataSource = app.get(DataSource);
    await dataSource.runMigrations();

    // Seed a test user and obtain JWT
    const seed = await seedTestUser(app);
    authToken = seed.token;
    userId = seed.userId;
  });

  afterAll(async () => {
    await dataSource.query('TRUNCATE TABLE users, garments, outfits, calendar_events, notifications CASCADE');
    await app.close();
  });

  afterEach(async () => {
    await dataSource.query('TRUNCATE TABLE garments CASCADE');
  });

  // Tests...
});
```

### 3.2 Testing full request/response cycle

```ts
describe('POST /api/garments', () => {
  it('should create a garment and return 201 with the created entity', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/garments')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('image', Buffer.from('fake-image-data'), 'test.jpg')
      .field('name', 'Blue Cotton Shirt')
      .field('category', 'top')
      .field('color', 'blue')
      .field('brand', 'Nike')
      .field('size', 'M')
      .expect(201);

    expect(response.body).toMatchObject({
      id: expect.any(String),
      name: 'Blue Cotton Shirt',
      category: 'top',
      color: 'blue',
      userId,
    });
    expect(response.body.imageUrl).toMatch(/^https?:\/\//);
  });

  it('should return 400 when required fields are missing', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/garments')
      .set('Authorization', `Bearer ${authToken}`)
      .field('name', 'Incomplete Garment')
      .expect(400);

    expect(response.body.message).toContain('category should not be empty');
  });

  it('should return 401 without auth token', async () => {
    await request(app.getHttpServer())
      .post('/api/garments')
      .field('name', 'Unauthorized')
      .field('category', 'top')
      .expect(401);
  });

  it('should return 413 when file exceeds size limit', async () => {
    const largeBuffer = Buffer.alloc(15 * 1024 * 1024); // 15 MB
    await request(app.getHttpServer())
      .post('/api/garments')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('image', largeBuffer, 'large.jpg')
      .field('name', 'Oversized Garment')
      .field('category', 'top')
      .expect(413);
  });

  it('should return 415 when file type is invalid', async () => {
    await request(app.getHttpServer())
      .post('/api/garments')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('image', Buffer.from('not-an-image'), 'document.pdf')
      .field('name', 'Invalid File')
      .field('category', 'top')
      .expect(415);
  });
});

describe('GET /api/garments', () => {
  beforeEach(async () => {
    // Insert test garments
    await dataSource.query(`
      INSERT INTO garments (id, name, category, color, user_id, image_url, created_at)
      VALUES
        (gen_random_uuid(), 'Shirt A', 'top', 'red', $1, 'https://example.com/a.jpg', NOW()),
        (gen_random_uuid(), 'Shirt B', 'top', 'blue', $1, 'https://example.com/b.jpg', NOW()),
        (gen_random_uuid(), 'Pants C', 'bottom', 'black', $1, 'https://example.com/c.jpg', NOW())
    `, [userId]);
  });

  it('should return paginated garments', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/garments?page=1&limit=2')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.data).toHaveLength(2);
    expect(response.body.meta).toMatchObject({ total: 3, page: 1, limit: 2 });
  });

  it('should filter by category', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/garments?category=bottom')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].category).toBe('bottom');
  });

  it('should search by name', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/garments?search=Shirt')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.data).toHaveLength(2);
  });
});

describe('GET /api/garments/:id', () => {
  let garmentId: string;

  beforeEach(async () => {
    const result = await dataSource.query(`
      INSERT INTO garments (name, category, color, user_id, image_url)
      VALUES ('Test Garment', 'top', 'green', $1, 'https://example.com/g.jpg')
      RETURNING id
    `, [userId]);
    garmentId = result[0].id;
  });

  it('should return a garment by id', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/garments/${garmentId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.name).toBe('Test Garment');
  });

  it('should return 404 when garment does not exist', async () => {
    await request(app.getHttpServer())
      .get('/api/garments/non-existent-uuid')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);
  });

  it('should return 403 when garment belongs to another user', async () => {
    const otherUserToken = await getTokenForOtherUser(app);
    await request(app.getHttpServer())
      .get(`/api/garments/${garmentId}`)
      .set('Authorization', `Bearer ${otherUserToken}`)
      .expect(403);
  });
});

describe('PATCH /api/garments/:id', () => {
  let garmentId: string;

  beforeEach(async () => {
    const result = await dataSource.query(`
      INSERT INTO garments (name, category, color, user_id, image_url)
      VALUES ('Old Name', 'top', 'red', $1, 'https://example.com/g.jpg')
      RETURNING id
    `, [userId]);
    garmentId = result[0].id;
  });

  it('should update a garment', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/garments/${garmentId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'New Name', color: 'blue' })
      .expect(200);

    expect(response.body.name).toBe('New Name');
    expect(response.body.color).toBe('blue');
  });

  it('should return 404 when updating non-existent garment', async () => {
    await request(app.getHttpServer())
      .patch('/api/garments/non-existent-uuid')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Ghost' })
      .expect(404);
  });
});

describe('DELETE /api/garments/:id', () => {
  it('should soft-delete a garment and return 204', async () => {
    const result = await dataSource.query(`
      INSERT INTO garments (name, category, color, user_id, image_url)
      VALUES ('To Delete', 'top', 'red', $1, 'https://example.com/g.jpg')
      RETURNING id
    `, [userId]);
    const garmentId = result[0].id;

    await request(app.getHttpServer())
      .delete(`/api/garments/${garmentId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(204);

    // Verify soft-delete
    const { deletedAt } = (await dataSource.query(
      'SELECT deleted_at FROM garments WHERE id = $1', [garmentId]
    ))[0];
    expect(deletedAt).not.toBeNull();
  });
});
```

## 4. Testing Guards, Interceptors, Pipes, Filters

### 4.1 Guard test (JwtAuthGuard)

```ts
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  it('should allow access when @Public() decorator is present', () => {
    const context = createMockExecutionContext({ isPublic: true });
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

    const result = guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw UnauthorizedException when no token', () => {
    const context = createMockExecutionContext({ headers: {} });
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when token is expired', () => {
    const context = createMockExecutionContext({
      headers: { authorization: 'Bearer expired.jwt.here' },
    });
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should allow access when valid token is present', () => {
    const mockUser = { id: 'user-1', email: 'test@example.com' };
    const validToken = generateTestJwt(mockUser);
    const context = createMockExecutionContext({
      headers: { authorization: `Bearer ${validToken}` },
    });
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    const result = guard.canActivate(context);
    expect(result).toBe(true);
    expect(context.switchToHttp().getRequest().user).toEqual(mockUser);
  });

  function createMockExecutionContext(options: { isPublic?: boolean; headers?: Record<string, string> }): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: options.headers || {},
          user: null,
        }),
        getResponse: jest.fn(),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  }
});
```

### 4.2 Interceptor test (LoggingInterceptor)

```ts
import { LoggingInterceptor } from '../src/common/interceptors/logging.interceptor';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let mockLogger: { log: jest.Mock };

  beforeEach(() => {
    mockLogger = { log: jest.fn() };
    interceptor = new LoggingInterceptor(mockLogger as any);
  });

  it('should log the request method and URL', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ method: 'GET', url: '/api/garments' }),
      }),
    } as ExecutionContext;

    const next: CallHandler = { handle: () => of('test') };

    interceptor.intercept(context, next).subscribe();

    expect(mockLogger.log).toHaveBeenCalledWith(
      expect.stringContaining('GET /api/garments')
    );
  });

  it('should log the response time', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ method: 'POST', url: '/api/garments' }),
      }),
    } as ExecutionContext;

    const next: CallHandler = { handle: () => of('response') };

    interceptor.intercept(context, next).subscribe();

    expect(mockLogger.log).toHaveBeenCalledWith(
      expect.stringMatching(/\d+ms$/)
    );
  });
});
```

### 4.3 Pipe test (ValidationPipe)

```ts
import { ValidationPipe } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

class CreateGarmentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(['top', 'bottom', 'footwear', 'accessory', 'outerwear'])
  category: string;

  @IsString()
  @IsNotEmpty()
  color: string;

  @IsOptional()
  @IsString()
  brand?: string;
}

describe('ValidationPipe (CreateGarmentDto)', () => {
  let pipe: ValidationPipe;

  beforeEach(() => {
    pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true });
  });

  it('should pass valid DTO', async () => {
    const dto = { name: 'Shirt', category: 'top', color: 'blue' };
    const result = await pipe.transform(dto, {
      type: 'body',
      metatype: CreateGarmentDto,
    });
    expect(result).toEqual(dto);
  });

  it('should strip unknown properties when whitelist is true', async () => {
    const result = await pipe.transform(
      { name: 'Shirt', category: 'top', color: 'blue', unknownField: 'evil' },
      { type: 'body', metatype: CreateGarmentDto }
    );
    expect(result).not.toHaveProperty('unknownField');
  });

  it('should throw on missing required field', async () => {
    await expect(
      pipe.transform(
        { name: 'Shirt', color: 'blue' },
        { type: 'body', metatype: CreateGarmentDto }
      )
    ).rejects.toThrow();
  });

  it('should throw on invalid enum value', async () => {
    await expect(
      pipe.transform(
        { name: 'Shirt', category: 'invalid_category', color: 'blue' },
        { type: 'body', metatype: CreateGarmentDto }
      )
    ).rejects.toThrow();
  });
});
```

### 4.4 Exception filter test (AllExceptionsFilter)

```ts
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
  });

  it('should format HttpException correctly', () => {
    const exception = new HttpException('Bad Request', HttpStatus.BAD_REQUEST);
    const host = createMockHost(mockStatus);

    filter.catch(exception, host);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Bad Request',
      timestamp: expect.any(String),
      path: '/test',
    });
  });

  it('should handle unrecognized exceptions as 500', () => {
    const exception = new Error('Something broke');
    const host = createMockHost(mockStatus);

    filter.catch(exception, host);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR })
    );
  });

  function createMockHost(statusFn: jest.Mock): ArgumentsHost {
    return {
      switchToHttp: () => ({
        getResponse: () => ({
          status: statusFn,
          json: mockJson,
        }),
        getRequest: () => ({ url: '/test' }),
      }),
    } as unknown as ArgumentsHost;
  }
});
```

## 5. Testing WebSocket Gateways

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { io as Client, Socket } from 'socket.io-client';
import { AppModule } from '../src/app.module';

describe('[WebSocket] NotificationsGateway', () => {
  let app: INestApplication;
  let clientSocket: Socket;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.listen(0); // random port

    const httpServer = app.getHttpServer();
    const { token, id } = await seedTestUser(app);
    authToken = token;
    userId = id;
  });

  afterAll(async () => {
    clientSocket?.disconnect();
    await app.close();
  });

  const connectSocket = (token: string): Promise<Socket> =>
    new Promise((resolve, reject) => {
      const socket = Client(`http://localhost:${app.getHttpServer().address().port}`, {
        auth: { token },
        transports: ['websocket'],
      });
      socket.on('connect', () => resolve(socket));
      socket.on('connect_error', reject);
    });

  describe('connection', () => {
    it('should connect with valid JWT', async () => {
      clientSocket = await connectSocket(authToken);
      expect(clientSocket.connected).toBe(true);
    });

    it('should reject connection with invalid JWT', async () => {
      await expect(connectSocket('invalid-token')).rejects.toThrow();
    });
  });

  describe('notification events', () => {
    beforeEach(async () => {
      clientSocket = await connectSocket(authToken);
    });

    afterEach(() => {
      clientSocket?.disconnect();
    });

    it('should receive notification when a new notification is created', (done) => {
      clientSocket.on('notification:new', (data) => {
        expect(data).toMatchObject({
          id: expect.any(String),
          type: expect.any(String),
          message: expect.any(String),
        });
        done();
      });

      // Simulate creating a notification via the API
      request(app.getHttpServer())
        .post('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ type: 'outfit_reminder', message: 'Time to dress!' })
        .expect(201);
    });

    it('should mark notification as read via socket event', (done) => {
      clientSocket.emit('notification:read', { notificationId: 'some-id' });
      clientSocket.on('notification:read:ack', (data) => {
        expect(data.success).toBe(true);
        done();
      });
    });
  });
});
```

## 6. Testing Database Interactions with Testcontainers

```ts
import { DataSource } from 'typeorm';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { createDatabase, dropDatabase } from 'typeorm-extension';

describe('Database integration', () => {
  let container: StartedTestContainer;
  let dataSource: DataSource;

  beforeAll(async () => {
    container = await new GenericContainer('postgres:16')
      .withEnvironment({
        POSTGRES_DB: 'closet_test',
        POSTGRES_USER: 'test',
        POSTGRES_PASSWORD: 'test',
      })
      .withExposedPorts(5432)
      .start();

    const databaseUrl = `postgresql://test:test@localhost:${container.getMappedPort(5432)}/closet_test`;

    dataSource = new DataSource({
      type: 'postgres',
      url: databaseUrl,
      entities: ['src/**/*.entity.ts'],
      migrations: ['src/migrations/*.ts'],
      synchronize: false,
    });

    await dataSource.initialize();
    await dataSource.runMigrations();
  }, 60000);

  afterAll(async () => {
    await dataSource?.destroy();
    await container?.stop();
  });

  it('should insert and retrieve a user', async () => {
    await dataSource.query(
      `INSERT INTO users (id, email, password_hash, name) VALUES ($1, $2, $3, $4)`,
      ['test-id', 'test@example.com', '$2b$10$hash', 'Test User']
    );

    const [user] = await dataSource.query(
      'SELECT * FROM users WHERE email = $1',
      ['test@example.com']
    );

    expect(user.email).toBe('test@example.com');
    expect(user.name).toBe('Test User');
  });

  it('should enforce unique email constraint', async () => {
    await dataSource.query(
      `INSERT INTO users (id, email, password_hash, name) VALUES ($1, $2, $3, $4)`,
      ['id-1', 'dupe@example.com', 'hash1', 'User A']
    );

    await expect(
      dataSource.query(
        `INSERT INTO users (id, email, password_hash, name) VALUES ($1, $2, $3, $4)`,
        ['id-2', 'dupe@example.com', 'hash2', 'User B']
      )
    ).rejects.toThrow(/duplicate key|unique constraint/);
  });

  it('should cascade delete user garments', async () => {
    const userId = 'cascade-test-user';
    await dataSource.query(
      `INSERT INTO users (id, email, password_hash, name) VALUES ($1, $2, $3, $4)`,
      [userId, 'cascade@test.com', 'hash', 'Cascade']
    );
    await dataSource.query(
      `INSERT INTO garments (name, category, color, user_id, image_url) VALUES ($1, $2, $3, $4, $5)`,
      ['Cascade Garment', 'top', 'red', userId, 'https://example.com/c.jpg']
    );

    await dataSource.query('DELETE FROM users WHERE id = $1', [userId]);

    const garments = await dataSource.query(
      'SELECT * FROM garments WHERE user_id = $1',
      [userId]
    );
    expect(garments).toHaveLength(0);
  });
});
```

## 7. Testing File Upload Endpoints

```ts
describe('POST /api/garments/upload', () => {
  it('should accept a valid image file', async () => {
    const imageBuffer = createValidImageBuffer(800, 600); // 800x600 JPEG
    const response = await request(app.getHttpServer())
      .post('/api/garments/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('file', imageBuffer, 'shirt.jpg')
      .expect(201);

    expect(response.body).toMatchObject({
      url: expect.stringContaining('supabase.co'),
      width: 800,
      height: 600,
      mimeType: 'image/jpeg',
    });
  });

  it('should reject images exceeding max dimensions', async () => {
    const largeImage = createValidImageBuffer(5000, 5000);
    await request(app.getHttpServer())
      .post('/api/garments/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('file', largeImage, 'huge.jpg')
      .expect(413);
  });

  it('should reject non-image uploads', async () => {
    await request(app.getHttpServer())
      .post('/api/garments/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('file', Buffer.from('malicious content'), 'script.js')
      .expect(415);
  });

  it('should handle Supabase storage failure gracefully', async () => {
    // Arrange: make the storage service throw
    jest.spyOn(supabaseStorageService, 'upload').mockRejectedValueOnce(
      new Error('Storage quota exceeded')
    );

    const response = await request(app.getHttpServer())
      .post('/api/garments/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('file', createValidImageBuffer(100, 100), 'fail.jpg')
      .expect(502);

    expect(response.body.message).toContain('Upload service unavailable');
  });
});
```

## 8. Testing Rate Limiting

```ts
describe('Rate limiting on /api/auth/login', () => {
  it('should allow 5 requests per minute', async () => {
    const payload = { email: 'test@example.com', password: 'wrong' };

    for (let i = 0; i < 5; i++) {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(payload)
        .expect(401); // wrong password
    }
  });

  it('should return 429 after exceeding rate limit', async () => {
    const payload = { email: 'test@example.com', password: 'wrong' };

    // Send 5 requests (first window)
    for (let i = 0; i < 5; i++) {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(payload);
    }

    // 6th request should be blocked
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send(payload)
      .expect(429);
  });

  it('should reset rate limit window after 60 seconds', async () => {
    jest.useFakeTimers();

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrong' })
      .expect(401);

    // Advance time past the window
    jest.advanceTimersByTime(61000);

    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrong' })
      .expect(401);

    expect(response.headers['x-ratelimit-remaining']).toBe('4');
  });
});
```

## 9. Testing Authentication Flows

```ts
describe('[Integration] AuthController', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user and return tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'StrongP@ss1',
          name: 'New User',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        user: { email: 'newuser@example.com', name: 'New User' },
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      });
    });

    it('should reject duplicate email registration', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'dupe@example.com', password: 'StrongP@ss1', name: 'Dupe' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'dupe@example.com', password: 'StrongP@ss1', name: 'Dupe' })
        .expect(409);
    });

    it('should reject weak passwords', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'weak@example.com', password: '123', name: 'Weak' })
        .expect(400);
    });

    it('should reject invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'not-an-email', password: 'StrongP@ss1', name: 'Bad Email' })
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    const credentials = { email: 'logintest@example.com', password: 'StrongP@ss1' };

    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ ...credentials, name: 'Login Test' });
    });

    it('should login with correct credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(credentials)
        .expect(200);

      expect(response.body).toMatchObject({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        user: expect.objectContaining({ email: credentials.email }),
      });
    });

    it('should reject incorrect password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: credentials.email, password: 'WrongPassword1' })
        .expect(401);
    });

    it('should reject non-existent user', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'StrongP@ss1' })
        .expect(401);
    });

    it('should rate-limit excessive login attempts', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({ email: credentials.email, password: 'WrongPassword1' });
      }

      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: credentials.email, password: 'WrongPassword1' })
        .expect(429);
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const registerRes = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'refresh@test.com', password: 'StrongP@ss1', name: 'Refresh Test' });
      refreshToken = registerRes.body.refreshToken;
    });

    it('should issue new access and refresh tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
    });

    it('should reject expired refresh tokens', async () => {
      jest.useFakeTimers();
      jest.advanceTimersByDate(8 * 24 * 60 * 60 * 1000); // 8 days

      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });

    it('should reject reuse of old refresh token after rotation', async () => {
      const firstRefresh = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken });

      const newRefreshToken = firstRefresh.body.refreshToken;

      // Try old token — should fail
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(401);

      // New token still works
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: newRefreshToken })
        .expect(200);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should invalidate the refresh token', async () => {
      const registerRes = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'logout@test.com', password: 'StrongP@ss1', name: 'Logout' });

      const accessToken = registerRes.body.accessToken;
      const refreshToken = registerRes.body.refreshToken;

      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      // Refresh should now fail
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });
  });
});
```

## 10. Mock Factory Patterns for Entities

```ts
// test/factories/user.factory.ts
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

export interface UserFactoryOptions {
  id?: string;
  email?: string;
  password?: string;
  name?: string;
  role?: 'user' | 'admin';
  avatarUrl?: string | null;
  isActive?: boolean;
  createdAt?: Date;
}

export class UserFactory {
  static async create(options: UserFactoryOptions = {}) {
    const password = options.password ?? 'DefaultP@ss1';
    const passwordHash = await bcrypt.hash(password, 10);

    return {
      id: options.id ?? faker.string.uuid(),
      email: options.email ?? faker.internet.email(),
      passwordHash,
      password,
      name: options.name ?? faker.person.fullName(),
      role: options.role ?? 'user',
      avatarUrl: options.avatarUrl ?? null,
      isActive: options.isActive ?? true,
      createdAt: options.createdAt ?? new Date(),
    };
  }

  static createAdmin(options: UserFactoryOptions = {}) {
    return this.create({ ...options, role: 'admin' });
  }

  static createInactive(options: UserFactoryOptions = {}) {
    return this.create({ ...options, isActive: false });
  }

  static createMany(count: number, options: UserFactoryOptions = {}) {
    return Promise.all(Array.from({ length: count }, () => this.create(options)));
  }
}
```

```ts
// test/factories/garment.factory.ts
import { faker } from '@faker-js/faker';

export type GarmentCategory = 'top' | 'bottom' | 'footwear' | 'accessory' | 'outerwear';
export type GarmentColor =
  | 'black' | 'white' | 'gray' | 'red' | 'blue' | 'green' | 'yellow'
  | 'purple' | 'pink' | 'orange' | 'brown' | 'beige' | 'navy' | 'multicolor';
export type GarmentStatus = 'active' | 'archived' | 'processing';

export interface GarmentFactoryOptions {
  id?: string;
  userId?: string;
  name?: string;
  category?: GarmentCategory;
  color?: GarmentColor;
  brand?: string;
  size?: string;
  material?: string;
  imageUrl?: string;
  status?: GarmentStatus;
  favorite?: boolean;
  timesWorn?: number;
  lastWornAt?: Date | null;
  createdAt?: Date;
  deletedAt?: Date | null;
}

export class GarmentFactory {
  static create(options: GarmentFactoryOptions = {}) {
    return {
      id: options.id ?? faker.string.uuid(),
      userId: options.userId ?? faker.string.uuid(),
      name: options.name ?? faker.commerce.productName(),
      category: options.category ?? faker.helpers.arrayElement<GarmentCategory>([
        'top', 'bottom', 'footwear', 'accessory', 'outerwear',
      ]),
      color: options.color ?? faker.helpers.arrayElement<GarmentColor>([
        'black', 'white', 'red', 'blue', 'green',
      ]),
      brand: options.brand ?? faker.company.name(),
      size: options.size ?? faker.helpers.arrayElement(['XS', 'S', 'M', 'L', 'XL', 'XXL']),
      material: options.material ?? faker.helpers.arrayElement([
        'Cotton', 'Polyester', 'Wool', 'Denim', 'Silk', 'Linen',
      ]),
      imageUrl: options.imageUrl ?? faker.image.url(),
      status: options.status ?? 'active',
      favorite: options.favorite ?? false,
      timesWorn: options.timesWorn ?? 0,
      lastWornAt: options.lastWornAt ?? null,
      createdAt: options.createdAt ?? new Date(),
      deletedAt: options.deletedAt ?? null,
    };
  }

  static createTop(options: GarmentFactoryOptions = {}) {
    return this.create({ ...options, category: 'top' });
  }

  static createBottom(options: GarmentFactoryOptions = {}) {
    return this.create({ ...options, category: 'bottom' });
  }

  static createFootwear(options: GarmentFactoryOptions = {}) {
    return this.create({ ...options, category: 'footwear' });
  }

  static createAccessory(options: GarmentFactoryOptions = {}) {
    return this.create({ ...options, category: 'accessory' });
  }

  static createOuterwear(options: GarmentFactoryOptions = {}) {
    return this.create({ ...options, category: 'outerwear' });
  }

  static createFavorited(options: GarmentFactoryOptions = {}) {
    return this.create({ ...options, favorite: true });
  }

  static createProcessing(options: GarmentFactoryOptions = {}) {
    return this.create({ ...options, status: 'processing' });
  }

  static createArchived(options: GarmentFactoryOptions = {}) {
    return this.create({ ...options, status: 'archived' });
  }

  static createMany(count: number, options: GarmentFactoryOptions = {}): ReturnType<typeof GarmentFactory.create>[] {
    return Array.from({ length: count }, () => GarmentFactory.create(options));
  }
}
```

```ts
// test/factories/outfit.factory.ts
import { faker } from '@faker-js/faker';

export interface OutfitFactoryOptions {
  id?: string;
  userId?: string;
  name?: string;
  description?: string;
  season?: 'spring' | 'summer' | 'autumn' | 'winter' | 'all';
  style?: string;
  garments?: string[]; // array of garment IDs
  imageUrl?: string | null;
  isPublic?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class OutfitFactory {
  static create(options: OutfitFactoryOptions = {}) {
    return {
      id: options.id ?? faker.string.uuid(),
      userId: options.userId ?? faker.string.uuid(),
      name: options.name ?? faker.lorem.words(3),
      description: options.description ?? faker.lorem.sentence(),
      season: options.season ?? faker.helpers.arrayElement(['spring', 'summer', 'autumn', 'winter', 'all']),
      style: options.style ?? faker.helpers.arrayElement(['casual', 'formal', 'sporty', 'bohemian', 'minimalist']),
      garments: options.garments ?? [],
      imageUrl: options.imageUrl ?? null,
      isPublic: options.isPublic ?? false,
      createdAt: options.createdAt ?? new Date(),
      updatedAt: options.updatedAt ?? new Date(),
    };
  }

  static createWithGarments(garmentCount: number, options: OutfitFactoryOptions = {}) {
    const garments = Array.from({ length: garmentCount }, () => faker.string.uuid());
    return this.create({ ...options, garments });
  }

  static createPublic(options: OutfitFactoryOptions = {}) {
    return this.create({ ...options, isPublic: true });
  }
}
```

## 11. Example Test: AuthService

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../users/user.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient } from '@supabase/supabase-js';
import { BadRequestException, UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserFactory } from '../../test/factories/user.factory';

describe('AuthService', () => {
  let authService: AuthService;
  let userService: jest.Mocked<UserService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: '$2b$10$hashedpassword',
    name: 'Test User',
    role: 'user',
    isActive: true,
    avatarUrl: null,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            updateRefreshToken: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
            decode: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_ACCESS_SECRET') return 'test-access-secret';
              if (key === 'JWT_REFRESH_SECRET') return 'test-refresh-secret';
              if (key === 'JWT_ACCESS_EXPIRATION') return '15m';
              if (key === 'JWT_REFRESH_EXPIRATION') return '7d';
              return null;
            }),
          },
        },
        {
          provide: 'SupabaseClient',
          useValue: {
            auth: {
              signUp: jest.fn(),
              signInWithPassword: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get(UserService);
    jwtService = module.get(JwtService);
  });

  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      userService.findByEmail.mockResolvedValue(mockUser as any);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
      jwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await authService.login({ email: 'test@example.com', password: 'password123' });

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: expect.objectContaining({ id: mockUser.id, email: mockUser.email }),
      });
      expect(userService.updateRefreshToken).toHaveBeenCalledWith(mockUser.id, 'refresh-token');
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      userService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'nobody@example.com', password: 'password123' })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      userService.findByEmail.mockResolvedValue(mockUser as any);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      await expect(
        authService.login({ email: 'test@example.com', password: 'wrong-password' })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when account is inactive', async () => {
      userService.findByEmail.mockResolvedValue({ ...mockUser, isActive: false } as any);

      await expect(
        authService.login({ email: 'test@example.com', password: 'password123' })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException for missing email', async () => {
      await expect(
        authService.login({ email: '', password: 'password123' })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for missing password', async () => {
      await expect(
        authService.login({ email: 'test@example.com', password: '' })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('register', () => {
    it('should create a new user and return tokens', async () => {
      userService.findByEmail.mockResolvedValue(null);
      userService.create.mockResolvedValue(mockUser as any);
      jwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await authService.register({
        email: 'new@example.com',
        password: 'StrongP@ss1',
        name: 'New User',
      });

      expect(result).toMatchObject({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: expect.objectContaining({ email: mockUser.email }),
      });
      expect(userService.create).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: expect.any(String),
        name: 'New User',
      });
    });

    it('should throw ConflictException when email already exists', async () => {
      userService.findByEmail.mockResolvedValue(mockUser as any);

      await expect(
        authService.register({ email: 'test@example.com', password: 'StrongP@ss1', name: 'Dupe' })
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException for weak password', async () => {
      userService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.register({ email: 'weak@example.com', password: '123', name: 'Weak' })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid email', async () => {
      userService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.register({ email: 'not-an-email', password: 'StrongP@ss1', name: 'Bad' })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('refreshToken', () => {
    it('should issue new tokens for a valid refresh token', async () => {
      jwtService.verify.mockReturnValue({ sub: mockUser.id });
      userService.findById.mockResolvedValue({ ...mockUser, refreshToken: 'valid-refresh-token' } as any);
      jwtService.sign
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-refresh-token');

      const result = await authService.refreshToken('valid-refresh-token');

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
    });

    it('should throw UnauthorizedException when token is expired', async () => {
      jwtService.verify.mockImplementation(() => { throw new Error('jwt expired'); });

      await expect(
        authService.refreshToken('expired-token')
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token does not match stored token', async () => {
      jwtService.verify.mockReturnValue({ sub: mockUser.id });
      userService.findById.mockResolvedValue({ ...mockUser, refreshToken: 'different-token' } as any);

      await expect(
        authService.refreshToken('old-token')
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
```

## 12. Example Test: GarmentService

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { GarmentService } from './garment.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Garment } from './entities/garment.entity';
import { SupabaseStorageService } from '../storage/supabase-storage.service';
import { AiGatewayService } from '../ai-gateway/ai-gateway.service';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateGarmentDto } from './dto/create-garment.dto';
import { UpdateGarmentDto } from './dto/update-garment.dto';
import { GarmentFactory } from '../../test/factories/garment.factory';
import { createMockRepository, MockRepository } from '../../test/mocks/repository.mock';

describe('GarmentService', () => {
  let service: GarmentService;
  let repository: MockRepository<Garment>;
  let storageService: jest.Mocked<SupabaseStorageService>;
  let aiGatewayService: jest.Mocked<AiGatewayService>;

  const userId = 'user-1';
  const mockGarment = GarmentFactory.create({ userId });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GarmentService,
        {
          provide: getRepositoryToken(Garment),
          useValue: createMockRepository<Garment>(),
        },
        {
          provide: SupabaseStorageService,
          useValue: {
            upload: jest.fn(),
            delete: jest.fn(),
            getSignedUrl: jest.fn(),
          },
        },
        {
          provide: AiGatewayService,
          useValue: {
            detectGarment: jest.fn(),
            extractColor: jest.fn(),
            classifyCategory: jest.fn(),
            removeBackground: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GarmentService>(GarmentService);
    repository = module.get(getRepositoryToken(Garment));
    storageService = module.get(SupabaseStorageService);
    aiGatewayService = module.get(AiGatewayService);
  });

  describe('create', () => {
    const dto: CreateGarmentDto = {
      name: 'Blue Shirt',
      category: 'top',
      color: 'blue',
      brand: 'Nike',
      size: 'M',
      material: 'Cotton',
    };

    const mockFile = { buffer: Buffer.from('fake-image'), mimetype: 'image/jpeg', size: 1000 } as Express.Multer.File;

    it('should create a garment with AI-processed attributes', async () => {
      storageService.upload.mockResolvedValue({ url: 'https://supabase.co/image.jpg', path: 'images/image.jpg' });
      aiGatewayService.detectGarment.mockResolvedValue({ detected: true, confidence: 0.98 });
      aiGatewayService.extractColor.mockResolvedValue({ dominantColor: 'blue', palette: ['#0000ff', '#0000cc'] });
      aiGatewayService.classifyCategory.mockResolvedValue({ category: 'top', confidence: 0.95 });
      repository.create.mockReturnValue(mockGarment);
      repository.save.mockResolvedValue(mockGarment);

      const result = await service.create(dto, mockFile, userId);

      expect(result).toEqual(mockGarment);
      expect(storageService.upload).toHaveBeenCalledWith(expect.any(Buffer), expect.any(String), 'image/jpeg');
      expect(aiGatewayService.detectGarment).toHaveBeenCalled();
    });

    it('should throw BadRequestException when AI fails to detect a garment', async () => {
      aiGatewayService.detectGarment.mockResolvedValue({ detected: false, confidence: 0 });

      await expect(service.create(dto, mockFile, userId)).rejects.toThrow(BadRequestException);
    });

    it('should handle storage upload failure gracefully', async () => {
      storageService.upload.mockRejectedValue(new Error('Storage unavailable'));

      await expect(service.create(dto, mockFile, userId)).rejects.toThrow('Storage unavailable');
    });

    it('should handle missing file gracefully', async () => {
      await expect(service.create(dto, null as any, userId)).rejects.toThrow(BadRequestException);
    });

    it('should reject oversized image', async () => {
      const oversizedFile = { buffer: Buffer.alloc(12 * 1024 * 1024), mimetype: 'image/jpeg', size: 12 * 1024 * 1024 } as Express.Multer.File;

      await expect(service.create(dto, oversizedFile, userId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated garments for the user', async () => {
      const garments = GarmentFactory.createMany(3, { userId });
      repository.findAndCount.mockResolvedValue([garments, 3]);

      const result = await service.findAll({ userId, page: 1, limit: 10 });

      expect(result.data).toHaveLength(3);
      expect(result.meta.total).toBe(3);
    });

    it('should filter by category', async () => {
      repository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ userId, category: 'top' });

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ category: 'top' }) })
      );
    });

    it('should search by name', async () => {
      repository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ userId, search: 'shirt' });

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ name: expect.any(Object) }) })
      );
    });

    it('should return empty array when no garments exist', async () => {
      repository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll({ userId, page: 1, limit: 10 });

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return a garment by id', async () => {
      repository.findOne.mockResolvedValue(mockGarment);

      const result = await service.findOne(mockGarment.id, userId);

      expect(result).toEqual(mockGarment);
    });

    it('should throw NotFoundException when garment does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent', userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when garment belongs to another user', async () => {
      repository.findOne.mockResolvedValue({ ...mockGarment, userId: 'other-user' });

      await expect(service.findOne(mockGarment.id, userId)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    const updateDto: UpdateGarmentDto = { name: 'Updated Shirt', color: 'red' };

    it('should update and return the garment', async () => {
      repository.findOne.mockResolvedValue(mockGarment);
      repository.save.mockResolvedValue({ ...mockGarment, ...updateDto });

      const result = await service.update(mockGarment.id, updateDto, userId);

      expect(result.name).toBe('Updated Shirt');
      expect(result.color).toBe('red');
    });

    it('should throw NotFoundException when garment does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.update('non-existent', updateDto, userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when updating another user garment', async () => {
      repository.findOne.mockResolvedValue({ ...mockGarment, userId: 'other-user' });

      await expect(service.update(mockGarment.id, updateDto, userId)).rejects.toThrow(ForbiddenException);
    });

    it('should allow partial updates', async () => {
      repository.findOne.mockResolvedValue(mockGarment);
      repository.save.mockResolvedValue({ ...mockGarment, brand: 'Adidas' });

      const result = await service.update(mockGarment.id, { brand: 'Adidas' }, userId);

      expect(result.brand).toBe('Adidas');
      expect(result.name).toBe(mockGarment.name); // unchanged
    });
  });

  describe('remove', () => {
    it('should soft-delete a garment', async () => {
      repository.findOne.mockResolvedValue(mockGarment);
      repository.save.mockResolvedValue({ ...mockGarment, deletedAt: new Date() });

      await service.remove(mockGarment.id, userId);

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ deletedAt: expect.any(Date) })
      );
    });

    it('should delete associated storage file', async () => {
      repository.findOne.mockResolvedValue(mockGarment);

      await service.remove(mockGarment.id, userId);

      expect(storageService.delete).toHaveBeenCalledWith(mockGarment.imageUrl);
    });

    it('should throw NotFoundException when garment does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent', userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('error handling edge cases', () => {
    it('should handle database connection failure', async () => {
      repository.find.mockRejectedValue(new Error('Database connection lost'));

      await expect(service.findAll({ userId })).rejects.toThrow('Database connection lost');
    });

    it('should handle concurrent update conflicts', async () => {
      repository.findOne.mockResolvedValue(mockGarment);
      repository.save.mockRejectedValue({ code: '23505' }); // unique violation

      await expect(
        service.update(mockGarment.id, { name: 'Conflict' }, userId)
      ).rejects.toThrow();
    });

    it('should handle empty DTO gracefully', async () => {
      repository.findOne.mockResolvedValue(mockGarment);
      repository.save.mockResolvedValue(mockGarment);

      const result = await service.update(mockGarment.id, {}, userId);

      expect(result).toEqual(mockGarment);
    });

    it('should reject invalid category value', async () => {
      await expect(
        service.update(mockGarment.id, { category: 'invalid_category' as any }, userId)
      ).rejects.toThrow();
    });
  });
});
```

## 13. Example Test: OutfitService

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { OutfitService } from './outfit.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Outfit } from './entities/outfit.entity';
import { GarmentService } from '../garments/garment.service';
import { RecommendationService } from '../recommendations/recommendation.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OutfitFactory } from '../../test/factories/outfit.factory';
import { GarmentFactory } from '../../test/factories/garment.factory';
import { createMockRepository, MockRepository } from '../../test/mocks/repository.mock';

describe('OutfitService', () => {
  let service: OutfitService;
  let repository: MockRepository<Outfit>;
  let garmentService: jest.Mocked<GarmentService>;
  let recommendationService: jest.Mocked<RecommendationService>;

  const userId = 'user-1';
  const mockOutfit = OutfitFactory.create({ userId, garments: ['g1', 'g2', 'g3'] });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OutfitService,
        {
          provide: getRepositoryToken(Outfit),
          useValue: createMockRepository<Outfit>(),
        },
        {
          provide: GarmentService,
          useValue: {
            findOne: jest.fn(),
            findByIds: jest.fn(),
          },
        },
        {
          provide: RecommendationService,
          useValue: {
            getRecommendations: jest.fn(),
            scoreOutfit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OutfitService>(OutfitService);
    repository = module.get(getRepositoryToken(Outfit));
    garmentService = module.get(GarmentService);
    recommendationService = module.get(RecommendationService);
  });

  describe('create', () => {
    const dto = {
      name: 'Summer Look',
      season: 'summer',
      style: 'casual',
      garmentIds: ['g1', 'g2', 'g3'],
    };

    it('should create an outfit with validated garments', async () => {
      const mockGarments = [
        GarmentFactory.create({ id: 'g1', userId, category: 'top' }),
        GarmentFactory.create({ id: 'g2', userId, category: 'bottom' }),
        GarmentFactory.create({ id: 'g3', userId, category: 'footwear' }),
      ];
      garmentService.findByIds.mockResolvedValue(mockGarments);
      repository.create.mockReturnValue(mockOutfit);
      repository.save.mockResolvedValue(mockOutfit);

      const result = await service.create(dto, userId);

      expect(result).toEqual(mockOutfit);
      expect(garmentService.findByIds).toHaveBeenCalledWith(dto.garmentIds, userId);
    });

    it('should throw BadRequestException when garment IDs are empty', async () => {
      await expect(
        service.create({ ...dto, garmentIds: [] }, userId)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when a garment belongs to another user', async () => {
      garmentService.findByIds.mockRejectedValue(new ForbiddenException());

      await expect(service.create(dto, userId)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when no name is provided', async () => {
      await expect(
        service.create({ ...dto, name: '' }, userId)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getRecommendations', () => {
    it('should return AI-generated outfit recommendations', async () => {
      const userGarments = GarmentFactory.createMany(20, { userId });
      const recommendations = [
        OutfitFactory.createWithGarments(3),
        OutfitFactory.createWithGarments(3),
      ];

      garmentService.findByIds.mockResolvedValue(userGarments);
      recommendationService.getRecommendations.mockResolvedValue(recommendations);

      const result = await service.getRecommendations(userId, { season: 'summer', style: 'casual' });

      expect(result).toHaveLength(2);
      expect(result[0].garments).toHaveLength(3);
    });

    it('should return empty array when user has fewer than 3 garments', async () => {
      const userGarments = GarmentFactory.createMany(2, { userId });
      garmentService.findByIds.mockResolvedValue(userGarments);

      const result = await service.getRecommendations(userId, { season: 'summer' });

      expect(result).toEqual([]);
    });

    it('should handle recommendation service failure gracefully', async () => {
      const userGarments = GarmentFactory.createMany(10, { userId });
      garmentService.findByIds.mockResolvedValue(userGarments);
      recommendationService.getRecommendations.mockRejectedValue(new Error('AI service unavailable'));

      await expect(
        service.getRecommendations(userId, { season: 'summer' })
      ).rejects.toThrow('Recommendation service unavailable');
    });
  });

  describe('update', () => {
    it('should update outfit name and description', async () => {
      repository.findOne.mockResolvedValue(mockOutfit);
      repository.save.mockResolvedValue({ ...mockOutfit, name: 'Updated Outfit' });

      const result = await service.update(mockOutfit.id, { name: 'Updated Outfit' }, userId);

      expect(result.name).toBe('Updated Outfit');
    });

    it('should add new garments to existing outfit', async () => {
      const newGarmentIds = ['g4', 'g5'];
      const newGarments = [
        GarmentFactory.create({ id: 'g4', userId }),
        GarmentFactory.create({ id: 'g5', userId }),
      ];
      garmentService.findByIds.mockResolvedValue(newGarments);
      repository.findOne.mockResolvedValue(mockOutfit);
      repository.save.mockResolvedValue({
        ...mockOutfit,
        garments: [...mockOutfit.garments, ...newGarmentIds],
      });

      const result = await service.update(mockOutfit.id, { garmentIds: newGarmentIds }, userId);

      expect(result.garments).toContain('g4');
      expect(result.garments).toContain('g5');
    });
  });
});
```

## 14. Testing Async Operations and Queues

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { BullModule, getQueueToken } from '@nestjs/bull';
import { Queue } from 'bull';
import { GarmentProcessingProcessor } from './garment-processing.processor';
import { AiGatewayService } from '../ai-gateway/ai-gateway.service';
import { GarmentService } from '../garments/garment.service';

describe('GarmentProcessingProcessor', () => {
  let processor: GarmentProcessingProcessor;
  let garmentService: jest.Mocked<GarmentService>;
  let aiGatewayService: jest.Mocked<AiGatewayService>;
  let queue: jest.Mocked<Queue>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GarmentProcessingProcessor,
        {
          provide: GarmentService,
          useValue: {
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: AiGatewayService,
          useValue: {
            removeBackground: jest.fn(),
            detectGarment: jest.fn(),
            extractColor: jest.fn(),
            classifyCategory: jest.fn(),
          },
        },
        {
          provide: getQueueToken('garment-processing'),
          useValue: {
            add: jest.fn(),
            process: jest.fn(),
            on: jest.fn(),
          },
        },
      ],
    }).compile();

    processor = module.get<GarmentProcessingProcessor>(GarmentProcessingProcessor);
    garmentService = module.get(GarmentService);
    aiGatewayService = module.get(AiGatewayService);
    queue = module.get(getQueueToken('garment-processing'));
  });

  describe('processGarment', () => {
    const jobData = { garmentId: 'g-1', userId: 'u-1', imagePath: 'images/test.jpg' };

    it('should process a garment through the AI pipeline', async () => {
      aiGatewayService.removeBackground.mockResolvedValue({ processedPath: 'images/test-nobg.jpg' });
      aiGatewayService.detectGarment.mockResolvedValue({ detected: true, confidence: 0.97 });
      aiGatewayService.extractColor.mockResolvedValue({ dominantColor: 'blue', palette: ['#0000ff'] });
      aiGatewayService.classifyCategory.mockResolvedValue({ category: 'top', confidence: 0.96 });

      const result = await processor.processGarment({ data: jobData } as any);

      expect(result).toMatchObject({
        detected: true,
        color: 'blue',
        category: 'top',
      });
      expect(garmentService.update).toHaveBeenCalledWith('g-1', expect.objectContaining({
        status: 'active',
        color: 'blue',
        category: 'top',
      }), 'u-1');
    });

    it('should handle AI pipeline partial failure', async () => {
      aiGatewayService.removeBackground.mockResolvedValue({ processedPath: 'images/test-nobg.jpg' });
      aiGatewayService.detectGarment.mockResolvedValue({ detected: true, confidence: 0.97 });
      aiGatewayService.extractColor.mockRejectedValue(new Error('Color extraction failed'));
      aiGatewayService.classifyCategory.mockResolvedValue({ category: 'top', confidence: 0.95 });

      const result = await processor.processGarment({ data: jobData } as any);

      // Should still complete with partial results
      expect(result).toMatchObject({
        detected: true,
        category: 'top',
      });
      expect(result.color).toBeUndefined();
    });

    it('should mark garment as failed when AI pipeline completely fails', async () => {
      aiGatewayService.removeBackground.mockRejectedValue(new Error('Critical failure'));

      await expect(
        processor.processGarment({ data: jobData } as any)
      ).rejects.toThrow('Critical failure');

      expect(garmentService.update).toHaveBeenCalledWith('g-1', { status: 'failed' }, 'u-1');
    });

    it('should retry on transient failure', async () => {
      const job = {
        data: jobData,
        attemptsMade: 1,
        opts: { attempts: 3 },
      };

      aiGatewayService.removeBackground.mockRejectedValue(new Error('Transient error'));

      await expect(processor.processGarment(job as any)).rejects.toThrow('Transient error');
    });
  });

  describe('queue integration', () => {
    it('should add a job to the queue on garment creation', async () => {
      queue.add.mockResolvedValue({ id: 'job-1' } as any);

      const job = await queue.add('process-garment', { garmentId: 'g-1', userId: 'u-1', imagePath: 'images/test.jpg' });

      expect(queue.add).toHaveBeenCalledWith(
        'process-garment',
        expect.objectContaining({ garmentId: 'g-1' }),
        expect.objectContaining({ attempts: 3, backoff: 5000 })
      );
      expect(job.id).toBe('job-1');
    });

    it('should handle queue overload', async () => {
      queue.add.mockRejectedValue(new Error('Queue is full'));

      await expect(
        queue.add('process-garment', { garmentId: 'g-1' })
      ).rejects.toThrow('Queue is full');
    });
  });
});
```

## 15. Testing Caching Behavior

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { CacheModule, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { RecommendationService } from './recommendation.service';
import { OutfitService } from './outfit.service';

describe('RecommendationService caching', () => {
  let service: RecommendationService;
  let cacheManager: jest.Mocked<Cache>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CacheModule.register()],
      providers: [
        RecommendationService,
        {
          provide: OutfitService,
          useValue: { getRecommendations: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<RecommendationService>(RecommendationService);
    cacheManager = module.get(CACHE_MANAGER);
  });

  it('should cache recommendation results', async () => {
    const cacheKey = 'recommendations:user-1:summer:casual';
    const recommendations = [/* ... */];

    jest.spyOn(cacheManager, 'get').mockResolvedValue(null);
    jest.spyOn(cacheManager, 'set').mockResolvedValue();

    await service.getRecommendations('user-1', { season: 'summer', style: 'casual' });

    expect(cacheManager.set).toHaveBeenCalledWith(cacheKey, expect.any(Array), expect.any(Number));
  });

  it('should return cached results without recomputing', async () => {
    const cacheKey = 'recommendations:user-1:summer:casual';
    const cachedResult = [{ id: 'cached-outfit' }];

    jest.spyOn(cacheManager, 'get').mockResolvedValue(cachedResult);

    const result = await service.getRecommendations('user-1', { season: 'summer', style: 'casual' });

    expect(result).toEqual(cachedResult);
  });

  it('should invalidate cache when garments change', async () => {
    jest.spyOn(cacheManager, 'del').mockResolvedValue();

    await service.invalidateUserCache('user-1');

    expect(cacheManager.del).toHaveBeenCalledWith(expect.stringContaining('user-1'));
  });

  it('should set TTL on cached items', async () => {
    jest.spyOn(cacheManager, 'get').mockResolvedValue(null);
    jest.spyOn(cacheManager, 'set').mockResolvedValue();

    await service.getRecommendations('user-1', { season: 'winter' });

    expect(cacheManager.set).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Array),
      1800000 // 30 minutes
    );
  });

  it('should handle cache miss gracefully', async () => {
    jest.spyOn(cacheManager, 'get').mockResolvedValue(null);
    jest.spyOn(cacheManager, 'set').mockResolvedValue();

    const result = await service.getRecommendations('user-1', { season: 'summer' });

    expect(result).toBeDefined();
  });
});
```
