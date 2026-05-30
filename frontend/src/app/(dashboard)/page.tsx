import type { Metadata } from 'next';
import { DashboardHome } from '@/features/dashboard/dashboard-home';

export const metadata: Metadata = { title: 'Inicio' };

export default function HomePage() {
  return <DashboardHome />;
}
