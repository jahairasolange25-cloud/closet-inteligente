# Closet Inteligente Digital — Accessibility Specifications

> **Version:** 1.0.0
> **Status:** APPROVED
> **Standard:** WCAG 2.1 Level AA
> **Last Updated:** 2026-05-25

---

## 1. WCAG 2.1 AA Compliance Checklist

### 1.1 Perceivable (Principle 1)

| Criterion | Level | Requirement | Implementation |
|---|---|---|---|
| 1.1.1 Non-text Content | A | All non-text content has text alternative | Alt text on garment images, ARIA labels on icons, hidden text for decorative elements |
| 1.2.1 Audio-only/Video-only | A | No pre-recorded audio/video without alternative | Video uploads include text description |
| 1.2.2 Captions (Prerecorded) | A | Captions provided for all prerecorded audio | Video content uses `<track>` elements |
| 1.2.3 Audio Description | A | Audio description for video content | Video narration describes visual content |
| 1.2.4 Captions (Live) | AA | Captions for live audio | Future consideration (Phase 3) |
| 1.2.5 Audio Description (Prerecorded) | AA | Audio description provided | Future consideration |
| 1.3.1 Info and Relationships | A | Semantic structure preserved | Proper heading hierarchy (`<h1>`→`<h6>`), `<nav>`, `<main>`, `<aside>`, `<article>` landmarks |
| 1.3.2 Meaningful Sequence | A | Content order preserved in code | Tab order matches visual order |
| 1.3.3 Sensory Characteristics | A | Instructions don't rely on shape/size/sound | "Click the red button" → "Click the Delete button (red)" |
| 1.3.4 Orientation | AA | Content not restricted to single orientation | App works in both portrait and landscape |
| 1.3.5 Identify Input Purpose | AA | Input fields have autocomplete attributes | `autocomplete="name"`, `autocomplete="email"`, etc. |
| 1.4.1 Use of Color | A | Color not sole means of conveying info | Error states use icon + message, not just red border |
| 1.4.2 Audio Control | A | Audio stops after 3s or has control | Auto-play videos are muted; no auto-playing audio |
| 1.4.3 Contrast (Minimum) | AA | Text: 4.5:1, Large text: 3:1 | Verified in design tokens (see §2) |
| 1.4.4 Resize Text | AA | Text can be resized 200% without loss | Responsive layout uses relative units; no fixed font sizes |
| 1.4.5 Images of Text | AA | Text rendered as text, not image | No images of text except logos |
| 1.4.10 Reflow | AA | Content reflows at 320px wide | Responsive grid collapses to single column |
| 1.4.11 Non-text Contrast | AA | UI components: 3:1 contrast ratio | Focus indicators, input borders, icons |
| 1.4.12 Text Spacing | AA | No loss of content with custom spacing | Layout uses relative units, overflow is handled |
| 1.4.13 Content on Hover/Focus | AA | Dismissable, hoverable, persistent tooltips | Tooltips dismiss on Escape, stay on hover, don't obscure |

### 1.2 Operable (Principle 2)

