# Closet Inteligente Digital — Coding Standards

---

> These standards are MANDATORY for all code contributed to the Closet Inteligente Digital platform. Pull requests that violate these standards will be automatically flagged by CI and must be corrected before merge.

---

## 1. TypeScript Strict Mode

### 1.1 Required Compiler Options

The root `tsconfig.json` and all project-level `tsconfig.json` files MUST include:

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

### 1.2 Strict Mode Violations — Zero Tolerance

The following patterns are **STRICTLY PROHIBITED**:

```typescript
// ❌ BAD — using `any`
const data: any = await fetchData();

// ✅ GOOD — using proper types
const data: IGarment = await fetchData();

// ❌ BAD — non-null assertion without justification
const name = user!.name;

// ✅ GOOD — proper null checking
const name = user?.name ?? 'Unknown';

// ❌ BAD — type assertion without validation
const result = response.data as IGarment;

// ✅ GOOD — runtime validation
const result = validateGarment(response.data);

// ❌ BAD — using `// @ts-ignore` or `// @ts-expect-error`
// @ts-ignore
const x = someFunction();

// ✅ GOOD — fix the actual type error
const x: ReturnType<typeof someFunction> = someFunction();
```

### 1.3 Exceptions

Exceptions to strict mode require:
1. An ESLint `eslint-disable-next-line` with a specific rule name (NOT `@typescript-eslint/no-explicit-any`)
2. A comment explaining WHY the exception is needed
3. Review approval
4. A tracking issue to remove the exception

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// TODO: Remove once API types are finalized (tracking: CID-123)
const data: any = await fetchData();
```

---

## 2. ESLint Configuration

### 2.1 Required Plugins & Rules

```javascript
// .eslintrc.js — ROOT configuration
module.exports = {
  root: true,
  extends: [
    'next/core-web-vitals',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended-type-checked',
    'plugin:@typescript-eslint/stylistic-type-checked',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:jsx-a11y/recommended',
    'plugin:prettier/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: true,
    tsconfigRootDir: __dirname,
  },
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'import',
    'jsx-a11y',
    'prettier',
    'unicorn',
    'sonarjs',
  ],
  rules: {
    // TypeScript
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/require-await': 'error',
    '@typescript-eslint/return-await': ['error', 'always'],
    '@typescript-eslint/strict-boolean-expressions': 'error',
    '@typescript-eslint/switch-exhaustiveness-check': 'error',

    // React
    'react/react-in-jsx-scope': 'off', // Next.js doesn't need it
    'react/prop-types': 'off', // TypeScript handles this
    'react/self-closing-comp': 'error',
    'react/jsx-boolean-value': ['error', 'never'],
    'react/jsx-no-useless-fragment': 'error',
    'react/hook-use-state': 'error',
    'react/jsx-key': ['error', { checkFragmentShorthand: true }],

    // React Hooks
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // Import
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
          'type',
        ],
        pathGroups: [
          { pattern: 'react', group: 'external', position: 'before' },
          { pattern: 'next/**', group: 'external', position: 'before' },
          { pattern: '@/**', group: 'internal', position: 'after' },
        ],
        pathGroupsExcludedImportTypes: ['react', 'next'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
    'import/no-duplicates': 'error',

    // Unicorn
    'unicorn/prefer-ternary': 'off',
    'unicorn/prefer-string-slice': 'error',
    'unicorn/prefer-top-level-await': 'error',
    'unicorn/no-array-for-each': 'error',
    'unicorn/no-for-loop': 'error',
    'unicorn/prefer-array-flat-map': 'error',
    'unicorn/prefer-spread': 'error',
    'unicorn/no-array-callback-reference': 'off',

    // SonarJS
    'sonarjs/no-duplicate-string': ['error', { threshold: 5 }],
    'sonarjs/cognitive-complexity': ['error', 15],
    'sonarjs/no-identical-functions': 'error',
    'sonarjs/no-collection-size-mischeck': 'error',

    // General
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'no-alert': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'no-throw-literal': 'error',
    'prefer-template': 'error',
    'prefer-object-spread': 'error',
    'arrow-body-style': ['error', 'as-needed'],
    'object-shorthand': ['error', 'always'],
    'no-unneeded-ternary': 'error',
    'no-nested-ternary': 'error',
  },
  settings: {
    react: { version: 'detect' },
    'import/resolver': {
      typescript: true,
      node: true,
    },
  },
  ignorePatterns: ['node_modules', '.next', 'dist', 'build', '*.js'],
};
```

