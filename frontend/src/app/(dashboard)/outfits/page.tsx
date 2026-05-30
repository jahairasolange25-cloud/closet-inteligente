import type { Metadata } from 'next';
import { OutfitsListPage } from '@/features/outfits/outfits-list-page';

export const metadata: Metadata = { title: 'Outfits' };

export default function OutfitsPage() {
  return <OutfitsListPage />;
}