| Criterion | Level | Requirement | Implementation |
|---|---|---|---|
| 2.1.1 Keyboard | A | All functionality via keyboard | Tab navigation, Enter/Space to activate, Escape to close |
| 2.1.2 No Keyboard Trap | A | Focus can move away | Modals trap focus but Escape closes them |
| 2.1.4 Character Key Shortcuts | A | Shortcuts can be remapped or turned off | Custom hotkey configuration in Settings |
| 2.2.1 Timing Adjustable | A | Time limits can be extended | Session timeout warning with extend option |
| 2.2.2 Pause, Stop, Hide | A | Moving/blinking content can be paused | Auto-rotate 3D viewer has pause button |
| 2.3.1 Three Flashes | A | No content flashes >3 times/second | No flashing content in the app |
| 2.4.1 Bypass Blocks | A | Skip to main content link | "Skip to main content" as first focusable element |
| 2.4.2 Page Titled | A | Pages have descriptive titles | `<title>` reflects route: "My Closet — Closet Inteligente Digital" |
| 2.4.3 Focus Order | A | Focus order preserves meaning | Tab order follows visual layout |
| 2.4.4 Link Purpose (In Context) | A | Link purpose clear from context | "Read more about [garment name]" not "Click here" |
| 2.4.5 Multiple Ways | AA | Multiple ways to find content | Navigation, search, breadcrumbs, sitemap |
| 2.4.6 Headings and Labels | AA | Descriptive headings and labels | Form labels always visible (no placeholder-only) |
| 2.4.7 Focus Visible | AA | Visible focus indicator | 3px primary-500/40 ring on all interactive elements |
| 2.5.1 Pointer Gestures | A | Multi-point gestures have single-point alternative | Two-finger pinch can be done with +/- buttons in 3D viewer |
| 2.5.2 Pointer Cancellation | A | Down-event can be cancelled | `onClick` instead of `onMouseDown` for actions |
| 2.5.3 Label in Name | A | Visible label matches accessible name | Button "Save" has `aria-label="Save"` (consistent) |
| 2.5.4 Motion Actuation | A | Motion-triggered actions have UI alternative | Shake-to-undo also has button alternative |
| 2.5.8 Target Size | AA | Minimum 24x24px target size | All interactive targets ≥44x44px (exceeds minimum) |

### 1.3 Understandable (Principle 3)

| Criterion | Level | Requirement | Implementation |
|---|---|---|---|
| 3.1.1 Language of Page | A | Page language defined | `<html lang="es-CO">` primary, `lang="en"` for English |
| 3.1.2 Language of Parts | A | Language changes identified | `lang` attribute on translated text spans |
| 3.2.1 On Focus | A | No context change on focus | No auto-submit, no popup on focus |
| 3.2.2 On Input | A | No context change on input | Filter updates results inline, no page reload |
| 3.2.3 Consistent Navigation | AA | Navigation repeated across pages | Sidebar and bottom nav consistent order |
| 3.2.4 Consistent Identification | AA | Same functionality, same label | "Delete" always means permanent removal |
| 3.3.1 Error Identification | A | Errors clearly identified | Inline error messages below fields, red border |
| 3.3.2 Labels or Instructions | A | Labels and instructions provided | All inputs have labels, required indicators |
| 3.3.3 Error Suggestion | AA | Suggestions for error correction | "Email format: name@domain.com" |
| 3.3.4 Error Prevention (Legal) | AA | Reversible/submitted data confirmed | Delete confirmation modals, undo toasts |

### 1.4 Robust (Principle 4)

| Criterion | Level | Requirement | Implementation |
|---|---|---|---|
| 4.1.1 Parsing | A | No major markup errors | Valid HTML5, linted JSX |
| 4.1.2 Name, Role, Value | A | Custom controls expose name/role/value | All custom components use proper ARIA |
| 4.1.3 Status Messages | AA | Status updates announced | Loading spinners, toast notifications use `aria-live` |

---

## 2. Color Contrast Ratios

### 2.1 Verified Contrast Pairs

| Text Size | Token Pair | Ratio | Pass (AA) |
|---|---|---|---|
| Normal (16px/14px bold) | `neutral-700` on `white` | 8.7:1 | ✅ |
| Normal | `neutral-600` on `white` | 5.7:1 | ✅ |
| Normal | `neutral-500` on `white` | 4.5:1 | ✅ (AA) — only for disabled/secondary |
| Normal | `neutral-400` on `white` | 3.0:1 | ❌ — only for placeholder text |
| Normal | `neutral-800` on `neutral-100` | 8.3:1 | ✅ |
| Normal | `primary-500` on `white` | 4.5:1 | ✅ (AA) |
| Large (18px+/14px bold+) | `primary-600` on `white` | 5.8:1 | ✅ |
| Normal | `error-500` on `white` | 4.5:1 | ✅ |
| Normal | `white` on `primary-500` | 4.5:1 | ✅ |
| Normal (dark) | `neutral-200` on `neutral-900` | 8.3:1 | ✅ |
| Normal (dark) | `neutral-300` on `neutral-900` | 5.7:1 | ✅ |
| Normal (dark) | `primary-400` on `neutral-900` | 5.8:1 | ✅ |

