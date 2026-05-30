import { api } from '@/lib/api';
import type { CalendarEvent, CreateCalendarEventDto, UpdateCalendarEventDto } from '@/types/calendar';

export const calendarService = {
  async getRange(startDate: string, endDate: string): Promise<CalendarEvent[]> {
    const { data } = await api.get<CalendarEvent[]>('/calendar/range', {
      params: { startDate, endDate },
    });
    return data;
  },

  async create(dto: CreateCalendarEventDto): Promise<CalendarEvent> {
    const { data } = await api.post<CalendarEvent>('/calendar', dto);
    return data;
  },

  async update(id: string, dto: UpdateCalendarEventDto): Promise<CalendarEvent> {
    const { data } = await api.patch<CalendarEvent>(`/calendar/${id}`, dto);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/calendar/${id}`);
  },
};
