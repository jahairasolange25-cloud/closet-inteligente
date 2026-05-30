import type { Metadata } from 'next';
import { GarmentDetailPage } from '@/features/garments/garment-detail-page';

export const metadata: Metadata = { title: 'Detalle de Prenda' };

export default function GarmentPage({ params }: { params: { id: string } }) {
  return <GarmentDetailPage id={params.id} />;
}