### 2.2 Contrast Enforcement

```typescript
// Contrast checker utility
function checkContrast(foreground: string, background: string): number {
  // Returns ratio (e.g., 4.5)
  // Used in design token validation
}

// Design tokens guaranteed to pass AA:
const CONTRAST_SAFE_PAIRS = [
  ['neutral-700', 'white'],        // 8.7:1
  ['primary-500', 'white'],        // 4.5:1
  ['error-500', 'white'],          // 4.5:1
  ['white', 'primary-500'],        // 4.5:1
  ['white', 'neutral-900'],        // 15.3:1
  ['primary-600', 'white'],        // 5.8:1
] as const;
```

### 2.3 Large Text Definition

| Criteria | Size/Weight |
|---|---|
| Large text (AA min 3:1) | ≥18px normal weight, or ≥14px bold |
| Normal text (AA min 4.5:1) | <18px normal weight, or <14px bold |

---

## 3. Focus Indicators

### 3.1 Default Focus Ring

| Property | Value |
|---|---|
| Width | `3px` |
| Color | `primary-500` with 40% opacity |
| Style | `solid` outline |
| Offset | `2px` |
| Radius | Matches component border-radius |
| Transition | `outline-color 150ms ease-out` |

### 3.2 Implementation

```tsx
// Global focus styles in global.css
@layer base {
  *:focus-visible {
    outline: 3px solid rgba(59, 130, 246, 0.4);
    outline-offset: 2px;
  }

  /* Remove focus ring for mouse users */
  *:focus:not(:focus-visible) {
    outline: none;
  }

  /* Custom component overrides */
  .btn:focus-visible {
    outline: 3px solid rgba(59, 130, 246, 0.4);
    outline-offset: 2px;
    border-radius: 8px;
  }
}
```

### 3.3 Error Focus

```css
*:focus-visible[aria-invalid="true"] {
  outline-color: rgba(239, 68, 68, 0.5);
}
```

### 3.4 Skip to Main Content

```tsx
// First focusable element in <body>
<SkipLink href="#main-content">
  Saltar al contenido principal
</SkipLink>

// Target on each page
<main id="main-content" tabIndex={-1}>
  {/* page content */}
</main>
```

- Hidden until focused (visually hidden, focusable)
- Appears at top-left when focused
- Skips navigation, sidebar, topbar

---

## 4. Screen Reader Support

### 4.1 ARIA Landmarks

| Landmark | Role | Element | Page Location |
|---|---|---|---|
| Banner | `banner` | `<header>` | Topbar |
| Navigation | `navigation` | `<nav>` | Sidebar, bottom nav, breadcrumbs |
| Main | `main` | `<main>` | Main content area |
| Complementary | `complementary` | `<aside>` | Filter panel, sidebar widgets |
| Content Info | `contentinfo` | `<footer>` | Page footer |
| Search | `search` | `<div role="search">` | Search bar |
| Form | `form` | `<form>` | All forms |

### 4.2 ARIA Labels

| Element | Label Pattern | Example |
|---|---|---|
| Button (icon-only) | `aria-label="{action}"` | `aria-label="Delete garment"` |
| Button (with text) | No label needed (text is label) | — |
| Navigation item | `aria-label="{page} page"` | `aria-label="Closet page"` |
| Search input | `aria-label="Search your wardrobe"` | `aria-label="Search garments"` |
| Modal | `aria-labelledby="modal-title"` | `aria-labelledby="delete-modal-title"` |
| Input | `<label for="input-id">` | `<label for="garment-name">Name</label>` |
| Select | `<label>` + `aria-describedby` for error | — |
| Switch | `aria-label="{setting name}"` | `aria-label="Enable notifications"` |
| Tab panel | `aria-labelledby="tab-id"` | `aria-labelledby="details-tab"` |
| Toast | `role="alert"` or `role="status"` | — |
| Progress bar | `aria-valuenow` + `aria-valuemin` + `aria-valuemax` | — |
| Badge | `aria-label="{count} unread notifications"` | — |
| Dropdown | `aria-expanded` on trigger | — |
| Dialog | `role="dialog"` + `aria-modal="true"` | — |
| Tooltip | `role="tooltip"` + `aria-describedby` on trigger | — |

