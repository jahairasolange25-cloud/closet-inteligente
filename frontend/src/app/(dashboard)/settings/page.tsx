import type { Metadata } from 'next';
import { SettingsPage } from '@/features/settings/settings-page';

export const metadata: Metadata = { title: 'Configuración' };

export default function SettingsPageRoute() {
  return <SettingsPage />;
}
