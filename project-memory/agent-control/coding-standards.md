# Coding Standards

> This document is a DUPLICATE of `project-memory/core/coding-standards.md` for easy agent reference.
>
> **IMPORTANT**: If you need to update this document, update `project-memory/core/coding-standards.md` FIRST, then copy to this location.
>
> Any discrepancy between this file and the core version should be resolved in favor of the core version.

---

## 1. General Principles

### 1.1 Consistency Over Preference
All code should follow existing patterns, not individual preferences. When in doubt, look at how similar code is written elsewhere in the project.

### 1.2 Readability Over Cleverness
Write code that is easy to understand. Avoid clever optimizations that sacrifice readability unless performance is proven to be a problem.

### 1.3 Explicit Over Implicit
Make dependencies, data flow, and side effects explicit. Avoid magic strings, implicit state, and hidden side effects.

### 1.4 Fail Fast
Validate inputs early. Throw errors as soon as something is wrong. Don't let invalid data propagate through the system.

### 1.5 DRY (Don't Repeat Yourself)
If you write the same code twice, extract it. If you write similar code three times, abstract it.

---

## 2. Language-Specific Standards

### 2.1 TypeScript

#### 2.1.1 Strict Mode
TypeScript must be used in strict mode (`"strict": true` in tsconfig.json). No exceptions.

#### 2.1.2 No `any`
Avoid `any` type. Use `unknown` when the type is truly unknown, then narrow it. If you use `any`, you must add a comment justifying why.

#### 2.1.3 Explicit Return Types
All functions must have explicit return types. This ensures the function's contract is clear and prevents accidental type changes.

```typescript
// ✅ Good
function getUser(id: string): Promise<User> {
  return userRepository.findById(id);
}

// ❌ Bad
function getUser(id: string) {
  return userRepository.findById(id);
}
```

#### 2.1.4 No Implicit `any`
Do not rely on TypeScript inferring `any`. Always specify types for parameters.

```typescript
// ✅ Good
function processItem(item: ClothingItem): void { ... }

// ❌ Bad
function processItem(item) { ... }
```

#### 2.1.5 Use Interfaces Over Types (for objects)
Prefer `interface` for object shapes. Use `type` for unions, intersections, and primitives.

```typescript
// ✅ Good
interface User {
  id: string;
  name: string;
}

// ✅ Good (type for union)
type Status = 'active' | 'inactive' | 'pending';

// ❌ Bad
type User = {
  id: string;
  name: string;
}
```

#### 2.1.6 Enums
Prefer `const enum` or union types over regular enums. Regular enums generate runtime code.

```typescript
// ✅ Good
type Status = 'active' | 'inactive';

// ✅ Good (const enum)
const enum Status {
  Active = 'active',
  Inactive = 'inactive',
}

// ❌ Bad
enum Status {
  Active = 'active',
  Inactive = 'inactive',
}
```

#### 2.1.7 Null vs Undefined
Use `undefined` for values that are not yet set. Use `null` for explicitly empty values. Be consistent.

#### 2.1.8 Optional Chaining and Nullish Coalescing
Use optional chaining (`?.`) and nullish coalescing (`??`) instead of logical AND (`&&`) or OR (`||`) for null/undefined checks.

```typescript
// ✅ Good
const name = user?.profile?.name ?? 'Anonymous';

// ❌ Bad
const name = (user && user.profile && user.profile.name) || 'Anonymous';
```

### 2.2 Python

#### 2.2.1 Type Hints
All functions must have type hints. Use `mypy` for type checking.

```python
# ✅ Good
def get_user(user_id: str) -> User:
    return user_repository.find_by_id(user_id)

# ❌ Bad
def get_user(user_id):
    return user_repository.find_by_id(user_id)
```

#### 2.2.2 Docstrings
Use Google-style docstrings for all public functions and classes.

```python
def calculate_similarity(vector_a: np.ndarray, vector_b: np.ndarray) -> float:
    """Calculate cosine similarity between two vectors.

    Args:
        vector_a: First embedding vector.
        vector_b: Second embedding vector.

    Returns:
        Cosine similarity score between 0 and 1.

    Raises:
        ValueError: If vectors have different lengths.
    """
    ...
```

#### 2.2.3 Imports Order
1. Standard library
2. Third-party libraries
3. Local modules

Each group separated by a blank line.

```python
import os
import sys
from typing import Optional

import numpy as np
import torch
from fastapi import APIRouter, HTTPException

from services.schemas.clothing import ClothingItem
from pipelines.segmentation import Segmenter
```

---

## 3. File Organization

### 3.1 One Concept Per File
Each file should represent one concept. Exception: small, tightly-coupled types or utilities may be grouped.

