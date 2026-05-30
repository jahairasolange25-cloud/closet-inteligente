# Testing Prompt — Closet Inteligente Digital

> **Purpose:** Standardized approach for writing tests across all layers of the CID platform. Use this prompt when writing new tests, adding test coverage, or reviewing existing tests.

---

## 1. Testing Philosophy

### Principles
1. **Test behavior, not implementation** — Test what the code does, not how it does it
2. **One assertion per logical concept** — Each test should verify one specific behavior
3. **Tests are documentation** — Well-written tests describe how the system should behave
4. **Deterministic tests** — Tests should produce the same result every time, regardless of order or environment
5. **Fast feedback** — Unit tests should run in milliseconds; integration tests in seconds
6. **Regression first** — When fixing a bug, write a failing test first, then make it pass

### Test Pyramid

```
        ╱╲
       ╱  ╲          E2E Tests (Playwright)
      ╱    ╲         Critical paths only
     ╱──────╲
    ╱        ╲       Integration Tests (supertest, pytest)
   ╱          ╲      Service-layer contracts, API endpoints
  ╱──────────────╲
 ╱                ╲  Unit Tests (Jest, RTL, pytest)
╱                  ╲ Pure logic, components, hooks, services
```

### Testing by Layer

| Layer | Framework | Focus | Speed | Count |
|---|---|---|---|---|
| **Frontend Unit** | Jest + React Testing Library | Components, hooks, stores, utils | <10ms | Many |
| **Backend Unit** | Jest | Services, guards, pipes, DTOs | <10ms | Many |
| **Backend Integration** | Jest + supertest | Controllers, full endpoints | <500ms | Some |
| **Python Unit** | pytest | Models, services, utils | <100ms | Many |
| **Python Integration** | pytest + TestClient | API endpoints | <1s | Some |
| **E2E** | Playwright | Critical user flows | <30s | Few |
| **Visual Regression** | Storybook + Chromatic | UI component appearance | <10s | Some |
| **Performance** | k6 / Artillery | API throughput, response times | <5min | Few |

---

## 2. Test Plan Format

### 2.1 Test Plan Template
```markdown
# Test Plan — <Component or Feature Name>

**Author:** <agent-id>
**Date:** YYYY-MM-DD
**Related Task:** <task ID or issue number>

---

## Scope
<what is being tested and what is not>

## In Scope
- <feature aspect 1>
- <feature aspect 2>

## Out of Scope
- <aspect not covered by these tests>
- <aspect not covered by these tests>

---

## Test Environment

### Dependencies to Mock
| Dependency | Mock Strategy | Library |
|---|---|---|
| Cloudinary | Mock SDK calls | jest.mock |
| Supabase Auth | Mock JWT verification | jest.mock |
| Redis | Mock ioredis | redis-mock |
| AI Service | Mock HTTP responses | nock / msw |
| PostgreSQL | Testcontainers (integration) | testcontainers |
| Socket.IO | Mock socket.io-client | jest.mock |

### Test Data Requirements
- <test database seeding requirements>
- <fixture files needed>
- <factory functions needed>

---

## Test Scenarios

### Scenario 1: <name>
- **Type:** Unit | Integration | E2E
- **Priority:** Critical | High | Medium | Low
- **Description:** <what this tests>
- **Preconditions:** <required state before test>
- **Test Steps:**
  1. <step>
  2. <step>
- **Expected Result:** <expected outcome>
- **Edge Cases:**
  - <edge case 1>
  - <edge case 2>

### Scenario 2: <name>
...

---

## Coverage Requirements

| Module | Lines | Branches | Functions | Statements |
|---|---|---|---|---|
| <component> | ≥XX% | ≥XX% | ≥XX% | ≥XX% |

---

## Risks and Mitigations
- <test risk> → <mitigation>
- <test risk> → <mitigation>
```

---

## 3. Test Case Template

### 3.1 Frontend (Jest + React Testing Library)
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
// or: import { jest } from '@jest/globals';