### 2.2 NestJS ESLint Configuration

Extends the root config with NestJS-specific rules:

```javascript
module.exports = {
  extends: [
    '../../.eslintrc.js',
    'plugin:@nestjs/recommended',
  ],
  rules: {
    '@typescript-eslint/no-extraneous-class': 'off',
    '@typescript-eslint/interface-name-prefix': 'off',
    '@nestjs/use-injectable': 'error',
  },
};
```

---

## 3. Prettier Configuration

```jsonc
// .prettierrc
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf",
  "quoteProps": "consistent",
  "jsxSingleQuote": false,
  "bracketSameLine": false,
  "htmlWhitespaceSensitivity": "css",
  "embeddedLanguageFormatting": "auto"
}
```

### Prettier + ESLint Integration

- Use `eslint-config-prettier` to disable ESLint rules that conflict with Prettier
- Use `eslint-plugin-prettier` to run Prettier as an ESLint rule
- Format-on-save enabled in VS Code
- Pre-commit hook formats staged files via `lint-staged`

---

## 4. Import Ordering Rules

### 4.1 Groups (in order)

1. **Built-in** — Node.js built-ins (`fs`, `path`)
2. **External** — npm packages (`react`, `next`, `zustand`)
3. **Internal** — Project modules (`@/components`, `@/lib`)
4. **Parent** — `../` imports
5. **Sibling** — `./` imports in same directory
6. **Index** — `./` index file
7. **Type** — Type-only imports (separated)

### 4.2 Example

```typescript
// 1. Built-in
import { readFile } from 'node:fs';

// 2. External — React first
import React, { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// 2. External — third-party
import { useQuery } from '@tanstack/react-query';
import { create } from 'zustand';
import clsx from 'clsx';

// 3. Internal (via path alias)
import { apiClient } from '@/lib/api-client';
import { useGarmentStore } from '@/stores/use-garment-store';
import { IGarment } from '@/types/garment.types';
import { GARMENT_PAGINATION_LIMIT } from '@/constants/api.constants';

// 4. Parent
import { BaseLayout } from '../layout/base-layout';

// 5. Sibling
import { GarmentCard } from './garment-card';
import { GarmentFilters } from './garment-filters';

// 6. Type-only (separated group)
import type { GarmentListResponse, ApiError } from '@/types/api.types';
```

### 4.3 Forbidden Patterns

```typescript
// ❌ BAD — mixing internal and external
import React from 'react';
import { apiClient } from '@/lib/api-client';
import { useState } from 'react';

// ❌ BAD — using default export for components
import GarmentCard from './garment-card';

// ✅ GOOD — named export
import { GarmentCard } from './garment-card';

// ❌ BAD — importing everything
import * as GarmentTypes from '@/types/garment.types';

// ✅ GOOD — named imports
import { EGarmentType, IGarment } from '@/types/garment.types';
```

---

## 5. Error Handling Patterns

### 5.1 Backend (NestJS) Error Handling

```typescript
// Use NestJS built-in exceptions
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';

// ✅ GOOD — specific HTTP exceptions
@Get(':id')
async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<IGarment> {
  const garment = await this.garmentService.findOne(id);
  if (!garment) {
    throw new NotFoundException(`Garment with ID "${id}" not found`);
  }
  return garment;
}

// ✅ GOOD — validation errors with details
@Post()
async create(@Body() dto: CreateGarmentDto): Promise<IGarment> {
  // class-validator handles DTO validation
  return this.garmentService.create(dto);
}

// ✅ GOOD — business logic exceptions
@Post(':id/purchase')
async purchase(@Param('id') id: string, @CurrentUser() user: IUser): Promise<void> {
  if (!user.isVerified) {
    throw new ForbiddenException('Email verification required to purchase');
  }
  // ... business logic
}

// ❌ BAD — throwing generic Error
throw new Error('Something went wrong');

// ❌ BAD — exposing internal details
throw new InternalServerErrorException('Database connection failed on replica-2');
```

### 5.2 Custom Exception Filter

```typescript
// src/common/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';
    let details: Record<string, string[]> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as Record<string, unknown>;
        message = (resp.message as string) ?? exception.message;
        code = (resp.code as string) ?? HttpStatus[status];
        details = resp.details as Record<string, string[]>;
      }
    }

    if (status >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} — ${status}: ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json({
      success: false,
      error: {
        code,
        message,
        details,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }
}
```

