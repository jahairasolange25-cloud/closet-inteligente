import type { Metadata } from 'next';
import { OutfitDetailPage } from '@/features/outfits/outfit-detail-page';

export const metadata: Metadata = { title: 'Detalle de Outfit' };

export default function OutfitPage({ params }: { params: { id: string } }) {
  return <OutfitDetailPage id={params.id} />;
}
