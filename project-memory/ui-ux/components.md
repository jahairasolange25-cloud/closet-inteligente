# Closet Inteligente Digital — Component Specifications

> **Version:** 1.0.0
> **Status:** APPROVED
> **Last Updated:** 2026-05-25

---

## 1. Button

### 1.1 Purpose
Triggers an action or navigates to a destination. Primary call-to-action mechanism in the UI.

### 1.2 Props Interface

```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon';
  size: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
  isDisabled?: boolean;
  isFullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
  href?: string; // renders as Link if provided
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  ariaLabel?: string;
  className?: string;
}
```

### 1.3 States

| State | Description |
|---|---|
| **Default** | Resting state with full opacity |
| **Hover** | Background darkens by one shade (e.g., primary-500 → primary-600) |
| **Active/Pressed** | Background darkens by two shades (primary-600 → primary-700). Scale 0.98 |
| **Disabled** | Opacity 50%, cursor not-allowed, no hover/active effects |
| **Loading** | Show spinner icon, hide children text, disable interaction |
| **Focused** | 3px focus ring in primary-500/40 |

### 1.4 Variants

| Variant | Default BG | Default Text | Hover BG | Active BG | Disabled BG |
|---|---|---|---|---|---|
| **primary** | `primary-500` | `white` | `primary-600` | `primary-700` | `primary-300` |
| **secondary** | `secondary-500` | `white` | `secondary-600` | `secondary-700` | `secondary-300` |
| **ghost** | `transparent` | `neutral-700` | `neutral-100` | `neutral-200` | `transparent` |
| **danger** | `error-500` | `white` | `error-600` | `error-700` | `error-300` |
| **icon** | `transparent` | `neutral-600` | `neutral-100` | `neutral-200` | `transparent` |

### 1.5 Sizes

| Size | Height | Padding X | Font | Icon Size | Gap |
|---|---|---|---|---|---|
| **sm** | `32px` | `12px` | `label-sm` (12px) | `16px` | `6px` |
| **md** | `40px` | `16px` | `label-md` (14px) | `18px` | `8px` |
| **lg** | `48px` | `20px` | `label-lg` (16px) | `20px` | `10px` |

### 1.6 Responsive

- Mobile: `md` size minimum for touch targets (44px if icon-only)
- Desktop: `sm` and `md` sizes acceptable
- Full-width on mobile if `isFullWidth` is set

### 1.7 Accessibility

- Focus ring on keyboard focus
- Loading state: `aria-busy="true"`, `aria-label="Loading"`
- Icon-only: must have `ariaLabel` prop
- Role: `button` inherently (or `link` when `href` is set)

### 1.8 Animations

- Hover: 100ms background-color transition
- Press: 50ms scale transform (0.98)
- Loading: 2s spin on spinner icon

---

## 2. Input

### 2.1 Purpose
Text input field for user data entry. Supports multiple types and validation states.

### 2.2 Props Interface

```typescript
interface InputProps {
  type: 'text' | 'email' | 'password' | 'search' | 'number' | 'tel' | 'url';
  size: 'sm' | 'md' | 'lg';
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
  maxLength?: number;
  showCharCount?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClear?: () => void; // shows clear button when value is set
  autoFocus?: boolean;
  name?: string;
  id?: string;
  className?: string;
}
```

### 2.3 States

| State | Border | Background | Text | Shadow |
|---|---|---|---|---|
| **Default** | `neutral-300` | `white` | `neutral-800` | none |
| **Hover** | `neutral-400` | `white` | `neutral-800` | none |
| **Focus** | `primary-500` | `white` | `neutral-800` | 0 0 0 3px primary-500/20 |
| **Disabled** | `neutral-200` | `neutral-100` | `neutral-400` | none |
| **Error** | `error-500` | `error-50` | `neutral-800` | 0 0 0 3px error-500/20 |
| **Success** | `success-500` | `success-50` | `neutral-800` | 0 0 0 3px success-500/20 |
| **ReadOnly** | `neutral-200` | `neutral-50` | `neutral-600` | none |
| **Filled** | `neutral-300` | `white` | `neutral-800` | none |

### 2.4 Size Variants

| Size | Height | Font | Padding |
|---|---|---|---|
| **sm** | `32px` | `body-sm` (14px) | `8px 12px` |
| **md** | `40px` | `body-md` (16px) | `10px 12px` |
| **lg** | `48px` | `body-lg` (18px) | `12px 16px` |

### 2.5 Special Types

| Type | Behavior |
|---|---|
| **password** | Show/hide toggle button (eye icon) on right |
| **search** | Search icon on left, clear button on right when value exists |
| **number** | Up/down arrows on right, min/max validation |
| **email** | Keyboard type email on mobile, email validation on blur |
| **tel** | Phone keyboard on mobile, pattern validation |

### 2.6 Accessibility

- Label via `<label>` element with `htmlFor` attribute
- Error message linked via `aria-describedby`
- Required indicator: `*` in `error-500` color on label
- Input mode set appropriately for type
- Character count announced to screen readers at 80%+ of limit

### 2.7 Character Counter

- Appears below input when `showCharCount` is true
- Format: `{current}/{maxLength}`
- Turns `warning-500` at 80% capacity
- Turns `error-500` at 100% capacity
- Does not prevent typing beyond limit (server validates)

---

## 3. Select

### 3.1 Purpose
Allows user to select one or more options from a list. Supports native, custom dropdown, and searchable modes.

### 3.2 Props Interface

```typescript
interface SelectProps {
  variant: 'native' | 'custom' | 'searchable' | 'multi';
  size: 'sm' | 'md' | 'lg';
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  error?: string;
  helperText?: string;
  isDisabled?: boolean;
  isRequired?: boolean;
  isClearable?: boolean;
  isSearchable?: boolean;
  maxItems?: number; // for multi-select visible chips before overflow
  noOptionsMessage?: string;
  loadingMessage?: string;
  className?: string;
}

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
  icon?: React.ReactNode;
}
```

### 3.3 Variants

| Variant | Description | Use When |
|---|---|---|
| **native** | Uses `<select>` element. Browser-native dropdown | Less than 5 options, mobile-friendly |
| **custom** | Custom dropdown with styled options | More than 5 options, needs styling |
| **searchable** | Custom dropdown with text filter | 15+ options, user needs to search |
| **multi** | Multi-select with checkboxes and chips | Selecting multiple values |

