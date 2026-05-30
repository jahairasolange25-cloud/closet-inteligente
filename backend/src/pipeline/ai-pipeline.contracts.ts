/**
 * Stable contracts for backend ↔ AI service communication.
 *
 * These types are the source of truth for the HTTP interface between the
 * NestJS backend and the future FastAPI AI service. All changes here must be
 * reflected in the Python service's Pydantic models.
 *
 * STUB-001: When the real AI service exists, implement HttpAIPipelineAdapter
 * using these contracts.
 */

// ─── Pipeline Step Enum ────────────────────────────────────────────────────

export type PipelineStepName =
  | 'background_removal'
  | 'classification'
  | 'attribute_extraction'
  | 'thumbnail';

export const PIPELINE_STEP_NAMES: readonly PipelineStepName[] = [
  'background_removal',
  'classification',
  'attribute_extraction',
  'thumbnail',
] as const;

export type PipelineStepStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type PipelineJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

// ─── AI Service Request ────────────────────────────────────────────────────

export interface AIPipelineStepRequest {
  step: PipelineStepName;
  garmentId: string;
  imageUrl: string;
  /** Idempotency key — backend-generated, allows AI service to deduplicate retries */
  requestId: string;
}

// ─── AI Service Response ───────────────────────────────────────────────────

export interface BackgroundRemovalResult {
  maskedImageUrl: string;
  confidence: number;
}

export interface ClassificationResult {
  category: string;
  subcategory: string | null;
  confidence: number;
}

export interface AttributeExtractionResult {
  colors: string[];
  material: string[];
  patterns: string[];
  confidence: number;
}

export interface ThumbnailResult {
  thumbnailUrl: string;
  width: number;
  height: number;
}

export type AIPipelineStepResult =
  | ({ step: 'background_removal' } & BackgroundRemovalResult)
  | ({ step: 'classification' } & ClassificationResult)
  | ({ step: 'attribute_extraction' } & AttributeExtractionResult)
  | ({ step: 'thumbnail' } & ThumbnailResult);

export interface AIPipelineStepResponse {
  requestId: string;
  step: PipelineStepName;
  status: 'completed' | 'failed';
  result?: AIPipelineStepResult;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
  processingMs: number;
}

// ─── Retry / Timeout Policy ────────────────────────────────────────────────

export interface PipelineRetryPolicy {
  maxAttempts: number;
  baseDelayMs: number;
  /** Exponential backoff multiplier */
  backoffFactor: number;
  timeoutMs: number;
}

export const DEFAULT_PIPELINE_RETRY_POLICY: PipelineRetryPolicy = {
  maxAttempts: 3,
  baseDelayMs: 500,
  backoffFactor: 2,
  timeoutMs: 30_000,
};

// ─── Failure Contracts ─────────────────────────────────────────────────────

export type PipelineFailureCode =
  | 'TIMEOUT'
  | 'AI_SERVICE_UNAVAILABLE'
  | 'AI_SERVICE_ERROR'
  | 'INVALID_IMAGE'
  | 'UNSUPPORTED_FORMAT'
  | 'QUOTA_EXCEEDED';

export interface PipelineFailure {
  code: PipelineFailureCode;
  message: string;
  retryable: boolean;
  step: PipelineStepName;
  garmentId: string;
}
