import { Test, TestingModule } from '@nestjs/testing';
import { HttpAIPipelineAdapter } from './http-ai-pipeline.adapter';

describe('HttpAIPipelineAdapter', () => {
  let adapter: HttpAIPipelineAdapter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HttpAIPipelineAdapter],
    }).compile();

    adapter = module.get<HttpAIPipelineAdapter>(HttpAIPipelineAdapter);
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  it('should throw on timeout when AI service is unreachable', async () => {
    const originalUrl = process.env.AI_SERVICE_URL;
    process.env.AI_SERVICE_URL = 'http://localhost:1';

    await expect(
      adapter.processStep('background_removal', 'test-id', 'http://example.com/img.png'),
    ).rejects.toThrow();

    process.env.AI_SERVICE_URL = originalUrl;
  }, 15000);

  it('should throw circuit breaker after repeated failures', async () => {
    const originalUrl = process.env.AI_SERVICE_URL;
    process.env.AI_SERVICE_URL = 'http://localhost:1';

    for (let i = 0; i < 5; i++) {
      await expect(
        adapter.processStep('background_removal', 'test-id', 'http://example.com/img.png'),
      ).rejects.toThrow();
    }

    await expect(
      adapter.processStep('background_removal', 'test-id', 'http://example.com/img.png'),
    ).rejects.toThrow('AI_SERVICE_CIRCUIT_OPEN');

    process.env.AI_SERVICE_URL = originalUrl;
  }, 30000);
});
