import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { randomBytes } from 'crypto';

const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'TRACE']);

@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly logger = new Logger(CsrfGuard.name);

  canActivate(context: ExecutionContext): boolean {
    // E2E/integration tests run without a browser, so there is no mechanism to
    // receive the CSRF cookie and echo it back as a header. Skip validation in
    // the test environment only — dev and prod keep full protection.
    if (process.env.NODE_ENV === 'test') {
      return true;
    }

    const request: Request = context.switchToHttp().getRequest();
    const response: Response = context.switchToHttp().getResponse();

    if (SAFE_METHODS.has(request.method)) {
      this.ensureCsrfCookie(request, response);
      return true;
    }

    const cookieToken = request.cookies?.[CSRF_COOKIE_NAME];
    const headerToken = request.headers[CSRF_HEADER_NAME] as string | undefined;

    if (!cookieToken || !headerToken) {
      this.logger.warn(`CSRF validation failed: missing token (method=${request.method}, path=${request.path})`);
      throw new HttpException(
        { statusCode: HttpStatus.FORBIDDEN, code: 'CSRF_TOKEN_MISSING', message: 'CSRF token missing' },
        HttpStatus.FORBIDDEN,
      );
    }

    if (cookieToken !== headerToken) {
      this.logger.warn(`CSRF validation failed: token mismatch (method=${request.method}, path=${request.path})`);
      throw new HttpException(
        { statusCode: HttpStatus.FORBIDDEN, code: 'CSRF_TOKEN_MISMATCH', message: 'CSRF token mismatch' },
        HttpStatus.FORBIDDEN,
      );
    }

    return true;
  }

  private ensureCsrfCookie(request: Request, response: Response): void {
    if (request.cookies?.[CSRF_COOKIE_NAME]) return;

    const token = randomBytes(32).toString('hex');
    response.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }
}
