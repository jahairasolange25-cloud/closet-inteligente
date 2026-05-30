'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Image from 'next/image';
import { Sparkles, Shirt, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { calendarService } from '@/services/calendar.service';
import { outfitsService } from '@/services/outfits.service';
import { useUIStore } from '@/stores/ui-store';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import type { CalendarEvent } from '@/types/calendar';
import type { Outfit } from '@/types/outfit';

interface Props {
  isOpen: boolean;
  date: Date | null;
  existingEvent: CalendarEvent | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ScheduleModal({ isOpen, date, existingEvent, onClose, onSaved }: Props) {
  const { addToast } = useUIStore();
  const [selectedOutfitId, setSelectedOutfitId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: outfitsData, isLoading: outfitsLoading } = useQuery({
    queryKey: ['outfits-picker'],
    queryFn: () => outfitsService.list({ limit: 50 }),
    enabled: isOpen,
    staleTime: 2 * 60 * 1000,
  });

  useEffect(() => {
    if (isOpen) {
      setSelectedOutfitId(existingEvent?.outfitId ?? '');
      setNotes(existingEvent?.notes ?? '');
    }
  }, [isOpen, existingEvent]);

  if (!date) return null;

  const dateStr = format(date, 'yyyy-MM-dd');
  const dateLabel = format(date, "EEEE d 'de' MMMM", { locale: es });

  const handleSave = async () => {
    if (!selectedOutfitId) {
      addToast({ type: 'warning', message: 'Selecciona un outfit para planificar' });
      return;
    }
    setIsSaving(true);
    try {
      if (existingEvent) {
        await calendarService.update(existingEvent.id, {
          outfitId: selectedOutfitId,
          notes: notes || undefined,
        });
        addToast({ type: 'success', message: 'Outfit actualizado en el calendario' });
      } else {
        await calendarService.create({
          date: dateStr,
          outfitId: selectedOutfitId,
          notes: notes || undefined,
        });
        addToast({ type: 'success', message: 'Outfit planificado correctamente' });
      }
      onSaved();
      onClose();
    } catch {
      addToast({ type: 'error', message: 'Error al guardar el evento' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingEvent) return;
    setIsDeleting(true);
    try {
      await calendarService.delete(existingEvent.id);
      addToast({ type: 'success', message: 'Outfit eliminado del calendario' });
      onSaved();
      onClose();
    } catch {
      addToast({ type: 'error', message: 'Error al eliminar el evento' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingEvent ? 'Editar outfit planificado' : 'Planificar outfit'}
      size="md"
      footer={
        <div className="flex items-center justify-between w-full gap-3">
          <div>
            {existingEvent && (
              <Button variant="danger" size="sm" loading={isDeleting} onClick={handleDelete}>
                Eliminar
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
            <Button size="sm" loading={isSaving} onClick={handleSave}>
              {existingEvent ? 'Actualizar' : 'Planificar'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Date display */}
        <div className="flex items-center gap-2 p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20">
          <Sparkles className="h-4 w-4 text-primary-500 flex-shrink-0" />
          <p className="text-sm font-medium text-primary-700 dark:text-primary-300 capitalize">
            {dateLabel}
          </p>
        </div>

        {/* Outfit selector */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Outfit <span className="text-error-500">*</span>
          </p>
          {outfitsLoading ? (
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 rounded-lg bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
              ))}
            </div>
          ) : !outfitsData?.data.length ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <Shirt className="h-8 w-8 text-neutral-300" />
              <p className="text-sm text-neutral-400">No tienes outfits creados todavía</p>
              <p className="text-xs text-neutral-400">Crea un outfit antes de planificarlo</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-1">
              {outfitsData.data.map((outfit: Outfit) => (
                <OutfitOption
                  key={outfit.id}
                  outfit={outfit}
                  selected={selectedOutfitId === outfit.id}
                  onSelect={() => setSelectedOutfitId(outfit.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="schedule-notes" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Notas (opcional)
          </label>
          <textarea
            id="schedule-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="¿Para qué ocasión? Notas adicionales..."
            rows={2}
            maxLength={300}
            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 resize-none"
          />
          <p className="text-xs text-neutral-400 text-right">{notes.length}/300</p>
        </div>
      </div>
    </Modal>
  );
}

function OutfitOption({
  outfit,
  selected,
  onSelect,
}: {
  outfit: Outfit;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl border text-left transition-all w-full',
        selected
          ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-500/30'
          : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
      )}
    >
      {/* Thumbnail or placeholder */}
      <div className="relative h-12 w-12 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {outfit.garments?.[0]?.thumbnailUrl ? (
          <Image
            src={outfit.garments[0].thumbnailUrl}
            alt=""
            fill
            sizes="48px"
            className="object-cover"
          />
        ) : (
          <Shirt className="h-5 w-5 text-neutral-400" aria-hidden />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100 truncate">{outfit.name}</p>
        <p className="text-xs text-neutral-400 mt-0.5">
          {outfit.garments.length} prenda{outfit.garments.length !== 1 ? 's' : ''}
          {outfit.type ? ` · ${outfit.type}` : ''}
        </p>
      </div>
      {selected && (
        <div className="h-5 w-5 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
          <X className="h-3 w-3 text-white rotate-45" aria-hidden />
        </div>
      )}
    </button>
  );
}
