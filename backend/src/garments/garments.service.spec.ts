import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GarmentsService } from './garments.service';
import { DATABASE_POOL } from '../database/database.module';
import { StorageService } from '../storage/storage.service';
import { RedisService } from '../redis/redis.service';
import { PipelineService } from '../pipeline/pipeline.service';

const mockPool = { query: jest.fn() };
const mockStorage = { uploadTemp: jest.fn(), upload: jest.fn(), delete: jest.fn() };
const mockRedis = { set: jest.fn(), get: jest.fn() };
const mockPipeline = { startPipeline: jest.fn(), getPipelineStatus: jest.fn() };

describe('GarmentsService', () => {
  let service: GarmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GarmentsService,
        { provide: DATABASE_POOL, useValue: mockPool },
        { provide: StorageService, useValue: mockStorage },
        { provide: RedisService, useValue: mockRedis },
        { provide: PipelineService, useValue: mockPipeline },
      ],
    }).compile();

    service = module.get<GarmentsService>(GarmentsService);
    jest.clearAllMocks();
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('throws NotFoundException when garment not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await expect(service.findOne('user-1', 'garment-uuid')).rejects.toThrow(NotFoundException);
    });

    it('returns camelCase garment response when found', async () => {
      const row = { id: 'garment-uuid', user_id: 'user-1', name: 'Blue Shirt', type: 'shirts', state: 'available', usage_count: 0, is_favorite: false, pipeline_status: 'pending', tags: [], material: [] };
      mockPool.query.mockResolvedValue({ rows: [row] });

      const result = await service.findOne('user-1', 'garment-uuid');
      expect(result.id).toBe('garment-uuid');
      expect(result.userId).toBe('user-1');
      expect(result.category).toBe('shirts');
      expect(result.isFavorite).toBe(false);
    });
  });

  describe('softDelete', () => {
    it('throws NotFoundException when garment not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await expect(service.softDelete('user-1', 'garment-uuid')).rejects.toThrow(NotFoundException);
    });
  });
});
