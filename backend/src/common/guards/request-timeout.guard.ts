import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';

const DEFAULT_TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT_MS || '30000', 10);

@Injectable()
export class RequestTimeoutGuard implements CanActivate {
  private readonly timeoutMs = DEFAULT_TIMEOUT_MS;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const response: Response = context.switchToHttp().getResponse();

    if (request.path === '/health') {
      return true;
    }

    return new Promise<boolean>((resolve) => {
      const timer = setTimeout(() => {
        if (!response.headersSent) {
          response.status(HttpStatus.REQUEST_TIMEOUT).json({
            statusCode: HttpStatus.REQUEST_TIMEOUT,
            code: 'REQUEST_TIMEOUT',
            message: 'Request exceeded timeout limit',
            timestamp: new Date().toISOString(),
            path: request.originalUrl || request.url,
          });
        }
        resolve(false);
      }, this.timeoutMs);

      const originalEnd = response.end.bind(response);
      response.end = (...args: any[]) => {
        clearTimeout(timer);
        return originalEnd(...args);
      };

      resolve(true);
    });
  }
}
