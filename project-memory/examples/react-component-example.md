# React Component Creation Example — GarmentCard

> **Purpose:** Reference implementation for creating React components in the Closet Inteligente Digital project.
> **Pattern:** Component → Tests → Stories
> **Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, TanStack Query, Zustand, Framer Motion

---

## Component Specification

```
┌─────────────────────┐
│  ┌───────────────┐  │  <- Image container (4:5 aspect ratio)
│  │   [Image]     │  │     580x725px recommended
│  │               │  │     Object-fit: cover
│  └───────────────┘  │     Corner radius: 12px top
│  ┌───────────────┐  │  <- Info section (padding: 12px)
│  │ Garment Name  │  │     Font: heading-xs, weight 600
│  │ Brand • Color │  │     Font: body-xs, color neutral-500
│  │ [❤️] [👁️]   │  │     Actions row
│  └───────────────┘  │
└─────────────────────┘
```

---

## File 1: GarmentCard.tsx

```typescript
'use client';

import { useCallback, useMemo, type KeyboardEvent, type MouseEvent } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { cn } from '@/src/utils/cn';
import { useGarmentStore } from '@/src/stores/useGarmentStore';
import type { GarmentData } from '@/src/types/garment';

export interface GarmentCardProps {
  garment: GarmentData;
  isSelected?: boolean;
  isLoading?: boolean;
  hasError?: boolean;
  onSelect?: (garmentId: string) => void;
  onDoubleClick?: (garment: GarmentData) => void;
  onContextMenu?: (garment: GarmentData, event: MouseEvent) => void;
  onRetry?: (garmentId: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

type CardSizeConfig = {
  width: string;
  imageHeight: string;
  font: string;
  subFont: string;
};

const sizeConfig: Record<string, CardSizeConfig> = {
  sm: {
    width: 'w-36',
    imageHeight: 'h-44',
    font: 'text-xs',
    subFont: 'text-[10px]',
  },
  md: {
    width: 'w-44',
    imageHeight: 'h-56',
    font: 'text-sm',
    subFont: 'text-xs',
  },
  lg: {
    width: 'w-56',
    imageHeight: 'h-72',
    font: 'text-base',
    subFont: 'text-sm',
  },
};

const PLACEHOLDER_IMAGE = '/images/garment-placeholder.svg';

function GarmentCardSkeleton({ size = 'md' }: { size?: GarmentCardProps['size'] }) {
  const config = sizeConfig[size ?? 'md'];

  return (
    <div
      role="status"
      aria-label="Loading garment card"
      className={cn(
        'animate-pulse rounded-xl bg-white dark:bg-neutral-800',
        'shadow-sm border border-neutral-200 dark:border-neutral-700',
        config.width,
      )}
    >
      <div
        className={cn(
          'rounded-t-xl bg-neutral-200 dark:bg-neutral-700',
          config.imageHeight,
        )}
      />
      <div className="space-y-2 p-3">
        <div className="h-3 w-3/4 rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-2 w-1/2 rounded bg-neutral-200 dark:bg-neutral-700" />
      </div>
    </div>
  );
}

function GarmentCardError({
  garmentId,
  onRetry,
}: {
  garmentId: string;
  onRetry?: (garmentId: string) => void;
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border-2',
        'border-error-200 bg-error-50 p-4 text-center',
        'dark:border-error-800 dark:bg-error-900/20',
        'w-44 h-72',
      )}
    >
      <svg
        className="mb-2 h-8 w-8 text-error-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <p className="text-xs font-medium text-error-700 dark:text-error-300">
        Failed to load
      </p>
      {onRetry && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRetry(garmentId);
          }}
          className={cn(
            'mt-2 rounded-md px-3 py-1 text-xs font-medium',
            'bg-error-500 text-white hover:bg-error-600',
            'focus:outline-none focus:ring-2 focus:ring-error-500/50',
            'transition-colors',
          )}
          aria-label="Retry loading garment"
        >
          Retry
        </button>
      )}
    </div>
  );
}

function GarmentCardEmpty({ size = 'md' }: { size?: GarmentCardProps['size'] }) {
  const config = sizeConfig[size ?? 'md'];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl',
        'border-2 border-dashed border-neutral-300 bg-neutral-50',
        'dark:border-neutral-600 dark:bg-neutral-800/50',
        config.width,
        config.imageHeight,
        'p-4 text-center',
      )}
    >
      <svg
        className="mb-2 h-8 w-8 text-neutral-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        No image available
      </p>
    </div>
  );
}

export function GarmentCard({
  garment,
  isSelected: externalSelected,
  isLoading = false,
  hasError = false,
  onSelect,
  onDoubleClick,
  onContextMenu,
  onRetry,
  className,
  size = 'md',
}: GarmentCardProps) {
  const selectedGarmentId = useGarmentStore((state) => state.selectedGarmentId);
  const setSelectedGarment = useGarmentStore((state) => state.setSelectedGarment);

  const isSelected = externalSelected ?? selectedGarmentId === garment.id;
  const config = sizeConfig[size];

  const handleClick = useCallback(() => {
    setSelectedGarment(isSelected ? null : garment.id);
    onSelect?.(garment.id);
  }, [garment.id, isSelected, onSelect, setSelectedGarment]);

  const handleDoubleClick = useCallback(() => {
    onDoubleClick?.(garment);
  }, [garment, onDoubleClick]);

  const handleContextMenu = useCallback(
    (event: MouseEvent) => {
      event.preventDefault();
      onContextMenu?.(garment, event);
    },
    [garment, onContextMenu],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleClick();
      }
      if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
        event.preventDefault();
        onContextMenu?.(garment, event as unknown as MouseEvent);
      }
    },
    [handleClick, garment, onContextMenu],
  );

  const brandColorLabel = useMemo(() => {
    const parts: string[] = [];
    if (garment.brand) parts.push(garment.brand);
    if (garment.color) parts.push(garment.color);
    return parts.join(' • ') || null;
  }, [garment.brand, garment.color]);

  if (isLoading) {
    return <GarmentCardSkeleton size={size} />;
  }

  if (hasError) {
    return <GarmentCardError garmentId={garment.id} onRetry={onRetry} />;
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <div
        role="button"
        tabIndex={0}
        aria-label={`${garment.name}${isSelected ? ' — Selected' : ''}`}
        aria-selected={isSelected}
        aria-busy={garment.state === 'processing'}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        onKeyDown={handleKeyDown}
        className={cn(
          'group relative cursor-pointer overflow-hidden rounded-xl',
          'border-2 bg-white shadow-sm',
          'dark:bg-neutral-800',
          'hover:shadow-md',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
          'dark:focus-visible:ring-offset-neutral-900',
          'transition-all duration-200 ease-smooth',
          isSelected
            ? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/20'
            : 'border-transparent hover:scale-[1.02]',
          config.width,
          className,
        )}
      >
        <div
          className={cn(
            'relative overflow-hidden',
            config.imageHeight,
            'bg-neutral-100 dark:bg-neutral-700',
          )}
        >
          {garment.imageUrl ? (
            <Image
              src={garment.imageUrl}
              alt={garment.name}
              fill
              sizes={
                size === 'lg'
                  ? '224px'
                  : size === 'sm'
                    ? '144px'
                    : '176px'
              }
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              priority={false}
              loading="lazy"
              onError={(e) => {
                const target = e.currentTarget;
                target.src = PLACEHOLDER_IMAGE;
              }}
            />
          ) : (
            <GarmentCardEmpty size={size} />
          )}

          {garment.state === 'processing' && (
            <div
              className="absolute inset-0 flex items-center justify-center bg-black/40"
              aria-label="Processing"
            >
              <div
                className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent"
                role="status"
              >
                <span className="sr-only">Processing garment image</span>
              </div>
            </div>
          )}

          {garment.state === 'error' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="rounded-md bg-error-500 px-2 py-0.5 text-xs font-medium text-white">
                Error
              </span>
            </div>
          )}

          {garment.state === 'archived' && (
            <div className="absolute right-2 top-2">
              <span
                className={cn(
                  'rounded-md bg-neutral-900/70 px-2 py-0.5',
                  'text-[10px] font-medium text-white',
                  'backdrop-blur-sm',
                )}
              >
                Archived
              </span>
            </div>
          )}
        </div>

        <div className="space-y-1 p-3">
          <h3
            className={cn(
              'font-semibold leading-tight text-neutral-800',
              'dark:text-neutral-100',
              'line-clamp-2',
              config.font,
            )}
            title={garment.name}
          >
            {garment.name}
          </h3>

          {brandColorLabel && (
            <p
              className={cn(
                'text-neutral-500 dark:text-neutral-400',
                'truncate',
                config.subFont,
              )}
            >
              {brandColorLabel}
            </p>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
              }}
              className={cn(
                'rounded-full p-1 text-neutral-400',
                'hover:text-error-500 hover:bg-error-50',
                'dark:hover:text-error-400 dark:hover:bg-error-900/20',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                'transition-colors',
              )}
              aria-label={`Add ${garment.name} to favorites`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
              }}
              className={cn(
                'rounded-full p-1 text-neutral-400',
                'hover:text-primary-500 hover:bg-primary-50',
                'dark:hover:text-primary-400 dark:hover:bg-primary-900/20',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                'transition-colors',
              )}
              aria-label={`View ${garment.name} details`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
```