### 3.4 States

Same as Input (default, hover, focus, disabled, error, success).

### 3.5 Multi-Select Chips

- Selected items appear as chips above or inside the dropdown
- Each chip has a remove button (X)
- Max visible: `maxItems` (default 3), then "+N more" label
- Chip style: `neutral-100` bg, `neutral-700` text, `6px` radius

### 3.6 Accessibility

- Role: `combobox` for custom dropdowns
- `aria-expanded` for open/closed state
- `aria-activedescendant` for active option
- Keyboard navigation: Arrow Up/Down, Enter to select, Escape to close
- Multi-select: `aria-multiselectable="true"`

---

## 4. Textarea

### 4.1 Purpose
Multi-line text input for longer content. Supports resizing and character limits.

### 4.2 Props Interface

```typescript
interface TextareaProps {
  size: 'sm' | 'md' | 'lg';
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
  maxLength?: number;
  showCharCount?: boolean;
  minRows?: number;
  maxRows?: number;
  autoResize?: boolean;
  className?: string;
}
```

### 4.3 Size Variants

| Size | Min Height | Font | Padding |
|---|---|---|---|
| **sm** | `64px` (4 rows) | `body-sm` | `8px 12px` |
| **md** | `80px` (5 rows) | `body-md` | `10px 12px` |
| **lg** | `96px` (6 rows) | `body-lg` | `12px 16px` |

### 4.4 Auto-Resize

- When `autoResize` is true, textarea grows vertically as user types
- Max height: `320px` (above that, scroll)
- Transition: height 150ms ease-out

---

## 5. Card

### 5.1 Purpose
Container for grouped content. Multiple variants for different content types.

### 5.2 Props Interface

```typescript
type CardVariant = 'garment' | 'outfit' | 'stat' | 'avatar' | 'default';

interface CardProps {
  variant: CardVariant;
  isSelected?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  onClick?: () => void;
  href?: string;
  className?: string;
  children: React.ReactNode;
}
```

### 5.3 Variant Specifications

#### Garment Card

```
┌─────────────────────┐
│  ┌───────────────┐  │  <- Image container (4:5 aspect ratio)
│  │               │  │     580x725px recommended
│  │   [Image]     │  │     Object-fit: cover
│  │               │  │     Corner radius: 12px top
│  └───────────────┘  │
│  ┌───────────────┐  │  <- Info section (padding: 12px)
│  │ Garment Name  │  │     Font: heading-xs, weight 600
│  │ Brand • Color │  │     Font: body-xs, color neutral-500
│  │ [❤️] [👁️]   │  │     Actions row
│  └───────────────┘  │
└─────────────────────┘

Dimensions: 100% width (grid column), max 280px
```

#### Outfit Card

```
┌─────────────────────┐
│  ┌─┐ ┌─┐ ┌─┐ ┌─┐  │  <- Garment preview grid (2x2)
│  │  │ │  │ │  │ │  │     Each thumbnail: 60x60px, 4px radius
│  │  │ │  │ │  │ │  │     Max 4 shown, "+N more" overlay
│  └─┘ └─┘ └─┘ └─┘  │
│  ┌───────────────┐  │  <- Info
│  │ Outfit Name   │  │     heading-sm (18px)
│  │ Casual • 5 items │  body-xs, neutral-500
│  └───────────────┘  │
└─────────────────────┘

Dimensions: 100% width, max 320px
```

#### Stat Card

```
┌─────────────────────┐
│  ┌───────────────┐  │
│  │ Icon (24px)   │  │  <- Icon + trend indicator
│  │   5.2K        │  │  <- Stat value (display-sm, 36px, bold)
│  │   Garments    │  │  <- Label (body-sm, neutral-500)
│  │   ↑ 12%       │  │  <- Trend (body-xs, success-500 or error-500)
│  └───────────────┘  │
└─────────────────────┘

Dimensions: 100% width, flexible height (min 120px)
```

#### Avatar Card

```
┌─────────────────────┐
│  ┌───────────────┐  │  <- 3D viewer or image (1:1)
│  │  [3D Avatar]  │  │     200x200px recommended
│  └───────────────┘  │     Border radius: full (circle)
│  ┌───────────────┐  │
│  │ "Default"     │  │  <- Name (body-sm, semibold)
│  │ v2 • Active   │  │  <- Version + status
│  └───────────────┘  │
└─────────────────────┘
```

### 5.4 States

| State | Description |
|---|---|
| **Default** | Normal appearance |
| **Hover** | Slight elevation increase (`shadow-sm` → `shadow-md`). Scale 1.02 for garment cards |
| **Selected** | 2px primary-500 border, primary-50 background |
| **Disabled** | Opacity 50%, no hover effects |
| **Loading** | Skeleton shimmer placeholder |

### 5.5 Accessibility

- Cards are `article` elements
- Clickable cards have `role="button"` and `tabIndex={0}`
- `onKeyDown` for Enter/Space on clickable cards
- Garment images have `alt` text with garment name

---

## 6. Modal

### 6.1 Purpose
Overlay dialog for confirmations, forms, previews, and full-screen content.

### 6.2 Props Interface

```typescript
type ModalVariant = 'confirmation' | 'form' | 'preview' | 'fullscreen';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  variant: ModalVariant;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: React.ReactNode;
  footer?: React.ReactNode;
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  preventBodyScroll?: boolean;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  className?: string;
}
```

### 6.3 Variant Specifications

| Variant | Size Default | Features |
|---|---|---|
| **confirmation** | `sm` (400px) | Title, description, Cancel + Confirm buttons. Destructive variant shows error-500 button |
| **form** | `md` (560px) | Form fields inside, Save/Cancel footer, no close on overlay click if dirty |
| **preview** | `lg` (720px) | Media/content preview, close button only |
| **fullscreen** | `full` (100vw) | Full-screen image gallery, 3D viewer. Dark backdrop hides all |

### 6.4 States

