# Test Data Factories — Closet Inteligente Digital

## 1. Factory Pattern for Test Data Generation

This document defines the factory and builder patterns used across all test suites (frontend, backend, AI) to generate test data in a consistent, maintainable way.

**Principles**:
- Factories produce plain objects (not entities) to stay framework-agnostic.
- Every factory has sensible defaults so tests only override what matters.
- Use `@faker-js/faker` (JS/TS) and `faker` (Python) for randomized fields.
- Values can be overridden via a plain object argument.
- Complex associations use builder pattern for readability.
- All factories expose a `build()` method for a single instance and `buildMany(count)` for arrays.

### 1.1 Factory interface (base pattern)

```ts
// Shared factory interface
export interface Factory<T> {
  build(overrides?: Partial<T>): T;
  buildMany(count: number, overrides?: Partial<T>): T[];
}
```

```ts
// Base factory class
export abstract class BaseFactory<T> implements Factory<T> {
  abstract define(): T;

  build(overrides: Partial<T> = {}): T {
    return { ...this.define(), ...overrides };
  }

  buildMany(count: number, overrides: Partial<T> = {}): T[] {
    return Array.from({ length: count }, () => this.build(overrides));
  }

  buildWithSequence(
    count: number,
    sequenceCallback: (index: number, base: T) => T
  ): T[] {
    return Array.from({ length: count }, (_, i) => {
      const base = this.build();
      return sequenceCallback(i, base);
    });
  }
}
```

## 2. User Factory

```ts
// test/factories/user.factory.ts
import { faker } from '@faker-js/faker';
import { BaseFactory } from './base.factory';

export type UserRole = 'user' | 'admin';
export type AuthProvider = 'email' | 'google' | 'apple' | 'facebook';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  avatarUrl: string | null;
  isActive: boolean;
  emailVerified: boolean;
  authProvider: AuthProvider;
  refreshToken: string | null;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    notificationsEnabled: boolean;
    measurementUnit: 'metric' | 'imperial';
  };
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class UserFactory extends BaseFactory<User> {
  private password: string = 'DefaultP@ss1';

  define(): User {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    return {
      id: faker.string.uuid(),
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      passwordHash: `$2b$10$${faker.string.alphanumeric(53)}`,
      name: `${firstName} ${lastName}`,
      role: 'user',
      avatarUrl: faker.image.avatar(),
      isActive: true,
      emailVerified: true,
      authProvider: 'email',
      refreshToken: faker.string.alphanumeric(64),
      preferences: {
        theme: 'light',
        language: 'en',
        notificationsEnabled: true,
        measurementUnit: 'metric',
      },
      createdAt: faker.date.past({ years: 1 }),
      updatedAt: faker.date.recent(),
      deletedAt: null,
    };
  }

  withPassword(password: string): this {
    this.password = password;
    return this;
  }

  admin(): this {
    this.define = () => ({
      ...this.define(),
      role: 'admin',
    });
    return this;
  }

  inactive(): this {
    this.define = () => ({
      ...this.define(),
      isActive: false,
    });
    return this;
  }

  unverified(): this {
    this.define = () => ({
      ...this.define(),
      emailVerified: false,
    });
    return this;
  }

  socialLogin(provider: AuthProvider): this {
    this.define = () => ({
      ...this.define(),
      authProvider: provider,
      passwordHash: '',
    });
    return this;
  }

  darkTheme(): this {
    this.define = () => ({
      ...this.define(),
      preferences: {
        ...this.define().preferences,
        theme: 'dark',
      },
    });
    return this;
  }

  getPassword(): string {
    return this.password;
  }
}

// Singleton instance
export const userFactory = new UserFactory();
```

### Usage examples

```ts
// Default user
const user = userFactory.build();

// Admin user
const admin = userFactory.admin().build({ email: 'admin@closet.app' });

// Inactive user with specific id
const inactive = userFactory.inactive().build({ id: 'user-inactive' });

// 5 social login users
const socialUsers = userFactory.socialLogin('google').buildMany(5);

// Sequence of users
const sequenced = userFactory.buildWithSequence(3, (i, base) => ({
  ...base,
  email: `user${i}@test.com`,
  name: `User ${i}`,
}));
```

## 3. Garment Factory

