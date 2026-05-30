import type { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = { title: 'Recuperar Contraseña' };

export default function ForgotPasswordPage() {
  return (
    <Card padding="lg" className="w-full animate-fade-in">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold font-display text-neutral-800 dark:text-neutral-100">
          Recuperar Contraseña
        </h1>
        <Badge variant="warning" className="mt-2">Próximamente</Badge>
      </div>
      <p className="text-center text-sm text-neutral-500 mb-6">
        La recuperación de contraseña estará disponible en la próxima versión.
        Por favor, contacta soporte si necesitas ayuda.
      </p>
      <Link href="/login" className="block text-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400">
        ← Volver al inicio de sesión
      </Link>
    </Card>
  );
}