### 5.3 Frontend (React) Error Handling

```typescript
// ✅ GOOD — Use TanStack Query error handling
function GarmentList() {
  const { data, isLoading, error } = useQuery<IGarment[], ApiError>({
    queryKey: ['garments'],
    queryFn: () => apiClient.getGarments(),
  });

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorDisplay error={error} onRetry={() => refetch()} />;
  if (!data?.length) return <EmptyState />;

  return data.map((garment) => <GarmentCard key={garment.id} garment={garment} />);
}

// ✅ GOOD — Error boundary for React components
class GarmentErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('GarmentErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <ErrorFallback onReset={() => this.setState({ hasError: false })} />;
    }
    return this.props.children;
  }
}

// ❌ BAD — silently swallowing errors
try {
  await apiClient.createGarment(data);
} catch {
  // do nothing
}

// ❌ BAD — using console.log for errors
catch (error) {
  console.log(error);
}

// ✅ GOOD — proper error logging
catch (error) {
  console.error('Failed to create garment:', error);
  throw new AppError('Failed to create garment', { cause: error });
}
```

### 5.4 Result Pattern (for complex operations)

```typescript
// lib/result.ts
export type Result<T, E = ApiError> =
  | { success: true; data: T }
  | { success: false; error: E };

export function success<T>(data: T): Result<T, never> {
  return { success: true, data };
}

export function failure<E>(error: E): Result<never, E> {
  return { success: false, error };
}

// Usage
async function createGarment(dto: CreateGarmentDto): Promise<Result<IGarment>> {
  try {
    const garment = await garmentRepository.save(dto);
    return success(garment);
  } catch (error) {
    return failure(new ApiError('GARMENT_CREATE_FAILED', 'Could not create garment'));
  }
}
```

---

## 6. Logging Standards

### 6.1 Backend (NestJS)

```typescript
// Use NestJS Logger (built-in)
import { Logger, Injectable } from '@nestjs/common';

@Injectable()
export class GarmentService {
  private readonly logger = new Logger(GarmentService.name);

  async create(dto: CreateGarmentDto): Promise<IGarment> {
    this.logger.log(`Creating garment for user ${dto.userId}`);

    try {
      const garment = await this.garmentRepository.save(dto);
      this.logger.debug(`Garment created: ${garment.id}`);
      return garment;
    } catch (error) {
      this.logger.error(`Failed to create garment: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }
}
```

### 6.2 Log Levels

| Level | When to use |
|---|---|
| `error` | System failures, unhandled exceptions, DB errors |
| `warn` | Recoverable issues, deprecated API usage, rate limit approaching |
| `log` | Business events (garment created, user registered) |
| `debug` | Detailed diagnostic info (query parameters, response times) |
| `verbose` | Everything else (available only in development) |

### 6.3 Log Format — Structured JSON

All logs MUST be structured JSON for log aggregation:

```typescript
// ✅ GOOD — structured logging
this.logger.log({
  message: 'Garment created',
  garmentId: garment.id,
  userId: garment.userId,
  garmentType: garment.garmentType,
  duration: Date.now() - startTime,
});

// ❌ BAD — string interpolation
this.logger.log(`Garment ${garment.id} created by user ${garment.userId}`);
```

### 6.4 Frontend Logging

```typescript
// Use a logging service, not console.log
// lib/logger.ts
const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  info: (message: string, data?: Record<string, unknown>) => {
    if (isDev) console.info(message, data);
    // In production, send to logging service
  },
  warn: (message: string, data?: Record<string, unknown>) => {
    console.warn(message, data);
  },
  error: (message: string, error?: unknown, data?: Record<string, unknown>) => {
    console.error(message, error, data);
    // Send to Sentry in production
    if (!isDev) {
      Sentry.captureException(error, { extra: { message, ...data } });
    }
  },
};
```

---

## 7. Testing Standards

### 7.1 Framework & Coverage

| Requirement | Standard |
|---|---|
| Test framework | Jest (frontend + backend) |
| E2E framework | Playwright |
| Minimum coverage | **80%** (lines, branches, functions, statements) |
| Threshold | CI fails if below 80% |
| Test pattern | `*.spec.ts` (unit), `*.e2e-spec.ts` (E2E) |
| Test location | Co-located with source files or in `__tests__/` |

### 7.2 Unit Testing Standards

```typescript
// ✅ GOOD — testing service with mocked repository
describe('GarmentService', () => {
  let service: GarmentService;
  let repository: MockType<Repository<GarmentEntity>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GarmentService,
        {
          provide: getRepositoryToken(GarmentEntity),
          useValue: createMock<Repository<GarmentEntity>>(),
        },
      ],
    }).compile();

    service = module.get<GarmentService>(GarmentService);
    repository = module.get(getRepositoryToken(GarmentEntity));
  });

  describe('findAll', () => {
    it('should return paginated garments for a user', async () => {
      const userId = 'user-1';
      const garments = [createMockGarment({ userId })];
      repository.findAndCount.mockResolvedValue([garments, 1]);

      const result = await service.findAll(userId, { page: 1, pageSize: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId } }),
      );
    });

    it('should return empty list when no garments exist', async () => {
      repository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll('user-1', { page: 1, pageSize: 20 });

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });
});