describe('<ComponentName />', () => {
  // Arrange: set up common test data and mocks
  const defaultProps = {
    // ...default props
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the component with required props', () => {
      render(<ComponentName {...defaultProps} />);
      expect(screen.getByRole('heading')).toHaveTextContent('Expected Title');
    });

    it('renders a loading state while data is being fetched', () => {
      render(<ComponentName {...defaultProps} isLoading />);
      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
    });

    it('renders an empty state when there is no data', () => {
      render(<ComponentName {...defaultProps} data={[]} />);
      expect(screen.getByText(/no items/i)).toBeInTheDocument();
    });

    it('renders an error state when there is an error', () => {
      const error = new Error('Network error');
      render(<ComponentName {...defaultProps} error={error} />);
      expect(screen.getByRole('alert')).toHaveTextContent(/network error/i);
    });

    it('renders a list of items when data is provided', () => {
      const items = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
      ];
      render(<ComponentName {...defaultProps} data={items} />);
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });
  });

  describe('interaction', () => {
    it('calls onSelect when a garment card is clicked', async () => {
      const onSelect = vi.fn();
      const garment = { id: '1', name: 'Blue Shirt' };
      render(<ComponentName {...defaultProps} garment={garment} onSelect={onSelect} />);

      await userEvent.click(screen.getByRole('button'));

      expect(onSelect).toHaveBeenCalledWith('1');
    });

    it('submits the form when all required fields are filled', async () => {
      const onSubmit = vi.fn();
      render(<ComponentName {...defaultProps} onSubmit={onSubmit} />);

      await userEvent.type(screen.getByLabelText(/name/i), 'Test Garment');
      await userEvent.selectOptions(screen.getByLabelText(/type/i), 'Top');
      await userEvent.click(screen.getByRole('button', { name: /submit/i }));

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Test Garment', type: 'Top' }),
      );
    });

    it('shows validation errors when required fields are missing', async () => {
      render(<ComponentName {...defaultProps} />);

      await userEvent.click(screen.getByRole('button', { name: /submit/i }));

      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('supports keyboard navigation', async () => {
      render(<ComponentName {...defaultProps} />);
      const firstFocusable = screen.getByRole('button');
      firstFocusable.focus();
      expect(document.activeElement).toBe(firstFocusable);
    });

    it('has proper ARIA labels', () => {
      render(<ComponentName {...defaultProps} />);
      expect(screen.getByRole('img')).toHaveAttribute('alt', expect.any(String));
    });
  });

  describe('edge cases', () => {
    it('handles very long text without breaking layout', () => {
      const garment = { id: '1', name: 'A'.repeat(200) };
      render(<ComponentName {...defaultProps} garment={garment} />);
      expect(screen.getByText('A'.repeat(200))).toBeInTheDocument();
    });

    it('handles special characters in text', () => {
      const garment = { id: '1', name: '<script>alert("xss")</script>' };
      render(<ComponentName {...defaultProps} garment={garment} />);
      // Should escape HTML
      expect(screen.getByText(/&lt;script&gt;/)).not.toBeInTheDocument();
    });
  });
});
```

### 3.2 Backend Service (Jest)
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createMock } from '@golevelup/ts-jest';
import { GarmentService } from './garment.service';
import { GarmentEntity } from './entities/garment.entity';
import { NotFoundException } from '@nestjs/common';
import { createMockGarment } from '../../test/factories/garment.factory';

describe('GarmentService', () => {
  let service: GarmentService;
  let repository: jest.Mocked<Repository<GarmentEntity>>;

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

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    const userId = 'user-1';

    it('returns paginated garments for a user', async () => {
      const garments = [createMockGarment({ userId })];
      repository.findAndCount.mockResolvedValue([garments, 1]);

      const result = await service.findAll(userId, { page: 1, pageSize: 20 });

      expect(result.data).toEqual(garments);
      expect(result.total).toBe(1);
      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId },
          skip: 0,
          take: 20,
        }),
      );
    });

    it('returns empty array when user has no garments', async () => {
      repository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll(userId, { page: 1, pageSize: 20 });

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('applies correct pagination skip for second page', async () => {
      repository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(userId, { page: 2, pageSize: 10 });

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
    });

    it('applies sorting when sortBy is provided', async () => {
      repository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(userId, {
        page: 1,
        pageSize: 20,
        sortBy: 'createdAt',
        order: 'DESC',
      });

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { createdAt: 'DESC' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('returns a garment by ID', async () => {
      const garment = createMockGarment({ id: 'garment-1' });
      repository.findOne.mockResolvedValue(garment);

      const result = await service.findOne('garment-1');

      expect(result).toEqual(garment);
    });

    it('throws NotFoundException when garment does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates and returns a new garment', async () => {
      const dto = { name: 'New Shirt', garmentType: 'Top' };
      const saved = createMockGarment({ name: 'New Shirt', garmentType: 'Top' });
      repository.save.mockResolvedValue(saved);

      const result = await service.create(dto, 'user-1');

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ ...dto, userId: 'user-1' }),
      );
      expect(result).toEqual(saved);
    });

    it('validates required fields before creating', async () => {
      const dto = { name: '', garmentType: 'Top' };

      await expect(service.create(dto, 'user-1')).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('updates and returns the updated garment', async () => {
      const existing = createMockGarment({ id: 'garment-1', name: 'Old' });
      const updated = { ...existing, name: 'New' };
      repository.findOne.mockResolvedValue(existing);
      repository.save.mockResolvedValue(updated);

      const result = await service.update('garment-1', { name: 'New' });

      expect(result.name).toBe('New');
    });

    it('throws NotFoundException when updating non-existent garment', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.update('non-existent', { name: 'New' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('soft-deletes a garment', async () => {
      const garment = createMockGarment({ id: 'garment-1' });
      repository.findOne.mockResolvedValue(garment);
      repository.softDelete.mockResolvedValue({ affected: 1 } as any);

      await service.delete('garment-1');

      expect(repository.softDelete).toHaveBeenCalledWith('garment-1');
    });

    it('throws NotFoundException when deleting non-existent garment', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.delete('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
```

