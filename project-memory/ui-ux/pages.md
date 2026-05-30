# Closet Inteligente Digital — Page-by-Page UX Specifications

> **Version:** 1.0.0
> **Status:** APPROVED
> **Last Updated:** 2026-05-25

---

## 1. Login / Register Pages

### 1.1 Route: `/auth/login`, `/auth/register`, `/auth/reset-password`

### 1.2 Layout
- Centered card layout (max-width: 440px)
- No sidebar, no topbar — standalone auth shell
- Full-screen background: gradient from primary-50 to white (light), neutral-950 (dark)
- Logo centered above the card
- Language selector (top-right) — ES/EN toggle

### 1.3 States

| State | Behavior |
|---|---|
| **Initial** | Clean form with empty fields |
| **Typing** | Inline validation on blur. Email format checked. Password strength indicator visible after 4 chars |
| **Validating** | Feedback icon (spinner) on email field while checking availability (register) |
| **Submitting** | Button shows spinner, all inputs disabled, "Iniciando sesión..." or "Creando cuenta..." |
| **Success** | Brief success toast, redirect to dashboard/home |
| **Error** | Inline error on field or banner alert at top for server errors |
| **Rate limited** | "Demasiados intentos. Intenta de nuevo en X minutos." timer countdown |
| **Network error** | "Error de conexión. Verifica tu internet." with retry button |
| **Maintenance** | Full-screen maintenance banner if auth service is down |

### 1.4 Login Page UX

```
┌──────────────────────────────────────┐
│                                      │
│            [Logo]                    │
│                                      │
│        Welcome Back                  │
│    Log in to your digital closet     │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ 📧 Email                       │  │
│  │ hello@example.com              │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ 🔒 Password                    │  │
│  │ •••••••••              [👁]   │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────┐      │
│  │  ◻ Remember me             │      │
│  └────────────────────────────┘      │
│                                      │
│  ┌────────────────────────────────┐  │
│  │        Iniciar Sesión          │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │  ──── or continue with ────   │  │
│  └────────────────────────────────┘  │
│                                      │
│  [G Google]  [ Apple]              │
│                                      │
│  ¿No tienes cuenta? [Regístrate]    │
│  [¿Olvidaste tu contraseña?]        │
│                                      │
└──────────────────────────────────────┘
```

### 1.5 Register Page UX

```
┌──────────────────────────────────────┐
│                                      │
│            [Logo]                    │
│                                      │
│  Create Your Account                 │
│  Start digitizing your wardrobe      │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ 👤 Full Name                   │  │
│  │ María García                   │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ 📧 Email                       │  │
│  │ maria@example.com       [✓]   │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ 🔒 Password                    │  │
│  │ ••••••••••••••••       [Strong]│  │
│  └────────────────────────────────┘  │
│  ┌──── Strength bar ────────────┐   │
│  │  ██████████░░░░░░░░░░        │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ 🔒 Confirm Password            │  │
│  │ ••••••••••••••••       [✓]    │  │
│  └────────────────────────────────┘  │
│                                      │
│  ◻ Acepto los [Términos de Servicio] │
│    y la [Política de Privacidad]     │
│                                      │
│  ┌────────────────────────────────┐  │
│  │        Crear Cuenta            │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │  ──── or continue with ────   │  │
│  └────────────────────────────────┘  │
│                                      │
│  [G Google]  [ Apple]              │
│                                      │
│  ¿Ya tienes cuenta? [Inicia Sesión] │
│                                      │
└──────────────────────────────────────┘
```

### 1.6 Social Auth Buttons

| Button | Style |
|---|---|
| **Google** | White bg, Google logo, border neutral-200, "Continuar con Google" |
| **Apple** | Black bg (light) / White bg (dark), Apple logo, "Continuar con Apple" |
| Loading | Both show spinner after click, disabled during auth |

### 1.7 Validation Rules

| Field | Rules | Error Message |
|---|---|---|
| Email | Required, valid email format | "Ingresa un correo electrónico válido" |
| Password | Min 8 chars, 1 uppercase, 1 number | "Mínimo 8 caracteres, 1 mayúscula y 1 número" |
| Confirm password | Must match password | "Las contraseñas no coinciden" |
| Full name | Required, min 2 chars | "Ingresa tu nombre completo" |
| Terms | Must be checked | "Debes aceptar los términos" |