```ts
// test/factories/garment.factory.ts
import { faker } from '@faker-js/faker';
import { BaseFactory } from './base.factory';

export type GarmentCategory = 'top' | 'bottom' | 'footwear' | 'accessory' | 'outerwear';
export type GarmentColor =
  | 'black' | 'white' | 'gray' | 'red' | 'blue' | 'green'
  | 'yellow' | 'purple' | 'pink' | 'orange' | 'brown'
  | 'beige' | 'navy' | 'maroon' | 'teal' | 'multicolor';
export type GarmentStatus = 'active' | 'archived' | 'processing' | 'failed';
export type GarmentSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL';
export type GarmentMaterial =
  | 'cotton' | 'polyester' | 'wool' | 'denim' | 'silk' | 'linen'
  | 'leather' | 'nylon' | 'rayon' | 'spandex' | 'cashmere' | 'lace';

export interface Garment {
  id: string;
  userId: string;
  name: string;
  category: GarmentCategory;
  color: GarmentColor;
  brand: string | null;
  size: GarmentSize | null;
  material: GarmentMaterial | null;
  imageUrl: string;
  thumbnailUrl: string | null;
  status: GarmentStatus;
  favorite: boolean;
  timesWorn: number;
  lastWornAt: Date | null;
  purchasePrice: number | null;
  purchaseDate: Date | null;
  notes: string | null;
  aiTags: {
    detectedColor: GarmentColor;
    detectedCategory: GarmentCategory;
    confidence: number;
    palette: string[];
  } | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class GarmentFactory extends BaseFactory<Garment> {
  define(): Garment {
    return {
      id: faker.string.uuid(),
      userId: faker.string.uuid(),
      name: `${faker.commerce.productAdjective()} ${faker.commerce.productName()}`,
      category: faker.helpers.arrayElement<GarmentCategory>([
        'top', 'bottom', 'footwear', 'accessory', 'outerwear',
      ]),
      color: faker.helpers.arrayElement<GarmentColor>([
        'black', 'white', 'blue', 'red', 'green', 'gray',
      ]),
      brand: faker.helpers.maybe(() => faker.company.name(), { probability: 0.8 }) ?? null,
      size: faker.helpers.maybe(() =>
        faker.helpers.arrayElement<GarmentSize>(['XS', 'S', 'M', 'L', 'XL', 'XXL'])
      , { probability: 0.8 }) ?? null,
      material: faker.helpers.maybe(() =>
        faker.helpers.arrayElement<GarmentMaterial>([
          'cotton', 'polyester', 'wool', 'denim', 'silk',
        ])
      , { probability: 0.7 }) ?? null,
      imageUrl: faker.image.urlPicsumPhotos(),
      thumbnailUrl: faker.image.urlPicsumPhotos(),
      status: 'active',
      favorite: faker.datatype.boolean(0.2),
      timesWorn: faker.number.int({ min: 0, max: 50 }),
      lastWornAt: faker.helpers.maybe(() => faker.date.recent({ days: 30 }), { probability: 0.6 }),
      purchasePrice: faker.helpers.maybe(() =>
        faker.number.float({ min: 5, max: 500, fractionDigits: 2 })
      , { probability: 0.5 }),
      purchaseDate: faker.helpers.maybe(() => faker.date.past({ years: 2 }), { probability: 0.5 }),
      notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }) ?? null,
      aiTags: {
        detectedColor: faker.helpers.arrayElement(['blue', 'black', 'red', 'white']),
        detectedCategory: faker.helpers.arrayElement(['top', 'bottom', 'footwear']),
        confidence: faker.number.float({ min: 0.7, max: 0.99, fractionDigits: 2 }),
        palette: Array.from({ length: 3 }, () => faker.color.rgb()),
      },
      metadata: {},
      createdAt: faker.date.past({ years: 1 }),
      updatedAt: faker.date.recent(),
      deletedAt: null,
    };
  }

  // --- Predefined category types ---

  top(overrides: Partial<Garment> = {}): Garment {
    return this.build({ ...overrides, category: 'top' });
  }

  bottom(overrides: Partial<Garment> = {}): Garment {
    return this.build({ ...overrides, category: 'bottom' });
  }

  footwear(overrides: Partial<Garment> = {}): Garment {
    return this.build({ ...overrides, category: 'footwear' });
  }

  accessory(overrides: Partial<Garment> = {}): Garment {
    return this.build({ ...overrides, category: 'accessory' });
  }

  outerwear(overrides: Partial<Garment> = {}): Garment {
    return this.build({ ...overrides, category: 'outerwear' });
  }

  // --- Predefined states ---

  favorited(overrides: Partial<Garment> = {}): Garment {
    return this.build({ ...overrides, favorite: true });
  }

  processing(overrides: Partial<Garment> = {}): Garment {
    return this.build({
      ...overrides,
      status: 'processing',
      aiTags: null,
    });
  }

  failed(overrides: Partial<Garment> = {}): Garment {
    return this.build({
      ...overrides,
      status: 'failed',
      aiTags: null,
    });
  }

  archived(overrides: Partial<Garment> = {}): Garment {
    return this.build({ ...overrides, status: 'archived' });
  }

  wornRecently(overrides: Partial<Garment> = {}): Garment {
    return this.build({
      ...overrides,
      lastWornAt: faker.date.recent({ days: 3 }),
      timesWorn: faker.number.int({ min: 10, max: 50 }),
    });
  }

  neverWorn(overrides: Partial<Garment> = {}): Garment {
    return this.build({
      ...overrides,
      timesWorn: 0,
      lastWornAt: null,
    });
  }

  // --- Predefined colors ---

  colored(color: GarmentColor, overrides: Partial<Garment> = {}): Garment {
    return this.build({ ...overrides, color });
  }

  // --- With specific attributes ---

  withBrand(brand: string, overrides: Partial<Garment> = {}): Garment {
    return this.build({ ...overrides, brand });
  }

  withSize(size: GarmentSize, overrides: Partial<Garment> = {}): Garment {
    return this.build({ ...overrides, size });
  }

  // --- Category-balanced set ---

  createBalancedSet(userId: string, count: number = 5): Garment[] {
    const categories: GarmentCategory[] = ['top', 'bottom', 'footwear', 'accessory', 'outerwear'];
    return Array.from({ length: count }, (_, i) => {
      return this.build({
        userId,
        category: categories[i % categories.length],
        name: `Balanced ${categories[i % categories.length]} ${i}`,
      });
    });
  }
}

export const garmentFactory = new GarmentFactory();
```

### Usage examples

```ts
// Default garment
const garment = garmentFactory.build({ userId: 'user-1' });

// Specific category
const top = garmentFactory.top({ userId: 'user-1', color: 'blue' });

// Favored bottom
const favBottom = garmentFactory.favorited().bottom({ userId: 'user-1' });

// 10 processing garments
const processing = garmentFactory.processing().buildMany(10, { userId: 'user-1' });

// Balanced wardrobe with 15 garments
const wardrobe = garmentFactory.createBalancedSet('user-1', 15);
```

## 4. Outfit Factory

