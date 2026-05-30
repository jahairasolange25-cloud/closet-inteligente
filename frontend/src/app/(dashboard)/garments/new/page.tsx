import type { Metadata } from 'next';
import { NewGarmentPage } from '@/features/garments/new-garment-page';

export const metadata: Metadata = { title: 'Añadir Prenda' };

export default function GarmentNewPage() {
  return <NewGarmentPage />;
}
