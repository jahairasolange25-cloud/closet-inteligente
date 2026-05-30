export type GarmentCategory =
  | 'shirts' | 'blouses' | 'tshirts' | 'sweaters' | 'hoodies'
  | 'jackets' | 'coats' | 'sportswear' | 'formalwear'
  | 'pants' | 'jeans' | 'shorts' | 'skirts'
  | 'dresses' | 'jumpsuits' | 'suits'
  | 'sneakers' | 'boots' | 'heels' | 'sandals' | 'flats'
  | 'hats' | 'scarves' | 'belts' | 'bags' | 'jewelry' | 'sunglasses'
  | 'underwear' | 'socks' | 'swimwear' | 'other';

export type GarmentState = 'available' | 'washing' | 'damaged' | 'storage' | 'for_sale' | 'donated';

export type PipelineStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Garment {
  id: string;
  userId: string;
  name: string;
  category: GarmentCategory;
  color: string | null;
  brand: string | null;
  size: string | null;
  material: string[] | null;
  tags: string[] | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  state: GarmentState;
  pipelineStatus: PipelineStatus;
  isFavorite: boolean;
  lastUsedAt: string | null;
  usageCount: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGarmentDto {
  name: string;
  category: GarmentCategory;
  color?: string;
  brand?: string;
  size?: string;
  material?: string[];
  tags?: string[];
  notes?: string;
}

export interface UpdateGarmentDto extends Partial<CreateGarmentDto> {
  state?: GarmentState;
  isFavorite?: boolean;
}

export interface GarmentFilters {
  category?: GarmentCategory;
  state?: GarmentState;
  color?: string;
  search?: string;
  isFavorite?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedGarments {
  data: Garment[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
