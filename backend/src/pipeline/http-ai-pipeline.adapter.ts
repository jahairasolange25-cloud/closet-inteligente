import { Injectable, Logger } from '@nestjs/common';
import { AIPipelineAdapter } from './ai-pipeline.adapter';
import { randomUUID } from 'crypto';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5100';
const STEP_TIMEOUT_MS = Number(process.env.AI_STEP_TIMEOUT_MS || '30000');
const MAX_RETRIES = Number(process.env.AI_MAX_RETRIES || '2');
const GLOBAL_TIMEOUT_MS = Number(process.env.AI_GLOBAL_TIMEOUT_MS || '120000');

interface PipelineStepResponse {
  requestId: string;
  step: string;
  status: 'completed' | 'failed';
  result?: Record<string, unknown>;
  error?: { code: string; message: string; retryable: boolean };
  processingMs: number;
}

interface FullPipelineResponse {
  pipelineId: string;
  garmentId: string;
  status: string;
  steps: Array<{
    step: string;
    status: string;
    started_at: string;
    completed_at: string | null;
    error: string | null;
    result: Record<string, unknown> | null;
  }>;
  error: string | null;
  started_at: string;
  completed_at: string | null;
  total_processing_ms: number;
}

@Injectable()
export class HttpAIPipelineAdapter implements AIPipelineAdapter {
  private readonly logger = new Logger('AIPipelineAdapter[HTTP]');
  private failureCount = 0;
  private lastFailureTime = 0;

  async processStep(
    stepName: string,
    garmentId: string,
    imageUrl: string,
  ): Promise<Record<string, unknown>> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await this.callAiService(stepName, garmentId, imageUrl);
        this.failureCount = 0;
        return result;
      } catch (err: any) {
        lastError = err;
        if (attempt < MAX_RETRIES) {
          const delay = 500 * Math.pow(2, attempt);
          this.logger.warn(
            `[HTTP] Step "${stepName}" attempt ${attempt + 1} failed, retrying in ${delay}ms: ${err.message}`,
          );
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    this.failureCount++;
    this.lastFailureTime = Date.now();

    throw lastError ?? new Error(`Step ${stepName} failed after ${MAX_RETRIES + 1} attempts`);
  }

  private async callAiService(
    stepName: string,
    garmentId: string,
    imageUrl: string,
  ): Promise<Record<string, unknown>> {
    if (this.isCircuitBroken()) {
      throw new Error('AI_SERVICE_CIRCUIT_OPEN');
    }

    const requestId = randomUUID();

    const url = `${AI_SERVICE_URL}/api/v1/pipeline/step`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), STEP_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: stepName,
          garmentId,
          imageUrl,
          requestId,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`AI service returned ${response.status}: ${errorText}`);
      }

      const data: PipelineStepResponse = await response.json();

      if (data.status === 'failed') {
        throw new Error(
          data.error?.message || `Step ${stepName} failed at AI service`,
        );
      }

      return data.result ?? {};
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error(`Step "${stepName}" timed out after ${STEP_TIMEOUT_MS}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async runFullPipeline(
    garmentId: string,
    imageUrl: string,
    userId: string,
  ): Promise<FullPipelineResponse> {
    const requestId = randomUUID();
    const url = `${AI_SERVICE_URL}/api/v1/pipeline/full`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GLOBAL_TIMEOUT_MS);

    try {
      this.logger.log(`[HTTP] Running full pipeline for garment ${garmentId}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          garmentId,
          imageUrl,
          requestId,
          userId,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`AI service returned ${response.status}: ${errorText}`);
      }

      const data: FullPipelineResponse = await response.json();

      this.logger.log(
        `[HTTP] Full pipeline completed for garment ${garmentId}: status=${data.status}, duration=${data.total_processing_ms}ms`,
      );

      return data;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error(`Full pipeline timed out after ${GLOBAL_TIMEOUT_MS}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private isCircuitBroken(): boolean {
    if (this.failureCount >= 5) {
      const elapsed = Date.now() - this.lastFailureTime;
      if (elapsed < 30000) {
        return true;
      }
      this.failureCount = 0;
    }
    return false;
  }
}