### 3.3 Backend Controller (Jest + supertest)
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { createMockGarment } from './factories/garment.factory';

describe('GarmentController (Integration)', () => {
  let app: INestApplication;
  let mockGarmentService: Record<string, jest.Mock>;

  beforeAll(async () => {
    mockGarmentService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('GarmentService')
      .useValue(mockGarmentService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/garments', () => {
    it('returns 200 and paginated garments', async () => {
      const garments = [createMockGarment()];
      mockGarmentService.findAll.mockResolvedValue({ data: garments, total: 1 });

      const response = await request(app.getHttpServer())
        .get('/api/v1/garments')
        .set('Authorization', 'Bearer test-token')
        .query({ page: 1, pageSize: 20 });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.total).toBe(1);
    });

    it('returns 401 without authentication', async () => {
      const response = await request(app.getHttpServer()).get('/api/v1/garments');

      expect(response.status).toBe(401);
    });

    it('returns 400 with invalid query parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/garments')
        .set('Authorization', 'Bearer test-token')
        .query({ page: -1, pageSize: 1000 });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/garments', () => {
    it('returns 201 and creates a garment', async () => {
      const dto = { name: 'New Shirt', garmentType: 'Top' };
      const created = createMockGarment(dto);
      mockGarmentService.create.mockResolvedValue(created);

      const response = await request(app.getHttpServer())
        .post('/api/v1/garments')
        .set('Authorization', 'Bearer test-token')
        .send(dto);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('New Shirt');
    });

    it('returns 422 with invalid DTO', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/garments')
        .set('Authorization', 'Bearer test-token')
        .send({ name: '' }); // Missing required fields

      expect(response.status).toBe(422);
    });
  });
});
```

### 3.4 Python (pytest)
```python
"""Tests for garment detection service."""

from unittest.mock import Mock, patch, MagicMock
import pytest
import numpy as np
from fastapi.testclient import TestClient
from app import app
from services.detection_service import GarmentDetector

