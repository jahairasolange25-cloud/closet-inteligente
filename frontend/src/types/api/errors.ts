export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'UNKNOWN';

export interface NormalizedApiError {
  code: ApiErrorCode;
  message: string;
  status: number | null;
  fields?: Record<string, string[]>;
  retryable: boolean;
}

export interface NestValidationError {
  message: string | string[];
  error?: string;
  statusCode?: number;
}
