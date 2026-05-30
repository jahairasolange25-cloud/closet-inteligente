import type { Metadata } from 'next';
import { AvatarPage } from '@/features/avatar/avatar-page';

export const metadata: Metadata = { title: 'Mi Avatar' };

export default function AvatarPageRoute() {
  return <AvatarPage />;
}