| State | Description |
|---|---|
| **Closed** | Not rendered (removed from DOM) |
| **Opening** | Animate scale 0.95→1, backdrop fade in. Duration: 200ms |
| **Open** | Fully visible, focus trapped, body scroll locked |
| **Closing** | Animate scale 1→0.95, backdrop fade out. Duration: 150ms |
| **Loading** | Confirm/Save button shows spinner, inputs disabled |

### 6.5 Accessibility

- Focus trap: Tab cycles within modal
- First focusable element auto-focused on open
- Escape closes modal
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby` for title
- Return focus to trigger element on close

---

## 7. Dropdown

### 7.1 Purpose
Reveals a list of options or actions on user trigger.

### 7.2 Props Interface

```typescript
type DropdownVariant = 'menu' | 'select' | 'actions';

interface DropdownProps {
  variant: DropdownVariant;
  trigger: React.ReactNode;
  items: DropdownItem[];
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: 'start' | 'end';
  side?: 'top' | 'bottom';
  maxHeight?: number;
  className?: string;
}

interface DropdownItem {
  label: string;
  value?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  destructive?: boolean;
  divider?: boolean;
  onClick: () => void;
}
```

### 7.3 Variant Specifications

| Variant | Features |
|---|---|
| **menu** | Navigation links or actions. Checkmark on selected |
| **select** | Option picker. Radio or checkmark on active item |
| **actions** | Gear/dots trigger. Context actions. Last items can be destructive |

### 7.4 States

| Element | State | Visual |
|---|---|---|
| Trigger | Default | Normal appearance |
| Trigger | Active | Primary color, slight background |
| Item | Default | `neutral-700` text, no background |
| Item | Hover | `neutral-100` background |
| Item | Active | `primary-50` background, `primary-700` text |
| Item | Disabled | `neutral-400` text, no hover |
| Item | Destructive | `error-600` text, `error-50` on hover |
| Divider | — | 1px `neutral-200` |

### 7.5 Positioning

- Uses floating-ui or similar for positioning calculation
- Default: bottom-start, flips to top if no space
- `8px` gap from trigger
- Virtualization for 20+ items

### 7.6 Accessibility

- Role: `menu` or `listbox`
- Items: `role="menuitem"` or `role="option"`
- `aria-expanded` on trigger
- Keyboard: Arrow keys navigate, Enter/Space selects, Escape closes

---

## 8. Badge

### 8.1 Purpose
Small label indicating status, count, or notification.

### 8.2 Props Interface

```typescript
type BadgeVariant = 'status' | 'count' | 'notification' | 'tag';
type BadgeColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface BadgeProps {
  variant: BadgeVariant;
  color: BadgeColor;
  children: React.ReactNode;
  size?: 'sm' | 'md';
  isPill?: boolean;
  isDot?: boolean;
  count?: number; // for variant='notification'
  maxCount?: number; // defaults to 99
  className?: string;
}
```

### 8.3 Variant Specifications

| Variant | Style | Usage |
|---|---|---|
| **status** | Filled background, white text | Garment state (Active, Archived, Donated) |
| **count** | Filled background, count number | "3 items", "12 new" |
| **notification** | Red dot or number on icon | Bell icon unread count |
| **tag** | Outlined with bg tint | Filter tags, category labels |

### 8.4 Sizes

| Size | Height | Font | Padding |
|---|---|---|---|
| **sm** | `18px` | `label-xs` (10px) | `2px 6px` |
| **md** | `22px` | `label-sm` (12px) | `3px 8px` |

### 8.5 Notification Badge

- Positioned top-right of parent icon
- Dot variant: 8px red circle when count > 0
- Number variant: shows count up to `maxCount`, then "+{maxCount}"
- Animation: scale in 150ms when count changes

---

## 9. Toast

### 9.1 Purpose
Temporary notification for feedback, errors, and system messages.

### 9.2 Props Interface

```typescript
type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  variant: ToastVariant;
  title?: string;
  description: string;
  duration?: number; // ms, default per variant
  onDismiss?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  isVisible: boolean;
  position?: 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-center';
}
```

### 9.3 Variant Specifications

| Variant | Icon | Icon Color | Default Duration |
|---|---|---|---|
| **success** | `CheckCircle` | `success-500` | 4000ms |
| **error** | `XCircle` | `error-500` | 8000ms |
| **warning** | `AlertTriangle` | `warning-500` | 7000ms |
| **info** | `Info` | `info-500` | 5000ms |

### 9.4 States

| State | Description |
|---|---|
| **Entering** | Slide in from edge, 300ms ease-out |
| **Visible** | Full opacity, positioned in stack |
| **Exiting** | Slide out to edge, 300ms ease-in. Or swipe right to dismiss (mobile) |
| **Dismissed** | Removed from DOM. Remaining toasts re-position |
| **Paused** | Timer paused on hover (duration countdown halts) |

### 9.5 Accessibility

- Role: `status` or `alert`
- `aria-live="polite"` for info/success, `aria-live="assertive"` for errors
- Focus is NOT moved to toast (does not interrupt user flow)
- Action button is focusable for screen readers

---

## 10. Tooltip

### 10.1 Purpose
Provides additional context on hover or focus for UI elements.

### 10.2 Props Interface

```typescript
type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  content: string | React.ReactNode;
  children: React.ReactNode;
  position?: TooltipPosition;
  delay?: number; // show delay in ms (default: 300)
  hideDelay?: number; // hide delay in ms (default: 100)
  maxWidth?: number; // px (default: 240)
  isDisabled?: boolean;
  className?: string;
}
```

### 10.3 States

| State | Description |
|---|---|
| **Hidden** | Tooltip not rendered |
| **Entering** | After 300ms delay, fade in + small vertical offset. 150ms duration |
| **Visible** | Fully shown, positioned relative to trigger |
| **Exiting** | Fade out, 100ms duration |

### 10.4 Position

- Default: `top`, centered on trigger
- Flips to opposite side if no viewport space
- Arrow indicator pointing to trigger (8px triangle)
- Gap: `8px` from trigger

### 10.5 Accessibility

- `role="tooltip"` on tooltip element
- Trigger has `aria-describedby` linking to tooltip ID
- Visible on hover AND focus
- Dismiss on Escape key

---

## 11. Tabs

### 11.1 Purpose
Organizes content into switchable panels. Supports horizontal, vertical, and scrollable layouts.

### 11.2 Props Interface

```typescript
interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
  disabled?: boolean;
  content: React.ReactNode;
}

