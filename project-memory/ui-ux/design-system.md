# Closet Inteligente Digital — Design System

> **Version:** 1.0.0
> **Status:** APPROVED
> **Last Updated:** 2026-05-25
> **Framework:** Tailwind CSS 3.4.x via `tailwind.config.ts`

---

## 1. Color Palette

### 1.1 Light Mode

| Token | Tailwind Variable | Hex | Usage |
|---|---|---|---|
| **Primary** | `primary-50` | `#F0F7FF` | Primary background (lightest) |
| `primary-100` | `#E0EFFF` | Hover state backgrounds |
| `primary-200` | `#B8DCFF` | Active state backgrounds |
| `primary-300` | `#8AC4FF` | Border hover |
| `primary-400` | `#5CA8FF` | Border active, disabled text |
| `primary-500` | `#3B82F6` | **Default primary** — buttons, links, active states |
| `primary-600` | `#2563EB` | Hover — buttons, links |
| `primary-700` | `#1D4ED8` | Active — pressed states |
| `primary-800` | `#1E3A8A` | Text on light backgrounds |
| `primary-900` | `#172554` | Darkest primary text |
| **Secondary** | `secondary-50` | `#F5F3FF` | Secondary backgrounds |
| `secondary-100` | `#EDE9FE` | Secondary hover backgrounds |
| `secondary-200` | `#DDD6FE` | Secondary borders |
| `secondary-300` | `#C4B5FD` | Secondary active borders |
| `secondary-400` | `#A78BFA` | Secondary disabled |
| `secondary-500` | `#8B5CF6` | **Default secondary** |
| `secondary-600` | `#7C3AED` | Secondary hover |
| `secondary-700` | `#6D28D9` | Secondary active |
| `secondary-800` | `#5B21B6` | Secondary text |
| `secondary-900` | `#4C1D95` | Secondary darkest |
| **Accent** | `accent-50` | `#FFF7ED` | Accent backgrounds |
| `accent-500` | `#F97316` | **Default accent** — highlights, promotions |
| `accent-600` | `#EA580C` | Accent hover |
| `accent-700` | `#C2410C` | Accent active |
| **Neutral** | `neutral-50` | `#FAFAFA` | Page background |
| `neutral-100` | `#F5F5F5` | Card backgrounds |
| `neutral-200` | `#E5E5E5` | Borders, dividers |
| `neutral-300` | `#D4D4D4` | Disabled backgrounds |
| `neutral-400` | `#A3A3A3` | Disabled text |
| `neutral-500` | `#737373` | Placeholder text |
| `neutral-600` | `#525252` | Secondary text |
| `neutral-700` | `#404040` | Body text |
| `neutral-800` | `#262626` | Heading text |
| `neutral-900` | `#171717` | Darkest text |
| **Success** | `success-50` | `#F0FDF4` | Success background |
| `success-100` | `#DCFCE7` | Success light background |
| `success-200` | `#BBF7D0` | Success border light |
| `success-300` | `#86EFAC` | Success border |
| `success-400` | `#4ADE80` | Success icon |
| `success-500` | `#22C55E` | **Default success** |
| `success-600` | `#16A34A` | Success hover |
| `success-700` | `#15803D` | Success text |
| **Warning** | `warning-50` | `#FFFBEB` | Warning background |
| `warning-100` | `#FEF3C7` | Warning light background |
| `warning-200` | `#FDE68A` | Warning border light |
| `warning-300` | `#FCD34D` | Warning border |
| `warning-400` | `#FBBF24` | Warning icon |
| `warning-500` | `#F59E0B` | **Default warning** |
| `warning-600` | `#D97706` | Warning hover |
| `warning-700` | `#B45309` | Warning text |
| **Error** | `error-50` | `#FEF2F2` | Error background |
| `error-100` | `#FEE2E2` | Error light background |
| `error-200` | `#FECACA` | Error border light |
| `error-300` | `#FCA5A5` | Error border |
| `error-400` | `#F87171` | Error icon |
| `error-500` | `#EF4444` | **Default error** |
| `error-600` | `#DC2626` | Error hover |
| `error-700` | `#B91C1C` | Error text |
| **Info** | `info-50` | `#EFF6FF` | Info background |
| `info-100` | `#DBEAFE` | Info light background |
| `info-200` | `#BFDBFE` | Info border light |
| `info-300` | `#93C5FD` | Info border |
| `info-400` | `#60A5FA` | Info icon |
| `info-500` | `#3B82F6` | **Default info** |
| `info-600` | `#2563EB` | Info hover |
| `info-700` | `#1D4ED8` | Info text |

