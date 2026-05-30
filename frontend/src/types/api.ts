export type { PaginatedResponse, PaginationParams, ApiErrorCode, NormalizedApiError, NestValidationError } from './api/index';

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type ApiResponse<T> = T | ApiError;