### 1.8 Password Strength Indicator

| Score | Label | Color | Bar % |
|---|---|---|---|
| 0-1 | Débil | `error-500` | 25% |
| 2 | Regular | `warning-500` | 50% |
| 3 | Buena | `info-500` | 75% |
| 4 | Fuerte | `success-500` | 100% |

### 1.9 Reset Password Flow

1. Enter email → submit → "If an account exists, you'll receive a reset link"
2. Email sent confirmation screen with back-to-login link
3. Reset link page: new password + confirm, validation, submit → success → redirect to login

---

## 2. Home / Dashboard Page

### 2.1 Route: `/` or `/dashboard`

### 2.2 Layout
- Sidebar (desktop) + Topbar + Main content
- 4-column stat row at top
- Two-panel below: daily recommendation (left) + quick actions (right)
- Full-width activity feed at bottom

### 2.3 States

| State | Behavior |
|---|---|
| **Loading** | Skeleton grid for stats, skeleton cards for recommendation and actions |
| **Loaded (first time)** | Welcome onboarding prompt if closet is empty |
| **Loaded (data)** | Full dashboard with all sections |
| **Empty closet** | Dashboard shows "Get Started" guide with steps |
| **Error** | Error banner, retry per-section |

### 2.4 Summary Cards

| Card | Metric | Icon | Trend |
|---|---|---|---|
| Total Garments | `{count}` | `Shirt` | % change vs last week |
| Total Outfits | `{count}` | `Layers` | % change vs last week |
| Worn This Week | `{count}` | `Footprints` | % change vs last week |
| AI Recommendations | `{count}` | `Sparkles` | New since yesterday |

### 2.5 Quick Actions

| Action | Icon | Description |
|---|---|---|
| Add Garment | `Plus` | Opens upload flow |
| Create Outfit | `Shirt` | Opens outfit builder |
| AI Suggest | `Sparkles` | Generates outfit suggestions |
| Scan Wardrobe | `Camera` | Opens camera for batch scan |

### 2.6 Daily Outfit Recommendation

- Shows current weather (integrated with weather API)
- Displays 1 recommended outfit with garment thumbnails
- Action buttons: "Wear Today" (logs wear), "View Details", "Regenerate"
- Source: AI-generated or last used outfit for similar weather

### 2.7 Recent Activity Feed

| Event | Display |
|---|---|
| Garment added | "Has añadido [nombre]" with timestamp and thumbnail |
| Outfit created | "Has creado [nombre]" with preview |
| AI detection complete | "IA ha procesado [n] prendas" |
| Worn garment | "Has usado [nombre]" with wear count update |
| Weather alert | "Se espera lluvia — ¿revisar tu outfit?" |
| Avatar ready | "Tu avatar 3D está listo" with view link |

### 2.8 Notification Summary

- Compact section showing 3 most recent notifications
- "View all" link redirects to notifications page
- Each item: icon, title, relative time

---

## 3. Closet Page (Wardrobe)

### 3.1 Route: `/wardrobe`

### 3.2 Layout
- Topbar with title "My Closet"
- Search bar + filter/sort controls below topbar
- Grid view (default) or list view toggle
- Filter panel (slide-in on desktop, bottom sheet on mobile)
- Batch action bar (visible when items selected)

### 3.3 States

| State | Behavior |
|---|---|
| **Loading** | Skeleton grid (12 cards in 3 rows) with shimmer |
| **Empty** | Empty closet illustration + "Add Your First Garment" CTA |
| **Loaded** | Garment grid with cards |
| **Searching** | Live filter results as user types; "No results" empty state if no match |
| **Filtered** | Active filter chips above grid; result count |
| **Selecting** | Checkbox overlay on cards; batch action bar appears |
| **Error** | "Failed to load wardrobe" with retry |

### 3.4 Search Bar

- Debounced input (300ms)
- Search by: name, brand, color, category
- Recent searches shown on focus
- Voice search button on mobile (future)

### 3.5 Sort Options

| Option | Behavior |
|---|---|
| Recently Added | Default. Sort by `created_at` desc |
| Name A-Z | Alphabetical |
| Most Worn | By `wear_count` desc |
| Least Worn | By `wear_count` asc |
| Brand | Alphabetical by brand |
| Price | High to low / Low to high |

### 3.6 Filter Panel Sections