### 1.2 Dark Mode Overrides

| Light Token | Dark Token | Hex |
|---|---|---|
| `neutral-50` | `neutral-950` | `#0A0A0A` |
| `neutral-100` | `neutral-900` | `#171717` |
| `neutral-200` | `neutral-800` | `#262626` |
| `neutral-300` | `neutral-700` | `#404040` |
| `neutral-400` | `neutral-600` | `#525252` |
| `neutral-500` | `neutral-400` | `#A3A3A3` |
| `neutral-600` | `neutral-300` | `#D4D4D4` |
| `neutral-700` | `neutral-200` | `#E5E5E5` |
| `neutral-800` | `neutral-100` | `#F5F5F5` |
| `neutral-900` | `neutral-50` | `#FAFAFA` |
| `primary-500` | `primary-400` | `#5CA8FF` |
| `primary-600` | `primary-300` | `#8AC4FF` |
| `secondary-500` | `secondary-400` | `#A78BFA` |
| `accent-500` | `accent-400` | `#FB923C` |
| `success-500` | `success-400` | `#4ADE80` |
| `warning-500` | `warning-400` | `#FBBF24` |
| `error-500` | `error-400` | `#F87171` |
| `info-500` | `info-400` | `#60A5FA` |

### 1.3 Surface Colors

| Token | Light | Dark | Usage |
|---|---|---|---|
| `surface-primary` | `#FFFFFF` | `#0A0A0A` | Main surface |
| `surface-secondary` | `#FAFAFA` | `#171717` | Secondary surface |
| `surface-tertiary` | `#F5F5F5` | `#262626` | Tertiary surface |
| `surface-elevated` | `#FFFFFF` | `#1A1A1A` | Cards, modals, dropdowns |
| `surface-inverse` | `#171717` | `#FAFAFA` | Inverse surface |
| `overlay` | `rgba(0,0,0,0.5)` | `rgba(0,0,0,0.7)` | Modal/drawer overlays |

---

## 2. Typography

### 2.1 Font Families

| Token | Family | Fallback | Usage |
|---|---|---|---|
| `font-sans` | `'Inter'` | `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` | Body text, UI elements |
| `font-display` | `'Plus Jakarta Sans'` | `'Inter', system-ui, sans-serif` | Headings, display text |
| `font-mono` | `'JetBrains Mono'` | `'Fira Code', 'Cascadia Code', monospace` | Code, numbers, measurements |

### 2.2 Font Sizes, Weights & Line Heights

#### Display / Headings

| Token | Size | Weight | Line Height | Letter Spacing | Usage |
|---|---|---|---|---|---|
| `display-xl` | `4.5rem` (72px) | 700 (Bold) | `1.1` | `-0.02em` | Hero titles |
| `display-lg` | `3.75rem` (60px) | 700 | `1.1` | `-0.02em` | Landing page headings |
| `display-md` | `3rem` (48px) | 700 | `1.15` | `-0.02em` | Section headings |
| `display-sm` | `2.25rem` (36px) | 650 | `1.2` | `-0.015em` | Page titles |
| `heading-xl` | `1.875rem` (30px) | 650 | `1.25` | `-0.015em` | Main section titles |
| `heading-lg` | `1.5rem` (24px) | 600 | `1.3` | `-0.01em` | Card headings |
| `heading-md` | `1.25rem` (20px) | 600 | `1.35` | `-0.01em` | Subsection titles |
| `heading-sm` | `1.125rem` (18px) | 600 | `1.4` | `-0.01em` | Small card titles |
| `heading-xs` | `1rem` (16px) | 600 | `1.45` | `0` | Component headings |

#### Body

| Token | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| `body-lg` | `1.125rem` (18px) | 400 | `1.6` | Large body, descriptions |
| `body-md` | `1rem` (16px) | 400 | `1.6` | Default body text |
| `body-sm` | `0.875rem` (14px) | 400 | `1.55` | Secondary text, metadata |
| `body-xs` | `0.75rem` (12px) | 400 | `1.5` | Captions, timestamps |
| `body-2xs` | `0.625rem` (10px) | 400 | `1.5` | Legal notices, tiny labels |

#### Label / Button

| Token | Size | Weight | Line Height | Letter Spacing | Usage |
|---|---|---|---|---|---|
| `label-lg` | `1rem` (16px) | 500 | `1.4` | `+0.01em` | Large buttons |
| `label-md` | `0.875rem` (14px) | 500 | `1.4` | `+0.01em` | Default buttons |
| `label-sm` | `0.75rem` (12px) | 500 | `1.4` | `+0.01em` | Small buttons, chips |
| `label-xs` | `0.625rem` (10px) | 600 | `1.4` | `+0.02em` | Badge text, tag text |

