import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ScheduleModal } from '@/features/calendar/schedule-modal';
import type { CalendarEvent } from '@/types/calendar';

// ── Service mocks ────────────────────────────────────────────────────────────

const mockCreate = vi.fn().mockResolvedValue({});
const mockUpdate = vi.fn().mockResolvedValue({});
const mockDelete = vi.fn().mockResolvedValue({});
const mockAddToast = vi.fn();

vi.mock('@/services/calendar.service', () => ({
  calendarService: {
    create: (...args: unknown[]) => mockCreate(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
}));

vi.mock('@/services/outfits.service', () => ({
  outfitsService: {
    list: vi.fn().mockResolvedValue({
      data: [
        {
          id: 'outfit-1',
          userId: 'u-1',
          name: 'Casual Monday',
          garments: [],
          isFavorite: false,
          occasion: null,
          type: 'casual',
          season: null,
          notes: null,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      ],
      meta: { total: 1, page: 1, limit: 50, totalPages: 1 },
    }),
  },
}));

const MOCK_OUTFIT = {
  id: 'outfit-1',
  userId: 'u-1',
  name: 'Casual Monday',
  garments: [] as [],
  isFavorite: false,
  occasion: null as null,
  type: 'casual' as const,
  season: null as null,
  notes: null as null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

vi.mock('@/stores/ui-store', () => ({
  useUIStore: () => ({ addToast: mockAddToast }),
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={makeClient()}>{children}</QueryClientProvider>;
}

const TEST_DATE = new Date(2026, 4, 26); // May 26 2026

describe('ScheduleModal', () => {
  beforeEach(() => {
    mockCreate.mockClear();
    mockUpdate.mockClear();
    mockDelete.mockClear();
    mockAddToast.mockClear();
  });

  it('does not render when date is null', () => {
    const { container } = render(
      <Wrapper>
        <ScheduleModal isOpen={true} date={null} existingEvent={null} onClose={vi.fn()} onSaved={vi.fn()} />
      </Wrapper>,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the date label when open', async () => {
    render(
      <Wrapper>
        <ScheduleModal isOpen={true} date={TEST_DATE} existingEvent={null} onClose={vi.fn()} onSaved={vi.fn()} />
      </Wrapper>,
    );
    expect(screen.getByText('Planificar outfit')).toBeInTheDocument();
    expect(screen.getByText(/mayo/i)).toBeInTheDocument();
  });

  it('shows warning when saving without selecting an outfit', async () => {
    render(
      <Wrapper>
        <ScheduleModal isOpen={true} date={TEST_DATE} existingEvent={null} onClose={vi.fn()} onSaved={vi.fn()} />
      </Wrapper>,
    );
    fireEvent.click(screen.getByRole('button', { name: /planificar/i }));
    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'warning' }),
      );
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('shows Edit title when existingEvent is provided', () => {
    const existingEvent: CalendarEvent = {
      id: 'ev-1',
      userId: 'u-1',
      date: '2026-05-26',
      outfitId: 'outfit-1',
      outfit: MOCK_OUTFIT,
      occasion: null,
      notes: 'Test note',
      createdAt: '',
      updatedAt: '',
    };
    render(
      <Wrapper>
        <ScheduleModal isOpen={true} date={TEST_DATE} existingEvent={existingEvent} onClose={vi.fn()} onSaved={vi.fn()} />
      </Wrapper>,
    );
    expect(screen.getByText('Editar outfit planificado')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /actualizar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /eliminar/i })).toBeInTheDocument();
  });

  it('calls onClose when cancel is clicked', () => {
    const onClose = vi.fn();
    render(
      <Wrapper>
        <ScheduleModal isOpen={true} date={TEST_DATE} existingEvent={null} onClose={onClose} onSaved={vi.fn()} />
      </Wrapper>,
    );
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('renders notes textarea with 300 char limit', () => {
    render(
      <Wrapper>
        <ScheduleModal isOpen={true} date={TEST_DATE} existingEvent={null} onClose={vi.fn()} onSaved={vi.fn()} />
      </Wrapper>,
    );
    const textarea = screen.getByPlaceholderText(/para qué ocasión/i);
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute('maxLength', '300');
  });
});