| Filter | Type | Options |
|---|---|---|
| Category | Multi-checkbox | All garment_type enum values |
| Color | Color swatches | All colors present in wardrobe |
| Size | Multi-select | S, M, L, XL, numeric range |
| Brand | Searchable multi-select | All brands present |
| Season | Multi-checkbox | Spring, Summer, Fall, Winter, All |
| State | Multi-checkbox | Active, Archived, Donated, Sold, etc. |
| Price Range | Range slider | Min-max with input fields |
| Formality | Range slider | 1 (casual) to 10 (formal) |
| Date Added | Date range | From/To date pickers |

### 3.7 Garment Card Design

See Components section — Card variant: garment.

| Element | Detail |
|---|---|
| Image | 4:5 aspect ratio, object-cover, lazy loaded with blurhash |
| Favorite | Heart icon top-right corner (toggleable) |
| Name | Truncated to 2 lines |
| Brand + Color | Single line, secondary text |
| Wear count | Small icon + count bottom-left |
| Selection | Checkbox visible in selection mode only |

### 3.8 Batch Actions

Actions bar appears at bottom when 1+ items selected:

| Action | Icon | Behavior |
|---|---|---|
| Select All | `CheckSquare` | Selects all visible items |
| Add to Outfit | `Shirt` | Opens create outfit with selected items |
| Change State | `Tag` | Dropdown: mark as Archived/Donated/Sold |
| Delete | `Trash2` | Confirmation modal: "Delete N items?" |
| Export | `Download` | Export selected items data |

### 3.9 View Toggle

- Grid view: Default. Responsive columns (2-6 based on breakpoint)
- List view: Single column. Each row: thumbnail + name + brand + category + wear count + actions

---

## 4. Garment Detail Page

### 4.1 Route: `/wardrobe/[id]`

### 4.2 Layout
- Back button in topbar
- Split layout: image gallery (left 50%) + details (right 50%)
- On mobile: stacked (full-width image, details below)
- Tab section below: Usage History | Associated Outfits | AI Data

### 4.3 Sections

#### Image Gallery
| Element | Specification |
|---|---|
| Main image | Large display (100% width of left panel). Object-fit: contain |
| Thumbnails | Row below main image (80x80px). Click to select. Primary image highlighted |
| Zoom | Hover-to-zoom (desktop) or pinch-to-zoom (mobile) |
| Fullscreen | Tap/click to open fullscreen gallery viewer |
| Navigation | Left/right arrows to cycle images |
| Add photo | "+" button at end of thumbnail row to upload additional image |

#### Attributes Display
| Attribute | Display | Edit Control |
|---|---|---|
| Name | heading-lg (24px) | Text input inline |
| Brand | body-md with icon | Text input or auto-complete |
| Size | body-md with icon | Size selector |
| Color | Color swatch + name | Color swatch picker |
| Category | Badge (garment_type) | Select dropdown |
| Pattern | body-md | Text input or tags |
| Fabric | body-md | Select dropdown |
| Season | Badge(s) | Multi-select |
| Formality | Rating 1-10 (visual bar) | Range slider |
| Price | "$XX.XX" with currency | Number input + currency select |
| Purchase Date | Formatted date | Date picker |
| Purchase Location | body-sm | Text input |
| State | Badge (garment_state) | Select dropdown |
| Notes | body-md | Textarea (expandable) |
| Tags | Chip list | Tag input |

#### Edit Mode
- Toggle button "Edit" in header switches to edit mode
- Fields become editable (type determined by attribute)
- Footer shows "Cancel" + "Save Changes" buttons
- Unsaved changes prompt on navigation away
- Character limits: name 200, notes 2000

#### Delete Confirmation
- Trigger: "Delete" button (red, bottom of page)
- Modal: "Are you sure you want to delete [garment name]?"
- Warning: "This action cannot be undone. {N} outfits include this garment."
- Confirm button: "Delete" (error-500 style)
- Cancel: keeps garment

#### Usage History
| Column | Data |
|---|---|
| Date | When worn |
| Outfit | Associated outfit (if any) |
| Event | Calendar event (if any) |
| Weather | Weather at time of wear |
| Notes | User notes for that wear |

#### Outfit Associations
- Grid of outfit cards that include this garment
- Each card: outfit thumbnail grid, name, type
- Click to navigate to outfit detail
- "Add to Outfit" button to use garment in new outfit