// ✅ GOOD — testing React component with React Testing Library
describe('GarmentCard', () => {
  it('renders garment name and image', () => {
    const garment = createMockGarment({ name: 'Blue Shirt' });

    render(<GarmentCard garment={garment} onSelect={jest.fn()} />);

    expect(screen.getByText('Blue Shirt')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('alt', 'Blue Shirt');
  });

  it('calls onSelect when clicked', async () => {
    const onSelect = jest.fn();
    const garment = createMockGarment();

    render(<GarmentCard garment={garment} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button'));

    expect(onSelect).toHaveBeenCalledWith(garment.id);
  });
});

// ❌ BAD — testing implementation details
it('sets loading state correctly', () => {
  const { container } = render(<GarmentList />);
  expect(container.querySelector('.loading-spinner')).toBeTruthy();
});

// ✅ GOOD — testing behavior
it('shows loading state while fetching', () => {
  render(<GarmentList />);
  expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
});
```

### 7.3 E2E Testing Standards

```typescript
// ✅ GOOD — Playwright E2E test
test('user can create a garment', async ({ page }) => {
  await page.goto('/auth/login');
  await page.fill('[data-testid="email"]', 'test@example.com');
  await page.fill('[data-testid="password"]', 'password123');
  await page.click('[data-testid="login-button"]');

  await page.goto('/wardrobe/new');
  await page.fill('[data-testid="garment-name"]', 'Blue Jeans');
  await page.selectOption('[data-testid="garment-type"]', 'Bottom');
  await page.setInputFiles('[data-testid="image-upload"]', 'test-assets/jeans.jpg');
  await page.click('[data-testid="submit-button"]');

  await expect(page.locator('[data-testid="garment-card"]')).toContainText('Blue Jeans');
});
```

### 7.4 Test Data Factories

```typescript
// tests/factories/garment.factory.ts
import { faker } from '@faker-js/faker';
import { IGarment } from '@/types/garment.types';
import { EGarmentType, EGarmentState } from '@/types/enums';

export function createMockGarment(overrides?: Partial<IGarment>): IGarment {
  return {
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    name: faker.commerce.productName(),
    garmentType: faker.helpers.enumValue(EGarmentType),
    garmentState: EGarmentState.Active,
    brand: faker.company.name(),
    size: faker.helpers.arrayElement(['XS', 'S', 'M', 'L', 'XL']),
    color: faker.color.human(),
    imageUrl: faker.image.url(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
}
```

---

## 8. API Contract Validation

### 8.1 DTO Validation (NestJS)

```typescript
// ✅ GOOD — complete DTO with validation decorators
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  MaxLength,
  MinLength,
  IsUrl,
} from 'class-validator';
import { EGarmentType, EGarmentState } from '../enums/garment.enum';

export class CreateGarmentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsEnum(EGarmentType)
  garmentType: EGarmentType;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  brand?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  size?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;
}

// ✅ GOOD — Update DTO with partial validation
export class UpdateGarmentDto extends PartialType(CreateGarmentDto) {}
```

### 8.2 API Response Contracts

```typescript
// ✅ GOOD — typed responses
@Get()
@ApiOperation({ summary: 'List user garments' })
@ApiQuery({ name: 'page', required: false, type: Number })
@ApiQuery({ name: 'pageSize', required: false, type: Number })
@ApiResponse({ status: 200, description: 'Paginated garment list', type: PaginatedResponse<IGarment> })
@ApiResponse({ status: 401, description: 'Unauthorized' })
async findAll(
  @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
): Promise<PaginatedResponse<IGarment>> {
  return this.garmentService.findAll(page, pageSize);
}
```

### 8.3 OpenAPI / Swagger Standards

- Every endpoint MUST have `@ApiOperation`, `@ApiResponse`, and `@ApiTags`
- Every DTO MUST have `@ApiProperty` decorators with descriptions
- Response DTOs MUST be explicitly defined (not `any` or generic objects)

---

## 9. Security Standards

### 9.1 Input Sanitization

```typescript
// ✅ GOOD — Sanitize all user inputs

// 1. Trim and sanitize strings
function sanitizeString(input: string): string {
  return input.trim().replace(/<[^>]*>/g, ''); // Strip HTML tags
}

// 2. Validate UUIDs
@Param('id', ParseUUIDPipe) id: string

// 3. Whitelist validation (class-validator)
@IsString()
@IsNotEmpty()
@MaxLength(100)
name: string;
```

### 9.2 Parameterized Queries

```typescript
// ✅ GOOD — using TypeORM parameterized queries
const user = await this.userRepository.findOne({
  where: { email }, // TypeORM parameterizes this
});

// ✅ GOOD — raw query with parameters
await this.dataSource.query(
  'SELECT * FROM garments WHERE user_id = $1 AND garment_type = $2',
  [userId, garmentType],
);

// ❌ BAD — string interpolation in SQL
await this.dataSource.query(
  `SELECT * FROM garments WHERE user_id = '${userId}'`, // SQL Injection!
);
```

### 9.3 Content Security Policy (CSP)

```typescript
// next.config.js
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.cloudinary.com https://*.supabase.co",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.cloudinary.com https://*.supabase.co https://*.googleusercontent.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co https://*.cloudinary.com wss://*.closetinteligente.com https://*.googleapis.com",
  "frame-src 'self' https://*.supabase.co",
  "media-src 'self' https://*.cloudinary.com",
  "worker-src 'self' blob:",
  "base-uri 'self'",
].join('; ');

const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ];
  },
};
```

### 9.4 Rate Limiting

```typescript
// ✅ GOOD — NestJS rate limiting with @nestjs/throttler
@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60_000, // 1 minute
        limit: 100,   // 100 requests per minute
      },
    ]),
  ],
})
export class AppModule {}

