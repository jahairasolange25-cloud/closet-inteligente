import { describe, it, expect } from 'vitest';
import { extractError } from '@/lib/api';

describe('extractError', () => {
  it('extracts message from Axios-like error response', () => {
    const err = { response: { data: { message: 'Credenciales inválidas' } } };
    expect(extractError(err)).toBe('Credenciales inválidas');
  });

  it('handles array message from class-validator', () => {
    const err = { response: { data: { message: ['email must be an email', 'password too short'] } } };
    expect(extractError(err)).toBe('email must be an email');
  });

  it('falls back to a default message for unknown errors', () => {
    expect(extractError(null)).toBe('Ocurrió un error inesperado');
    expect(extractError(undefined)).toBe('Ocurrió un error inesperado');
    expect(extractError({})).toBe('Ocurrió un error inesperado');
  });
});