#### Status Change Actions
| Action | New State | Confirmation |
|---|---|---|
| Archive | Archived | Brief toast, undo option |
| Mark as Donated | Donated | Modal: "Record donation?" with date picker |
| Mark as Sold | Sold | Modal: "Record sale?" with price + date picker |
| Mark as Lost | Lost | Simple confirmation |
| Mark as Damaged | Damaged | Modal: "Describe damage" textarea |
| Reactivate | Active | Simple confirmation |

---

## 5. Upload Garment Page

### 5.1 Route: `/wardrobe/new`

### 5.2 Layout
- Full multi-step wizard experience
- Step indicator at top (4 steps)
- No sidebar (or sidebar hidden), focused form

### 5.3 Multi-Step Flow

#### Step 1: Photos (mandatory)
- Large drop zone for image upload
- Camera capture button (mobile)
- Drag-and-drop reorder of uploaded photos
- Minimum: 1 photo (front view). Recommended: 3 (front, back, detail)
- Validation: at least 1 photo required to proceed

#### Step 2: Details (auto-filled by AI, editable)
- All garment attributes listed as form fields
- If AI processed: fields pre-filled with confidence badges
- "AI Suggested" badge next to auto-filled fields (e.g., "Category: Top [AI 92%]")
- Manual override: user can change any field
- Validation: Name and Category required

#### Step 3: AI Review (processing state)
- Shows AI detection progress in real-time
- Three pipeline steps:
  1. Segmentation (Detectron2) — isolating garment from background
  2. Attribute Extraction (color, type, pattern, fabric)
  3. Measurement Estimation (if full-body photo)
- Each step: status indicator (pending / processing / done / failed)
- Overall progress bar

#### Step 4: Confirm & Save
- Summary of all data (image, attributes)
- "Save to Closet" button
- "Save & Add Another" option
- "Discard" button with confirmation

### 5.4 AI Processing States

| Step | Pending | Processing | Complete | Failed |
|---|---|---|---|---|
| Segmentation | ○ | ◌ (spinner) | ✓ | ✗ (retry) |
| Attributes | ○ | ◌ (spinner) | ✓ | ✗ (manual) |
| Measurements | ○ | ◌ (spinner) | ✓ | N/A |

### 5.5 Error States

| Error | Behavior |
|---|---|
| File too large | Inline error: "Image exceeds 10MB limit. Please compress and retry." |
| Wrong format | Inline error: "Format not supported. Use JPG, PNG, or WebP." |
| Upload failed | Retry button per-file. "Connection lost" if network issue. |
| AI timeout | "AI processing taking longer than expected. You can save now and AI will update later." |
| AI failure | "AI could not process this image. Fields will need manual entry." |
| Network lost during upload | Queue upload, show "Waiting for connection..." banner |

### 5.6 Progress Indicator

```typescript
interface UploadProgress {
  status: 'uploading' | 'processing' | 'complete' | 'error';
  percent: number; // 0-100 for upload
  bytesUploaded: number;
  bytesTotal: number;
  stage: 'compressing' | 'uploading' | 'ai-segmentation' | 'ai-attributes' | 'ai-measurements';
}
```

---

## 6. Outfits Page

### 6.1 Route: `/outfits`

### 6.2 Layout
- Topbar with title "My Outfits"
- Gallery grid of outfit cards
- Floating action button (FAB) for "Create Outfit" (mobile)
- "Create Outfit" button in topbar (desktop)
- AI Recommend button
- Filter by outfit type tabs

### 6.3 States

| State | Behavior |
|---|---|
| **Loading** | 6 skeleton outfit cards |
| **Empty** | Empty state illustration + Create + AI Suggest CTAs |
| **Loaded** | Outfit grid |
| **Filtered** | Active type filter, result count |
| **Error** | "Could not load outfits" with retry |

### 6.4 Filter Tabs

| Tab | Filter |
|---|---|
| All | No filter |
| Casual | outfit_type === Casual |
| Business | outfit_type === Business |
| Formal | outfit_type === Formal |
| Sport | outfit_type === Sport |
| Travel | outfit_type === Travel |
| AI Generated | is_ai_generated === true |

### 6.5 Actions

| Action | Location | Behavior |
|---|---|---|
| Create Outfit | Topbar / FAB | Navigate to `/outfits/builder` |
| AI Recommend | Topbar | Opens AI recommendation panel (sidebar or modal) |

