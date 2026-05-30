import type { Garment } from './garment';

export type OutfitType = 'casual' | 'formal' | 'office' | 'party';
export type OutfitOccasion = 'work' | 'casual' | 'formal' | 'sport' | 'evening' | 'travel' | 'other';

export interface Outfit {
  id: string;
  userId: string;
  name: string;
  type: OutfitType;
  occasion: OutfitOccasion | null;
  season: string | null;
  notes: string | null;
  isFavorite: boolean;
  garments: Garment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateOutfitDto {
  name: string;
  type: OutfitType;
  garment_ids: string[];
}

export interface UpdateOutfitDto extends Partial<CreateOutfitDto> {
  isFavorite?: boolean;
}

export interface OutfitFilters {
  type?: OutfitType;
  occasion?: OutfitOccasion;
  season?: string;
  isFavorite?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface RecommendOutfitDto {
  occasion?: OutfitOccasion;
  season?: string;
  count?: number;
  excludeIds?: string[];
}

export interface OutfitRecommendation {
  outfit: Outfit;
  score: number;
  reason: string;
}
