import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DATABASE_POOL } from '../database/database.module';
import { CalendarService } from './calendar.service';

const mockPool = {
  query: jest.fn(),
};

describe('CalendarService', () => {
  let service: CalendarService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalendarService,
        { provide: DATABASE_POOL, useValue: mockPool },
      ],
    }).compile();

    service = module.get<CalendarService>(CalendarService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates a calendar event', async () => {
      const row = { id: 'ev-1', user_id: 'u-1', event_date: '2026-06-01', outfit_id: null, title: null, notes: null, is_worn: false, created_at: new Date(), updated_at: new Date() };
      mockPool.query.mockResolvedValue({ rows: [row] });

      const result = await service.create('u-1', { event_date: '2026-06-01' });
      expect(result.id).toBe('ev-1');
    });

    it('throws BadRequestException when outfit does not belong to user', async () => {
      // outfit lookup returns empty
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      await expect(service.create('u-1', { event_date: '2026-06-01', outfit_id: 'o-1' })).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException on unique constraint violation', async () => {
      const pgError = Object.assign(new Error('unique_violation'), { code: '23505' });
      mockPool.query.mockRejectedValue(pgError);
      await expect(service.create('u-1', { event_date: '2026-06-01' })).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('returns grouped events within 31-day window', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [] }) // events
        .mockResolvedValueOnce({ rows: [] }); // outfits

      const result = await service.findAll('u-1', { start_date: '2026-05-01', end_date: '2026-05-31' });
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
    });

    it('throws BadRequestException when range exceeds 31 days', async () => {
      await expect(service.findAll('u-1', { start_date: '2026-01-01', end_date: '2026-03-01' })).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when start_date is after end_date', async () => {
      await expect(service.findAll('u-1', { start_date: '2026-06-01', end_date: '2026-05-01' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('getRange', () => {
    it('returns range statistics', async () => {
      // all 4 Promise.all queries return empty rows; service uses optional chaining defaults
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await service.getRange('u-1', { start_date: '2026-05-01', end_date: '2026-05-31' });
      expect(result.total_days).toBe(31);
      expect(result.scheduled_days).toBe(0);
      expect(result.new_outfits_added).toBe(0);
      expect(result.outfit_frequency).toEqual({});
      expect(result.most_used_outfit).toBeNull();
    });

    it('throws BadRequestException when range exceeds 365 days', async () => {
      await expect(service.getRange('u-1', { start_date: '2025-01-01', end_date: '2026-06-01' })).rejects.toThrow(BadRequestException);
    });
  });
});