// Per-endpoint rate limiting
@Throttle({ default: { limit: 10, ttl: 60_000 } }) // 10 per minute
@Post('upload')
async upload(@UploadedFile() file: Express.Multer.File) {
  // ...
}
```

### 9.5 Additional Security Rules

- **ALL** passwords hashed with bcrypt (cost factor 12)
- **ALL** database connections use TLS
- **ALL** secrets stored in environment variables (never in code)
- **ALL** file uploads validated for type, size, and content
- **NO** storing raw user IP addresses (hash them)
- **NO** exposing internal IDs in URLs (use UUIDs)
- **NO** accepting data from untrusted sources
- **YES** using Helmet.js for HTTP headers
- **YES** implementing CORS whitelist

---

## 10. Performance Standards

### 10.1 Lazy Loading

```typescript
// ✅ GOOD — dynamic import for heavy components
import dynamic from 'next/dynamic';

const AvatarViewer = dynamic(() => import('@/components/avatar/avatar-viewer'), {
  loading: () => <AvatarSkeleton />,
  ssr: false, // 3D rendering is client-only
});

// ✅ GOOD — lazy load AI detection results
function GarmentUpload() {
  const [showAiResults, setShowAiResults] = useState(false);

  return (
    <div>
      <UploadZone onUploadComplete={() => setShowAiResults(true)} />
      {showAiResults && (
        <Suspense fallback={<AiResultSkeleton />}>
          <AiDetectionResults />
        </Suspense>
      )}
    </div>
  );
}
```

### 10.2 Code Splitting

```typescript
// ✅ GOOD — route-based code splitting (Next.js App Router does this automatically)
// app/wardrobe/page.tsx — automatically code-split from app/outfits/page.tsx

// ✅ GOOD — component-level code splitting
const OutfitBuilder = dynamic(() => import('@/components/outfits/outfit-builder'), {
  ssr: false,
});
```

### 10.3 Image Optimization

```typescript
// ✅ GOOD — using Next.js Image component
import Image from 'next/image';

