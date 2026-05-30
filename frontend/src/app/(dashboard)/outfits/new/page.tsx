import type { Metadata } from 'next';
import { NewOutfitPage } from '@/features/outfits/new-outfit-page';

export const metadata: Metadata = { title: 'Crear Outfit' };

export default function OutfitNewPage() {
  return <NewOutfitPage />;
}
