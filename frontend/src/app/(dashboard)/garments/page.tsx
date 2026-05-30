import type { Metadata } from 'next';
import { GarmentsListPage } from '@/features/garments/garments-list-page';

export const metadata: Metadata = { title: 'Mi Closet' };

export default function GarmentsPage() {
  return <GarmentsListPage />;
}