function GarmentCard({ garment }: { garment: IGarment }) {
  return (
    <Image
      src={garment.imageUrl}
      alt={garment.name}
      width={400}
      height={500}
      priority={false}
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
      className="object-cover rounded-lg"
      placeholder="blur"
      blurDataURL={garment.thumbnailBlurUrl}
    />
  );
}

// ❌ BAD — using <img> tag directly
<img src={garment.imageUrl} alt={garment.name} />
```

### 10.4 Memoization

```typescript
// ✅ GOOD — useMemo for expensive computations
function OutfitScore({ outfit }: { outfit: IOutfit }) {
  const score = useMemo(() => {
    return calculateCompatibilityScore(outfit.garments);
  }, [outfit.garments]);

  return <div>Compatibility Score: {score}%</div>;
}

// ✅ GOOD — useCallback for stable function references
function GarmentGrid() {
  const handleSelect = useCallback((id: string) => {
    router.push(`/wardrobe/${id}`);
  }, [router]);

  return <GarmentList garments={garments} onSelect={handleSelect} />;
}

// ✅ GOOD — React.memo for expensive renders
const GarmentCard = React.memo(function GarmentCard({
  garment,
  onSelect,
}: GarmentCardProps) {
  return (
    <button onClick={() => onSelect(garment.id)}>
      <Image src={garment.imageUrl} alt={garment.name} width={200} height={250} />
      <h3>{garment.name}</h3>
    </button>
  );
});

// ❌ BAD — premature / unnecessary memoization
const SimpleText = React.memo(function SimpleText({ text }: { text: string }) {
  return <span>{text}</span>;
});
```

### 10.5 Performance Budgets

| Asset | Budget (production) |
|---|---|
| Initial JS (brotli) | ≤200 KB |
| Initial CSS (brotli) | ≤50 KB |
| Largest Contentful Paint (LCP) | ≤2.5s |
| First Input Delay (FID) | ≤100ms |
| Cumulative Layout Shift (CLS) | ≤0.1 |
| Time to Interactive (TTI) | ≤3.5s |
| First Contentful Paint (FCP) | ≤1.8s |
| API response time (P95) | ≤500ms |
| 3D model loading (P75) | ≤3s |

### 10.6 Additional Performance Rules

- Debounce search inputs (300ms)
- Virtualize long lists (>100 items) using `react-window` or `@tanstack/react-virtual`
- Use `next/dynamic` for all non-critical components
- Preload critical fonts and hero images
- Use `prefetch` on navigation links
- Avoid unnecessary re-renders (profile with React DevTools)
- Use production builds for performance testing
- Enable compression (brotli) on API responses

---

## 11. Documentation Standards

### 11.1 JSDoc / TSDoc Requirements

**ALL** public APIs, exported functions, methods, and interfaces MUST have TSDoc comments.

```typescript
/**
 * Creates a new garment and queues it for AI detection.
 *
 * @param dto - The garment creation data (validated by CreateGarmentDto).
 * @param userId - The UUID of the authenticated user.
 * @returns The newly created garment with AI tags (once processed).
 * @throws {NotFoundException} If the user does not exist.
 * @throws {BadRequestException} If the garment data is invalid.
 *
 * @example
 * const garment = await garmentService.create(dto, 'user-123');
 * console.log(garment.id); // 'uuid-here'
 */
async create(dto: CreateGarmentDto, userId: string): Promise<IGarment> {
  // ...
}
```

### 11.2 Documentation Requirements by Scope

| Scope | Required | Detail |
|---|---|---|
| Public API functions | ✅ TSDoc | Full description, params, returns, throws, example |
| Internal functions | ✅ TSDoc | Description + params + returns |
| Private methods | Optional | Inline comment if non-obvious logic |
| Interfaces / Types | ✅ TSDoc | Description of purpose and usage |
| React Components | ✅ TSDoc (Props) | Component purpose + Prop descriptions |
| DTOs | ✅ TSDoc | Field descriptions |
| NestJS modules | ✅ TSDoc | Module purpose, provided services |
| NestJS controllers | ✅ TSDoc | Route purpose |
| Classes | ✅ TSDoc | Class responsibility |
| Constants | ✅ TSDoc | What the constant represents |
| Test files | Optional | Describe block description sufficient |

### 11.3 Comment Rules

```typescript
// ✅ GOOD — explaining WHY, not WHAT
// Use a Set for O(1) lookups since this check runs on every render
const activeGarmentIds = new Set(activeGarments.map((g) => g.id));