```ts
// test/factories/outfit.factory.ts
import { faker } from '@faker-js/faker';
import { BaseFactory } from './base.factory';
import { Garment } from './garment.factory';

export type OutfitSeason = 'spring' | 'summer' | 'autumn' | 'winter' | 'all';
export type OutfitStyle = 'casual' | 'formal' | 'sporty' | 'bohemian' | 'minimalist' | 'vintage' | 'edgy';
export type OutfitOccasion = 'everyday' | 'work' | 'party' | 'wedding' | 'beach' | 'sport' | 'date';

export interface Outfit {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  season: OutfitSeason;
  style: OutfitStyle;
  occasion: OutfitOccasion;
  garments: Garment[];
  garmentIds: string[];
  imageUrl: string | null;
  isPublic: boolean;
  isAiGenerated: boolean;
  aiScore: number | null;
  timesWorn: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class OutfitFactory extends BaseFactory<Outfit> {
  define(): Outfit {
    const garmentIds = Array.from({ length: 3 }, () => faker.string.uuid());

    return {
      id: faker.string.uuid(),
      userId: faker.string.uuid(),
      name: faker.lorem.words({ min: 2, max: 4 }).replace(/^./, (c) => c.toUpperCase()),
      description: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.7 }) ?? null,
      season: faker.helpers.arrayElement<OutfitSeason>(['spring', 'summer', 'autumn', 'winter', 'all']),
      style: faker.helpers.arrayElement<OutfitStyle>(['casual', 'formal', 'sporty', 'minimalist']),
      occasion: faker.helpers.arrayElement<OutfitOccasion>(['everyday', 'work', 'party', 'date']),
      garments: [],
      garmentIds,
      imageUrl: faker.helpers.maybe(() => faker.image.urlPicsumPhotos(), { probability: 0.5 }) ?? null,
      isPublic: faker.datatype.boolean(0.3),
      isAiGenerated: faker.datatype.boolean(0.2),
      aiScore: faker.helpers.maybe(() =>
        faker.number.float({ min: 0.5, max: 1.0, fractionDigits: 2 })
      , { probability: 0.2 }) ?? null,
      timesWorn: faker.number.int({ min: 0, max: 20 }),
      tags: faker.helpers.multiple(() => faker.lorem.word(), { count: { min: 0, max: 3 } }),
      createdAt: faker.date.past({ years: 1 }),
      updatedAt: faker.date.recent(),
    };
  }

  withGarments(garments: Garment[]): this {
    this.define = () => ({
      ...this.define(),
      garments,
      garmentIds: garments.map(g => g.id),
    });
    return this;
  }

  withGarmentCount(count: number): this {
    const garmentIds = Array.from({ length: count }, () => faker.string.uuid());
    this.define = () => ({
      ...this.define(),
      garmentIds,
    });
    return this;
  }

  public(): this {
    this.define = () => ({
      ...this.define(),
      isPublic: true,
    });
    return this;
  }

  aiGenerated(score: number = 0.85): this {
    this.define = () => ({
      ...this.define(),
      isAiGenerated: true,
      aiScore: score,
    });
    return this;
  }

  forSeason(season: OutfitSeason): this {
    this.define = () => ({
      ...this.define(),
      season,
    });
    return this;
  }

  withStyle(style: OutfitStyle): this {
    this.define = () => ({
      ...this.define(),
      style,
    });
    return this;
  }

  forOccasion(occasion: OutfitOccasion): this {
    this.define = () => ({
      ...this.define(),
      occasion,
    });
    return this;
  }
}

export const outfitFactory = new OutfitFactory();
```

### Usage examples

```ts
// Default outfit
const outfit = outfitFactory.build({ userId: 'user-1' });

// Summer casual outfit with specific garments
const summerOutfit = outfitFactory
  .forSeason('summer')
  .withStyle('casual')
  .build({
    userId: 'user-1',
    garments: [shirt, shorts, sandals],
  });

// AI-generated outfit for winter
const aiOutfit = outfitFactory
  .aiGenerated(0.92)
  .forSeason('winter')
  .build({ userId: 'user-1' });

// 5 formal outfits
const formalOutfits = outfitFactory
  .withStyle('formal')
  .buildMany(5, { userId: 'user-1' });
```

## 5. Avatar Factory

