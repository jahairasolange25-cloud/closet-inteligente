import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';
import { QueueService } from './queue/queue.service';

// Stub QueueService prevents real BullMQ Worker + Redis connections during tests
class QueueServiceStub {
  async addJob(): Promise<string> { return 'stub-job-id'; }
  processJobs(): void {}
  async onModuleDestroy(): Promise<void> {}
}

describe('AppModule bootstrap', () => {
  let module: TestingModule;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-min-32-characters-long-ok';
    process.env.DB_HOST = 'localhost';
    process.env.DB_NAME = 'closet';
    process.env.DB_USER = 'closet';
    process.env.DB_PASSWORD = 'closet_secret';
    process.env.REDIS_HOST = 'localhost';
    process.env.REDIS_PORT = '6379';
    process.env.NODE_ENV = 'test';
  });

  it('compiles the AppModule without errors', async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(QueueService)
      .useClass(QueueServiceStub)
      .compile();

    expect(module).toBeDefined();
    await module.close();
  });
});