client = TestClient(app)


class TestGarmentDetector:
    """Unit tests for GarmentDetector."""

    @pytest.fixture
    def detector(self):
        """Create a detector instance with mocked model."""
        with patch("services.detection_service.Detectron2Model") as mock_model:
            mock_model.return_value.predict.return_value = {
                "instances": MagicMock(
                    pred_boxes=MagicMock(tensor=MagicMock(tolist=lambda: [[10, 20, 100, 200]])),
                    pred_classes=MagicMock(tolist=lambda: [1]),
                    scores=MagicMock(tolist=lambda: [0.95]),
                )
            }
            detector = GarmentDetector(model_path="/mock/path")
            yield detector

    def test_detect_success(self, detector):
        """Test successful garment detection."""
        image = np.zeros((224, 224, 3), dtype=np.uint8)
        result = detector.detect(image, confidence_threshold=0.5)

        assert "detections" in result
        assert len(result["detections"]) > 0
        assert result["detections"][0]["confidence"] >= 0.5

    def test_detect_below_threshold(self, detector):
        """Test detection with high confidence threshold filters out low-confidence results."""
        image = np.zeros((224, 224, 3), dtype=np.uint8)
        result = detector.detect(image, confidence_threshold=0.99)

        assert len(result["detections"]) == 0

    def test_detect_empty_image(self, detector):
        """Test detection with empty (all-black) image."""
        image = np.zeros((224, 224, 3), dtype=np.uint8)
        result = detector.detect(image)

        assert "detections" in result

    def test_detect_invalid_input(self, detector):
        """Test detection raises error for invalid input."""
        with pytest.raises(ValueError, match="Image must be a numpy array"):
            detector.detect(None)  # type: ignore

        with pytest.raises(ValueError, match="Image must have 3 channels"):
            detector.detect(np.zeros((224, 224), dtype=np.uint8))


class TestDetectionAPI:
    """Integration tests for detection API."""

    def test_detect_endpoint_success(self):
        """Test POST /api/v1/detect with a valid image."""
        with open("tests/fixtures/shirt.jpg", "rb") as f:
            response = client.post(
                "/api/v1/detect",
                files={"image": ("shirt.jpg", f, "image/jpeg")},
            )

        assert response.status_code == 200
        data = response.json()
        assert "garment_type" in data
        assert "confidence" in data
        assert data["confidence"] >= 0.0

    def test_detect_endpoint_invalid_file_type(self):
        """Test POST /api/v1/detect with invalid file type."""
        response = client.post(
            "/api/v1/detect",
            files={"image": ("test.txt", b"not an image", "text/plain")},
        )

        assert response.status_code == 422
        assert "detail" in response.json()

    def test_detect_endpoint_no_file(self):
        """Test POST /api/v1/detect with no file."""
        response = client.post("/api/v1/detect")
        assert response.status_code == 422

    def test_detect_endpoint_large_file(self):
        """Test POST /api/v1/detect with oversized file."""
        large_data = np.random.bytes(30 * 1024 * 1024)  # 30MB
        response = client.post(
            "/api/v1/detect",
            files={"image": ("large.jpg", large_data, "image/jpeg")},
        )

        assert response.status_code == 413  # Payload Too Large