```ts
// test/factories/avatar.factory.ts
import { faker } from '@faker-js/faker';
import { BaseFactory } from './base.factory';

export type AvatarStatus = 'generating' | 'ready' | 'failed';
export type AvatarGender = 'male' | 'female' | 'neutral';

export interface AvatarMeasurement {
  height: { value: number; unit: 'cm'; confidence: number };
  shoulderWidth: { value: number; unit: 'cm'; confidence: number };
  chest: { value: number; unit: 'cm'; confidence: number };
  waist: { value: number; unit: 'cm'; confidence: number };
  hips: { value: number; unit: 'cm'; confidence: number };
  inseam: { value: number; unit: 'cm'; confidence: number };
  armLength: { value: number; unit: 'cm'; confidence: number };
  neck: { value: number; unit: 'cm'; confidence: number };
}

export interface AvatarVersion {
  id: string;
  url: string;
  thumbnailUrl: string;
  createdAt: Date;
  measurements: AvatarMeasurement;
}

export interface Avatar {
  id: string;
  userId: string;
  name: string;
  status: AvatarStatus;
  gender: AvatarGender;
  currentVersion: string | null;
  versions: AvatarVersion[];
  measurements: AvatarMeasurement | null;
  modelUrl: string | null;
  thumbnailUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class AvatarFactory extends BaseFactory<Avatar> {
  private generateMeasurements(): AvatarMeasurement {
    return {
      height: { value: faker.number.int({ min: 150, max: 200 }), unit: 'cm', confidence: faker.number.float({ min: 0.7, max: 0.99 }) },
      shoulderWidth: { value: faker.number.int({ min: 35, max: 55 }), unit: 'cm', confidence: faker.number.float({ min: 0.7, max: 0.99 }) },
      chest: { value: faker.number.int({ min: 80, max: 120 }), unit: 'cm', confidence: faker.number.float({ min: 0.7, max: 0.99 }) },
      waist: { value: faker.number.int({ min: 60, max: 100 }), unit: 'cm', confidence: faker.number.float({ min: 0.7, max: 0.99 }) },
      hips: { value: faker.number.int({ min: 80, max: 120 }), unit: 'cm', confidence: faker.number.float({ min: 0.7, max: 0.99 }) },
      inseam: { value: faker.number.int({ min: 65, max: 85 }), unit: 'cm', confidence: faker.number.float({ min: 0.7, max: 0.99 }) },
      armLength: { value: faker.number.int({ min: 50, max: 70 }), unit: 'cm', confidence: faker.number.float({ min: 0.7, max: 0.99 }) },
      neck: { value: faker.number.int({ min: 30, max: 45 }), unit: 'cm', confidence: faker.number.float({ min: 0.7, max: 0.99 }) },
    };
  }

  private generateVersion(): AvatarVersion {
    return {
      id: faker.string.uuid(),
      url: faker.image.urlPicsumPhotos(),
      thumbnailUrl: faker.image.urlPicsumPhotos(),
      createdAt: faker.date.recent({ days: 30 }),
      measurements: this.generateMeasurements(),
    };
  }

  define(): Avatar {
    const versions = [this.generateVersion()];

    return {
      id: faker.string.uuid(),
      userId: faker.string.uuid(),
      name: `${faker.person.firstName()}'s Avatar`,
      status: 'ready',
      gender: faker.helpers.arrayElement<AvatarGender>(['male', 'female', 'neutral']),
      currentVersion: versions[0].id,
      versions,
      measurements: versions[0].measurements,
      modelUrl: faker.image.urlPicsumPhotos(),
      thumbnailUrl: faker.image.urlPicsumPhotos(),
      createdAt: faker.date.past({ years: 1 }),
      updatedAt: faker.date.recent(),
    };
  }

  generating(): this {
    this.define = () => ({
      ...this.define(),
      status: 'generating',
      currentVersion: null,
      measurements: null,
      modelUrl: null,
      thumbnailUrl: null,
      versions: [],
    });
    return this;
  }

  failed(): this {
    this.define = () => ({
      ...this.define(),
      status: 'failed',
      currentVersion: null,
      measurements: null,
      modelUrl: null,
      thumbnailUrl: null,
    });
    return this;
  }

  withMultipleVersions(count: number): this {
    const versions = Array.from({ length: count }, () => this.generateVersion());
    this.define = () => ({
      ...this.define(),
      versions,
      currentVersion: versions[count - 1].id,
      measurements: versions[count - 1].measurements,
    });
    return this;
  }

  withGender(gender: AvatarGender): this {
    this.define = () => ({
      ...this.define(),
      gender,
    });
    return this;
  }

  withSpecificMeasurements(measurements: Partial<AvatarMeasurement>): this {
    const base = this.define();
    const currentMeasurements = base.measurements ?? this.generateMeasurements();

    return {
      ...base,
      measurements: { ...currentMeasurements, ...measurements },
      versions: base.versions.map(v => ({
        ...v,
        measurements: { ...v.measurements, ...measurements },
      })),
    };
  }
}

export const avatarFactory = new AvatarFactory();
```

### Usage examples

```ts
// Ready avatar
const avatar = avatarFactory.build({ userId: 'user-1' });

// Avatar being generated
const generating = avatarFactory.generating().build({ userId: 'user-1' });

// Avatar with 5 versions
const multiVersion = avatarFactory.withMultipleVersions(5).build({ userId: 'user-1' });

// Female avatar with custom measurements
const female = avatarFactory
  .withGender('female')
  .withSpecificMeasurements({
    height: { value: 165, unit: 'cm', confidence: 0.95 },
    waist: { value: 68, unit: 'cm', confidence: 0.92 },
  })
  .build({ userId: 'user-1' });
```

## 6. Calendar Event Factory

```ts
// test/factories/calendar.factory.ts
import { faker } from '@faker-js/faker';
import { BaseFactory } from './base.factory';

export interface CalendarEvent {
  id: string;
  userId: string;
  outfitId: string;
  date: string; // YYYY-MM-DD
  note: string | null;
  isRecurring: boolean;
  recurringPattern: 'daily' | 'weekly' | 'monthly' | null;
  createdAt: Date;
  updatedAt: Date;
}

export class CalendarEventFactory extends BaseFactory<CalendarEvent> {
  define(): CalendarEvent {
    return {
      id: faker.string.uuid(),
      userId: faker.string.uuid(),
      outfitId: faker.string.uuid(),
      date: faker.date.future({ years: 1 }).toISOString().split('T')[0],
      note: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.5 }) ?? null,
      isRecurring: false,
      recurringPattern: null,
      createdAt: faker.date.past({ years: 1 }),
      updatedAt: faker.date.recent(),
    };
  }

  onDate(date: string): this {
    this.define = () => ({
      ...this.define(),
      date,
    });
    return this;
  }

  today(): this {
    return this.onDate(new Date().toISOString().split('T')[0]);
  }

  tomorrow(): this {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.onDate(tomorrow.toISOString().split('T')[0]);
  }

  recurring(pattern: 'daily' | 'weekly' | 'monthly'): this {
    this.define = () => ({
      ...this.define(),
      isRecurring: true,
      recurringPattern: pattern,
    });
    return this;
  }

  withOutfit(outfitId: string): this {
    this.define = () => ({
      ...this.define(),
      outfitId,
    });
    return this;
  }

  withNote(note: string): this {
    this.define = () => ({
      ...this.define(),
      note,
    });
    return this;
  }

  inMonth(year: number, month: number): this {
    const day = faker.number.int({ min: 1, max: 28 });
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return this.onDate(date);
  }
}