type TabVariant = 'horizontal' | 'vertical' | 'scrollable' | 'pills';

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant: TabVariant;
  className?: string;
}
```

### 11.3 Variant Specifications

| Variant | Layout | Indicator | Use Case |
|---|---|---|---|
| **horizontal** | Single row, bottom border | Active tab has bottom line (2px, primary-500) | Page-level section switching |
| **vertical** | Left column, side border | Active tab has left bar (2px, primary-500) | Settings sections, sidebar |
| **scrollable** | Single row with arrows | Same as horizontal | Many tabs, responsive |
| **pills** | Inline pill buttons | Active pill has filled primary-500 bg | Filter groups, small UI |

### 11.4 States

| State | Visual |
|---|---|
| Tab default | `neutral-600` text, no background |
| Tab hover | `neutral-800` text, `neutral-100` background (pills) |
| Tab active | `primary-600` text, indicator line (horizontal), filled bg (pills) |
| Tab disabled | `neutral-400` text, cursor not-allowed |
| Content transition | 150ms cross-fade |

### 11.5 Accessibility

- Role: `tablist` on container, `tab` on each tab, `tabpanel` on content
- `aria-selected` on active tab
- Keyboard: Arrow keys navigate tabs, Home/End for first/last
- `aria-controls` links tab to panel

---

## 12. Accordion

### 12.1 Purpose
Collapsible content sections for space-efficient information display.

### 12.2 Props Interface

```typescript
interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
  disabled?: boolean;
}

interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  defaultExpanded?: string[];
  onChange?: (expandedIds: string[]) => void;
  className?: string;
}
```

### 12.3 States

| State | Visual |
|---|---|
| **Collapsed** | Only title visible. Chevron icon pointing down |
| **Expanding** | Content height animates open. Chevron rotates up. 250ms ease-smooth |
| **Expanded** | Content fully visible. Chevron pointing up |
| **Collapsing** | Content height animates closed. 250ms ease-smooth |
| **Disabled** | 50% opacity, no click handler |

### 12.4 Accessibility

- Button role on header, `aria-expanded` state
- Content region: `role="region"`, `aria-labelledby` linked to header
- Keyboard: Enter/Space to toggle

---

## 13. Progress Bar

### 13.1 Purpose
Indicates progress for uploads, AI processing, and multi-step flows.

### 13.2 Props Interface

```typescript
type ProgressVariant = 'determinate' | 'indeterminate' | 'step';

interface ProgressProps {
  variant: ProgressVariant;
  value?: number; // 0-100 for determinate
  steps?: string[]; // step labels for step variant
  currentStep?: number; // 0-indexed for step variant
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  color?: 'primary' | 'success' | 'warning' | 'error';
  className?: string;
}
```

### 13.3 Variant Specifications

| Variant | Visual | Use Case |
|---|---|---|
| **determinate** | Filled bar from 0-100% | Upload progress, processing |
| **indeterminate** | Animated shimmer across full width | Unknown duration, loading |
| **step** | Connected circles with labels | Wizard/onboarding steps |

### 13.4 Sizes

| Size | Height | Font |
|---|---|---|
| **sm** | `4px` | none |
| **md** | `8px` | `body-xs` |
| **lg** | `12px` | `body-sm` |

### 13.5 States

| State | Visual |
|---|---|
| **Idle** | 0% filled |
| **Progressing** | Bar fills with value %. Transition: 300ms width |
| **Complete** | 100%, turns `success-500` color |
| **Error** | Current progress stops, turns `error-500` |
| **Indeterminate** | Continuous left-to-right shimmer animation |

### 13.6 Step Progress

```
  ●━━━━━━○━━━━━━○━━━━━━○
  Step 1  Step 2  Step 3  Step 4
  ✓       ●       ○       ○
(Done)  (Current) (Next)  (Future)

Completed: green circle + check icon
Current: primary-500 filled circle
Future: neutral-300 outlined circle
```

### 13.7 Accessibility

- Role: `progressbar`
- `aria-valuenow`, `aria-valuemin`, `aria-valuemax` for determinate
- `aria-label` for indeterminate
- Step indicator: `aria-current="step"` on current step

---

## 14. Search Bar

### 14.1 Purpose
Full-featured search input with filters, suggestions, and clear functionality.

### 14.2 Props Interface

```typescript
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  filters?: SearchFilter[];
  activeFilters?: Record<string, string[]>;
  onFilterChange?: (filters: Record<string, string[]>) => void;
  suggestions?: string[];
  onSuggestionSelect?: (suggestion: string) => void;
  isLoading?: boolean;
  isExpanded?: boolean; // mobile: expands to full width
  recentSearches?: string[];
  className?: string;
}

interface SearchFilter {
  id: string;
  label: string;
  options: { value: string; label: string }[];
}
```

### 14.3 States

| State | Visual |
|---|---|
| **Collapsed** (mobile) | Search icon only |
| **Expanded** (mobile) | Full-width input with back button |
| **Focused** | Standard focus ring, suggestions appear |
| **Typing** | Clear button visible, live results |
| **Searching** | Loading spinner in input |
| **Results** | Suggestions/filtered results below |
| **No results** | "No results found" message |
| **Empty** | Placeholder text visible |

### 14.4 Desktop vs Mobile

| Element | Desktop | Mobile |
|---|---|---|
| Input | Always visible, 320px wide | Toggle via icon, full-width when active |
| Filters | Button opens filter dropdown | Slide-up panel |
| Suggestions | Dropdown below input | Full-screen overlay |
| Submit | Enter key | Enter key or search icon tap |

### 14.5 Accessibility

- Role: `search` on form, `combobox` on input
- `aria-expanded` for suggestions visibility
- `aria-activedescendant` for active suggestion
- Clear button: `aria-label="Clear search"`
- Suggestion selected by Enter or click

---

## 15. Filter Panel

### 15.1 Purpose
Multi-filter panel for refining list/grid content. Supports multiple filter types.

### 15.2 Props Interface

```typescript
interface FilterDef {
  id: string;
  label: string;
  type: 'checkbox' | 'radio' | 'range' | 'color' | 'date';
  options?: { value: string; label: string; color?: string }[];
  min?: number;
  max?: number;
}

