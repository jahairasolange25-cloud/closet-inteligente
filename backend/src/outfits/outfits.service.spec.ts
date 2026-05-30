import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { OutfitsService } from './outfits.service';
import { DATABASE_POOL } from '../database/database.module';

const mockPool = { query: jest.fn() };

describe('OutfitsService', () => {
  let service: OutfitsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OutfitsService,
        { provide: DATABASE_POOL, useValue: mockPool },
      ],
    }).compile();

    service = module.get<OutfitsService>(OutfitsService);
    jest.clearAllMocks();
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('throws NotFoundException when outfit not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await expect(service.findOne('user-1', 'outfit-uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('recommend', () => {
    it('returns empty suggestions when no garments exist', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await service.recommend('user-1', { exclude_garment_ids: [] });

      expect(result.suggestions).toHaveLength(0);
      expect(result.meta.warning).toBeTruthy();
    });

    it('returns suggestions when upper and lower garments are available', async () => {
      const garments = [
        { id: 'g1', name: 'Blue Shirt', type: 'shirt', color: 'blue', usage_count: 0, last_used_at: null },
        { id: 'g2', name: 'Black Pants', type: 'pants', color: 'black', usage_count: 0, last_used_at: null },
      ];
      mockPool.query.mockResolvedValue({ rows: garments });

      const result = await service.recommend('user-1', {});

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions[0]).toHaveProperty('garments');
      expect(result.suggestions[0]).toHaveProperty('reason');
    });
  });
});