export const calendarEventFactory = new CalendarEventFactory();
```

### Usage examples

```ts
// Default event
const event = calendarEventFactory.build({ userId: 'user-1', outfitId: 'outfit-1' });

// Today's event with note
const today = calendarEventFactory
  .today()
  .withNote('Client meeting - dress formal')
  .build({ userId: 'user-1', outfitId: 'outfit-1' });

// Recurring weekly event
const weekly = calendarEventFactory
  .recurring('weekly')
  .build({ userId: 'user-1', outfitId: 'outfit-1' });

// 30 events in current month
const monthEvents = calendarEventFactory
  .inMonth(2024, 6)
  .buildMany(30, { userId: 'user-1' });
```

## 7. Notification Factory

```ts
// test/factories/notification.factory.ts
import { faker } from '@faker-js/faker';
import { BaseFactory } from './base.factory';

export type NotificationType =
  | 'outfit_reminder'
  | 'wardrobe_tip'
  | 'style_suggestion'
  | 'garment_processed'
  | 'avatar_ready'
  | 'recommendation_ready'
  | 'calendar_reminder'
  | 'system'
  | 'achievement';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  read: boolean;
  readAt: Date | null;
  actionUrl: string | null;
  actionLabel: string | null;
  imageUrl: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export class NotificationFactory extends BaseFactory<Notification> {
  define(): Notification {
    const type = faker.helpers.arrayElement<NotificationType>([
      'outfit_reminder', 'wardrobe_tip', 'style_suggestion',
      'garment_processed', 'avatar_ready', 'recommendation_ready',
      'calendar_reminder', 'system', 'achievement',
    ]);

    const messages: Record<NotificationType, string> = {
      outfit_reminder: 'Don\'t forget to plan your outfit for tomorrow!',
      wardrobe_tip: 'Try pairing your blue shirt with beige chinos for a fresh look.',
      style_suggestion: 'We found a new outfit combination you might like.',
      garment_processed: 'Your garment has been processed and is ready.',
      avatar_ready: 'Your 3D avatar has been generated successfully!',
      recommendation_ready: 'New outfit recommendations are ready for you.',
      calendar_reminder: 'You have an outfit scheduled for today.',
      system: 'Welcome to Closet Inteligente Digital!',
      achievement: 'Congratulations! You\'ve added 10 garments to your wardrobe.',
    };

    const actions: Partial<Record<NotificationType, { url: string; label: string }>> = {
      outfit_reminder: { url: '/calendar', label: 'View Calendar' },
      style_suggestion: { url: '/outfits/recommendations', label: 'See Recommendations' },
      garment_processed: { url: '/wardrobe', label: 'View Wardrobe' },
      avatar_ready: { url: '/avatar', label: 'View Avatar' },
      calendar_reminder: { url: '/calendar', label: 'Open Calendar' },
    };

    const action = actions[type];

    return {
      id: faker.string.uuid(),
      userId: faker.string.uuid(),
      type,
      title: type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      message: messages[type],
      priority: type === 'system' ? 'high' : 'normal',
      read: faker.datatype.boolean(0.3),
      readAt: null,
      actionUrl: action?.url ?? null,
      actionLabel: action?.label ?? null,
      imageUrl: null,
      metadata: {},
      createdAt: faker.date.recent({ days: 7 }),
    };
  }

  unread(): this {
    this.define = () => ({
      ...this.define(),
      read: false,
      readAt: null,
    });
    return this;
  }

  ofType(type: NotificationType): this {
    this.define = () => ({
      ...this.define(),
      type,
    });
    return this;
  }

  highPriority(): this {
    this.define = () => ({
      ...this.define(),
      priority: 'high',
    });
    return this;
  }

  urgent(): this {
    this.define = () => ({
      ...this.define(),
      priority: 'urgent',
    });
    return this;
  }

  withAction(url: string, label: string): this {
    this.define = () => ({
      ...this.define(),
      actionUrl: url,
      actionLabel: label,
    });
    return this;
  }

  olderThan(days: number): this {
    this.define = () => ({
      ...this.define(),
      createdAt: faker.date.past({ days }),
      read: true,
      readAt: faker.date.past({ days: days - 1 }),
    });
    return this;
  }
}

export const notificationFactory = new NotificationFactory();
```

### Usage examples

```ts
// Unread notification
const unread = notificationFactory.unread().build({ userId: 'user-1' });

// Specific type notifications
const reminder = notificationFactory
  .ofType('outfit_reminder')
  .highPriority()
  .build({ userId: 'user-1' });

// Bulk unread notifications
const notifications = notificationFactory
  .unread()
  .buildMany(5, { userId: 'user-1' });

// Old read notifications
const oldNotifs = notificationFactory
  .olderThan(14)
  .buildMany(3, { userId: 'user-1' });
```

## 8. Analytics Event Factory

```ts
// test/factories/analytics.factory.ts
import { faker } from '@faker-js/faker';
import { BaseFactory } from './base.factory';

