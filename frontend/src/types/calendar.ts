import type { Outfit } from './outfit';

export interface CalendarEvent {
  id: string;
  userId: string;
  date: string;
  outfitId: string | null;
  outfit: Outfit | null;
  notes: string | null;
  occasion: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCalendarEventDto {
  date: string;
  outfitId?: string;
  notes?: string;
  occasion?: string;
}

export interface UpdateCalendarEventDto extends Partial<CreateCalendarEventDto> {}