---

## 7. Outfit Detail Page

### 7.1 Route: `/outfits/[id]`

### 7.2 Layout
- Back button in topbar
- Header: Outfit name, type badge, wear count, last worn
- Garment grid: 2x3 grid (max 6 garments)
- Each garment slot: image, name, remove button (edit mode)
- 3D Preview toggle button
- Action buttons row

### 7.3 Garment Grid

```
┌─────┐ ┌─────┐ ┌─────┐
│ 1   │ │ 2   │ │ 3   │
│ Top │ │ Bot │ │ Sho │
└─────┘ └─────┘ └─────┘
┌─────┐ ┌─────┐ ┌─────┐
│ 4   │ │ 5   │ │ +   │
│ Acc │ │ Bag │ │Add  │
└─────┘ └─────┘ └─────┘
```

### 7.4 3D Preview

- Toggle button shows 3D view of avatar wearing all outfit garments
- Fallback: 2D flat-lay of garments if 3D models not available
- Controls: rotate, zoom, pan
- Environment: selectable background (studio, outdoor, etc.)

### 7.5 Actions

| Action | Behavior |
|---|---|
| Edit Outfit | Opens edit mode — reorder, remove, add garments |
| Delete Outfit | Confirmation modal: "Delete [name]? It will be removed from your calendar." |
| Mark as Worn | Increments wear_count, logs to usage history. Shows success toast |
| Share | Opens share sheet: image export, link copy, social media |
| Weather Check | Shows current weather compatibility analysis |
| Clone | Creates a copy "Copy of [name]" — opens in edit mode |

---

## 8. Calendar Page

### 8.1 Route: `/calendar`

### 8.2 Layout
- Topbar with month navigation + "Today" button
- View toggle: Month / Day
- Month view: full calendar grid
- Day view: list of events with outfit assignments
- Clicking date opens day view

### 8.3 Month View

| Element | Specification |
|---|---|
| Header | `< March 2026 >` navigation. "Today" button |
| Day headers | Sun Mon Tue Wed Thu Fri Sat (Spanish locale: Do Lu Ma Mi Ju Vi Sa) |
| Past dates | `neutral-300` text (light) or `neutral-600` (dark) |
| Future dates | `neutral-700` text (light) or `neutral-300` (dark) |
| Today | Primary-500 circle outline |
| Selected | Filled primary-500 circle |
| Has outfit | Small dot/dots below date number. Multiple dots if multiple events |
| "Free outfit" day | Small sparkle icon suggesting no outfit assigned yet |
| Events | Colored bar (event color) + truncated title |

### 8.4 Day View

```
┌────────────────────────────────────┐
│  March 10, 2026        ☀️ 22°C     │
│  Today                   Sunny      │
│  < Day view                      > │
├────────────────────────────────────┤
│                                    │
│  ┌──┐  Morning                     │
│  │10│  ┌────────────────────────┐  │
│  │  │  │ Work Meeting           │  │
│  │  │  │ Outfit: Office Look  ──┤  │
│  │  │  │ [img] [img] [img]      │  │
│  │  │  │ [Change]  [Weather ✓] │  │
│  │  │  └────────────────────────┘  │
│  ├──┤                             │
│  │12│  No events                  │
│  ├──┤                             │
│  │  │  Afternoon                  │
│  │  │  (free outfit indicator)    │
│  │  │  ┌────────────────────────┐ │
│  │  │  │ 🆓 No outfit assigned  │ │
│  │  │  │ [Assign Outfit] [AI    │ │
│  │  │  │  Suggest]              │ │
│  │  │  └────────────────────────┘ │
│  ├──┤                             │
│  │  │  Evening                    │
│  │  │  ┌────────────────────────┐ │
│  │  │  │ Dinner with Friends   │ │
│  │  │  │ [Assign Outfit]       │ │
│  │  │  └────────────────────────┘ │
│  └──┘                             │
└────────────────────────────────────┘
```

### 8.5 Outfit Assignment

- Dropdown: select from existing outfits
- Modal: browse outfits grid
- AI Suggest: generates outfit for the specific event (considers dress code, weather)
- "Free outfit" indicator: days without any outfit assignment show sparkle icon
- Quick assign: drag outfit from list onto date (desktop)

### 8.6 Event Details Popup