export type AnalyticsEventType =
  | 'page_view'
  | 'garment_upload'
  | 'garment_view'
  | 'garment_delete'
  | 'outfit_create'
  | 'outfit_view'
  | 'recommendation_request'
  | 'recommendation_click'
  | 'avatar_generate'
  | 'avatar_view'
  | 'calendar_add'
  | 'notification_click'
  | 'search'
  | 'login'
  | 'register'
  | 'export_data';

export interface AnalyticsEvent {
  id: string;
  userId: string;
  event: AnalyticsEventType;
  properties: Record<string, unknown>;
  timestamp: Date;
  sessionId: string;
  userAgent: string;
  ipAddress: string;
  referrer: string | null;
  duration: number | null; // ms
}

export class AnalyticsEventFactory extends BaseFactory<AnalyticsEvent> {
  define(): AnalyticsEvent {
    return {
      id: faker.string.uuid(),
      userId: faker.string.uuid(),
      event: faker.helpers.arrayElement<AnalyticsEventType>([
        'page_view', 'garment_upload', 'garment_view', 'outfit_create',
      ]),
      properties: {},
      timestamp: faker.date.recent({ days: 30 }),
      sessionId: faker.string.alphanumeric(32),
      userAgent: faker.internet.userAgent(),
      ipAddress: faker.internet.ip(),
      referrer: faker.helpers.maybe(() => faker.internet.url(), { probability: 0.3 }) ?? null,
      duration: faker.helpers.maybe(() =>
        faker.number.int({ min: 100, max: 60000 })
      , { probability: 0.6 }) ?? null,
    };
  }

  ofType(event: AnalyticsEventType): this {
    this.define = () => ({
      ...this.define(),
      event,
    });
    return this;
  }

  withProperty(key: string, value: unknown): this {
    this.define = () => ({
      ...this.define(),
      properties: { ...this.define().properties, [key]: value },
    });
    return this;
  }

  today(): this {
    this.define = () => ({
      ...this.define(),
      timestamp: faker.date.recent({ days: 1 }),
    });
    return this;
  }

  thisWeek(): this {
    this.define = () => ({
      ...this.define(),
      timestamp: faker.date.recent({ days: 7 }),
    });
    return this;
  }

  thisMonth(): this {
    this.define = () => ({
      ...this.define(),
      timestamp: faker.date.recent({ days: 30 }),
    });
    return this;
  }
}

export const analyticsEventFactory = new AnalyticsEventFactory();
```

### Usage examples

```ts
// Page view event
const pageView = analyticsEventFactory
  .ofType('page_view')
  .withProperty('page', '/wardrobe')
  .build({ userId: 'user-1' });

// Recommendation request with properties
const recEvent = analyticsEventFactory
  .ofType('recommendation_request')
  .withProperty('season', 'summer')
  .withProperty('style', 'casual')
  .withProperty('garment_count', 15)
  .build({ userId: 'user-1' });

// 1000 events for performance testing
const events = analyticsEventFactory.thisMonth().buildMany(1000, { userId: 'user-1' });
```

## 9. Builder Pattern for Complex Entities

For extremely complex entities like a full user wardrobe with preferences and history, use the builder pattern:

```ts
// test/builders/wardrobe.builder.ts
import { faker } from '@faker-js/faker';
import { User, userFactory } from '../factories/user.factory';
import { Garment, garmentFactory } from '../factories/garment.factory';
import { Outfit, outfitFactory } from '../factories/outfit.factory';
import { CalendarEvent, calendarEventFactory } from '../factories/calendar.factory';

export interface WardrobeState {
  user: User;
  garments: Garment[];
  outfits: Outfit[];
  calendarEvents: CalendarEvent[];
}

export class WardrobeBuilder {
  private userOverrides: Partial<User> = {};
  private garmentCount: number = 10;
  private outfitCount: number = 3;
  private calendarEventCount: number = 5;
  private includeProcessing: boolean = false;
  private includeArchived: boolean = false;
  private categoryDistribution: 'balanced' | 'random' = 'random';

  withUser(overrides: Partial<User>): this {
    this.userOverrides = overrides;
    return this;
  }

  withGarments(count: number): this {
    this.garmentCount = count;
    return this;
  }

  withOutfits(count: number): this {
    this.outfitCount = count;
    return this;
  }

  withCalendarEvents(count: number): this {
    this.calendarEventCount = count;
    return this;
  }

  withProcessingGarments(): this {
    this.includeProcessing = true;
    return this;
  }

  withArchivedGarments(): this {
    this.includeArchived = true;
    return this;
  }

  withBalancedCategories(): this {
    this.categoryDistribution = 'balanced';
    return this;
  }

  build(): WardrobeState {
    const user = userFactory.build(this.userOverrides);
    const userId = user.id;

    // Build garments
    let garments: Garment[];

    if (this.categoryDistribution === 'balanced') {
      garments = garmentFactory.createBalancedSet(userId, this.garmentCount);
    } else {
      garments = garmentFactory.buildMany(this.garmentCount, { userId });
    }

    // Add processing garments if requested
    if (this.includeProcessing) {
      garments.push(garmentFactory.processing().build({ userId }));
    }

    // Add archived garments if requested
    if (this.includeArchived) {
      garments.push(garmentFactory.archived().build({ userId }));
    }

    // Build outfits referencing some garments
    const garmentSubset = faker.helpers.arrayElements(garments, { min: 2, max: 4 });
    const outfits = outfitFactory.buildMany(this.outfitCount, {
      userId,
      garments: garmentSubset,
      garmentIds: garmentSubset.map(g => g.id),
    });

    // Build calendar events
    const calendarEvents = calendarEventFactory.buildMany(this.calendarEventCount, {
      userId,
      outfitId: outfits[0]?.id ?? faker.string.uuid(),
    });

    return { user, garments, outfits, calendarEvents };
  }
}
```

### Usage

```ts
const wardrobe = new WardrobeBuilder()
  .withUser({ email: 'test@example.com', name: 'Test User' })
  .withGarments(20)
  .withOutfits(5)
  .withCalendarEvents(10)
  .withBalancedCategories()
  .withProcessingGarments()
  .build();