#### Caption / Overline

| Token | Size | Weight | Line Height | Letter Spacing | Usage |
|---|---|---|---|---|---|
| `caption` | `0.75rem` (12px) | 400 | `1.4` | `0` | Image captions |
| `overline` | `0.75rem` (12px) | 600 | `1.4` | `+0.08em` | Overline labels, stats |
| `legal` | `0.625rem` (10px) | 400 | `1.5` | `0` | Legal text, footnotes |

### 2.3 Font Weight Scale

| Weight Value | Name | Token |
|---|---|---|
| 400 | Regular | `font-normal` |
| 450 | Book | `font-book` (custom) |
| 500 | Medium | `font-medium` |
| 600 | Semi-Bold | `font-semibold` |
| 650 | Bold (display) | Custom |
| 700 | Bold | `font-bold` |

---

## 3. Spacing Scale

Base unit: **4px** (0.25rem)

| Token | rem | px | Example Usage |
|---|---|---|---|
| `space-0` | `0` | `0` | No spacing |
| `space-0.5` | `0.125rem` | `2px` | Minimal gap, inner icon spacing |
| `space-1` | `0.25rem` | `4px` | Tiny gaps, button text padding |
| `space-1.5` | `0.375rem` | `6px` | Small inner padding |
| `space-2` | `0.5rem` | `8px` | Input padding, icon margins |
| `space-2.5` | `0.625rem` | `10px` | Button horizontal padding |
| `space-3` | `0.75rem` | `12px` | Card padding, element gaps |
| `space-3.5` | `0.875rem` | `14px` | Fine-tuned spacing |
| `space-4` | `1rem` | `16px` | Standard gap, section padding |
| `space-5` | `1.25rem` | `20px` | Card internal margins |
| `space-6` | `1.5rem` | `24px` | Section spacing, form gaps |
| `space-7` | `1.75rem` | `28px` | Content margins |
| `space-8` | `2rem` | `32px` | Large card padding |
| `space-9` | `2.25rem` | `36px` | Section separation |
| `space-10` | `2.5rem` | `40px` | Page section spacing |
| `space-11` | `2.75rem` | `44px` | Touch target minimum |
| `space-12` | `3rem` | `48px` | Large section gaps |
| `space-14` | `3.5rem` | `56px` | Page margins |
| `space-16` | `4rem` | `64px` | Page section padding |
| `space-20` | `5rem` | `80px` | Large page breaks |
| `space-24` | `6rem` | `96px` | Hero section padding |
| `space-28` | `7rem` | `112px` | Hero spacing |
| `space-32` | `8rem` | `128px` | Maximum content padding |
| `space-36` | `9rem` | `144px` | Extreme spacing |
| `space-40` | `10rem` | `160px` | Full-page section gaps |

---

## 4. Border Radius Scale

| Token | rem | px | Usage |
|---|---|---|---|
| `radius-none` | `0` | `0` | No rounding |
| `radius-sm` | `0.125rem` | `2px` | Checkbox, small elements |
| `radius-md` | `0.25rem` | `4px` | Inputs, buttons |
| `radius-lg` | `0.375rem` | `6px` | Cards, dropdowns |
| `radius-xl` | `0.5rem` | `8px` | Modals, drawers |
| `radius-2xl` | `0.75rem` | `12px` | Large cards, dialogs |
| `radius-3xl` | `1rem` | `16px` | Sheets, bottom nav |
| `radius-4xl` | `1.5rem` | `24px` | Pill-shaped, tags |
| `radius-full` | `9999px` | `9999px` | Circular — avatars, icons, pills |

---

## 5. Shadow Scale

| Token | Value | Usage |
|---|---|---|
| `shadow-xs` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | Subtle depth |
| `shadow-sm` | `0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)` | Card default |
| `shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)` | Elevated cards |
| `shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` | Dropdowns, popovers |
| `shadow-xl` | `0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)` | Modals |
| `shadow-2xl` | `0 25px 50px -12px rgb(0 0 0 / 0.25)` | Drawers, full-screen dialogs |
| `shadow-inner` | `inset 0 2px 4px 0 rgb(0 0 0 / 0.05)` | Inset depth |

### Dark Mode Shadow Overrides

All shadow opacities are reduced by 50% in dark mode to maintain visual hierarchy without harsh contrast:

