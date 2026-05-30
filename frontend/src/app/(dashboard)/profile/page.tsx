import type { Metadata } from 'next';
import { ProfilePage } from '@/features/profile/profile-page';

export const metadata: Metadata = { title: 'Mi Perfil' };

export default function ProfilePageRoute() {
  return <ProfilePage />;
}
