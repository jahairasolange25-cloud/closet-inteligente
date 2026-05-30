'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, Plus } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { calendarService } from '@/services/calendar.service';
import { useUIStore } from '@/stores/ui-store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScheduleModal } from './schedule-modal';
import type { CalendarEvent } from '@/types/calendar';
import { cn } from '@/lib/cn';

export function CalendarPageView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [schedulingDate, setSchedulingDate] = useState<Date | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { addToast } = useUIStore();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDayOfWeek = getDay(monthStart);
  const paddingDays = Array.from({ length: startDayOfWeek });

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await calendarService.getRange(
        format(startOfMonth(currentDate), 'yyyy-MM-dd'),
        format(endOfMonth(currentDate), 'yyyy-MM-dd'),
      );
      setEvents(data);
    } catch {
      addToast({ type: 'error', message: 'Error cargando el calendario' });
    } finally {
      setIsLoading(false);
    }
  }, [currentDate, addToast]);

  useEffect(() => {
    load();
  }, [load]);

  const openScheduleModal = (day: Date) => {
    setSchedulingDate(day);
    setModalOpen(true);
  };

  const existingEventForSelected = schedulingDate
    ? events.find((e) => e.date === format(schedulingDate, 'yyyy-MM-dd')) ?? null
    : null;

  const getEventsForDate = (date: Date) =>
    events.filter((e) => e.date === format(date, 'yyyy-MM-dd'));

  const navigate = (dir: 1 | -1) => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + dir, 1));
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold font-display text-neutral-800 dark:text-neutral-100">Planificador</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)} aria-label="Mes anterior">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 capitalize min-w-[140px] text-center">
            {format(currentDate, 'MMMM yyyy', { locale: es })}
          </span>
          <Button variant="ghost" size="icon-sm" onClick={() => navigate(1)} aria-label="Mes siguiente">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Hoy</Button>
        </div>
      </div>

      <Card padding="md">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-neutral-400 py-2">{day}</div>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} variant="rect" className="aspect-square sm:aspect-auto sm:h-20" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {paddingDays.map((_, i) => <div key={`pad-${i}`} />)}
            {days.map((day) => {
              const dayEvents = getEventsForDate(day);
              const today = isToday(day);
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => openScheduleModal(day)}
                  className={cn(
                    'aspect-square sm:aspect-auto sm:min-h-[80px] p-1 rounded-lg text-left flex flex-col gap-1 transition-colors',
                    'hover:bg-neutral-50 dark:hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40',
                    today && 'bg-primary-50 dark:bg-primary-900/10',
                  )}
                  aria-label={`${format(day, 'dd MMMM', { locale: es })}${dayEvents.length > 0 ? `, ${dayEvents.length} evento(s)` : ''}, planificar outfit`}
                >
                  <span className={cn(
                    'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full',
                    today
                      ? 'bg-primary-500 text-white'
                      : 'text-neutral-600 dark:text-neutral-400',
                  )}>
                    {format(day, 'd')}
                  </span>
                  {dayEvents.slice(0, 2).map((event) => (
                    <div key={event.id} className="hidden sm:block w-full rounded bg-primary-100 dark:bg-primary-900/30 px-1 py-0.5">
                      <p className="text-[10px] text-primary-700 dark:text-primary-300 truncate">
                        {event.outfit?.name ?? 'Outfit planificado'}
                      </p>
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <span className="hidden sm:block text-[10px] text-neutral-400">+{dayEvents.length - 2}</span>
                  )}
                  {dayEvents.length === 0 && (
                    <span className="hidden sm:flex text-neutral-200 dark:text-neutral-700 items-center justify-center flex-1">
                      <Plus className="h-3 w-3" aria-hidden />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </Card>

      <div className="flex items-center gap-2 text-xs text-neutral-400">
        <CalendarDays className="h-4 w-4" />
        <span>{events.length} outfit(s) planificado(s) este mes</span>
      </div>

      <ScheduleModal
        isOpen={modalOpen}
        date={schedulingDate}
        existingEvent={existingEventForSelected}
        onClose={() => setModalOpen(false)}
        onSaved={load}
      />
    </div>
  );
}