```

---

## 4. Coverage Requirements

### 4.1 Coverage Targets by Module Type

| Module Type | Line Coverage | Branch Coverage | Function Coverage |
|---|---|---|---|
| Frontend Components | ≥70% | ≥60% | ≥80% |
| Frontend Hooks | ≥85% | ≥75% | ≥90% |
| Frontend Stores | ≥85% | ≥75% | ≥90% |
| Frontend Utils | ≥90% | ≥80% | ≥95% |
| Backend Services | ≥90% | ≥80% | ≥95% |
| Backend Controllers | ≥80% | ≥70% | ≥85% |
| Backend Guards/Pipes | ≥90% | ≥80% | ≥95% |
| Backend DTOs | ≥100% | N/A | ≥100% |
| Python Models | ≥85% | ≥75% | ≥90% |
| Python Services | ≥80% | ≥70% | ≥85% |
| Python API | ≥80% | ≥70% | ≥85% |

### 4.2 Coverage Configuration

**Jest (Frontend/Backend):**
```jsonc
// jest.config.ts
{
  "coverageThreshold": {
    "global": {
      "branches": 70,
      "functions": 80,
      "lines": 80,
      "statements": 80,
    },
    "./src/**/*.service.ts": {
      "branches": 80,
      "functions": 90,
      "lines": 90,
      "statements": 90,
    },
  },
  "collectCoverageFrom": [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.module.ts",
    "!src/main.ts",
    "!src/**/*.config.ts",
  ],
}
```

**pytest (Python):**
```ini
# pytest.ini or pyproject.toml
[tool.coverage.run]
source = ["services"]
omit = ["*/tests/*", "*/__init__.py", "*/config.py"]

[tool.coverage.report]
fail_under = 80
show_missing = true
```

### 4.3 Coverage Failure Response
If coverage falls below threshold:
1. Identify uncovered lines with `--show-missing`
2. Prioritize covering critical business logic paths
3. Add tests for branches that handle errors or edge cases
4. Re-run with coverage to verify threshold is met

---

## 5. Mocking Guidelines

### 5.1 What to Mock
| Layer | Mock? | Strategy |
|---|---|---|
| External API calls (Cloudinary, Supabase, FCM) | ✅ Always | `jest.mock()` / `nock` / `responses` |
| Database queries (unit tests) | ✅ Always | Mock repository |
| Database queries (integration tests) | ❌ Never | Use Testcontainers or test DB |
| File system I/O | ✅ Always | `mock-fs` / `memfs` |
| AI model inference | ✅ Unit tests | Mock return values |
| AI model inference | ❌ Integration | Use small test model |
| Socket.IO server | ✅ Unit tests | Mock socket instance |
| Socket.IO server | ❌ Integration | Use actual Socket.IO TestClient |
| Third-party SDKs | ✅ Always | `jest.mock()` |
| `Date.now()` / `Math.random()` | ✅ When needed | `jest.spyOn()` |
| Environment variables | ✅ When needed | `process.env` override |
| Network requests | ✅ Unit tests | `msw` / `nock` |
| Network requests | ❌ E2E tests | Use real backend |

### 5.2 Mock Setup Patterns

**Manual Mock (recommended for external services):**
```typescript
// __mocks__/@cloudinary/uploader.ts
export const upload = jest.fn().mockResolvedValue({
  public_id: 'mock-public-id',
  secure_url: 'https://res.cloudinary.com/mock/image.jpg',
  width: 800,
  height: 600,
});

export const destroy = jest.fn().mockResolvedValue({ result: 'ok' });
```

**Inline Mock with jest.mock:**
```typescript
jest.mock('@/lib/api-client', () => ({
  apiClient: {
    getGarments: jest.fn().mockResolvedValue({ data: [], total: 0 }),
    createGarment: jest.fn().mockResolvedValue({ id: 'mock-id' }),
  },
}));
```

**Dynamic Mock with createMock:**
```typescript
import { createMock } from '@golevelup/ts-jest';

const mockRepository = createMock<Repository<GarmentEntity>>();
mockRepository.findAndCount.mockResolvedValue([mockGarments, mockGarments.length]);
```

**Python Mock (unittest.mock):**
```python
from unittest.mock import patch, MagicMock

with patch("services.detection_service.Detectron2Model") as mock_model:
    mock_instance = MagicMock()
    mock_instance.predict.return_value = {"instances": MagicMock()}
    mock_model.return_value = mock_instance