- Trigger: click on event in day view
- Popup: card with title, time, location, dress code, assigned outfit
- Actions: edit event, change outfit, view weather, remove outfit

---

## 9. Avatar Page

### 9.1 Route: `/avatar`

### 9.2 Layout
- 3D viewer (main area, left 60% on desktop)
- Avatar list/sidebar (right 40% on desktop)
- On mobile: stacked (viewer full-width, list below)

### 9.3 States

| State | Behavior |
|---|---|
| **Loading** | 3D viewer shows loading spinner |
| **No avatar** | "Generate your 3D avatar" CTA with explanation |
| **Loaded** | 3D avatar displayed with orbit controls |
| **Generating** | Progress indicator, "Creating your avatar..." |
| **Error** | "Avatar could not be loaded" with retry |

### 9.4 3D Viewer Controls

| Control | Action |
|---|---|
| Click-drag | Rotate |
| Scroll/pinch | Zoom |
| Right-click-drag | Pan |
| Auto-rotate | Toggle button |
| Fullscreen | Expand to full viewport |
| Reset view | Reset camera position |
| Environment | Background selector (studio, outdoor, etc.) |

### 9.5 Avatar List

- Max 3 avatar versions
- Each: thumbnail, name, version number, active badge
- Active avatar highlighted with primary border
- Actions: Set Active, Delete, Rename

### 9.6 Generate Actions

| Action | Description |
|---|---|
| Generate from Photos | Upload 2 photos (front + side) for measurement estimation |
| Generate from Video | Upload video for 360-degree capture |
| Manual Measurements | Enter height, weight, sizes manually |
| Style presets | Body type, skin tone, hair color selectors |

### 9.7 Measurement Display

| Measurement | Format |
|---|---|
| Height | `175 cm` |
| Weight | `68 kg` |
| Chest | `96 cm` |
| Waist | `78 cm` |
| Hips | `102 cm` |
| Inseam | `82 cm` |
| Shoulder width | `44 cm` |
| Arm length | `60 cm` |
| Neck | `38 cm` |

### 9.8 Delete Confirmation

- Modal: "Delete [avatar name]?"
- Warning: "This avatar will be permanently removed. Associated outfits will use your remaining avatar."
- If only avatar: "You must have at least one avatar. Generate a new one before deleting."

---

## 10. Avatar Generation Page

### 10.1 Route: `/avatar/generate`

### 10.2 Layout
- Wizard-style flow
- Step indicator: Photos → Processing → Preview → Confirm
- Centered content, minimal chrome

### 10.3 Steps

#### Step 1: Video/Photo Upload
- Drop zone for video (MP4, MOV, max 50MB) or 2 photos (front + side)
- Camera capture button (mobile)
- "Or enter measurements manually" option

#### Step 2: Processing
- Progress bar: "Processing your data..."
- Step indicators:
  1. Pose estimation (Mediapipe)
  2. Measurement calculation
  3. Avatar generation (Ready Player Me)
  4. Texture application
  5. Optimization

#### Step 3: Preview
- 3D viewer with generated avatar
- "Regenerate" button if unsatisfied
- Manual adjustment sliders: height, weight, skin tone, hair color

#### Step 4: Confirm
- Name input for avatar
- "Save Avatar" button
- "Set as Active" checkbox

### 10.4 Error States

| Step | Error | Recovery |
|---|---|---|
| Upload | File too large, wrong format | Show validation inline |
| Pose detection | No person detected in image | "Could not detect a person. Ensure full body is visible." |
| Measurement | Processing failed | "Measurements could not be calculated. Enter manually." |
| Generation | API failure | "Avatar generation failed. Try again." with retry button |
| Optimization | Model too large | "Model exceeds size limit. Simplifying..." |

---

## 11. Analytics Page

### 11.1 Route: `/analytics`

### 11.2 Layout
- Topbar with title "Analytics"
- Date range selector (preset ranges + custom)
- KPI cards row (4 metrics)
- Chart grid (2 columns desktop, 1 column mobile)
- Data table at bottom

### 11.3 Date Range Selector

| Preset | Range |
|---|---|
| Last 7 days | 7 days ago → today |
| Last 30 days | 30 days ago → today |
| Last 90 days | 90 days ago → today |
| This year | Jan 1 → today |
| Custom | Date picker range |

### 11.4 KPI Cards