// Access generated data
console.log(wardrobe.user);
console.log(wardrobe.garments.length); // 21 (20 + 1 processing)
console.log(wardrobe.outfits.length);  // 5
```

## 10. Seeded Data for Deterministic Tests

```ts
// test/seeds/deterministic.ts
import { faker } from '@faker-js/faker';

/**
 * Initialize faker with a fixed seed for deterministic test data.
 */
export function seedTestData(seed: number = 42): void {
  faker.seed(seed);
}

/**
 * Reset faker to use random seeds.
 */
export function resetFaker(): void {
  faker.seed();
}

/**
 * Run a callback with a deterministic faker seed.
 */
export function withDeterministicData<T>(seed: number, fn: () => T): T {
  faker.seed(seed);
  const result = fn();
  faker.seed();
  return result;
}

// Pre-seeded factories for common test scenarios
export const deterministicData = {
  user: () => {
    faker.seed(100);
    return userFactory.build();
  },
  wardrobe: (count: number = 5) => {
    faker.seed(200);
    return garmentFactory.buildMany(count, { userId: 'deterministic-user' });
  },
  outfits: (count: number = 3) => {
    faker.seed(300);
    return outfitFactory.buildMany(count, { userId: 'deterministic-user' });
  },
};

// Reset after use
```

## 11. Python Factory Equivalents

```python
# tests/factories/user_factory.py
from dataclasses import dataclass, field
from faker import Faker
from typing import Optional
import uuid

fake = Faker()


@dataclass
class User:
    id: str
    email: str
    password_hash: str
    name: str
    role: str
    is_active: bool
    created_at: str


class UserFactory:
    def build(self, **overrides) -> User:
        data = {
            "id": str(uuid.uuid4()),
            "email": fake.email(),
            "password_hash": f"$2b$10${fake.password(length=53)}",
            "name": fake.name(),
            "role": "user",
            "is_active": True,
            "created_at": fake.iso8601(),
        }
        data.update(overrides)
        return User(**data)

    def build_many(self, count: int, **overrides) -> list[User]:
        return [self.build(**overrides) for _ in range(count)]

    def admin(self, **overrides) -> User:
        return self.build(role="admin", **overrides)

    def inactive(self, **overrides) -> User:
        return self.build(is_active=False, **overrides)
```

```python
# tests/factories/garment_factory.py
from dataclasses import dataclass, field
from faker import Faker
from typing import Optional
import random
import uuid

fake = Faker()


@dataclass
class Garment:
    id: str
    user_id: str
    name: str
    category: str
    color: str
    brand: Optional[str]
    size: Optional[str]
    status: str
    favorite: bool
    times_worn: int
    image_url: str


class GarmentFactory:
    CATEGORIES = ["top", "bottom", "footwear", "accessory", "outerwear"]
    COLORS = ["black", "white", "blue", "red", "green", "gray"]
    SIZES = ["XS", "S", "M", "L", "XL", "XXL"]

    def build(self, **overrides) -> Garment:
        data = {
            "id": str(uuid.uuid4()),
            "user_id": str(uuid.uuid4()),
            "name": f"{fake.word()} {fake.word()}",
            "category": random.choice(self.CATEGORIES),
            "color": random.choice(self.COLORS),
            "brand": fake.company() if random.random() > 0.2 else None,
            "size": random.choice(self.SIZES) if random.random() > 0.2 else None,
            "status": "active",
            "favorite": random.random() < 0.2,
            "times_worn": random.randint(0, 50),
            "image_url": fake.image_url(),
        }
        data.update(overrides)
        return Garment(**data)

    def build_many(self, count: int, **overrides) -> list[Garment]:
        return [self.build(**overrides) for _ in range(count)]

    def top(self, **overrides) -> Garment:
        return self.build(category="top", **overrides)

    def bottom(self, **overrides) -> Garment:
        return self.build(category="bottom", **overrides)

    def favorited(self, **overrides) -> Garment:
        return self.build(favorite=True, **overrides)

    def processing(self, **overrides) -> Garment:
        return self.build(status="processing", **overrides)
```

```python
# tests/factories/image_factory.py
import numpy as np
from typing import Optional, Tuple


class ImageFactory:
    """Factory for generating synthetic test images."""

    @staticmethod
    def solid_color(
        width: int = 100,
        height: int = 100,
        color: Tuple[int, int, int] = (128, 128, 128),
    ) -> np.ndarray:
        """Generate a solid color image."""
        img = np.ones((height, width, 3), dtype=np.uint8)
        img[:, :] = color
        return img

    @staticmethod
    def gradient(
        width: int = 256,
        height: int = 256,
    ) -> np.ndarray:
        """Generate a gradient image."""
        x = np.arange(width)
        y = np.arange(height)
        xx, yy = np.meshgrid(x, y)
        r = (xx / width * 255).astype(np.uint8)
        g = (yy / height * 255).astype(np.uint8)
        b = ((xx + yy) / (width + height) * 255).astype(np.uint8)
        return np.stack([r, g, b], axis=-1)

    @staticmethod
    def noise(
        width: int = 100,
        height: int = 100,
        mean: float = 128,
        std: float = 50,
    ) -> np.ndarray:
        """Generate random noise image."""
        return np.random.normal(mean, std, (height, width, 3)).clip(0, 255).astype(np.uint8)

    @staticmethod
    def checkerboard(
        width: int = 100,
        height: int = 100,
        square_size: int = 10,
    ) -> np.ndarray:
        """Generate checkerboard pattern."""
        img = np.zeros((height, width, 3), dtype=np.uint8)
        for y in range(0, height, square_size * 2):
            for x in range(0, width, square_size * 2):
                img[y:y + square_size, x:x + square_size] = [255, 255, 255]
        for y in range(square_size, height, square_size * 2):
            for x in range(square_size, width, square_size * 2):
                img[y:y + square_size, x:x + square_size] = [255, 255, 255]
        return img

    @staticmethod
    def garment_silhouette(
        width: int = 200,
        height: int = 300,
    ) -> np.ndarray:
        """Generate a simple garment silhouette."""
        img = np.ones((height, width, 3), dtype=np.uint8) * 240
        # Simple shirt shape
        cv2.rectangle(img, (30, 40), (width - 30, height - 40), (70, 130, 180), -1)
        return img
