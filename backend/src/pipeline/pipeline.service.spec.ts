import { Test, TestingModule } from '@nestjs/testing';
import { PipelineService } from './pipeline.service';
import { QueueService } from '../queue/queue.service';
import { RedisService } from '../redis/redis.service';
import { AI_PIPELINE_ADAPTER, AIPipelineAdapter } from './ai-pipeline.adapter';
import { DATABASE_POOL } from '../database/database.module';

describe('PipelineService', () => {
  let service: PipelineService;
  const mockPool = { query: jest.fn() };
  const mockRedis = { get: jest.fn(), set: jest.fn() };
  const mockQueue = {
    addJob: jest.fn(),
    processJobs: jest.fn(),
  };
  const mockAdapter: AIPipelineAdapter = {
    processStep: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PipelineService,
        { provide: QueueService, useValue: mockQueue },
        { provide: RedisService, useValue: mockRedis },
        { provide: DATABASE_POOL, useValue: mockPool },
        { provide: AI_PIPELINE_ADAPTER, useValue: mockAdapter },
      ],
    }).compile();

    service = module.get<PipelineService>(PipelineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should start pipeline and enqueue job', async () => {
    mockRedis.set.mockResolvedValue('OK');
    mockQueue.addJob.mockResolvedValue('job-1');

    await service.startPipeline('upload-1', 'garment-1', 'user-1', 'http://example.com/img.png');

    expect(mockRedis.set).toHaveBeenCalledTimes(2);
    expect(mockQueue.addJob).toHaveBeenCalledWith('pipeline', { uploadId: 'upload-1' });
  });

  it('should return not_started status for unknown garment', async () => {
    mockRedis.get.mockResolvedValue(null);
    mockPool.query.mockResolvedValue({ rows: [{ image_url: null }] });

    const result = await service.getPipelineStatus('unknown-id');

    expect(result).toEqual({
      status: 'not_started',
      progress: 0,
      steps: expect.any(Array),
      created_at: null,
      updated_at: null,
    });
  });

  it('should return completed status for garment with image but no pipeline', async () => {
    mockRedis.get.mockResolvedValue(null);
    mockPool.query.mockResolvedValue({ rows: [{ image_url: 'http://example.com/img.png' }] });

    const result = await service.getPipelineStatus('garment-1');

    expect(result).toEqual({
      status: 'completed',
      progress: 100,
      steps: expect.any(Array),
      created_at: null,
      updated_at: null,
    });
  });
});