| Metric | Formula | Display |
|---|---|---|
| Wardrobe Utilization | Worn in last 90d / Total | `65%` with trend |
| Cost Per Wear | Total spent / Total wears | `$2.34` |
| AI Precision | Accepted recommendations / Total | `87%` |
| Sustainability Score | CO₂ saved + water saved | Composite score `A` |

### 11.5 Charts

| Chart | Type | Description |
|---|---|---|
| Most Worn Categories | Horizontal bar | Top 10 categories by wear count |
| AI Recommendation Precision | Line chart | AI accuracy over time |
| Usage Trends | Multi-line | Daily wears over selected period |
| Color Distribution | Pie/donut | Color breakdown of wardrobe |
| Cost Analysis | Stacked bar | Cost per wear by category |
| Sustainability Impact | Area chart | Cumulative CO₂ + water saved |
| Wear Frequency Heatmap | Calendar heatmap | Daily wear activity (like GitHub) |

### 11.6 Export Button

| Export Type | Format | Content |
|---|---|---|
| Full Report | PDF | All charts + KPI summary |
| Data Export | CSV | Raw analytics data |
| Wardrobe Report | PDF | Complete wardrobe inventory |

---

## 12. Settings Page

### 12.1 Route: `/profile` (root), `/profile/notifications`, `/profile/privacy`, `/profile/account`

### 12.2 Layout
- Left: vertical tab navigation (settings sections)
- Right: content panel for selected section
- Mobile: full-width content, tabs become accordion or top tabs

### 12.3 Settings Sections

#### Profile
| Field | Control |
|---|---|
| Display Name | Text input |
| Email | Text input (greyed, change triggers verification) |
| Avatar/Photo | Image upload |
| Timezone | Select |
| Language | Select (ES/EN) |
| Body Measurements | Expandable section with manual inputs |
| Style Preferences | Multi-select: preferred styles, colors, brands |

#### Notifications
| Toggle | Description |
|---|---|
| Push Notifications | Master toggle for all push |
| Email Notifications | Master toggle for all email |
| Daily Outfit Reminder | Time picker (default 7:00 AM) |
| Garment Unused Alert | Number input: days (default 90) |
| Weather Alerts | Toggle |
| Calendar Reminders | Toggle |
| AI Recommendations | Toggle |
| Product Updates | Toggle |
| Marketing Emails | Toggle |
| Quiet Hours | From/To time pickers |

#### Privacy
| Toggle | Description |
|---|---|
| AI Processing Consent | "Allow AI to process garment images" |
| Biometric Data Storage | "Store body measurements for 3D avatar" |
| Share Outfits Publicly | "Make outfits visible to community" |
| Data for Research | "Anonymized data for sustainability research" |
| Third-party Sharing | "Share data with partner brands" |
| Data Export | Button: "Export all my data" (generates ZIP) |
| Delete Account | Red button: "Delete my account and all data" |

#### Storage
| Metric | Display |
|---|---|
| Total images | Count + total size |
| 3D models | Count + total size |
| Cloud storage used | Progress bar with quota |
| Clear cache | Button to clear local cache |

#### Delete Account Flow
1. Click "Delete Account" (red button in Privacy section)
2. Confirmation modal: "Are you sure? This deletes ALL data including garments, outfits, avatar, and analytics."
3. Type "DELETE" to confirm text input
4. Select reason from dropdown (optional)
5. Confirm button: "Permanently Delete My Account"
6. Success: account deleted, redirected to landing page
7. Error: "Could not process deletion" with support contact

---

## 13. Not Found Page (404)

### 13.1 Route: Catch-all `*`

### 13.2 Layout
- Centered error state with illustration
- "Page not found" heading
- "The page you're looking for doesn't exist or has been moved."
- "Go Home" button
- "Go to Closet" secondary action
- Links to common pages: Closet, Outfits, Calendar

---

## 14. Maintenance Page

### 14.1 Route: System-level redirect

### 14.2 Layout
- Centered content
- "We'll be right back" heading
- "We're doing some maintenance to improve your experience."
- Estimated completion time if available
- No navigation (app is unavailable)

---

## 15. Error Page (500)

### 15.1 Route: System-level error

### 15.2 Layout
- "Something went wrong" heading
- "An unexpected error occurred"
- "Try Again" button
- "Go Home" button
- Error reference code (for support)
- "Contact Support" link