| Token | Dark Value |
|---|---|
| `shadow-sm` | `0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.2)` |
| `shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.35), 0 2px 4px -2px rgb(0 0 0 / 0.25)` |
| `shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.3)` |
| `shadow-xl` | `0 20px 25px -5px rgb(0 0 0 / 0.45), 0 8px 10px -6px rgb(0 0 0 / 0.35)` |
| `shadow-2xl` | `0 25px 50px -12px rgb(0 0 0 / 0.5)` |

---

## 6. Z-Index Scale

| Token | Value | Usage |
|---|---|---|
| `z-base` | `0` | Page content |
| `z-sticky` | `10` | Sticky headers, sidebar |
| `z-dropdown` | `20` | Dropdown menus, popovers |
| `z-sticky-below` | `30` | Elements that should stay below tooltips but above dropdowns |
| `z-tooltip` | `40` | Tooltips, hints |
| `z-nav-overlay` | `50` | Mobile nav overlay |
| `z-sidebar` | `60` | Sidebar panel |
| `z-fab` | `70` | Floating action buttons |
| `z-header` | `80` | Top navigation bar |
| `z-modal-backdrop` | `90` | Modal overlay background |
| `z-modal` | `100` | Modal dialogs, drawers |
| `z-toast` | `110` | Toast notifications |
| `z-loading` | `120` | Full-page loading spinner |
| `z-tooltip-global` | `130` | Global tooltips (above everything) |

---

## 7. Breakpoints

| Name | Token | Min Width | Primary Target |
|---|---|---|---|
| xs | `xs` | `375px` | Small mobile devices |
| sm | `sm` | `640px` | Large mobile / phablet |
| md | `md` | `768px` | Tablet portrait |
| lg | `lg` | `1024px` | Tablet landscape / small desktop |
| xl | `xl` | `1280px` | Desktop |
| 2xl | `2xl` | `1536px` | Large desktop |

### Tailwind Configuration

```typescript
// tailwind.config.ts
screens: {
  xs: '375px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
}
```

### Responsive Strategy

- **Mobile-first**: All base styles target `xs`. Use `sm:`, `md:`, etc. to override upward.
- **Breakpoint usage**:
  - `xs`: Single column, bottom navigation, full-width inputs
  - `sm`: Two-column grid begins, sidebar can show as overlay
  - `md`: Sidebar pinned, three-column grids, multi-panel layouts
  - `lg`: Full desktop layout, max-width containers, side-by-side panels
  - `xl`: Extended content, large data tables, multi-column analytics
  - `2xl`: Ultra-wide optimization, max content width 1440px

---

## 8. Animation Tokens

### 8.1 Duration

| Token | Milliseconds | Usage |
|---|---|---|
| `duration-0` | `0ms` | Instant |
| `duration-50` | `50ms` | Micro-interactions (button press) |
| `duration-100` | `100ms` | Hover effects, tooltip show |
| `duration-150` | `150ms` | Focus ring, color transitions |
| `duration-200` | `200ms` | Dropdown open/close |
| `duration-250` | `250ms` | Panel slide, accordion |
| `duration-300` | `300ms` | Modal open, drawer slide |
| `duration-400` | `400ms` | Page transitions |
| `duration-500` | `500ms` | Toast in/out |
| `duration-700` | `700ms` | Loading shimmer |
| `duration-1000` | `1000ms` | Skeleton pulse |
| `duration-2000` | `2000ms` | Spinner rotation |

### 8.2 Easing Functions

| Token | Cubic Bezier | Usage |
|---|---|---|
| `ease-linear` | `0, 0, 1, 1` | Progress bars, spinners |
| `ease-in` | `0.4, 0, 1, 1` | Elements entering screen |
| `ease-out` | `0, 0, 0.2, 1` | Elements exiting screen |
| `ease-in-out` | `0.4, 0, 0.2, 1` | Moderate transitions |
| `ease-emphasized-in` | `0.5, 0, 1, 0.5` | Dramatic entrance |
| `ease-emphasized-out` | `0, 0, 0.2, 1.5` | Dramatic exit |
| `ease-spring` | `0.34, 1.56, 0.64, 1` | Bouncy spring effect |
| `ease-smooth` | `0.22, 1, 0.36, 1` | Smooth transitions |

### 8.3 Motion Safety

All animations must respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

In Tailwind, use the `motion-safe:` and `motion-reduce:` variants:

```tsx
<div className="motion-safe:animate-fade-in motion-reduce:opacity-100">
```

---

## 9. Iconography

### 9.1 Icon Library