// ❌ BAD — obvious comment
// Loop through garments
for (const garment of garments) {
  // ...
}

// ✅ GOOD — TODO with tracking issue
// TODO: Remove this fallback once AI detection is stable (tracking: CID-456)
const garmentType = aiDetectedType ?? fallbackType;

// ❌ BAD — TODO without context
// TODO: fix this later
```

---

## 12. Code Review Checklist

### 12.1 Before Submitting a PR

- [ ] Code compiles without errors (`pnpm build`)
- [ ] All lint rules pass (`pnpm lint`)
- [ ] TypeScript strict mode passes (`pnpm typecheck`)
- [ ] All tests pass (`pnpm test`)
- [ ] New code has ≥80% test coverage
- [ ] No `console.log` / `debugger` statements
- [ ] No commented-out code
- [ ] No `any` types (without approved exception)
- [ ] No magic numbers (all constants named)
- [ ] All errors are handled (not swallowed)
- [ ] All inputs are validated and sanitized
- [ ] All public APIs have TSDoc comments
- [ ] Branch name follows conventions
- [ ] Commit messages follow conventional commits
- [ ] PR description explains WHAT and WHY (not just how)
- [ ] PR links to related issues (e.g., "Closes CID-123")
- [ ] No secrets, keys, or credentials in code
- [ ] Bundle size impact acceptable (checked via CI)

### 12.2 During Code Review — Checklist

**Functionality & Correctness**
- [ ] Does the code do what it's supposed to?
- [ ] Are edge cases handled (empty state, errors, null inputs)?
- [ ] Are there any race conditions?
- [ ] Are calculations correct?

**Performance**
- [ ] Are there unnecessary re-renders?
- [ ] Are expensive operations memoized?
- [ ] Are images optimized?
- [ ] Are there N+1 queries? (watch for lazy loading in TypeORM)

**Security**
- [ ] Are all user inputs validated?
- [ ] Are SQL queries parameterized?
- [ ] Are permissions checked?
- [ ] Are secrets exposed anywhere?
- [ ] Is there proper authentication/authorization?

**Maintainability**
- [ ] Is the code readable?
- [ ] Are functions <50 lines? (suggest refactoring if larger)
- [ ] Are names meaningful?
- [ ] Is there duplicate code that could be extracted?
- [ ] Are there complex conditionals that could be simplified?
- [ ] Are abstractions at the right level?

**Testing**
- [ ] Are there unit tests for new logic?
- [ ] Do tests cover error cases?
- [ ] Are tests deterministic?
- [ ] Are E2E tests added for critical flows?

**Documentation**
- [ ] Are public APIs documented?
- [ ] Are complex algorithms explained?
- [ ] Are breaking changes documented?

### 12.3 PR Merge Criteria

A PR may be merged when:
1. At least **one** approved review from a senior engineer
2. All CI checks pass (lint, typecheck, test, build, coverage)
3. No unresolved conversations
4. Branch is up to date with `main`
5. All checklist items are satisfied

---

## 13. Git Workflow

### 13.1 Branch Strategy

- `main` — Production-ready code (protected, no direct pushes)
- `develop` — Integration branch
- `feature/*` — Feature branches (merge to develop)
- `fix/*` — Bug fix branches (merge to develop)
- `hotfix/*` — Emergency fixes (merge to main + develop)
- `release/*` — Release preparation (merge to main)

### 13.2 Commit Rules

- All commits MUST follow [Conventional Commits](https://www.conventionalcommits.org/)
- Format: `type(scope): description`
- Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`, `perf`, `ci`, `build`
- Scope is optional but recommended
- Imperative mood: "add feature" not "added feature" or "adds feature"
- Max 72 characters for the first line
- Body wraps at 72 characters
- Footer references issues: `Closes CID-123`

### 13.3 Pre-commit Hooks (Husky + lint-staged)

```jsonc
// .husky/pre-commit
// Runs lint-staged on staged files

// .lintstagedrc.json
{
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md,css,scss}": ["prettier --write"],
  "*.py": ["black --check", "isort --check"]
}

// .husky/commit-msg
// Runs commitlint to validate commit message
```
