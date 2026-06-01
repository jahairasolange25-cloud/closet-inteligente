'use client';

import { useAuthStore } from '@/stores/auth-store';
import { useGarmentStore } from '@/stores/garment-store';
import { useOutfitStore } from '@/stores/outfit-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { Shirt, Sparkles, CalendarDays, Plus, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

export function DashboardHome() {
  const { user, isAuthenticated } = useAuthStore();
  const { garments, total: totalGarments, fetchGarments, isLoading: gLoading } = useGarmentStore();
  const { total: totalOutfits, fetchOutfits, isLoading: oLoading } = useOutfitStore();

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchGarments({ limit: 6 });
    fetchOutfits({ limit: 4 });
  }, [fetchGarments, fetchOutfits, isAuthenticated]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  })();

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      {/* Hero greeting */}
      <div>
        <h1 className="text-2xl font-bold font-display text-neutral-800 dark:text-neutral-100">
          {greeting}, {user?.name?.split(' ')[0] ?? 'usuario'} 👋
        </h1>
        <p className="text-sm text-neutral-500 mt-1">Tu armario digital te espera</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Prendas', value: totalGarments, icon: Shirt, href: '/garments', color: 'text-primary-500' },
          { label: 'Outfits', value: totalOutfits, icon: Sparkles, href: '/outfits', color: 'text-secondary-500' },
          { label: 'Planificados', value: '—', icon: CalendarDays, href: '/calendar', color: 'text-accent-500' },
          { label: 'Actividad', value: '↑', icon: TrendingUp, href: '/analytics', color: 'text-success-500' },
        ].map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card hover padding="md" className="flex flex-col gap-2">
              <stat.icon className={`h-5 w-5 ${stat.color}`} aria-hidden />
              <div>
                {gLoading || oLoading ? (
                  <Skeleton variant="line" className="h-6 w-12 mb-1" />
                ) : (
                  <p className="text-2xl font-bold font-display text-neutral-800 dark:text-neutral-100">{stat.value}</p>
                )}
                <p className="text-xs text-neutral-500">{stat.label}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <Card padding="md">
        <CardHeader>
          <CardTitle>Acciones rápidas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link href="/garments/new">
            <Button variant="outline" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
              Añadir prenda
            </Button>
          </Link>
          <Link href="/outfits/new">
            <Button variant="outline" size="sm" leftIcon={<Sparkles className="h-4 w-4" />}>
              Crear outfit
            </Button>
          </Link>
          <Link href="/calendar">
            <Button variant="outline" size="sm" leftIcon={<CalendarDays className="h-4 w-4" />}>
              Planificar día
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Recent garments */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">Prendas recientes</h2>
          <Link href="/garments" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">Ver todas</Link>
        </div>
        {gLoading ? (
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} variant="rect" className="aspect-square" />
            ))}
          </div>
        ) : garments.length === 0 ? (
          <Card padding="lg" className="text-center">
            <p className="text-sm text-neutral-500 mb-3">Aún no tienes prendas. ¡Añade tu primera!</p>
            <Link href="/garments/new">
              <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
                Añadir prenda
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {garments.map((g) => (
              <Link key={g.id} href={`/garments/${g.id}`}>
                <div className="relative aspect-square rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 hover:ring-2 hover:ring-primary-500 transition-all">
                  {g.thumbnailUrl ? (
                    <Image src={g.thumbnailUrl} alt={g.name} fill sizes="(max-width: 640px) 33vw, 16vw" className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Shirt className="h-8 w-8 text-neutral-400" aria-hidden />
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