### 4.3 Live Regions

| Region | `aria-live` | Usage |
|---|---|---|
| Toast container | `polite` | Non-critical notifications |
| Error summary | `assertive` | Form submission errors |
| Loading state | `polite` | Content loading updates |
| Search results | `polite` | "Showing 12 results" announcement |
| Upload progress | `polite` | File upload status |
| AI processing | `polite` | "AI processing complete" |
| Count updates | `polite` | "Item added to favorites" |
| Sort/filter change | `polite` | "Sorted by name" or "Filtered by category" |

### 4.4 Announcement Patterns

```tsx
// Announcement component for dynamic content
function Announcement({ message, priority = 'polite' }: AnnouncementProps) {
  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

// Usage
<Announcement message="Showing 24 garments, filtered by category Tops" />
```

### 4.5 Screen Reader Testing

| Screen Reader | Platform | Test Frequency |
|---|---|---|
| NVDA | Windows | Every PR with UI changes |
| VoiceOver | macOS / iOS | Every sprint |
| TalkBack | Android | Every milestone |

---

## 5. Keyboard Navigation

### 5.1 Tab Order

| Order | Element | Notes |
|---|---|---|
| 1 | Skip to main content link | Hidden until focused |
| 2 | Topbar navigation | Menu, breadcrumbs, actions |
| 3 | Main content | In reading order |
| 4 | Sidebar (if visible) | After main content |
| 5 | Bottom navigation (mobile) | Last tab stop |

### 5.2 Standard Hotkeys

| Key | Action | Scope |
|---|---|---|
| `Tab` | Move to next focusable element | Global |
| `Shift + Tab` | Move to previous focusable element | Global |
| `Enter` | Activate button, submit form | Global |
| `Space` | Activate button, toggle switch | Global |
| `Escape` | Close modal/dropdown/drawer/popover | Global |
| `Arrow Up/Down` | Navigate dropdown list, slider value | Component |
| `Arrow Left/Right` | Navigate tabs, date picker days | Component |
| `Home/End` | First/last item in list | Component |
| `Ctrl + K` | Focus search bar (Cmd+K on Mac) | Global |
| `Ctrl + B` | Toggle sidebar (Cmd+B on Mac) | Global |
| `Ctrl + /` | Show keyboard shortcuts help | Global |
| `?` | Show keyboard shortcuts help | Global |
| `N` | Create new (garment, outfit) | Page |
| `Ctrl + S` | Save current form (Cmd+S on Mac) | Form |

### 5.3 Focus Management Rules