- **Primary**: [Lucide React](https://lucide.dev) v0.300+ — open-source, consistent, tree-shakeable
- **Fallback**: Inline SVG for custom icons not in Lucide (brand-specific, 3D-related)
- **Package**: `lucide-react@^0.300.0`

### 9.2 Icon Sizing

| Token | Size | Usage |
|---|---|---|
| `icon-2xs` | `12px` | Inline with body-xs |
| `icon-xs` | `14px` | Inline with body-sm |
| `icon-sm` | `16px` | Default inline icon, button with text |
| `icon-md` | `20px` | Icon-only buttons, list items |
| `icon-lg` | `24px` | Navigation icons, stat icons |
| `icon-xl` | `32px` | Empty state illustrations |
| `icon-2xl` | `48px` | Feature icons, avatars |
| `icon-3xl` | `64px` | Hero graphics |

### 9.3 Icon Color

Icons inherit `currentColor` by default. Use with text color utilities:

```tsx
<Heart className="w-5 h-5 text-error-500" />
```

- Informational icons: `text-neutral-500`
- Interactive icons: `text-primary-500` (hover: `text-primary-600`)
- Success icons: `text-success-500`
- Error icons: `text-error-500`
- Warning icons: `text-warning-500`

### 9.4 Icon Stroke Width

- **Default**: `strokeWidth={2}` (standard Lucide default)
- **Thin**: `strokeWidth={1.5}` (detailed icons, data viz)
- **Thick**: `strokeWidth={2.5}` (navigation, primary actions)

### 9.5 Icon Accessibility

- Decorative icons: `aria-hidden="true"` (most icons)
- Interactive icons: `aria-label` with descriptive text
- Standalone icon buttons: always include tooltip or `aria-label`

---

## 10. Component-Specific Design Tokens

### 10.1 Button Tokens

| Token | Value |
|---|---|
| `button-height-sm` | `32px` (space-8) |
| `button-height-md` | `40px` (space-10) |
| `button-height-lg` | `48px` (space-12) |
| `button-padding-x-sm` | `12px` (space-3) |
| `button-padding-x-md` | `16px` (space-4) |
| `button-padding-x-lg` | `20px` (space-5) |
| `button-radius` | `8px` (radius-xl) |
| `button-font-sm` | `0.75rem` (label-sm) |
| `button-font-md` | `0.875rem` (label-md) |
| `button-font-lg` | `1rem` (label-lg) |

### 10.2 Input Tokens

| Token | Value |
|---|---|
| `input-height-sm` | `32px` (space-8) |
| `input-height-md` | `40px` (space-10) |
| `input-height-lg` | `48px` (space-12) |
| `input-padding-x` | `12px` (space-3) |
| `input-padding-y` | `8px` (space-2) |
| `input-radius` | `8px` (radius-xl) |
| `input-border-width` | `1px` |
| `input-border-color` | `neutral-300` (light), `neutral-700` (dark) |
| `input-border-color-focus` | `primary-500` (light), `primary-400` (dark) |
| `input-border-color-error` | `error-500` (light), `error-400` (dark) |
| `input-bg` | `white` (light), `neutral-900` (dark) |
| `input-placeholder-color` | `neutral-400` (light), `neutral-500` (dark) |
| `input-label-color` | `neutral-700` (light), `neutral-300` (dark) |
| `input-label-font` | `0.875rem` weight 500 |
| `input-helper-font` | `0.75rem` (body-xs) |
| `input-error-font` | `0.75rem` weight 500, error color |

### 10.3 Card Tokens

| Token | Value |
|---|---|
| `card-radius` | `12px` (radius-2xl) |
| `card-padding` | `16px` (space-4) |
| `card-padding-lg` | `24px` (space-6) |
| `card-shadow` | `shadow-sm` |
| `card-shadow-hover` | `shadow-md` |
| `card-bg` | `white` (light), `neutral-900` (dark) |
| `card-border` | `1px solid neutral-200` (light), `1px solid neutral-800` (dark) |
| `card-gap` | `12px` (space-3) |

### 10.4 Modal Tokens

| Token | Value |
|---|---|
| `modal-radius` | `16px` (radius-3xl) |
| `modal-padding` | `24px` (space-6) |
| `modal-shadow` | `shadow-xl` |
| `modal-max-width-sm` | `400px` |
| `modal-max-width-md` | `560px` |
| `modal-max-width-lg` | `720px` |
| `modal-max-width-xl` | `960px` |
| `modal-backdrop-bg` | `rgba(0,0,0,0.5)` (light), `rgba(0,0,0,0.7)` (dark) |
| `modal-animation-duration` | `300ms` |
| `modal-animation-easing` | `ease-emphasized-out` |

### 10.5 Sidebar Tokens

| Token | Value |
|---|---|
| `sidebar-width` | `280px` (17.5rem) |
| `sidebar-collapsed-width` | `64px` (4rem) |
| `sidebar-bg` | `white` (light), `neutral-900` (dark) |
| `sidebar-border` | `1px solid neutral-200` (light), `1px solid neutral-800` (dark) |
| `sidebar-item-height` | `44px` (space-11) |
| `sidebar-item-radius` | `8px` (radius-xl) |
| `sidebar-item-padding-x` | `12px` (space-3) |
| `sidebar-item-active-bg` | `primary-50` (light), `primary-900/30` (dark) |
| `sidebar-item-active-text` | `primary-700` (light), `primary-300` (dark) |
| `sidebar-item-hover-bg` | `neutral-100` (light), `neutral-800` (dark) |

### 10.6 Topbar Tokens

| Token | Value |
|---|---|
| `topbar-height` | `64px` (4rem) |
| `topbar-bg` | `white/80` (light), `neutral-900/80` (dark) |
| `topbar-border` | `1px solid neutral-200` (light), `1px solid neutral-800` (dark) |
| `topbar-padding-x` | `16px` (space-4) on mobile, `24px` (space-6) on desktop |

### 10.7 Bottom Navigation Tokens (Mobile)

| Token | Value |
|---|---|
| `bottom-nav-height` | `64px` (4rem) |
| `bottom-nav-bg` | `white` (light), `neutral-900` (dark) |
| `bottom-nav-border` | `1px solid neutral-200` (light), `1px solid neutral-800` (dark) |
| `bottom-nav-icon-size` | `24px` |
| `bottom-nav-label-size` | `10px` (label-xs) |
| `bottom-nav-active-color` | `primary-500` (light), `primary-400` (dark) |
| `bottom-nav-inactive-color` | `neutral-400` (light), `neutral-500` (dark) |

---

## 11. Accessibility Tokens

### 11.1 Focus Indicators

| Token | Value |
|---|---|
| `focus-ring-width` | `3px` |
| `focus-ring-color` | `primary-500` with 40% opacity |
| `focus-ring-offset` | `2px` |
| `focus-ring-style` | `solid` outline |
| `focus-ring-radius` | Matches component border-radius |

**Implementation:**
```css
/* Tailwind plugin */
.focus-ring {
  @apply outline-none ring-3 ring-primary-500/40 ring-offset-2;
}
```

### 11.2 Color Contrast Ratios

| Requirement | Ratio | Application |
|---|---|---|
| Normal text | `>= 4.5:1` | Body, captions, labels (under 18px / 14px bold) |
| Large text | `>= 3:1` | Headings, display text (over 18px / 14px bold) |
| UI components | `>= 3:1` | Icons, borders, graph lines |
| User interface | `>= 3:1` | Focus indicators, input borders |
| Touch targets | N/A | Minimum 44x44px |

### 11.3 Focus Trap

- All modals, dialogs, and drawers implement focus trapping
- Tab cycles through focusable elements within the trap
- Escape key closes and returns focus to trigger element
- First focusable element auto-focused on open
- Last focused element retains state when re-opening

### 11.4 Reduced Motion

- `prefers-reduced-motion: reduce` disables all non-essential animations
- Essential animations (loading spinners, progress bars) remain at reduced speed
- Page transitions become instant
- Parallax and scroll-triggered animations are disabled
- Spring easings become linear

### 11.5 Touch Targets

| Element | Minimum Size | Notes |
|---|---|---|
| Buttons | `44x44px` | All interactive buttons |
| Icon buttons | `44x44px` | Hit area via padding |
| Links in lists | `44px` tall | Full row tap target |
| Form controls | `44px` height | Inputs, selects, toggles |
| Bottom nav items | `48x48px` | Tab bar items |
| Close buttons | `44x44px` | Modal close X |
| Slider thumbs | `44x44px` | Range input handles |

---

## 12. Form Design Tokens

### 12.1 Input Layout

| Token | Value |
|---|---|
| `input-height-sm` | `32px` |
| `input-height-md` | `40px` |
| `input-height-lg` | `48px` |
| `input-padding-x` | `12px` |
| `input-padding-y` | `8px` (sm: 4px, lg: 12px) |
| `input-border-width` | `1px` |
| `input-border-radius` | `8px` |
| `input-gap` | `8px` between label and input |
| `input-group-gap` | `20px` between form groups |
| `input-label-margin-bottom` | `6px` |

### 12.2 Input States

| State | Border | Background | Text | Shadow |
|---|---|---|---|---|
| Default | `neutral-300` | `white` | `neutral-800` | none |
| Hover | `neutral-400` | `white` | `neutral-800` | none |
| Focus | `primary-500` | `white` | `neutral-800` | `0 0 0 3px primary-500/20` |
| Disabled | `neutral-200` | `neutral-100` | `neutral-400` | none |
| Error | `error-500` | `error-50` | `neutral-800` | `0 0 0 3px error-500/20` |
| Success | `success-500` | `success-50` | `neutral-800` | `0 0 0 3px success-500/20` |
| Read-only | `neutral-200` | `neutral-50` | `neutral-600` | none |

### 12.3 Dark Mode Input States

| State | Border | Background | Text |
|---|---|---|---|
| Default | `neutral-700` | `neutral-900` | `neutral-100` |
| Hover | `neutral-600` | `neutral-900` | `neutral-100` |
| Focus | `primary-400` | `neutral-900` | `neutral-100` |
| Disabled | `neutral-800` | `neutral-900/50` | `neutral-600` |
| Error | `error-400` | `error-900/20` | `neutral-100` |
| Success | `success-400` | `success-900/20` | `neutral-100` |
| Read-only | `neutral-800` | `neutral-950` | `neutral-500` |

### 12.4 Select & Textarea Tokens

| Component | Token | Value |
|---|---|---|
| Select | `select-height` | `40px` (same as input-md) |
| Select | `select-chevron-size` | `16px` |
| Select | `select-chevron-color` | `neutral-500` |
| Textarea | `textarea-min-height` | `80px` (5rem) |
| Textarea | `textarea-resize-handle` | `bottom-right` only |
| Textarea | `textarea-padding` | `12px` |
| Multi-select | `multi-select-chip-radius` | `6px` |
| Multi-select | `multi-select-chip-height` | `28px` |

### 12.5 Label Tokens

| Token | Value |
|---|---|
| `label-font-size` | `0.875rem` (14px) |
| `label-font-weight` | `500` (Medium) |
| `label-color` | `neutral-700` (light), `neutral-300` (dark) |
| `label-required-indicator` | `*` in `error-500` |
| `label-helper-color` | `neutral-500` (light), `neutral-400` (dark) |
| `label-error-color` | `error-600` (light), `error-400` (dark) |

---

## 13. Tailwind Configuration Reference

```typescript
// tailwind.config.ts — Design System Integration
export default {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    screens: {
      xs: '375px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'monospace'],
    },
    extend: {
      colors: {
        primary: {
          50: '#F0F7FF', 100: '#E0EFFF', 200: '#B8DCFF', 300: '#8AC4FF',
          400: '#5CA8FF', 500: '#3B82F6', 600: '#2563EB', 700: '#1D4ED8',
          800: '#1E3A8A', 900: '#172554',
        },
        secondary: {
          50: '#F5F3FF', 100: '#EDE9FE', 200: '#DDD6FE', 300: '#C4B5FD',
          400: '#A78BFA', 500: '#8B5CF6', 600: '#7C3AED', 700: '#6D28D9',
          800: '#5B21B6', 900: '#4C1D95',
        },
        accent: {
          50: '#FFF7ED', 100: '#FFEDD5', 200: '#FED7AA', 300: '#FDBA74',
          400: '#FB923C', 500: '#F97316', 600: '#EA580C', 700: '#C2410C',
          800: '#9A3412', 900: '#7C2D12',
        },
        neutral: {
          50: '#FAFAFA', 100: '#F5F5F5', 200: '#E5E5E5', 300: '#D4D4D4',
          400: '#A3A3A3', 500: '#737373', 600: '#525252', 700: '#404040',
          800: '#262626', 900: '#171717', 950: '#0A0A0A',
        },
        success: {
          50: '#F0FDF4', 100: '#DCFCE7', 200: '#BBF7D0', 300: '#86EFAC',
          400: '#4ADE80', 500: '#22C55E', 600: '#16A34A', 700: '#15803D',
          800: '#166534', 900: '#14532D',
        },
        warning: {
          50: '#FFFBEB', 100: '#FEF3C7', 200: '#FDE68A', 300: '#FCD34D',
          400: '#FBBF24', 500: '#F59E0B', 600: '#D97706', 700: '#B45309',
          800: '#92400E', 900: '#78350F',
        },
        error: {
          50: '#FEF2F2', 100: '#FEE2E2', 200: '#FECACA', 300: '#FCA5A5',
          400: '#F87171', 500: '#EF4444', 600: '#DC2626', 700: '#B91C1C',
          800: '#991B1B', 900: '#7F1D1D',
        },
        info: {
          50: '#EFF6FF', 100: '#DBEAFE', 200: '#BFDBFE', 300: '#93C5FD',
          400: '#60A5FA', 500: '#3B82F6', 600: '#2563EB', 700: '#1D4ED8',
          800: '#1E40AF', 900: '#1E3A8A',
        },
      },
      spacing: {
        '4.5': '1.125rem', '11': '2.75rem', '13': '3.25rem',
        '15': '3.75rem', '17': '4.25rem', '18': '4.5rem',
        '19': '4.75rem',
      },
      borderRadius: {
        '4xl': '1.5rem',
      },
      boxShadow: {
        'focus': '0 0 0 3px rgba(59, 130, 246, 0.4)',
        'focus-error': '0 0 0 3px rgba(239, 68, 68, 0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'fade-out': 'fadeOut 200ms ease-in',
        'slide-up': 'slideUp 300ms ease-out',
        'slide-down': 'slideDown 300ms ease-out',
        'slide-left': 'slideLeft 300ms ease-out',
        'slide-right': 'slideRight 300ms ease-out',
        'scale-in': 'scaleIn 200ms ease-out',
        'scale-out': 'scaleOut 200ms ease-in',
        'shimmer': 'shimmer 1.5s infinite',
        'pulse-soft': 'pulseSoft 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-gentle': 'bounceGentle 1s infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        fadeOut: { '0%': { opacity: '1' }, '100%': { opacity: '0' } },
        slideUp: { '0%': { transform: 'translateY(16px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        slideDown: { '0%': { transform: 'translateY(-16px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        slideLeft: { '0%': { transform: 'translateX(16px)', opacity: '0' }, '100%': { transform: 'translateX(0)', opacity: '1' } },
        slideRight: { '0%': { transform: 'translateX(-16px)', opacity: '0' }, '100%': { transform: 'translateX(0)', opacity: '1' } },
        scaleIn: { '0%': { transform: 'scale(0.95)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        scaleOut: { '0%': { transform: 'scale(1)', opacity: '1' }, '100%': { transform: 'scale(0.95)', opacity: '0' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        pulseSoft: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.7' } },
        bounceGentle: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-4px)' } },
      },
      transitionTimingFunction: {
        'emphasized-in': 'cubic-bezier(0.5, 0, 1, 0.5)',
        'emphasized-out': 'cubic-bezier(0, 0, 0.2, 1.5)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};
```

---

## 14. Data Visualization Colors

For charts and analytics graphics, use these semantically-ordered color sequences:

| Order | Token | Hex | Usage |
|---|---|---|---|
| 1 | `chart-1` | `#3B82F6` | Primary data series |
| 2 | `chart-2` | `#8B5CF6` | Secondary series |
| 3 | `chart-3` | `#F97316` | Tertiary series |
| 4 | `chart-4` | `#22C55E` | Positive trend |
| 5 | `chart-5` | `#EF4444` | Negative trend |
| 6 | `chart-6` | `#F59E0B` | Warning data |
| 7 | `chart-7` | `#06B6D4` | Information series |
| 8 | `chart-8` | `#EC4899` | Accent category |
| 9 | `chart-9` | `#14B8A6` | Sustainability metric |
| 10 | `chart-10` | `#A855F7` | AI-related metric |

### Chart Sequential Gradient (for heatmaps, density)

| Step | Hex |
|---|---|
| Lightest | `#E0EFFF` |
| Light | `#8AC4FF` |
| Medium | `#3B82F6` |
| Dark | `#1D4ED8` |
| Darkest | `#172554` |

### Chart Diverging Gradient (for sentiment, comparison)

| Negative | Hex | Positive | Hex |
|---|---|---|---|
| `error-200` | `#FECACA` | `success-200` | `#BBF7D0` |
| `error-400` | `#F87171` | `success-400` | `#4ADE80` |
| `error-600` | `#DC2626` | `success-600` | `#16A34A` |

---

## 15. Motion Design Principles

1. **Purposeful**: Every animation serves a functional purpose (feedback, orientation, hierarchy)
2. **Subtle**: Animations are soft, never jarring. Max 300ms for most interactions
3. **Consistent**: Similar transitions use identical durations and easings
4. **Performant**: Use `transform` and `opacity` only. Hardware-accelerated properties
5. **Accessible**: All animations respect `prefers-reduced-motion`
6. **Responsive**: Reduce or disable animations on low-powered devices
7. **Physical**: Objects move with realistic momentum (ease-out for entering, ease-in for exiting)
8. **Layered**: Multiple elements stagger entrance by 50-100ms for visual hierarchy
9. **Directional**: Slide direction matches user expectation (left for back, right for forward)
10. **Measurable**: All animations benchmark at <16ms (60fps) on target devices