---

## File 2: GarmentCard.test.tsx

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { GarmentCard, type GarmentCardProps } from './GarmentCard';
import type { GarmentData } from '@/src/types/garment';

vi.mock('@/src/stores/useGarmentStore', () => ({
  useGarmentStore: vi.fn((selector) => {
    const state = {
      selectedGarmentId: null,
      setSelectedGarment: vi.fn(),
    };
    return selector(state);
  }),
}));

const createMockGarment = (overrides: Partial<GarmentData> = {}): GarmentData => ({
  id: 'garment-1',
  userId: 'user-1',
  name: 'Blue Denim Jacket',
  description: 'A classic blue denim jacket',
  type: 'outerwear' as const,
  category: 'jacket' as const,
  state: 'ready' as const,
  brand: 'Levi',
  color: 'Blue',
  colorHex: '#1a5c8a',
  size: 'M',
  material: 'Denim',
  imageUrl: 'https://example.com/jacket.jpg',
  thumbnailUrl: null,
  maskUrl: null,
  aiTags: null,
  pipelineStatus: null,
  position: 0,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-15'),
  ...overrides,
});

const renderCard = (props: Partial<GarmentCardProps> = {}) => {
  const garment = createMockGarment(props.garment ?? {});
  return render(
    <GarmentCard
      garment={garment}
      isSelected={props.isSelected}
      isLoading={props.isLoading}
      hasError={props.hasError}
      onSelect={props.onSelect}
      onDoubleClick={props.onDoubleClick}
      onContextMenu={props.onContextMenu}
      onRetry={props.onRetry}
      size={props.size}
      className={props.className}
    />,
  );
};