1. **Modal opens**: Focus moves to first focusable element inside modal
2. **Modal closes**: Focus returns to the element that triggered the modal
3. **New content loads**: Focus stays on triggering element (don't auto-move)
4. **Page navigates**: Focus moves to `<h1>` of new page
5. **Error occurs**: Focus moves to error summary or first erroneous field
6. **Toast appears**: Focus NOT moved (non-intrusive)
7. **Delete action**: Focus moves to confirmation dialog, returns to item list or next item

### 5.4 Roving Tabindex Pattern

Used for components where Arrow keys navigate among siblings:

```typescript
// Example: Tab list
const [currentIndex, setCurrentIndex] = useState(0);

// Only the active tab is in tab order
{items.map((item, index) => (
  <button
    role="tab"
    tabIndex={index === currentIndex ? 0 : -1}
    aria-selected={index === currentIndex}
    onKeyDown={(e) => {
      if (e.key === 'ArrowRight') setCurrentIndex((prev) => (prev + 1) % items.length);
      if (e.key === 'ArrowLeft') setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    }}
  >
    {item.label}
  </button>
))}
```

---

## 6. Form Accessibility

### 6.1 Required Fields

| Element | Visual Indicator | ARIA |
|---|---|---|
| Label | `<label>` with `*` in `error-500` | — |
| Input | `required` attribute | `aria-required="true"` |
| Error message | Below input, `error-500` text | `aria-describedby="field-error"` |

### 6.2 Error Pattern

```tsx
<div className="form-group">
  <label htmlFor="email" className="label">
    Email <span className="text-error-500" aria-hidden="true">*</span>
  </label>
  <input
    id="email"
    type="email"
    required
    aria-required="true"
    aria-invalid={!!error}
    aria-describedby={error ? 'email-error' : undefined}
    className="input"
  />
  {error && (
    <p id="email-error" className="error-text" role="alert">
      {error}
    </p>
  )}
</div>
```

### 6.3 Form Validation Announcements

| Event | Announcement | Method |
|---|---|---|
| Field error on blur | Error message for that field | `aria-describedby` |
| Form submit error | "There are 3 errors in the form" | Focus to error summary |
| Field success | No announcement (visual only) | — |
| Required field left empty | "This field is required" | `aria-describedby` |

### 6.4 Error Summary

For forms with multiple errors, display a summary at the top:

```tsx
<div
  role="alert"
  aria-labelledby="error-summary-heading"
  className="error-summary"
  tabIndex={-1} // auto-focused on form submission
>
  <h2 id="error-summary-heading">There are {errors.length} errors</h2>
  <ul>
    {errors.map((error) => (
      <li key={error.field}>
        <a href={`#${error.field}`}>{error.message}</a>
      </li>
    ))}
  </ul>
</div>
```

---

## 7. Image Alt Text Requirements

| Image Type | Alt Text Strategy | Example |
|---|---|---|
| Garment image | Garment name + type + color | "Blue cotton shirt by Zara" |
| Garment thumbnail | "Thumbnail of [name]" | "Thumbnail of Blue Shirt" |
| Avatar image | "Your 3D avatar" | — |
| User avatar (photo) | "Your profile photo" or user name | "María's profile photo" |
| Icon (functional) | `aria-label` with action | "Search garments" |
| Icon (decorative) | `aria-hidden="true"` + empty `alt=""` | — |
| Brand logo | "[Brand] logo" | "Zara logo" |
| Uploaded image | User-provided description or "Uploaded image" | — |
| Empty state illustration | Decorative only | `aria-hidden="true"` |
| Chart | Data summary as text | "Bar chart showing most worn categories: Tops 45%, Bottoms 30%..." |
| 3D model | "[Model name] — interactive 3D model" | "Summer avatar — interactive 3D model" |

### 7.1 Implementation

```tsx
// Functional image (button)
<button aria-label="Delete garment">
  <Trash2 aria-hidden="true" />
</button>

// Decorative image
<img src="decoration.svg" alt="" aria-hidden="true" />

// Informative image
<img
  src={garment.imageUrl}
  alt={`${garment.name} — ${garment.color} ${garment.garmentType} by ${garment.brand}`}
/>
```

---

## 8. Motion Sensitivity

### 8.1 `prefers-reduced-motion` Support

```css
/* Global reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  /* Keep essential animations at minimal */
  .spinner,
  .progress-bar {
    animation-duration: 2s !important;
  }
}
```

### 8.2 Tailwind Motion Variants

```tsx
// Use motion-safe variant for animations
<div className="motion-safe:animate-fade-in motion-reduce:opacity-100">

// Use motion-reduce for alternative static styles
<button className="motion-safe:hover:scale-105 motion-reduce:hover:scale-100">
```

### 8.3 Disabled Animations

The following animations are disabled when `prefers-reduced-motion: reduce`:

- Page transitions (become instant)
- Card hover scale effects
- Loading shimmer
- Toast slide-in/out (become instant opacity)
- Modal scale-in/out (become instant opacity)
- Dropdown open/close
- Accordion expand/collapse
- Skeleton pulse
- Spinner rotation (still visible, slower)
- Progress bar fill (still visible, immediate)

### 8.4 Motion Sensitivity System Setting

```typescript
// React hook for motion preference
function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}

