import { api } from '@/lib/api';

export interface GarmentStats {
  totalGarments: number;
  byCategory: Record<string, number>;
  byColor: Record<string, number>;
  byState: Record<string, number>;
  mostWorn: Array<{ garmentId: string; name: string; usageCount: number }>;
}

export interface AnalyticsDashboard {
  garmentStats: GarmentStats;
  outfitStats: {
    totalOutfits: number;
    byType: Record<string, number>;
    byOccasion: Record<string, number>;
    mostUsed: Array<{ outfitId: string; name: string; usageCount: number }>;
  };
  calendarStats: {
    plannedDays: number;
    streak: number;
  };
  aiPrecision: {
    accuracy: number;
    note: string;
  };
}

export const analyticsService = {
  async getDashboard(period: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<AnalyticsDashboard> {
    const { data } = await api.get<AnalyticsDashboard>('/analytics/dashboard', {
      params: { period },
    });
    return data;
  },

  async getGarmentStats(): Promise<GarmentStats> {
    const { data } = await api.get<GarmentStats>('/analytics/garments');
    return data;
  },
};