interface FilterPanelProps {
  filters: FilterDef[];
  activeFilters: Record<string, string[]>;
  onChange: (filters: Record<string, string[]>) => void;
  onApply: () => void;
  onClear: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  resultCount: number;
  className?: string;
}
```

### 15.3 States

| State | Visual |
|---|---|
| **Closed** | Filter button shows count: "Filters (3)" badge |
| **Open** (desktop) | Slide-in panel (280-320px) on right side |
| **Open** (mobile) | Bottom sheet overlay |
| **Dirty** | Apply button enabled, clear button visible |
| **Applied** | Active filters shown as chips above results |
| **Empty** | "No filters match your selection" message |

### 15.4 Active Filter Chips

```
[Category: Tops ✕] [Color: Blue ✕] [Size: M ✕] [Clear All]
```

### 15.5 Accessibility

- Panel: `role="dialog"`, `aria-label="Filters"`
- Apply/Clear buttons clearly labeled
- Filter count announced via `aria-live`

---

## 16. Image Uploader

### 16.1 Purpose
Multi-method image upload: drag-and-drop, click to browse, camera capture.

### 16.2 Props Interface

```typescript
interface ImageUploaderProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  maxFileSizeMB?: number; // default: 10
  acceptedFormats?: string[]; // default: ['image/jpeg', 'image/png', 'image/webp']
  existingImages?: string[]; // URLs of already-uploaded images
  onRemove?: (index: number) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  showCamera?: boolean; // show camera button (mobile)
  isProcessing?: boolean;
  processingStatus?: string;
  error?: string;
  className?: string;
}
```

### 16.3 States

| State | Visual |
|---|---|
| **Empty** | Dashed border zone, upload icon, "Drop images here or click to browse" text |
| **Hover** (drag) | Border turns primary-500, background primary-50 |
| **Files selected** | Image thumbnails with progress bars |
| **Uploading** | Each thumbnail shows upload progress (determinate bar) |
| **Processing** (AI) | Thumbnail overlayed with "AI analyzing..." spinner |
| **Complete** | Green check overlay on thumbnail |
| **Error** | Red border on failed upload, error message below |
| **Max files** | Zone hidden, "Max X files reached" message |
| **Invalid file** | Red border flash, error toast "File type not supported" |

### 16.4 Drop Zone Layout

```
┌──────────────────────────────────────────────┐
│  ┌────────────────────────────────────────┐  │
│  │                                        │  │
│  │         📷 (Icon: 48px)               │  │
│  │                                        │  │
│  │    Drop your garment photos here       │  │
│  │    or click to browse                  │  │
│  │                                        │  │
│  │    Supports: JPG, PNG, WebP           │  │
│  │    Max: 10MB each, up to 5 photos     │  │
│  │                                        │  │
│  │    ┌──────────────────┐               │  │
│  │    │  📷 Take Photo    │               │  │
│  │    └──────────────────┘               │  │
│  └────────────────────────────────────────┘  │
│                                               │
│  ┌──────┐ ┌──────┐ ┌──────┐                 │
│  │ img1 │ │ img2 │ │ img3 │  <- Thumbnails  │
│  │ ✓    │ │ ◌    │ │ ✗    │     with states │
│  └──────┘ └──────┘ └──────┘                 │
└──────────────────────────────────────────────┘
```

### 16.5 Accessibility

- Drop zone: `role="button"`, keyboard accessible
- File input: hidden, triggered by zone click
- Progress: `aria-valuenow` on each upload
- Error: `role="alert"` for file validation errors
- Thumbnails: `alt` text with filename

---

## 17. File Preview

### 17.1 Purpose
Preview different media types: images, video, and 3D models.

### 17.2 Props Interface

```typescript
type FileType = 'image' | 'video' | 'model3d';

interface FilePreviewProps {
  type: FileType;
  src: string;
  alt?: string;
  poster?: string; // for video
  autoPlay?: boolean;
  controls?: boolean;
  loop?: boolean;
  aspectRatio?: string; // e.g., "4/5", "1/1", "16/9"
  isZoomable?: boolean; // image pinch-to-zoom
  onError?: () => void;
  className?: string;
}
```

### 17.3 Type Specifications

| Type | Renderer | Features |
|---|---|---|
| **image** | `<img>` with blurhash placeholder | Pinch-to-zoom, swipe gallery, fullscreen |
| **video** | `<video>` with poster | Play/pause, progress bar, mute, fullscreen |
| **model3d** | `<Canvas>` (React Three Fiber) | OrbitControls, auto-rotate, zoom, fullscreen |

### 17.4 States

| State | Visual |
|---|---|
| **Loading** | Skeleton or blurhash placeholder |
| **Loaded** | Full media display |
| **Error** | Broken media icon, "Failed to load" message, retry button |
| **Fullscreen** | Media fills viewport, dark backdrop |

### 17.5 Accessibility

- Image: meaningful `alt` text
- Video: captions when available
- 3D: fallback text "3D model — use mouse/touch to rotate"
- Controls labeled for screen readers

---

## 18. Date Picker

### 18.1 Purpose
Calendar-based date selection with single and range modes.

### 18.2 Props Interface

```typescript
interface DatePickerProps {
  mode: 'single' | 'range';
  value: Date | [Date, Date] | null;
  onChange: (date: Date | [Date, Date] | null) => void;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  locale?: string; // default: 'es-CO'
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  error?: string;
  isDisabled?: boolean;
  className?: string;
}
```

### 18.3 States

| State | Visual |
|---|---|
| **Closed** | Input shows formatted date or placeholder |
| **Open** | Calendar overlay (dropdown or inline) |
| **Date selected** | Filled circle on selected date |
| **Range start** | Filled circle, range background begins |
| **Range end** | Filled circle, range background ends |
| **In range** | Muted background between start and end |
| **Disabled date** | Strikethrough, not clickable |
| **Today** | Bold outline circle |
| **Hover date** | Light background circle |

### 18.4 Navigation

| Control | Action |
|---|---|
| `<` / `>` arrows | Previous / Next month |
| Month name click | Month/year picker dropdown |
| Year click | Year range selector |
| "Today" button | Scroll to current month |

### 18.5 Accessibility

- Grid: `role="grid"`, `aria-label="Month March 2026"`
- Day cells: `role="gridcell"`, `aria-label="March 15, 2026"`
- Selected: `aria-selected="true"`
- Keyboard: Arrow keys navigate days, Enter selects
- Month/year pickers: `role="combobox"`, `aria-expanded`

---

## 19. Time Picker

### 19.1 Purpose
Time selection with hours and minutes.

### 19.2 Props Interface

```typescript
interface TimePickerProps {
  value: string; // "HH:MM" 24h format
  onChange: (time: string) => void;
  minuteInterval?: 1 | 5 | 15 | 30; // default: 15
  use12Hour?: boolean;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  error?: string;
  isDisabled?: boolean;
  className?: string;
}
```

### 19.3 Format

- Internal: 24-hour `"HH:MM"` format
- Display: 12-hour `"hh:MM AM/PM"` or 24-hour based on locale

### 19.4 States

Same as Date Picker (closed, open, selected, disabled).

---

## 20. Switch / Toggle

### 20.1 Purpose
Binary on/off toggle for settings and preferences.

### 20.2 Props Interface

```typescript
interface SwitchProps {
  isChecked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  isDisabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}