// Usage
const prefersReduced = usePrefersReducedMotion();
const duration = prefersReduced ? 0 : 300;
```

---

## 9. Dark Mode Accessibility

### 9.1 Contrast in Dark Mode

All color tokens in the design system have verified contrast in dark mode (see §2). Key guarantees:

- Body text (`neutral-200` on `neutral-900`): 8.3:1
- Secondary text (`neutral-300` on `neutral-900`): 5.7:1
- Disabled text (`neutral-500` on `neutral-900`): 3.0:1 (acceptable for disabled)
- Interactive elements maintain minimum 3:1 against backgrounds

### 9.2 Focus Indicators in Dark Mode

```css
@media (prefers-color-scheme: dark) {
  *:focus-visible {
    outline-color: rgba(96, 165, 250, 0.6); /* info-400 with higher opacity */
  }
}
```

### 9.3 Dark Mode Considerations

- Shadows are reduced (see Design System §5 — dark mode shadow overrides)
- Surface colors invert: white becomes near-black, dark text becomes light
- Interactive states maintain the same relative luminance difference
- No reliance on dark/light specific color meaning (e.g., don't assume light = good)
- Test all color combinations in both modes for contrast

---

## 10. Touch Target Minimum Sizes

| Element | Minimum Size | Note |
|---|---|---|
| All interactive elements | `44x44px` | WCAG 2.5.8 (AA) target |
| Icon buttons | `44x44px` | Hit area via `padding` or `::before` pseudo-element |
| Links in navigation | `44px` tall | Full row height |
| Form controls | `44px` tall | Inputs, selects, textareas |
| Bottom nav items | `48x48px` | Icon + label area |
| Close buttons | `44x44px` | "X" buttons on modals |
| Switch toggles | `44px` tall | Track + knob hit area |
| Slider thumbs | `44x44px` | Range input handles |
| Checkbox / Radio | `44x44px` | Click area via label |

### 10.1 Implementation

```tsx
// Icon button with minimum touch target
<button
  aria-label="Delete garment"
  className="w-11 h-11 flex items-center justify-center"
  // w-11 = 44px, ensures minimum touch target
>
  <Trash2 className="w-5 h-5" aria-hidden="true" />
</button>
```

### 10.2 Mobile Spacing Between Touch Targets

- Minimum `8px` gap between adjacent touch targets
- Reduced to `4px` gap only for grouped controls (radio group, chip group)
- Bottom navigation items have equal spacing across bar width

---

## 11. Focus Trap for Modals and Dialogs

### 11.1 Implementation

```typescript
interface FocusTrapOptions {
  containerRef: React.RefObject<HTMLElement>;
  initialFocusRef?: React.RefObject<HTMLElement>;
  onEscape: () => void;
}

