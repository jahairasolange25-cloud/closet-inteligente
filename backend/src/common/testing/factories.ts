/**
 * Reusable test factories for backend unit and integration tests.
 * Generates minimal valid objects — override any field as needed.
 */

import { randomUUID } from 'crypto';

// ─── User ─────────────────────────────────────────────────────────────────

export interface UserFactory {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  created_at: Date;
  updated_at: Date;
}

export function createUser(overrides: Partial<UserFactory> = {}): UserFactory {
  return {
    id: randomUUID(),
    email: `user-${randomUUID().slice(0, 8)}@test.com`,
    name: 'Test User',
    avatar: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

// ─── Garment ──────────────────────────────────────────────────────────────

export interface GarmentFactory {
  id: string;
  user_id: string;
  name: string;
  type: string;
  state: string;
  brand: string | null;
  size: string | null;
  color: string | null;
  season: string | null;
  usage_count: number;
  last_used_at: Date | null;
  image_url: string | null;
  thumbnail_url: string | null;
  is_favorite: boolean;
  pipeline_status: 'pending' | 'processing' | 'completed' | 'failed';
  notes: string | null;
  tags: string[];
  material: string[];
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export function createGarment(overrides: Partial<GarmentFactory> = {}): GarmentFactory {
  return {
    id: randomUUID(),
    user_id: randomUUID(),
    name: 'Test Garment',
    type: 'tops',
    state: 'available',
    brand: null,
    size: null,
    color: null,
    season: null,
    usage_count: 0,
    last_used_at: null,
    image_url: null,
    thumbnail_url: null,
    is_favorite: false,
    pipeline_status: 'pending',
    notes: null,
    tags: [],
    material: [],
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  };
}

// ─── Outfit ───────────────────────────────────────────────────────────────

export interface OutfitFactory {
  id: string;
  user_id: string;
  name: string;
  type: string;
  is_favorite: boolean;
  garment_ids: string[];
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export function createOutfit(overrides: Partial<OutfitFactory> = {}): OutfitFactory {
  return {
    id: randomUUID(),
    user_id: randomUUID(),
    name: 'Test Outfit',
    type: 'casual',
    is_favorite: false,
    garment_ids: [],
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  };
}

// ─── Auth Tokens ──────────────────────────────────────────────────────────

export function createAuthTokens() {
  return {
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
  };
}