```

### 20.3 States

| State | Visual |
|---|---|
| **Off** | `neutral-300` track, white knob left |
| **On** | `primary-500` track, white knob right |
| **Focus** | Focus ring on track |
| **Disabled off** | `neutral-200` track, `neutral-400` knob |
| **Disabled on** | `primary-300` track, `neutral-400` knob |

### 20.4 Sizes

| Size | Track | Knob |
|---|---|---|
| **sm** | `28px × 16px` | `12px` |
| **md** | `40px × 24px` | `20px` |

### 20.5 Accessibility

- Role: `switch`
- `aria-checked` state
- Keyboard: Enter/Space to toggle
- Label associated via `id`/`for` or `aria-labelledby`

---

## 21. Checkbox / Radio Button

### 21.1 Purpose
Selection controls for forms and filter panels.

### 21.2 Props Interface

```typescript
interface CheckboxProps {
  isChecked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  isIndeterminate?: boolean;
  isDisabled?: boolean;
  size?: 'sm' | 'md';
  error?: string;
  className?: string;
}

interface RadioProps {
  isSelected: boolean;
  onChange: () => void;
  label?: string;
  description?: string;
  isDisabled?: boolean;
  size?: 'sm' | 'md';
  name: string;
  className?: string;
}
```

### 21.3 States

| State | Checkbox | Radio |
|---|---|---|
| **Unselected** | Empty white box (neutral-300 border) | Empty white circle (neutral-300 border) |
| **Selected** | Primary-500 bg, white checkmark | Filled primary-500 circle center |
| **Indeterminate** | Primary-500 bg, white minus icon | N/A |
| **Disabled unselected** | Neutral-200 border, neutral-100 bg | Neutral-200 border, neutral-100 bg |
| **Disabled selected** | Primary-300 bg | Primary-300 inner circle |
| **Focus** | Standard focus ring | Standard focus ring |

### 21.4 Accessibility

- Checkbox: `role="checkbox"`, `aria-checked`
- Radio: `role="radio"`, `aria-checked`, grouped by `name`
- Label clickable via `<label>` element

---

## 22. Avatar Viewer (3D Canvas)

### 22.1 Purpose
3D viewer for user's digital avatar with orbit controls.

### 22.2 Props Interface

```typescript
interface AvatarViewerProps {
  modelUrl: string; // GLB URL
  thumbnailUrl?: string; // fallback image
  autoRotate?: boolean;
  enableZoom?: boolean;
  enablePan?: boolean;
  showControls?: boolean;
  environment?: 'studio' | 'sunset' | 'forest' | 'neutral';
  backgroundColor?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  fallback?: React.ReactNode; // shown if WebGL unavailable
  className?: string;
}
```

### 22.3 Specifications

| Property | Value |
|---|---|
| Canvas size | Fills parent container (min 200x200px) |
| Default camera | Distance 2.5, slightly above center |
| Orbit controls | Drei OrbitControls, damping enabled (0.1) |
| Auto-rotate | 2s per full rotation, gentle |
| Environment | "studio" for garments, "sunset" for avatar |
| Lighting | HDR environment map, 3-point fallback |
| Background | Transparent or specified color |
| Loading | Drei Progress component with percent |
| Error | Fallback 2D image with retry button |

### 22.4 States

| State | Visual |
|---|---|
| **Loading** | Progress bar "Loading 3D model..." |
| **Loaded** | Full 3D render with orbit controls |
| **Error** | "Failed to load 3D model" + fallback image + retry |
| **WebGL unavailable** | Fallback message "3D viewer requires WebGL" |
| **Empty** | Placeholder "No avatar generated yet" + generate button |

### 22.5 Accessibility

- `role="application"`, `aria-label="3D Avatar Viewer"`
- Fallback text: "Interactive 3D model. Use mouse or touch to rotate and zoom"
- Keyboard: Focus on canvas, arrow keys rotate (via custom handler)

---

## 23. Loading Spinner

### 23.1 Purpose
Indicates loading state. Supports full-page, inline, and overlay variants.

### 23.2 Props Interface

```typescript
type SpinnerVariant = 'full-page' | 'inline' | 'overlay';

interface SpinnerProps {
  variant: SpinnerVariant;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  overlayColor?: string;
  className?: string;
}
```

### 23.3 Variants

| Variant | Container | Backdrop | Z-index |
|---|---|---|---|
| **full-page** | Centered in viewport | `rgba(255,255,255,0.9)` or `rgba(0,0,0,0.8)` dark | `z-loading` (120) |
| **inline** | Inline with content | None | Parent stacking |
| **overlay** | Absolute fill parent | `rgba(255,255,255,0.7)` | Parent relative |

### 23.4 Sizes

| Size | Icon Size | Label Font |
|---|---|---|
| **sm** | `16px` | `body-xs` |
| **md** | `24px` | `body-sm` |
| **lg** | `48px` | `body-md` |

### 23.5 Accessibility

- `aria-label="Loading"` or `aria-labelledby`
- `aria-busy="true"` on loading container
- `role="status"` or `role="progressbar"`

---

## 24. Skeleton Loader

### 24.1 Purpose
Content placeholder while data is loading. Multiple variants for common layouts.

### 24.2 Props Interface

```typescript
type SkeletonVariant = 'card' | 'list' | 'detail' | 'table' | 'chart';

