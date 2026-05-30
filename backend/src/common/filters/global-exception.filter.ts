import { ArgumentsHost, BadRequestException, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

interface ValidationDetail {
  field: string;
  message: string;
  code: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);
  private readonly isDev = process.env.NODE_ENV === 'development';

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response: Response = ctx.getResponse<Response>();
    const request: Request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException ? exception.getStatus() : 500;
    const path = request.originalUrl || request.url;

    let code: string;
    let message: string;
    let details: ValidationDetail[] | undefined;

    if (exception instanceof BadRequestException) {
      code = 'BAD_REQUEST';
      const res = exception.getResponse() as any;
      message = typeof res === 'string' ? res : (res.message ?? 'Bad request');

      if (Array.isArray(res.message)) {
        details = this.parseValidationErrors(res.message);
      }

      if (!details || details.length === 0) {
        details = this.extractValidationDetails(res);
      }
    } else if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const res = exception.getResponse() as any;

      if (statusCode === 401) {
        code = 'UNAUTHORIZED';
      } else if (statusCode === 403) {
        code = 'FORBIDDEN';
      } else if (statusCode === 404) {
        code = 'NOT_FOUND';
      } else if (statusCode === 409) {
        code = 'CONFLICT';
      } else if (statusCode === 429) {
        code = 'TOO_MANY_REQUESTS';
      } else {
        code = typeof res === 'string' ? statusCode.toString() : (res.code ?? 'HTTP_ERROR');
      }

      message = typeof res === 'string' ? res : (res.message ?? exception.message);

      if (exception instanceof BadRequestException) {
        if (Array.isArray(res.message)) {
          details = this.parseValidationErrors(res.message);
        } else {
          details = this.extractValidationDetails(res);
        }
      }
    } else {
      code = 'INTERNAL_ERROR';
      message = 'An unexpected error occurred';

      if (this.isDev) {
        message = (exception as Error).message ?? message;
      }

      this.logger.error(`Unhandled exception: ${(exception as Error).message}`, (exception as Error).stack);
    }

    if (status >= 500) {
      this.logger.error(`[${status}] ${request.method} ${path}: ${message}`, exception instanceof Error ? exception.stack : undefined);
    } else {
      this.logger.warn(`[${status}] ${request.method} ${path}: ${message}`);
    }

    const body: Record<string, any> = {
      status,
      code,
      message,
      timestamp: new Date().toISOString(),
      path,
    };

    if (details && details.length > 0) {
      body.details = details;
    }

    if (this.isDev && exception instanceof Error && exception.stack) {
      body.stack = exception.stack;
    }

    response.status(status).json(body);
  }

  private parseValidationErrors(messages: any[]): ValidationDetail[] {
    return messages.map((msg: any) => {
      if (typeof msg === 'string') {
        return { field: 'unknown', message: msg, code: 'VALIDATION_ERROR' };
      }
      return {
        field: msg.property || msg.field || 'unknown',
        message: this.getFirstConstraintMessage(msg),
        code: this.getFirstConstraintCode(msg),
      };
    });
  }

  private extractValidationDetails(res: any): ValidationDetail[] {
    if (!res || typeof res !== 'object') return [];

    const details: ValidationDetail[] = [];

    if (res.errors && Array.isArray(res.errors)) {
      for (const err of res.errors) {
        details.push({
          field: err.field ?? err.property ?? 'unknown',
          message: err.message ?? Object.values(err.constraints ?? {})[0] ?? 'Validation failed',
          code: Object.keys(err.constraints ?? {})[0] ?? 'VALIDATION_ERROR',
        });
      }
    }

    return details;
  }

  private getFirstConstraintMessage(error: any): string {
    if (error.constraints) {
      const values = Object.values(error.constraints);
      return (values[0] as string) ?? 'Validation failed';
    }
    if (error.message) return error.message;
    return 'Validation failed';
  }

  private getFirstConstraintCode(error: any): string {
    if (error.constraints) {
      const keys = Object.keys(error.constraints);
      return keys[0] ?? 'VALIDATION_ERROR';
    }
    return 'VALIDATION_ERROR';
  }
}
