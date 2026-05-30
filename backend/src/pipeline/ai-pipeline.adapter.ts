import { Injectable, Logger } from '@nestjs/common';

export const AI_PIPELINE_ADAPTER = Symbol('AIPipelineAdapter');

export interface AIPipelineAdapter {
  processStep(stepName: string, garmentId: string, imageUrl: string): Promise<Record<string, unknown>>;
}

const STEP_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 2;

/**
 * Temporary stub adapter — simulates AI pipeline steps with random delays.
 * STUB-001: Replace with real HTTP call to FastAPI AI service.
 * Remove once Python AI service exists.
 */
@Injectable()
export class SimulatedAIPipelineAdapter implements AIPipelineAdapter {
  private readonly logger = new Logger('AIPipelineAdapter[stub]');

  async processStep(stepName: string, _garmentId: string, _imageUrl: string): Promise<Record<string, unknown>> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        await this.runWithTimeout(stepName, STEP_TIMEOUT_MS);
        this.logger.debug(`[stub] Step "${stepName}" completed (attempt ${attempt + 1})`);
        return {};
      } catch (err: any) {
        lastError = err;
        if (attempt < MAX_RETRIES) {
          this.logger.warn(`[stub] Step "${stepName}" attempt ${attempt + 1} failed, retrying: ${err.message}`);
          await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        }
      }
    }

    this.logger.error(`[stub] Step "${stepName}" exhausted all retries: ${lastError?.message}`);
    throw lastError ?? new Error(`Step ${stepName} failed`);
  }

  private runWithTimeout(stepName: string, timeoutMs: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Step "${stepName}" timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      // Simulated delay (500–2000ms) — STUB: replace with real HTTP call
      const delay = 500 + Math.random() * 1500;
      setTimeout(() => {
        clearTimeout(timer);
        resolve();
      }, delay);
    });
  }
}