interface SkeletonProps {
  variant: SkeletonVariant;
  count?: number; // repeat count for lists/grids
  columns?: number; // grid columns
  rows?: number; // table rows
  className?: string;
}
```

### 24.3 Variant Specifications

| Variant | Layout | Shimmer Color |
|---|---|---|
| **card** | 280x380px rectangle with image/text blocks | `neutral-200` to `neutral-100` (light) |
| **list** | Row of 3 text lines | `neutral-700` to `neutral-600` (dark) |
| **detail** | Large image left + text blocks right | Animated gradient |
| **table** | Header row + 5 content rows | Diagonal shimmer |
| **chart** | Outlined chart shape (bars or line) | Filled with shimmer |

### 24.4 Animation

```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

- Duration: 1.5s
- Easing: linear
- Animation: infinite

### 24.5 Accessibility

- `aria-busy="true"` on parent container
- `aria-label="Loading content"`
- Role: `status` or `presentation` (non-interactive)
- Remove from DOM when loading completes

---

## 25. Empty State

### 25.1 Purpose
Displayed when a list, search, or content area has no data.

### 25.2 Props Interface

```typescript
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  tip?: string;
  className?: string;
}
```

### 25.3 Layout

```
┌──────────────────────────────────────┐
│                                      │
│          Icon (64px)                 │
│                                      │
│          Title (heading-lg)          │
│                                      │
│      Description (body-md,           │
│       neutral-500)                   │
│                                      │
│    ┌──────────────────────┐          │
│    │  Action Button       │          │
│    └──────────────────────┘          │
│                                      │
│    ┌──────────────────────┐          │
│    │  Secondary Action    │          │
│    └──────────────────────┘          │
│                                      │
│      Tip: Useful context...          │
│                                      │
└──────────────────────────────────────┘
```

### 25.3 Accessibility

- `role="status"` for dynamic empty states
- Heading is an `<h2>` or appropriate level
- Action button focusable, keyboard accessible

---

## 26. Error Boundary

### 26.1 Purpose
Catches React rendering errors and displays a fallback UI.

### 26.2 Props Interface

```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetKeys?: any[]; // reset boundary when these change
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}
```

### 26.3 Fallback UI

```
┌──────────────────────────────────────┐
│                                      │
│          ⚠️ (Icon: 48px)            │
│                                      │
│     Something went wrong             │
│                                      │
│  An unexpected error occurred.       │
│  Please try refreshing the page.     │
│                                      │
│  ┌────────────────────────────┐      │
│  │  🔄 Try Again              │      │
│  └────────────────────────────┘      │
│                                      │
│  ┌────────────────────────────┐      │
│  │  🏠 Go to Dashboard        │      │
│  └────────────────────────────┘      │
│                                      │
└──────────────────────────────────────┘
```

### 26.4 Accessibility

- `role="alert"` for error announcement
- Focus sent to error boundary heading
- Retry button resets error state and re-renders children

---

## 27. Notification Bell

### 27.1 Purpose
Topbar element showing unread notification count with dropdown list.

### 27.2 Props Interface

```typescript
interface NotificationBellProps {
  unreadCount: number;
  notifications: NotificationItem[];
  onNotificationClick: (notificationId: string) => void;
  onMarkAllRead: () => void;
  onViewAll: () => void;
  isLoading?: boolean;
  className?: string;
}

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
  imageUrl?: string;
}
```

### 27.3 States

| State | Visual |
|---|---|
| **No unread** | Bell icon, no badge |
| **Has unread** | Bell icon with red badge showing count (max 99) |
| **Dropdown open** | Panel with notification list |
| **Loading** | Skeleton items in dropdown |
| **Empty** | "No notifications" message |
| **New notification** | Bell bounces, badge increments |

### 27.4 Dropdown Layout

```
┌──────────────────────────────┐
│  Notifications      [Mark all│
│                       as read]│
├──────────────────────────────┤
│  ● New item added           │  <- Unread: bold, blue dot
│  2 min ago                  │
├──────────────────────────────┤
│  ○ Outfit recommendation   │  <- Read: normal weight, no dot
│  1 hour ago                 │
├──────────────────────────────┤
│  ● AI detection complete   │
│  3 hours ago                │
├──────────────────────────────┤
│  ┌────────────────────────┐ │
│  │  View all notifications│ │
│  └────────────────────────┘ │
└──────────────────────────────┘

Width: 360px
Max height: 480px (scrollable)
```

### 27.5 Accessibility

- Bell button: `aria-label="Notifications (3 unread)"`
- Dropdown: `role="dialog"`, `aria-label="Notifications"`
- Each item: `role="button"`, `aria-label` with notification text

---

## 28. Sidebar Navigation

### 28.1 Purpose
Primary navigation for desktop and tablet. Collapsible with icon-only mode.

### 28.2 Props Interface

```typescript
interface SidebarNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
  isActive?: boolean;
  children?: SidebarNavItem[]; // nested items
}

interface SidebarNavigationProps {
  items: SidebarNavItem[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeItemId: string;
  onItemClick: (itemId: string) => void;
  showLabels?: boolean;
  className?: string;
}
```

### 28.3 Item States

| State | Visual |
|---|---|
| **Default** | `neutral-600` icon + text, no bg |
| **Hover** | `neutral-100` bg, `neutral-800` text |
| **Active** | `primary-50` bg, `primary-700` text, `primary-500` icon |
| **Active (collapsed)** | `primary-500` icon, tooltip with label |
| **Disabled** | `neutral-400`, cursor not-allowed |
| **With badge** | Badge on right side (count) |

### 28.4 Sub-items

- Indented 16px from parent
- Collapsed: hidden, shown on hover of parent (popover)
- Active state: left bar indicator (2px primary-500)

### 28.5 Responsive Behavior