```

### 5.3 Mock Verification
After each test, verify:
- Expected mocks were called with correct arguments
- No unexpected calls were made
- Mock implementations were restored (auto-cleanup in `afterEach`/`teardown`)

```typescript
afterEach(() => {
  vi.clearAllMocks();
  // or: jest.clearAllMocks();
});
```

### 5.4 Mock Anti-Patterns
```
❌ Mocking the module under test (defeats the purpose)
❌ Mocking something that should be tested (over-mocking)
❌ Shared mutable mock state between tests
❌ Mocking without verifying call counts or arguments
❌ Mocking too broadly (mock what you need, not everything)
❌ Using partial mocks when full mocks are clearer
```

---

## 6. Test Data Generation

### 6.1 Factory Functions

**TypeScript (Frontend/Backend) — using Faker.js:**
```typescript
// test/factories/garment.factory.ts
import { faker } from '@faker-js/faker';
import { IGarment } from '@/types/garment.types';
import { EGarmentType, EGarmentState, ESeason } from '@/types/enums';

export function createMockGarment(overrides?: Partial<IGarment>): IGarment {
  return {
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    name: faker.commerce.productName(),
    garmentType: faker.helpers.enumValue(EGarmentType),
    garmentState: EGarmentState.Active,
    brand: faker.company.name(),
    size: faker.helpers.arrayElement(['XS', 'S', 'M', 'L', 'XL', 'XXL']),
    color: faker.color.human(),
    colorHex: faker.color.rgb({ prefix: '#' }),
    pattern: faker.helpers.arrayElement(['solid', 'striped', 'floral', 'plaid', 'polka-dot']),
    season: faker.helpers.enumValue(ESeason),
    priceAmountCents: faker.number.int({ min: 1000, max: 200000 }),
    priceCurrency: 'COP',
    wearCount: faker.number.int({ min: 0, max: 100 }),
    imageUrl: faker.image.url(),
    isFavorite: faker.datatype.boolean(),
    createdAt: faker.date.past({ years: 2 }),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
}

export function createMockGarmentList(count: number = 5, overrides?: Partial<IGarment>): IGarment[] {
  return Array.from({ length: count }, () => createMockGarment(overrides));
}

export function createMockUser(overrides?: Partial<IUser>): IUser {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    displayName: faker.person.fullName(),
    isVerified: true,
    isActive: true,
    createdAt: faker.date.past({ years: 1 }),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
}
```

**Python — using Faker:**
```python
# tests/factories/garment_factory.py
from faker import Faker
from typing import Any
import uuid
from datetime import datetime, timedelta

fake = Faker()

GARMENT_TYPES = ["Top", "Bottom", "Dress", "Outerwear", "Footwear"]
GARMENT_STATES = ["Active", "Archived", "Donated"]
SEASONS = ["Spring", "Summer", "Fall", "Winter", "All"]


def create_mock_garment(overrides: dict[str, Any] | None = None) -> dict[str, Any]:
    garment = {
        "id": str(uuid.uuid4()),
        "user_id": str(uuid.uuid4()),
        "name": fake.word().capitalize() + " " + fake.word(),
        "garment_type": fake.random_element(GARMENT_TYPES),
        "garment_state": fake.random_element(GARMENT_STATES),
        "brand": fake.company(),
        "color": fake.color_name(),
        "season": fake.random_element(SEASONS),
        "wear_count": fake.random_int(0, 100),
        "created_at": (datetime.now() - timedelta(days=fake.random_int(1, 365))).isoformat(),
        "updated_at": datetime.now().isoformat(),
    }
    if overrides:
        garment.update(overrides)
    return garment


def create_mock_garment_list(count: int = 5, overrides: dict[str, Any] | None = None) -> list[dict[str, Any]]:
    return [create_mock_garment(overrides) for _ in range(count)]
```

### 6.2 Test Fixtures

**Static fixtures (for specific test scenarios):**
Store in `test/fixtures/`:
- Sample garment images (JPEG, PNG, WebP) for upload tests
- Sample 3D models (small GLB files) for rendering tests
- Sample CSV/JSON files for import tests

**Dynamic fixtures (for database seeding):**
```typescript
// test/fixtures/seed-database.ts
import { DataSource } from 'typeorm';
import { createMockGarment, createMockUser } from '../factories';

export async function seedTestDatabase(dataSource: DataSource): Promise<void> {
  const userRepo = dataSource.getRepository(UserEntity);
  const garmentRepo = dataSource.getRepository(GarmentEntity);

  const user = userRepo.create(createMockUser());
  await userRepo.save(user);

  const garments = Array.from({ length: 10 }, () =>
    garmentRepo.create(createMockGarment({ userId: user.id })),
  );
  await garmentRepo.save(garments);

  return { user, garments };
}
```

---

## 7. Test Execution Commands

```bash
# ===== Frontend (apps/web) =====

# Run all tests
cd apps/web && npm run test

# Run tests with coverage
cd apps/web && npm run test -- --coverage

# Run tests in watch mode
cd apps/web && npm run test -- --watch

# Run specific test file
cd apps/web && npm run test -- -- src/components/garments/garment-card.spec.tsx

# Run tests matching a pattern
cd apps/web && npm run test -- --testNamePattern="renders garment"

# Run E2E tests
cd apps/web && npm run test:e2e

# Run E2E tests in headed mode (see browser)
cd apps/web && npx playwright test --headed


# ===== Backend (apps/api) =====

# Run all tests
cd apps/api && npm run test

# Run tests with coverage
cd apps/api && npm run test -- --coverage

# Run integration tests
cd apps/api && npm run test:integration

# Run specific test file
cd apps/api && npm run test -- -- src/modules/garment/garment.service.spec.ts


# ===== Python AI (services/ai) =====

# Run all tests
cd services/ai && pytest

# Run with coverage
cd services/ai && pytest --cov=. --cov-report=term-missing

# Run specific test file
cd services/ai && pytest tests/test_detector.py

# Run tests by marker (e.g., slow tests)
cd services/ai && pytest -m "slow"

# Run tests in parallel
cd services/ai && pytest -n auto

# Run with verbose output
cd services/ai && pytest -v


# ===== All Services (root) =====

# Run all tests across the monorepo
npm run test

# Run lint + typecheck + test
npm run ci
```

---

## 8. CI Test Integration

### 8.1 CI Pipeline Test Stages
```yaml
# .github/workflows/ci.yml (conceptual)
jobs:
  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: pnpm install
      - run: cd apps/web && npm run lint
      - run: cd apps/web && npm run typecheck
      - run: cd apps/web && npm run test -- --coverage
      - run: cd apps/web && npm run build

  test-backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: pnpm install
      - run: cd apps/api && npm run lint
      - run: cd apps/api && npm run typecheck
      - run: cd apps/api && npm run test -- --coverage
      - run: cd apps/api && npm run build

  test-ai:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.11' }
      - run: pip install -r services/ai/requirements.txt
      - run: cd services/ai && ruff check .
      - run: cd services/ai && mypy .
      - run: cd services/ai && pytest --cov=. --cov-fail-under=80

  test-e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: pnpm install
      - run: npx playwright install --with-deps
      - run: cd apps/web && npm run test:e2e
```

### 8.2 CI Failure Response
If CI tests fail:
1. Check the specific failed job and test
2. Read the error message and stack trace
3. Check if the failure is related to your changes or pre-existing
4. If related to your changes, fix and re-push
5. If pre-existing, file an issue and note it in your PR

---

## 9. Test Review Checklist

Before submitting tests for review, verify:

- [ ] Tests test behavior, not implementation details
- [ ] Test names follow the pattern: `should <expected> when <condition>`
- [ ] Tests are deterministic (no random failures, no timing dependencies)
- [ ] No test depends on another test (independent, isolated)
- [ ] Mocks are properly set up and cleaned up
- [ ] Coverage thresholds are met (≥80%)
- [ ] Edge cases are covered (empty, error, loading, null, boundary)
- [ ] No console.log or debugger statements in test code
- [ ] No test is skipped (`.skip`) without a documented reason and tracking issue
- [ ] Factory functions are used for test data (not hardcoded values)
- [ ] Tests use `data-testid` attributes, not CSS classes or DOM structure
- [ ] Async tests properly await results
- [ ] Error cases test both the error being thrown AND the error message/content
