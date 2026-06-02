/**
 * AI Cascade Service — TypeScript orchestrator.
 *
 * Routes classification/description tasks through the Python AI service
 * and adds a Redis caching layer so the same garment is never re-processed.
 *
 * Tier 1 (local):    CLIP + MiniLM inside the Python service  → free, no API
 * Tier 2 (free API): Gemini Flash / Groq                      → handled in Python
 * Tier 3 (paid):     GPT-4o mini                              → handled in Python
 */

import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

export type CascadeSource = 'local' | 'free_api' | 'paid_api' | 'cache' | 'unavailable';

export interface ClassifyResult {
  category: string;
  subcategory: string | null;
  confidence: number;
  method: string;
  source: CascadeSource;
  cachedAt?: string;
}

export interface DescribeResult {
  text: string;
  source: CascadeSource;
  llmSource?: string;
  cachedAt?: string;
}

export interface StyleTagsResult {
  tags: string[];
  source: CascadeSource;
  cachedAt?: string;
}

/** TTL in seconds for AI results — descriptions don't change for the same image. */
const CACHE_TTL = 60 * 60 * 24 * 7; // 7 days

@Injectable()
export class CascadeService {
  private readonly logger = new Logger(CascadeService.name);
  private readonly aiBaseUrl: string;

  constructor(private readonly redis: RedisService) {
    this.aiBaseUrl = process.env.AI_SERVICE_URL || 'http://localhost:5100';
  }

  // ------------------------------------------------------------------ //
  // Garment description (LLM tier 2/3)                                  //
  // ------------------------------------------------------------------ //

  async describeGarment(params: {
    garmentId: string;
    category: string;
    subcategory?: string;
    colors: string[];
    styleTags?: string[];
  }): Promise<DescribeResult> {
    const cacheKey = `ai:describe:${params.garmentId}`;

    const cached = await this.redis.get<{ text: string; llmSource: string; cachedAt: string }>(cacheKey);
    if (cached) {
      return { text: cached.text, source: 'cache', llmSource: cached.llmSource, cachedAt: cached.cachedAt };
    }

    try {
      const resp = await fetch(`${this.aiBaseUrl}/api/v1/ai/describe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: params.category,
          subcategory: params.subcategory ?? null,
          colors: params.colors,
          style_tags: params.styleTags ?? [],
        }),
        signal: AbortSignal.timeout(15_000),
      });

      if (!resp.ok) throw new Error(`AI service ${resp.status}`);
      const data = (await resp.json()) as { text: string; source: string };

      const payload = { text: data.text, llmSource: data.source, cachedAt: new Date().toISOString() };
      await this.redis.set(cacheKey, payload, CACHE_TTL);

      const source: CascadeSource = _mapLlmSource(data.source);
      return { text: data.text, source, llmSource: data.source };
    } catch (err) {
      this.logger.warn(`describeGarment failed for ${params.garmentId}: ${(err as Error).message}`);
      return { text: '', source: 'unavailable' };
    }
  }

  // ------------------------------------------------------------------ //
  // Style tag generation (LLM tier 2/3)                                 //
  // ------------------------------------------------------------------ //

  async generateStyleTags(params: {
    garmentId: string;
    description: string;
    colors: string[];
  }): Promise<StyleTagsResult> {
    const cacheKey = `ai:styletags:${params.garmentId}`;

    const cached = await this.redis.get<{ tags: string[]; cachedAt: string }>(cacheKey);
    if (cached) {
      return { tags: cached.tags, source: 'cache', cachedAt: cached.cachedAt };
    }

    try {
      const resp = await fetch(`${this.aiBaseUrl}/api/v1/ai/style-tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: params.description, colors: params.colors }),
        signal: AbortSignal.timeout(15_000),
      });

      if (!resp.ok) throw new Error(`AI service ${resp.status}`);
      const data = (await resp.json()) as { tags: string[]; source: string };

      const payload = { tags: data.tags, cachedAt: new Date().toISOString() };
      await this.redis.set(cacheKey, payload, CACHE_TTL);

      return { tags: data.tags, source: _mapLlmSource(data.source) };
    } catch (err) {
      this.logger.warn(`generateStyleTags failed: ${(err as Error).message}`);
      return { tags: [], source: 'unavailable' };
    }
  }

  // ------------------------------------------------------------------ //
  // Outfit suggestion (LLM tier 2/3)                                    //
  // ------------------------------------------------------------------ //

  async suggestOutfit(params: {
    anchorGarment: string;
    wardrobeSummary: string;
    context?: string;
  }): Promise<DescribeResult> {
    try {
      const resp = await fetch(`${this.aiBaseUrl}/api/v1/ai/outfit-suggestion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anchor_garment: params.anchorGarment,
          wardrobe_summary: params.wardrobeSummary,
          context: params.context ?? null,
        }),
        signal: AbortSignal.timeout(20_000),
      });

      if (!resp.ok) throw new Error(`AI service ${resp.status}`);
      const data = (await resp.json()) as { text: string; source: string };
      return { text: data.text, source: _mapLlmSource(data.source), llmSource: data.source };
    } catch (err) {
      this.logger.warn(`suggestOutfit failed: ${(err as Error).message}`);
      return { text: '', source: 'unavailable' };
    }
  }
}

function _mapLlmSource(source: string): CascadeSource {
  if (source === 'gemini' || source === 'groq') return 'free_api';
  if (source === 'openai') return 'paid_api';
  return 'local';
}
