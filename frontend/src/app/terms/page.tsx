import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Términos y Condiciones' };

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900">
      <div className="mx-auto max-w-3xl px-4 py-16">
        <Link href="/register" className="text-sm text-primary-600 hover:underline mb-8 inline-block">
          &larr; Volver al registro
        </Link>
        <h1 className="text-3xl font-bold mb-8">Términos y Condiciones</h1>

        <section className="space-y-6 text-neutral-700 dark:text-neutral-300">
          <div>
            <h2 className="text-xl font-semibold mb-2">1. Aceptación de los Términos</h2>
            <p>
              Al crear una cuenta en Closet Inteligente, aceptas estos términos y condiciones. Si no estás de acuerdo, no debes usar el servicio.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">2. Descripción del Servicio</h2>
            <p>
              Closet Inteligente es una aplicación digital que permite a los usuarios gestionar su armario, crear conjuntos de vestimenta y recibir recomendaciones personalizadas mediante inteligencia artificial.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">3. Cuentas de Usuario</h2>
            <p>
              Eres responsable de mantener la confidencialidad de tus credenciales de inicio de sesión. Notifica inmediatamente cualquier uso no autorizado de tu cuenta.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">4. Privacidad de Datos</h2>
            <p>
              Los datos personales proporcionados se utilizarán únicamente para la operación del servicio. No compartimos tus datos con terceros sin tu consentimiento explícito.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">5. Almacenamiento de Imágenes</h2>
            <p>
              Las imágenes de prendas y conjuntos que subas se almacenan en Cloudinary. Puedes solicitar la eliminación de tus imágenes en cualquier momento.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">6. Limitación de Responsabilidad</h2>
            <p>
              Closet Inteligente no se hace responsable por daños directos o indirectos derivados del uso del servicio, incluyendo pero no limitado a pérdida de datos o interrupciones del servicio.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">7. Modificaciones</h2>
            <p>
              Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios serán notificados a través de la aplicación.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">8. Contacto</h2>
            <p>
              Para cualquier consulta sobre estos términos, contáctanos a través de los canales de soporte en la aplicación.
            </p>
          </div>
        </section>

        <div className="mt-12 pt-8 border-t border-neutral-200 dark:border-neutral-700">
          <p className="text-sm text-neutral-500">
            Última actualización: Mayo 2026
          </p>
        </div>
      </div>
    </main>
  );
}