| Breakpoint | Behavior |
|---|---|
| xs, sm (<768px) | Hidden — bottom nav used instead. Toggle via hamburger (overlay panel) |
| md (768px) | Collapsible from icon+text to icon-only |
| lg+ (1024px) | Expanded by default, user can collapse |

---

## 29. Bottom Navigation

### 29.1 Purpose
Mobile-first navigation bar at screen bottom. 5 items maximum.

### 29.2 Props Interface

```typescript
interface BottomNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode; // filled variant for active state
  href: string;
  badge?: number;
}

interface BottomNavigationProps {
  items: BottomNavItem[];
  activeItemId: string;
  onItemClick: (itemId: string) => void;
  className?: string;
}
```

### 29.3 States

| State | Visual |
|---|---|
| **Default** | `neutral-400` icon, `neutral-500` label (10px) |
| **Active** | `primary-500` icon + label |
| **Hover** | Subtle background tint |
| **With badge** | Red dot (no number) top-right of icon |

### 29.4 Hide/Show Behavior

- Visible on scroll up
- Hidden on scroll down (threshold: 50px)
- Always visible on keyboard open (mobile)
- Transition: translateY, 300ms ease-smooth

---

## 30. Data Table

### 30.1 Purpose
Tabular data display with sorting, filtering, pagination, and row selection.

### 30.2 Props Interface

```typescript
interface TableColumn<T> {
  id: string;
  header: string;
  accessor: (row: T) => React.ReactNode;
  sortable?: boolean;
  sortKey?: string;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  isLoading?: boolean;
  isSelectable?: boolean;
  selectedRows?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  sortBy?: { key: string; direction: 'asc' | 'desc' };
  onSortChange?: (sort: { key: string; direction: 'asc' | 'desc' }) => void;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  emptyState?: React.ReactNode;
  onRowClick?: (row: T) => void;
  className?: string;
}
```

### 30.3 States

| State | Visual |
|---|---|
| **Default** | Alternating row bg (even: neutral-50) |
| **Hover row** | `neutral-100` background |
| **Selected row** | `primary-50` background, primary-500 left border |
| **Sort active** | Column header shows arrow (↑ or ↓), primary-500 text |
| **Loading** | Skeleton rows (5 by default) |
| **Empty** | Empty state component spanning all columns |
| **Error** | Error state in table area |
| **Pagination** | Page number buttons, prev/next |

### 30.4 Responsive

- Desktop: Full table with horizontal scroll if needed
- Tablet: Table with horizontal scroll wrapper
- Mobile: Convert to card list (stacked layout) — hidden columns become details on expand

### 30.5 Accessibility

- Role: `table` or `grid` (if interactive)
- `aria-sort` on sorted columns
- Row selection: `aria-selected`
- Pagination: `aria-label="Page navigation"`, `aria-current="page"`
- Keyboard: Tab through cells, Enter on sortable headers, Space on rows

---

## 31. Chart Wrapper

### 31.1 Purpose
Wraps chart library (recharts or nivo) with loading, empty, and error states.

### 31.2 Props Interface

```typescript
interface ChartWrapperProps {
  title: string;
  description?: string;
  isLoading: boolean;
  isEmpty: boolean;
  hasError: boolean;
  onRetry?: () => void;
  children: React.ReactNode;
  height?: number; // default: 300
  actions?: React.ReactNode; // download, fullscreen, etc.
  className?: string;
}
```

### 31.3 States

| State | Visual |
|---|---|
| **Loading** | Skeleton chart shape (bars/line outline with shimmer) |
| **Empty** | "No data available" with chart icon |
| **Error** | "Failed to load chart" with retry button |
| **Loaded** | Full chart with tooltips, legends, grid |

### 31.4 Accessibility

- Chart data available as table (hidden, for screen readers)
- `aria-label` describing chart purpose
- Tooltip values announced via `aria-live`

---

## 32. Color Swatch Picker

### 32.1 Purpose
Color selection interface for garment attributes and filters.

### 32.2 Props Interface

```typescript
interface ColorSwatch {
  name: string;
  hex: string; // "#RRGGBB"
  label: string; // "Red", "Blue", etc.
}

interface ColorSwatchPickerProps {
  colors: ColorSwatch[];
  selectedColor: string | null; // hex value
  onChange: (color: string) => void;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}
```

### 32.3 States

| State | Visual |
|---|---|
| **Unselected** | Color circle with subtle border |
| **Selected** | White checkmark overlay, 2px primary ring |
| **Hover** | Slight scale (1.1), tooltip with color name |
| **Disabled** | Reduced opacity, no interaction |

### 32.4 Sizes

| Size | Swatch Size |
|---|---|
| **sm** | `24px` |
| **md** | `32px` |
| **lg** | `40px` |

---

## 33. Size Selector

### 33.1 Purpose
Select garment size from available options.

### 33.2 Props Interface

```typescript
interface SizeOption {
  value: string; // "S", "M", "L", "38", etc.
  label: string;
  isAvailable?: boolean; // false shows as unavailable
}

interface SizeSelectorProps {
  sizes: SizeOption[];
  selectedSize: string | null;
  onChange: (size: string) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

### 33.3 States

| State | Visual |
|---|---|
| **Available unselected** | Outlined button, neutral-300 border |
| **Available selected** | Filled primary-500, white text |
| **Unavailable** | Strikethrough, neutral-200, not clickable |
| **Hover** | Primary-300 border for available |

### 33.4 Layout

```
[S] [M] [L] [XL] [XXL]  <- available
[38] ~~[40]~~ [42] [44]  <- 40 is unavailable (strikethrough)
```

---

## 34. Implementation Priority

| Priority | Components | Phase |
|---|---|---|
| **P0** | Button, Input, Select, Textarea, Card, Badge, Toast, Loading Spinner, Skeleton, Empty State, Error Boundary | Phase 1 |
| **P1** | Modal, Dropdown, Tabs, Accordion, Progress Bar, Search Bar, Switch, Checkbox, Radio, Notification Bell, Sidebar Nav, Bottom Nav | Phase 1 |
| **P2** | Filter Panel, Image Uploader, File Preview, Data Table, Date Picker, Time Picker, Chart Wrapper, Color Swatch, Size Selector | Phase 2 |
| **P3** | Avatar Viewer (3D), Tooltip (advanced), Pagination (advanced) | Phase 2 |