```

## 12. Faker Integration Configuration

```ts
// test/factories/faker.config.ts
import { faker } from '@faker-js/faker';

// Configure faker defaults
faker.setLocale('en');

// Custom providers for domain-specific data
const customFaker = {
  garmentName: (): string => {
    const adjectives = ['Striped', 'Floral', 'Plain', 'Checked', 'Patterned', 'Knitted', 'Sleeveless'];
    const types = ['T-Shirt', 'Blouse', 'Jacket', 'Sweater', 'Hoodie', 'Cardigan', 'Polo'];
    return `${faker.helpers.arrayElement(adjectives)} ${faker.helpers.arrayElement(types)}`;
  },

  colorName: (): string => {
    return faker.helpers.arrayElement([
      'Midnight Blue', 'Scarlet Red', 'Forest Green', 'Ivory White',
      'Jet Black', 'Dusty Rose', 'Ochre Yellow', 'Lavender Purple',
    ]);
  },

  brand: (): string => {
    return faker.helpers.arrayElement([
      'Zara', 'H&M', 'Nike', 'Adidas', 'Levi\'s', 'Uniqlo',
      'Ralph Lauren', 'Tommy Hilfiger', 'Calvin Klein', 'Puma',
    ]);
  },

  size: (): string => {
    return faker.helpers.arrayElement(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']);
  },

  material: (): string => {
    return faker.helpers.arrayElement([
      'Cotton', 'Polyester', 'Wool', 'Denim', 'Silk', 'Linen',
      'Leather', 'Nylon', 'Rayon', 'Spandex', 'Cashmere', 'Lace',
    ]);
  },

  outfitName: (): string => {
    const prefixes = ['Summer', 'Winter', 'Casual', 'Formal', 'Beach', 'Office', 'Date Night'];
    const suffixes = ['Look', 'Vibe', 'Style', 'Ensemble', 'Combo', 'Outfit', 'Getup'];
    return `${faker.helpers.arrayElement(prefixes)} ${faker.helpers.arrayElement(suffixes)}`;
  },
};

export { customFaker };
```

## 13. Entity Relationship Matrix

| Entity            | Depends On | Optional Deps     | Unique Constraints          |
| ----------------- | ---------- | ----------------- | --------------------------- |
| User              | —          | —                 | email                       |
| Garment           | User       | —                 | —                           |
| Outfit            | User       | Garments          | —                           |
| Avatar            | User       | —                 | 1 per user                  |
| CalendarEvent     | User       | Outfit            | user_id + date + outfit_id  |
| Notification      | User       | —                 | —                           |
| AnalyticsEvent    | User       | —                 | —                           |

## 14. Factory Usage Guidelines

### Do's
- Use factories in unit tests, integration tests, and E2E seed scripts.
- Override only the fields relevant to the test scenario.
- Use `buildMany` for tests that need collections.
- Use builders for complex aggregate scenarios.
- Call `faker.seed()` for deterministic snapshots or golden-file tests.
- Use `withDeterministicData` when comparing output against expected values.

### Don'ts
- Do NOT use factories to produce data that matches a specific real user's data.
- Do NOT use factories in production code.
- Do NOT depend on factory-specific methods in assertions (change the assertion, not the factory).
- Do NOT nest factory calls inside entity definitions (use builder pattern instead).

### Performance considerations

```ts
// ❌ Avoid: Creating factories inside hot paths
for (const item of largeArray) {
  const garment = garmentFactory.build(); // Expensive loop
}

// ✅ Prefer: Build all at once
const garments = garmentFactory.buildMany(largeArray.length);
```

## 15. Factory Test Coverage

Every factory must have a corresponding test:

```ts
// test/factories/__tests__/user.factory.spec.ts
import { userFactory } from '../user.factory';

describe('UserFactory', () => {
  it('should build a default user', () => {
    const user = userFactory.build();
    expect(user.id).toBeDefined();
    expect(user.email).toContain('@');
    expect(user.isActive).toBe(true);
    expect(user.role).toBe('user');
  });

  it('should build an admin user', () => {
    const admin = userFactory.admin().build();
    expect(admin.role).toBe('admin');
  });

  it('should build an inactive user', () => {
    const inactive = userFactory.inactive().build();
    expect(inactive.isActive).toBe(false);
  });

  it('should override fields', () => {
    const user = userFactory.build({ email: 'override@test.com' });
    expect(user.email).toBe('override@test.com');
  });

  it('should build multiple users', () => {
    const users = userFactory.buildMany(5);
    expect(users).toHaveLength(5);
  });

  it('should enforce uniqueness via overrides', () => {
    const email = 'unique@test.com';
    const users = userFactory.buildMany(3, { email });
    expect(users.every(u => u.email === email)).toBe(true);
  });
});
```
