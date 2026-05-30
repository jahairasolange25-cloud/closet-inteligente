import { Response } from 'express';

export interface SecureCookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  path?: string;
  domain?: string;
  maxAge?: number;
  expires?: Date;
}

const DEFAULT_OPTIONS: SecureCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
};

export function setSecureCookie(
  res: Response,
  name: string,
  value: string,
  options: SecureCookieOptions = {},
): void {
  res.cookie(name, value, {
    ...DEFAULT_OPTIONS,
    ...options,
  });
}

export function clearSecureCookie(
  res: Response,
  name: string,
  options: SecureCookieOptions = {},
): void {
  res.clearCookie(name, {
    ...DEFAULT_OPTIONS,
    ...options,
  });
}

export function setRefreshTokenCookie(
  res: Response,
  token: string,
): void {
  const maxAgeDays = parseInt(process.env.JWT_REFRESH_EXPIRES_IN || '7', 10);
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;

  setSecureCookie(res, 'refresh_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/v1/auth',
    maxAge: maxAgeMs,
  });
}

export function clearRefreshTokenCookie(
  res: Response,
): void {
  clearSecureCookie(res, 'refresh_token', {
    path: '/api/v1/auth',
  });
}