function useFocusTrap({ containerRef, initialFocusRef, onEscape }: FocusTrapOptions) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Focus first focusable element
    const focusableSelector = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const firstFocusable = initialFocusRef?.current || container.querySelector(focusableSelector);
    if (firstFocusable instanceof HTMLElement) {
      firstFocusable.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onEscape();
        return;
      }

      if (e.key !== 'Tab') return;

      const focusableElements = container.querySelectorAll<HTMLElement>(focusableSelector);
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, initialFocusRef, onEscape]);
}
```

### 11.2 Elements Requiring Focus Trap

| Component | Trap Activated | Escape Action |
|---|---|---|
| Modal | On open | Closes modal, returns focus |
| Drawer | On open | Closes drawer, returns focus |
| Dropdown menu | On open | Closes dropdown |
| Slide-in panel | On open | Closes panel |
| Popover | On open | Closes popover |
| Date picker | On calendar open | Closes picker |
| Fullscreen image viewer | On open | Exits fullscreen |

---

## 12. Announcement Patterns for Async Updates

### 12.1 Live Region Announcements

| Event | Message | `aria-live` |
|---|---|---|
| Search complete | "Showing {count} results for '{query}'" | `polite` |
| Filter applied | "Filtered by {filter}: {value}. {count} items shown" | `polite` |
| Sort changed | "Sorted by {field}, {direction}" | `polite` |
| Item added | "{name} added to closet" | `polite` |
| Item deleted | "{name} deleted" | `assertive` |
| Item updated | "{name} updated" | `polite` |
| Upload complete | "{filename} uploaded successfully" | `polite` |
| Upload failed | "{filename} upload failed" | `assertive` |
| AI processing done | "AI finished processing {name}" | `polite` |
| Network restored | "Connection restored" | `polite` |
| Network lost | "You are offline. Some features unavailable." | `assertive` |
| Save successful | "Changes saved" | `polite` |
| Save failed | "Failed to save changes" | `assertive` |
| Batch action complete | "{count} items updated" | `polite` |

### 12.2 Toast Announcements

```tsx
// Toast container with live region
const ToastContainer = () => (
  <div
    aria-live="polite"
    aria-atomic="false"
    className="toast-container"
  >
    {/* toasts rendered here */}
  </div>
);
```

---

## 13. Testing Tools and Methods

### 13.1 Automated Testing

| Tool | Scope | Frequency |
|---|---|---|
| axe-core (@axe-core/react) | Component-level a11y | Every component test |
| @testing-library/jest-dom | Jest matchers for a11y | Every unit test |
| eslint-plugin-jsx-a11y | Static analysis for JSX a11y | Pre-commit hook |
| Lighthouse CI | Full page audit | Every PR |
| WAVE | Browser extension audit | Weekly |
| Accessibility Insights | Detailed manual checks | Every sprint |

### 13.2 Manual Testing Checklist

| Check | Method | Frequency |
|---|---|---|
| Keyboard navigation | Tab through all interactive elements | Every PR |
| Screen reader (NVDA) | Navigate entire flow with NVDA | Every feature |
| Screen reader (VoiceOver) | Navigate entire flow with VoiceOver | Every milestone |
| Zoom to 200% | Verify no content loss | Every PR |
| Color contrast | Check with Color Contrast Analyzer | Every design change |
| Focus visible | Tab through, verify focus rings | Every PR |
| Touch targets | Verify 44x44px minimum | Every UI change |
| Reduced motion | Enable OS setting, verify animations | Every new animation |
| Error announcements | Trigger errors, verify screen reader hears them | Every form change |
| Dark mode contrast | Check all pages in dark mode | Every milestone |

### 13.3 Testing Commands

```bash
# Run accessibility tests
pnpm test:a11y

# Run Lighthouse CI audit
pnpm lighthouse:ci

# Run axe-core scan on all routes
pnpm a11y:scan

# Check color contrast in all themes
pnpm contrast:check
```

### 13.4 Component Accessibility Tests

Every component with user interaction must include:

```typescript
// Example: Button accessibility test
describe('Button accessibility', () => {
  it('has no axe violations', async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('can be focused and activated by keyboard', () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Submit</Button>);
    const button = screen.getByRole('button', { name: /submit/i });
    button.focus();
    expect(button).toHaveFocus();
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(onClick).toHaveBeenCalled();
  });

  it('has accessible name', () => {
    render(<Button ariaLabel="Save changes">Save</Button>);
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });
});
```

### 13.5 Accessibility Acceptance Criteria

For a feature to be considered "Done", it must:

1. ✅ Pass automated axe-core scan with zero violations
2. ✅ Be fully navigable by keyboard
3. ✅ Have visible focus indicators on all interactive elements
4. ✅ Pass color contrast checks for all states and themes
5. ✅ Work correctly with screen reader (NVDA on Windows, VoiceOver on macOS)
6. ✅ Have appropriate `aria-` attributes on all custom components
7. ✅ Respect `prefers-reduced-motion`
8. ✅ Meet 44x44px minimum touch targets on all interactive elements
9. ✅ Have descriptive alt text on all informative images
10. ✅ Show clear error messages linked to form fields
11. ✅ Maintain focus order that matches visual layout
12. ✅ Preserve content and functionality at 200% zoom
13. ✅ Support system font size adjustments
14. ✅ Work in both light and dark modes with adequate contrast
15. ✅ Have a "skip to main content" link on every page
