import type { Metadata } from 'next';
import { LoginForm } from '@/features/auth/login-form';

export const metadata: Metadata = { title: 'Iniciar Sesión' };

export default function LoginPage() {
  return <LoginForm />;
}
