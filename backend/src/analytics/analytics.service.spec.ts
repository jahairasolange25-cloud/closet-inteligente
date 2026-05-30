import { Test, TestingModule } from '@nestjs/testing';
import { DATABASE_POOL } from '../database/database.module';
import { AnalyticsService } from './analytics.service';

const mockPool = { query: jest.fn() };

const countRow = (n: number) => ({ rows: [{ count: String(n) }] });

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: DATABASE_POOL, useValue: mockPool },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    jest.clearAllMocks();
  });

  describe('getDashboardAnalytics', () => {
    it('returns dashboard summary with correct structure', async () => {
      // summary queries (parallel Promise.all of 4)
      mockPool.query
        .mockResolvedValueOnce(countRow(10))                         // gTotal
        .mockResolvedValueOnce(countRow(3))                          // oTotal
        .mockResolvedValueOnce(countRow(1))                          // aTotal
        .mockResolvedValueOnce(countRow(5))                          // sSched
        .mockResolvedValueOnce({ rows: [] })                         // activity
        // trend queries (4 parallel)
        .mockResolvedValueOnce(countRow(2))                          // gCurr
        .mockResolvedValueOnce(countRow(1))                          // gPrev
        .mockResolvedValueOnce(countRow(1))                          // oCurr
        .mockResolvedValueOnce(countRow(0))                          // oPrev
        // week stats
        .mockResolvedValueOnce({ rows: [{ g: '2', o: '1' }] });

      const result = await service.getDashboardAnalytics('u-1', { period: '30d' });

      expect(result.summary.total_garments).toBe(10);
      expect(result.summary.total_outfits).toBe(3);
      expect(result.summary.total_avatars).toBe(1);
      expect(result.trends).toHaveProperty('garments_trend');
      expect(result.quick_stats).toHaveProperty('garments_this_week');
    });

    it('returns trend "up" when current period exceeds prior period', async () => {
      mockPool.query
        .mockResolvedValueOnce(countRow(5))
        .mockResolvedValueOnce(countRow(2))
        .mockResolvedValueOnce(countRow(2))
        .mockResolvedValueOnce(countRow(1))
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce(countRow(4))   // gCurr
        .mockResolvedValueOnce(countRow(1))   // gPrev
        .mockResolvedValueOnce(countRow(2))   // oCurr
        .mockResolvedValueOnce(countRow(1))   // oPrev
        .mockResolvedValueOnce({ rows: [{ g: '4', o: '2' }] });

      const result = await service.getDashboardAnalytics('u-1', {});
      expect(result.trends.garments_trend).toBe('up');
    });
  });

  describe('getGarmentAnalytics', () => {
    it('returns garment breakdown', async () => {
      mockPool.query
        .mockResolvedValueOnce(countRow(8))       // total
        .mockResolvedValueOnce({ rows: [] })       // by type
        .mockResolvedValueOnce({ rows: [] })       // by state
        .mockResolvedValueOnce({ rows: [] })       // most used
        .mockResolvedValueOnce({ rows: [] })       // least used
        .mockResolvedValueOnce(countRow(3))        // never used
        .mockResolvedValueOnce({ rows: [{ avg: '2.5' }] }); // avg

      const result = await service.getGarmentAnalytics('u-1');
      expect(result.total_garments).toBe(8);
      expect(result.never_used).toBe(3);
      expect(result.avg_usage_per_garment).toBe(2.5);
    });
  });
});