describe('GarmentCard', () => {
  describe('Default state', () => {
    it('should render garment name', () => {
      renderCard();
      expect(screen.getByText('Blue Denim Jacket')).toBeInTheDocument();
    });

    it('should render brand and color', () => {
      renderCard();
      expect(screen.getByText('Levi • Blue')).toBeInTheDocument();
    });

    it('should render image with alt text', () => {
      renderCard();
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt', 'Blue Denim Jacket');
    });

    it('should have correct aria-label', () => {
      renderCard();
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('aria-label', 'Blue Denim Jacket');
    });

    it('should be focusable via keyboard', () => {
      renderCard();
      const card = screen.getByRole('button');
      card.focus();
      expect(card).toHaveFocus();
    });
  });

  describe('Selected state', () => {
    it('should show selected border when isSelected is true', () => {
      const { container } = renderCard({ isSelected: true });
      const card = container.querySelector('[role="button"]');
      expect(card).toHaveClass('border-primary-500');
    });

    it('should announce selected state via aria-label', () => {
      renderCard({ isSelected: true });
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('aria-label', 'Blue Denim Jacket — Selected');
    });

    it('should set aria-selected to true', () => {
      renderCard({ isSelected: true });
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Loading state (skeleton)', () => {
    it('should render skeleton when isLoading is true', () => {
      const { container } = renderCard({ isLoading: true });
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('should have loading status for screen readers', () => {
      renderCard({ isLoading: true });
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading garment card');
    });

    it('should not render garment content when loading', () => {
      renderCard({ isLoading: true });
      expect(screen.queryByText('Blue Denim Jacket')).not.toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('should show error message when hasError is true', () => {
      renderCard({ hasError: true });
      expect(screen.getByText('Failed to load')).toBeInTheDocument();
    });

    it('should show retry button when onRetry is provided', () => {
      const onRetry = vi.fn();
      renderCard({ hasError: true, onRetry });
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('should call onRetry when retry button is clicked', async () => {
      const onRetry = vi.fn();
      renderCard({
        hasError: true,
        onRetry,
        garment: createMockGarment({ id: 'garment-1' }),
      });
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await userEvent.click(retryButton);
      expect(onRetry).toHaveBeenCalledWith('garment-1');
    });

    it('should have alert role for screen readers', () => {
      renderCard({ hasError: true });
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('Empty state (no image)', () => {
    it('should show placeholder when imageUrl is empty', () => {
      renderCard({ garment: createMockGarment({ imageUrl: '' }) });
      expect(screen.getByText('No image available')).toBeInTheDocument();
    });

    it('should fallback to placeholder on image error', () => {
      renderCard();
      const image = screen.getByRole('img');
      fireEvent.error(image);
      expect(image).toHaveAttribute('src', '/images/garment-placeholder.svg');
    });
  });

  describe('Event handlers', () => {
    it('should call onSelect when clicked', async () => {
      const onSelect = vi.fn();
      renderCard({ onSelect });
      const card = screen.getByRole('button');
      await userEvent.click(card);
      expect(onSelect).toHaveBeenCalledWith('garment-1');
    });

    it('should call onDoubleClick when double-clicked', async () => {
      const onDoubleClick = vi.fn();
      renderCard({ onDoubleClick });
      const card = screen.getByRole('button');
      await userEvent.dblClick(card);
      expect(onDoubleClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'garment-1' }));
    });

    it('should call onContextMenu on right-click', async () => {
      const onContextMenu = vi.fn();
      renderCard({ onContextMenu });
      const card = screen.getByRole('button');
      fireEvent.contextMenu(card);
      expect(onContextMenu).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'garment-1' }),
        expect.any(MouseEvent),
      );
    });

    it('should call onSelect on Enter key', () => {
      const onSelect = vi.fn();
      renderCard({ onSelect });
      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: 'Enter' });
      expect(onSelect).toHaveBeenCalledWith('garment-1');
    });

    it('should call onSelect on Space key', () => {
      const onSelect = vi.fn();
      renderCard({ onSelect });
      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: ' ' });
      expect(onSelect).toHaveBeenCalledWith('garment-1');
    });
  });

  describe('Garment states', () => {
    it('should show processing overlay for processing garments', () => {
      renderCard({ garment: createMockGarment({ state: 'processing' }) });
      expect(screen.getByLabelText('Processing garment image')).toBeInTheDocument();
    });

    it('should show error badge for error state garments', () => {
      renderCard({ garment: createMockGarment({ state: 'error' }) });
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('should show archived badge for archived garments', () => {
      renderCard({ garment: createMockGarment({ state: 'archived' }) });
      expect(screen.getByText('Archived')).toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    it('should render small size', () => {
      const { container } = renderCard({ size: 'sm' });
      const card = container.querySelector('[role="button"]');
      expect(card).toHaveClass('w-36');
    });

    it('should render medium size by default', () => {
      const { container } = renderCard();
      const card = container.querySelector('[role="button"]');
      expect(card).toHaveClass('w-44');
    });

    it('should render large size', () => {
      const { container } = renderCard({ size: 'lg' });
      const card = container.querySelector('[role="button"]');
      expect(card).toHaveClass('w-56');
    });
  });

  describe('Brand/Color display', () => {
    it('should not show brand-color line when both are empty', () => {
      renderCard({
        garment: createMockGarment({ brand: null, color: null }),
      });
      expect(screen.queryByText('•')).not.toBeInTheDocument();
    });

    it('should show only brand when color is missing', () => {
      renderCard({
        garment: createMockGarment({ color: null }),
      });
      expect(screen.getByText('Levi')).toBeInTheDocument();
    });

    it('should show only color when brand is missing', () => {
      renderCard({
        garment: createMockGarment({ brand: null }),
      });
      expect(screen.getByText('Blue')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have correct ARIA attributes', () => {
      renderCard();
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('tabIndex', '0');
      expect(card).toHaveAttribute('aria-selected', 'false');
    });

    it('should have focus-visible ring styles', () => {
      const { container } = renderCard();
      const card = container.querySelector('[role="button"]');
      expect(card).toHaveClass('focus-visible:ring-2');
      expect(card).toHaveClass('focus-visible:ring-primary-500');
    });

    it('should stop propagation when clicking favorite button', async () => {
      const onSelect = vi.fn();
      renderCard({ onSelect });
      const favButton = screen.getByLabelText('Add Blue Denim Jacket to favorites');
      await userEvent.click(favButton);
      expect(onSelect).not.toHaveBeenCalled();
    });
  });
});
```

---

## File 3: GarmentCard.stories.tsx

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { GarmentCard } from './GarmentCard';
import type { GarmentData } from '@/src/types/garment';

const meta: Meta<typeof GarmentCard> = {
  title: 'Components/GarmentCard',
  component: GarmentCard,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'light' },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    isSelected: { control: 'boolean' },
    isLoading: { control: 'boolean' },
    hasError: { control: 'boolean' },
    onSelect: { action: 'selected' },
    onDoubleClick: { action: 'doubleClicked' },
    onContextMenu: { action: 'contextMenu' },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GarmentCard>;

const baseGarment: GarmentData = {
  id: 'garment-1',
  userId: 'user-1',
  name: 'Blue Denim Jacket',
  description: 'A stylish blue denim jacket with silver buttons',
  type: 'outerwear',
  category: 'jacket',
  state: 'ready',
  brand: 'Levi',
  color: 'Blue',
  colorHex: '#1a5c8a',
  size: 'M',
  material: 'Denim',
  imageUrl: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=400',
  thumbnailUrl: null,
  maskUrl: null,
  aiTags: null,
  pipelineStatus: null,
  position: 0,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-15'),
};

const longNameGarment: GarmentData = {
  ...baseGarment,
  id: 'garment-2',
  name: 'Vintage-Inspired Oversized Wool Blend Peacoat with Leather Buttons',
  brand: 'Ralph Lauren',
};

const noImageGarment: GarmentData = {
  ...baseGarment,
  id: 'garment-3',
  name: 'Garment Without Image',
  imageUrl: '',
};

export const Default: Story = {
  args: {
    garment: baseGarment,
    size: 'md',
  },
};

export const Selected: Story = {
  args: {
    garment: baseGarment,
    isSelected: true,
  },
};

export const Loading: Story = {
  args: {
    garment: baseGarment,
    isLoading: true,
  },
};

export const Error: Story = {
  args: {
    garment: baseGarment,
    hasError: true,
    onRetry: (id: string) => console.log('Retry:', id),
  },
};

export const EmptyNoImage: Story = {
  args: {
    garment: noImageGarment,
  },
};

export const Processing: Story = {
  args: {
    garment: { ...baseGarment, state: 'processing' },
  },
};

export const Archived: Story = {
  args: {
    garment: { ...baseGarment, state: 'archived' },
  },
};

export const ErrorState: Story = {
  args: {
    garment: { ...baseGarment, state: 'error' },
  },
};

export const SmallSize: Story = {
  args: {
    garment: baseGarment,
    size: 'sm',
  },
};

export const LargeSize: Story = {
  args: {
    garment: baseGarment,
    size: 'lg',
  },
};

export const LongName: Story = {
  args: {
    garment: longNameGarment,
  },
};

export const WithoutBrand: Story = {
  args: {
    garment: { ...baseGarment, brand: null },
  },
};

export const WithoutColor: Story = {
  args: {
    garment: { ...baseGarment, color: null },
  },
};

export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
    theme: 'dark',
  },
  args: {
    garment: baseGarment,
  },
};

export const GridLayout: Story = {
  decorators: [
    (Story) => (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <Story />
        <Story />
        <Story />
        <Story />
      </div>
    ),
  ],
  args: {
    garment: baseGarment,
  },
};

export const InteractiveSelected: Story = {
  args: {
    garment: baseGarment,
  },
  play: async ({ canvasElement }) => {
    const card = canvasElement.querySelector('[role="button"]');
    if (card) {
      card.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }
  },
};
```

---

## Key Patterns Demonstrated

| Pattern | Implementation |
|---------|---------------|
| **TypeScript Interfaces** | `GarmentCardProps` with full type safety, proper defaults |
| **Tailwind CSS** | Utility classes with `cn()` helper, dark mode `dark:` prefix |
| **Zustand Store Interaction** | `useGarmentStore` selector for `selectedGarmentId` |
| **TanStack Query** | State-driven rendering based on `garment.state` |
| **Next.js Image Optimization** | `Image` component with `fill`, `sizes`, `loading="lazy"` |
| **Component States** | `default`, `selected`, `loading`, `error`, `empty` |
| **Accessibility** | ARIA labels, `role="button"`, keyboard nav, focus ring |
| **Event Handlers** | `onClick`, `onDoubleClick`, `onContextMenu`, stopPropagation |
| **Responsive Design** | `size` prop with `sm`, `md`, `lg` configurations |
| **Framer Motion** | `motion.div` with layout animations and exit transitions |
| **Testing** | Vitest with render, userEvent, all states covered |
| **Storybook** | 18 stories covering all states, sizes, and edge cases |