### 3.2 File Naming
- **React components**: PascalCase (`UserProfile.tsx`)
- **Hooks**: camelCase with `use` prefix (`useUserProfile.ts`)
- **Stores**: camelCase (`userStore.ts`)
- **Services**: camelCase (`userService.ts`)
- **Types**: PascalCase (`User.ts`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Configuration**: kebab-case (`tailwind.config.ts`)

### 3.3 Directory Naming
- **Directories**: kebab-case (`user-profile/`, `wardrobe-items/`)
- **NestJS modules**: kebab-case (`user-profile/`)

---

## 4. React/Next.js Standards

### 4.1 Component Types
Use React.FC or explicitly type props. Prefer inline interfaces for component props (unless shared).

```typescript
// ✅ Good
interface UserProfileProps {
  userId: string;
  showDetails?: boolean;
}

export function UserProfile({ userId, showDetails = false }: UserProfileProps) {
  ...
}
```

### 4.2 Server vs Client Components
- **Server components** are the default in Next.js App Router.
- Add `'use client'` only when you need browser APIs, state, or effects.
- Keep server components as the default; push client boundaries as far down as possible.

### 4.3 Data Fetching
- Use TanStack Query for client-side data fetching.
- Use server components for initial data where possible.
- Never fetch in components directly; use hooks or services.

### 4.4 State Management
- **Local state**: `useState` for component-local state.
- **Global state**: Zustand store for shared state.
- **Server state**: TanStack Query for API data.
- **URL state**: search params for filter/pagination state.

### 4.5 Component Composition
- Prefer composition over inheritance.
- Use children/slots for flexible layouts.
- Keep components focused (single responsibility).

```typescript
// ✅ Good
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </div>
  );
}

// ❌ Bad
function CardWithImageAndTitleAndDescriptionAndButton() { ... }
```

### 4.6 Accessibility
- All interactive elements must have accessible names.
- Use semantic HTML (`<button>`, `<nav>`, `<main>`, `<header>`).
- Include ARIA labels where semantic HTML is insufficient.
- Ensure keyboard navigation works.
- Maintain color contrast ratios (WCAG AA minimum).

### 4.7 Performance
- Use `React.memo` for expensive renders.
- Use `useMemo` and `useCallback` with actual dependencies.
- Avoid unnecessary re-renders.
- Lazy load images and components below the fold.
- Use Next.js Image component for optimization.

---

## 5. NestJS Standards

### 5.1 Module Structure
```
module-name/
├── controllers/
│   └── module-name.controller.ts
├── services/
│   └── module-name.service.ts
├── repositories/
│   └── module-name.repository.ts
├── dto/
│   ├── create-module-name.dto.ts
│   └── update-module-name.dto.ts
├── guards/
│   └── module-name.guard.ts
├── interfaces/
│   └── module-name.interface.ts
└── module-name.module.ts
```

### 5.2 Dependency Injection
- Use constructor injection.
- Prefer interface-based injection tokens for testability.
- Use `@Injectable()` decorator on all services.

### 5.3 Validation
- Use `class-validator` decorators on DTOs.
- Use `class-transformer` for serialization.
- Use `ValidationPipe` globally.

```typescript
// dto/create-user.dto.ts
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
```

### 5.4 Error Handling
- Use typed exceptions extending `HttpException`.
- Use exception filters for consistent error responses.
- Never catch without a purpose (rethrow, transform, or handle).

### 5.5 Authentication
- Use `@UseGuards(AuthGuard)` on every protected endpoint.
- Use `@UseGuards(RolesGuard)` for role-based access.
- Never manually check auth in service methods.

---

## 6. Database Standards (Prisma)

### 6.1 Naming Conventions
- **Models**: PascalCase, singular (`User`, `ClothingItem`).
- **Fields**: camelCase (`firstName`, `createdAt`).
- **Database tables**: snake_case, plural (`users`, `clothing_items`).
- **Database columns**: snake_case (`first_name`, `created_at`).
- **Relations**: camelCase (`owner`, `category`).

### 6.2 Model Design
- Every model must have `id` (auto-increment UUID or cuid).
- Every model must have `createdAt` and `updatedAt`.
- Use `@default(now())` for timestamps.
- Use `@updatedAt` for update timestamps.
- Use enums for fixed sets of values.
- Use relations for related data (not JSON blobs).

### 6.3 Indexes
- Index foreign keys.
- Index fields used in `WHERE`, `ORDER BY`, and `GROUP BY`.
- Index composite fields for common query patterns.
- Avoid over-indexing (write performance cost).

---

## 7. API Standards

### 7.1 RESTful Design
- Use nouns for resources (`/api/v1/wardrobe/items`).
- Use HTTP methods for actions (GET, POST, PUT, DELETE, PATCH).
- Use plural resource names (`/items`, not `/item`).
- Nest related resources (`/api/v1/wardrobe/items/:id/comments`).

### 7.2 Response Format
Consistent response envelope:

```typescript
// Success
{
  "data": { ... },
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 100
  }
}

// Error
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      { "field": "email", "message": "Must be a valid email" }
    ]
  }
}
```

### 7.3 HTTP Status Codes
- `200` — Success (GET, PATCH)
- `201` — Created (POST)
- `204` — No Content (DELETE)
- `400` — Bad Request (validation error)
- `401` — Unauthorized (not authenticated)
- `403` — Forbidden (not authorized)
- `404` — Not Found
- `409` — Conflict (duplicate)
- `422` — Unprocessable Entity
- `429` — Too Many Requests (rate limited)
- `500` — Internal Server Error

---

## 8. Testing Standards

### 8.1 Test Structure (AAA)
Every test must follow Arrange-Act-Assert:

```typescript
it('should return user when valid id is provided', async () => {
  // Arrange
  const userId = 'valid-id';
  const mockUser = { id: userId, name: 'Test User' };
  userRepository.findById.mockResolvedValue(mockUser);

  // Act
  const result = await userService.getUser(userId);

  // Assert
  expect(result).toEqual(mockUser);
});
```

### 8.2 Test Naming
`it('should [expected behavior] when [condition]')` or `test('[condition] -> [expected behavior]')`

### 8.3 Test Coverage
- Unit tests: All services, hooks, utilities.
- Integration tests: API endpoints, database operations.
- Use factories/fixtures for test data, not real data.

---

## 9. Git Standards

### 9.1 Branch Naming
- `feat/<issue-number>-<description>` — New features
- `fix/<issue-number>-<description>` — Bug fixes
- `chore/<issue-number>-<description>` — Maintenance
- `refactor/<description>` — Code refactoring
- `docs/<description>` — Documentation

### 9.2 Commit Messages
Follow conventional commits format:
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### 9.3 Code Review
- All code must be reviewed before merging to main.
- PRs should be small (under 500 lines changed).
- Address all review comments before merging.

---

## 10. Documentation Standards

### 10.1 Code Documentation
- Use JSDoc/TSDoc for all public APIs (functions, classes, interfaces).
- Keep comments focused on "why", not "what" (the code shows what).
- Add TODO comments with ticket references: `// TODO: #1234 Add pagination`.

### 10.2 README
- Keep README up to date.
- Document setup steps, environment variables, and common commands.
- Document architecture decisions in ADRs.

---

## 11. Error Handling Standards

### 11.1 Frontend Error Handling
- All API calls must have try/catch (or TanStack Query error handling).
- Display user-friendly error messages (not raw error objects).
- Log errors for debugging.

### 11.2 Backend Error Handling
- Use exception filters for consistent error responses.
- Log all errors with context.
- Never expose stack traces to clients.

### 11.3 AI Error Handling
- Validate inputs before processing.
- Log model inference errors.
- Return structured error responses.

---

## 12. Security Standards

### 12.1 Secrets Management
- No secrets in code (use environment variables).
- No secrets in git history.
- Use `.env.example` for documentation (without real values).

### 12.2 Input Validation
- Validate all user inputs on the backend (never trust the frontend).
- Sanitize inputs to prevent injection attacks.
- Use parameterized queries (Prisma handles this).

### 12.3 Authentication
- All API calls require authentication (except login/register).
- Use Auth0 for authentication.
- Validate JWTs on every request.

### 12.4 Authorization
- Check permissions on every operation.
- Use role-based access control.
- Validate resource ownership.

---

## 13. Performance Standards

### 13.1 Database
- Use indexes on frequently queried fields.
- Limit result sets (pagination).
- Avoid N+1 queries (use Prisma include/select).

### 13.2 Frontend
- Lazy load routes and components.
- Optimize images (Next.js Image, WebP).
- Minimize bundle size (tree-shaking, dynamic imports).
- Use React.memo judiciously.

### 13.3 AI
- Use GPU acceleration where available.
- Batch process where possible.
- Cache inference results.
- Use model quantization for faster inference.

---

## 14. Linting and Formatting

### 14.1 ESLint (Frontend & Backend)
- Use the project's ESLint configuration.
- Fix all lint errors before committing.
- Use `eslint --fix` for auto-fixable issues.

### 14.2 Prettier (Frontend & Backend)
- Use the project's Prettier configuration.
- Format all code with Prettier before committing.

### 14.3 Flake8 & Black (Python)
- Use Flake8 for linting.
- Use Black for formatting.
- Keep line length at 88 characters (Black default).

### 14.4 Pre-commit Hooks
- Run linting and formatting on every commit.
- Run type checking on every commit.
- Run tests on every commit (or at least before push).
