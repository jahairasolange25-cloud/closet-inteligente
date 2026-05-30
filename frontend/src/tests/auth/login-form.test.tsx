import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from '@/features/auth/login-form';

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: () => ({
    login: vi.fn().mockResolvedValue(undefined),
    isLoading: false,
    error: null,
    clearError: vi.fn(),
  }),
}));

describe('LoginForm', () => {
  it('renders email and password fields', () => {
    render(<LoginForm />);
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
    const passwordInput = screen.getByLabelText(/^contraseña/i, { selector: 'input' });
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAccessibleName('Contraseña');
  });

  it('shows validation error for invalid email', async () => {
    render(<LoginForm />);
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));
    await waitFor(() => {
      expect(screen.getByText(/email inválido/i)).toBeInTheDocument();
    });
  });

  it('shows password toggle button', () => {
    render(<LoginForm />);
    const toggle = screen.getByRole('button', { name: /mostrar contraseña/i });
    expect(toggle).toBeInTheDocument();
  });
});
