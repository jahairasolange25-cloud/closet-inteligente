# Closet Inteligente Digital — State Matrix

> **Version:** 1.0.0
> **Status:** APPROVED
> **Last Updated:** 2026-05-25

---

## 1. Global Application States

### 1.1 State Diagram

```
                    ┌─────────────┐
                    │  Bootstrap  │
                    │  (Loading)  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Auth       │
                    │  Check      │
                    └──┬──────┬───┘
                       │      │
               ┌───────▼┐  ┌──▼────────┐
               │  Auth   │  │  No Auth  │
               │  (Home) │  │  (Login)  │
               └───┬─────┘  └─────┬─────┘
                   │              │
          ┌────────┼────────┐     │
          │        │        │     │
     ┌────▼──┐ ┌──▼───┐ ┌──▼──┐  │
     │Online │ │Offline│ │Maint│  │
     └───┬───┘ └──┬───┘ └──┬──┘  │
         │        │        │     │
         └────────┴────────┘     │
                  │              │
             ┌────▼────┐        │
             │  Error  │        │
             │ Screen  │        │
             └─────────┘        │
                                 │
                          ┌──────▼──────┐
                          │  Unath      │
                          │  (Login)    │
                          └─────────────┘
```

### 1.2 Global State Definitions

| State | Trigger | UI Behavior | Duration |
|---|---|---|---|
| **Initial Load** | App first loads | Full-screen logo + spinner "Cargando..." | < 3s target |
| **Authenticated** | Valid session found | Full app shell, user data loaded | Session duration |
| **Unauthenticated** | No session / token expired | Redirect to login page | Until login |
| **Offline** | Network connectivity lost | Offline banner, cached content, pending queue | Until reconnected |
| **Maintenance Mode** | Server returns 503 | Full-screen maintenance page, no app access | Variable |
| **Error Screen** | Unrecoverable error | Error page with retry, error code | Until resolved |
| **Rate Limited** | 429 response from API | Toast + timed cooldown on specific actions | 60s typical |

---

## 2. Per-Feature State Matrix

### 2.1 Authentication Pages

| State | UI | Actions Available |
|---|---|---|
| **Loading** | Skeleton form, no inputs | None |
| **Login Default** | Empty form, email + password fields | Type credentials |
| **Login Validating** | Field validation on blur | Submit disabled if invalid |
| **Login Submitting** | Button spinner "Iniciando sesión...", all inputs disabled | Cancel (close app) |
| **Login Success** | Brief "¡Bienvenido!" toast, redirect to dashboard | None (auto-redirect) |
| **Login Error - Invalid** | Inline error "Credenciales incorrectas", shake animation | Retry |
| **Login Error - Locked** | Banner "Cuenta bloqueada por X minutos" | Contact support link |
| **Login Error - Network** | Banner "Error de conexión", retry button | Retry |
| **Login Rate Limited** | "Demasiados intentos. Intenta en X segundos" | Wait or reset password |
| **Register Default** | Empty form, all fields | Type, toggle password visibility |
| **Register Validating** | Inline validation, email availability check spinner | Submit disabled if invalid |
| **Register Submitting** | Button spinner "Creando cuenta...", inputs disabled | None |
| **Register Success** | "Cuenta creada" toast, verification email sent notice, redirect | Redirect to dashboard |
| **Register Error - Email exists** | Inline "Este correo ya está registrado" | Login link or reset |
| **Register Error - Weak password** | Inline with password requirements | Modify password |
| **Register Error - Terms not accepted** | Inline below checkbox | Accept terms |
| **Register Error - Network** | Banner "Error de conexión" | Retry |
| **Password Reset - Default** | Email input only | Submit |
| **Password Reset - Sent** | "Revisa tu correo" with back to login | Back to login |
| **Password Reset - Error** | "Correo no encontrado" | Retry |
| **Password Reset - New Default** | New password + confirm | Submit |
| **Password Reset - New Success** | "Contraseña actualizada", redirect to login | None (auto-redirect) |
| **Password Reset - Error** | Invalid token / expired link | "Solicita un nuevo enlace" |
| **OAuth - Google Loading** | Google button spinner | None |
| **OAuth - Apple Loading** | Apple button spinner | None |
| **OAuth - Error** | "No se pudo autenticar con [proveedor]" | Retry or use email |

### 2.2 Dashboard / Home

| State | UI | Actions Available |
|---|---|---|
| **Loading** | Skeleton row (4 stat cards), skeleton recommendation card, skeleton activity list | None |
| **Loaded (has data)** | Full dashboard with stats, recommendation, quick actions, activity feed, notifications | All dashboard actions |
| **Loaded (first visit)** | Welcome card with onboarding steps overlay | Start onboarding, dismiss |
| **Empty wardrobe** | Dashboard with empty stats (0s), "Get Started" guide, add garment CTA | Add garment, dismiss guide |
| **Partial data** | Some sections loaded, some skeleton | Available section actions |
| **Error - Stats** | Stat cards show "--" or "Error" with retry per card | Retry per card |
| **Error - Activity** | "No se pudo cargar actividad reciente" inline message | Retry |
| **Error - Recommendation** | "No se pudo generar recomendación" with retry | Retry or ignore |
| **Error - Full** | Full-page error state within dashboard | Retry, go to closet |

### 2.3 Closet / Wardrobe

| State | UI | Actions Available |
|---|---|---|
| **Loading** | Skeleton grid (12 cards, 3 rows), shimmer animation | None |
| **Loaded (has garments)** | Full grid with garment cards | Search, filter, sort, select, batch actions |
| **Loaded (empty)** | Empty closet illustration, "Add Your First Garment" CTA, "Scan Multiple" CTA | Add garment, scan |
| **Searching** | Live filtered results as user types. "No results" if match not found | Clear search, modify query |
| **Search - No Results** | "No se encontraron prendas" with suggestion "Try different search terms" | Clear search |
| **Filtered** | Active filter chips above grid. Result count "Showing 12 of 48" | Remove individual filters, clear all, modify filters |
| **Filtered - No Results** | "No items match these filters" with "Clear Filters" button | Clear filters |
| **Sorting** | Brief loading on sort change (if server-side sort) | Change sort option |
| **Selecting (single)** | Tap card → checkmark overlay, batch action bar appears | Batch actions, deselect, select all |
| **Selecting (multiple)** | Multiple checkmarks, count "3 selected" | Batch actions, deselect all |
| **Batch Action - Delete** | Confirmation modal: "Delete X items?" | Confirm (with undo option), cancel |
| **Batch Action - State Change** | Dropdown: "Mark as Archived/Donated/Sold" | Select state, confirm |
| **Batch Action - Add to Outfit** | Opens outfit creation with selected items | Create outfit |
| **Error - Load** | "Could not load wardrobe" with error details | Retry, contact support |
| **Error - Action** | Toast on failed action "Could not delete item" | Retry |
| **Grid View** | Responsive card grid (2-6 cols) | Tap card → detail, long press → select |
| **List View** | Single column table rows | Same as grid |

### 2.4 Garment Detail

| State | UI | Actions Available |
|---|---|---|
| **Loading** | Skeleton layout: image placeholder (50%), text skeleton blocks (50%) | None |
| **Loaded (view mode)** | Full garment details, image gallery, attributes, tabs | Edit, delete, share, status change, navigate tabs |
| **Loaded (edit mode)** | All fields editable. "Cancel" + "Save Changes" footer | Edit fields, cancel, save |
| **Editing - Unsaved** | "Unsaved changes" indicator in topbar | Save, discard, cancel |
| **Editing - Saving** | Save button spinner "Guardando...", inputs disabled | None |
| **Editing - Save Success** | Toast "Cambios guardados", return to view mode | View mode actions |
| **Editing - Save Error** | Inline error "No se pudieron guardar los cambios" | Retry save, cancel |
| **Editing - Validation Error** | Red border on invalid fields, error messages | Fix fields, retry |
| **Deleting - Confirmation** | Modal: "Delete [name]?" with warning about outfit associations | Confirm, cancel |
| **Deleting - In Progress** | Modal spinner "Eliminando..." | None |
| **Deleting - Success** | Toast "Prenda eliminada", redirect to wardrobe | None (auto-redirect) |
| **Deleting - Error** | Toast "No se pudo eliminar la prenda" | Retry or cancel |
| **Status Change - Confirm** | Modal for specific state (Donated: date picker, Sold: price input) | Confirm with data, cancel |
| **Status Change - Success** | Toast "Estado actualizado a [state]" | Continue |
| **Status Change - Error** | Toast "No se pudo actualizar el estado" | Retry |
| **Image - Zoom** | Hover zoom (desktop) or pinch zoom (mobile) | Pan, zoom, close |
| **Image - Fullscreen** | Fullscreen gallery overlay with navigation | Navigate, close |
| **Image - Add** | File picker for additional photos | Upload, cancel |
| **Image - Reorder** | Drag handle on thumbnails | Drag to reorder |
| **Tab - Usage History** | Table of wear events, chronologically | Scroll, view wear details |
| **Tab - Usage Empty** | "No usage data yet" message | — |
| **Tab - Outfit Associations** | Grid of outfit cards including this garment | View outfit, add to outfit |
| **Tab - Outfit Associations Empty** | "Not used in any outfits" message | Create outfit with this garment |
| **Tab - AI Data** | AI detection confidence, attributes extracted | View raw AI output |
| **Navigate away (unsaved)** | Confirm dialog: "Discard changes?" | Save, discard, cancel |

### 2.5 Garment Upload

| State | UI | Actions Available |
|---|---|---|
| **Upload Default (Step 1)** | Drop zone empty, camera button, format specs | Click/drag, camera, proceed disabled |
| **Upload - Hover Drag** | Dashed border turns primary, bg tints | Drop file(s) |
| **Upload - Files Selected** | Thumbnails with upload progress bars | Reorder, remove individual, proceed |
| **Upload - Too Many Files** | "Max 5 files" message, excess files rejected | Remove files, proceed |
| **Upload - Invalid File** | Inline error on specific file, red border | Remove invalid file, retry with valid |
| **Upload - File Too Large** | Error "File exceeds 10MB limit" | Compress and retry, remove |
| **Upload - Compressing** | "Compressing..." overlay on thumbnail | Wait |
| **Upload - Uploading** | Progress bar per file, overall progress bar | Cancel upload (individual) |
| **Upload - Complete** | Green check overlay on thumbnail | Proceed to Step 2 |
| **Upload - Failed** | Red X overlay, retry button | Retry individual file, remove |
| **Upload - Network Lost** | "Waiting for connection..." banner | Queue for retry |
| **Details Default (Step 2)** | All attribute fields, some AI-filled | Edit fields, back, proceed |
| **Details - AI Auto-Filled** | Fields populated with "AI 92%" confidence badge | Accept or override |
| **Details - AI Low Confidence** | Field highlighted warning-50, "Verify this" | User must confirm or correct |
| **Details - Validating** | Field validation on blur | Fix errors |
| **Details - All Required Filled** | Proceed button enabled | Move to Step 3 |
| **Processing (Step 3)** | AI pipeline progress: 3 steps with status indicators | Wait (or skip to manual) |
| **Processing - Segmentation** | "Isolating garment from background..." | — |
| **Processing - Attributes** | "Detecting color, type, pattern..." | — |
| **Processing - Measurements** | "Estimating measurements..." | — |
| **Processing - Complete** | All steps green ✓ | Proceed to Step 4 |
| **Processing - Partial** | Some steps failed, partial results available | Proceed with partial or retry |
| **Processing - Failed** | "AI processing failed. You can enter manually." | Proceed to Step 4 (manual), retry |
| **Processing - Timeout** | "AI taking longer than expected. Save now, AI will update later." | Save now, wait |
| **Review Default (Step 4)** | Summary of images + all attributes | Back, save, save & add another, discard |
| **Review - Saving** | "Saving to wardrobe..." spinner | None |
| **Review - Save Success** | "Garment added!" toast | Continue to closet, add another |
| **Review - Save Error** | "Could not save garment" | Retry, back to edit |
| **Review - Discard Confirm** | "Discard this garment? All data will be lost." | Discard (navigate away), cancel |
| **Upload - All Steps Complete** | Redirect to garment detail or wardrobe | — |

### 2.6 Outfits List

| State | UI | Actions Available |
|---|---|---|
| **Loading** | Skeleton grid (6 outfit cards) | None |
| **Loaded (has outfits)** | Outfit gallery grid | Create, AI recommend, filter, tap to detail |
| **Loaded (empty)** | Empty state illustration + "Create Your First Outfit" + "AI Generate" | Create, AI generate |
| **Filtered** | Tab-based filter by outfit_type. Active tab highlighted | Change tab, clear filter |
| **Creating** | Navigate to outfit builder | — |
| **AI Recommend Loading** | Sidebar panel showing spinner "Generating suggestions..." | Cancel |
| **AI Recommend Loaded** | Sidebar with 3-5 AI-generated outfit suggestions | Tap to view, accept, regenerate |
| **AI Recommend Empty** | "Not enough garments for recommendations. Add more!" | Go to wardrobe |
| **AI Recommend Error** | "Could not generate recommendations" | Retry, dismiss |
| **Error - Load** | "Could not load outfits" | Retry |
| **Error - Delete** | Toast "Could not delete outfit" | Retry |

### 2.7 Outfit Detail

| State | UI | Actions Available |
|---|---|---|
| **Loading** | Skeleton: garment grid (6 placeholders), text skeleton | None |
| **Loaded (view mode)** | Garment grid, info, actions | Edit, delete, wear, share, weather, 3D toggle |
| **Loaded (edit mode)** | Garments removable, reorderable, add slot | Remove, reorder, add garment, save, cancel |
| **Editing - Adding Garment** | Garment selector modal/bottom sheet | Select garment(s) |
| **Editing - Reordering** | Drag handles visible, garments draggable | Drag to position |
| **Editing - Saving** | "Saving outfit..." | Wait |
| **Editing - Save Success** | Toast "Outfit updated" | Back to view mode |
| **Editing - Save Error** | Toast "Could not save outfit" | Retry |
| **Deleting - Confirm** | Modal: "Delete [name]? Will be removed from calendar." | Confirm (error-500), cancel |
| **Deleting - Success** | Toast "Outfit deleted", redirect to list | None |
| **Deleting - Error** | Toast "Could not delete outfit" | Retry |
| **Mark as Worn** | Toast "¡Outfit usado! Wear count: X", haptic feedback | Undo (3s window) |
| **Sharing** | Share sheet (native) or image export | Copy link, save image, share to social |
| **3D Preview Toggle** | 3D view of avatar wearing outfit | Rotate, zoom, pan, change environment, exit |
| **3D Preview Loading** | "Loading 3D models..." with progress | None |
| **3D Preview Error** | "3D preview unavailable. WebGL required." with fallback button | View 2D flat-lay |
| **Weather Check** | Overlay showing weather compatibility per garment | View details, dismiss |

### 2.8 Calendar

| State | UI | Actions Available |
|---|---|---|
| **Loading** | Skeleton calendar grid (6 rows × 7 cols shimmer) | None |
| **Loaded (month view)** | Full month calendar with event dots | Navigate month, tap date, today button |
| **Loaded (day view)** | Day timeline with events + outfit assignments | Navigate day, assign outfit, AI suggest |
| **Month Navigation** | Swipe or arrows to change month, animated | To previous/next month |
| **Date Selected** | Highlighted date, navigate to day view | View day details |
| **Today** | Today highlighted with primary circle, "Today" button navigates here | — |
| **Outfit Assigned** | Date has colored dot, event shows outfit in day view | Change outfit, view outfit |
| **Free Outfit (no assignment)** | Date shows sparkle icon, day view shows "No outfit assigned" | Assign outfit, AI suggest |
| **Assigning Outfit** | Modal / sheet with outfit grid | Select outfit, search, cancel |
| **Assigning - Success** | Toast "Outfit assigned to [date]" | View calendar |
| **Assigning - Error** | Toast "Could not assign outfit" | Retry |
| **AI Suggest Loading** | Spinner "Generating outfit suggestion..." | Wait |
| **AI Suggest Loaded** | Suggested outfit displayed in day view | Accept, regenerate, dismiss |
| **AI Suggest Empty** | "Not enough garments" | Dismiss |
| **AI Suggest Error** | "Could not generate suggestion" | Retry, dismiss |
| **Remove Outfit** | Toast "Outfit removed from [date]" | Undo (3s window) |
| **Event Details Popup** | Card with event info, assigned outfit | Edit event, change outfit |
| **Sync Status** | "Syncing with Google Calendar..." subtle indicator | View sync status |
| **Error - Load** | "Could not load calendar" | Retry |
| **Error - Assign** | Toast "Could not assign outfit" | Retry |

### 2.9 Avatar

| State | UI | Actions Available |
|---|---|---|
| **Loading** | 3D viewer skeleton, avatar list skeleton | None |
| **Loaded (has avatar)** | 3D avatar viewer, list of versions | Rotate/zoom, select version, generate new, delete |
| **Loaded (no avatar)** | Empty state: illustration + "Generate Your 3D Avatar" | Generate |
| **3D Viewer Loading** | Progress bar "Loading 3D model..." | None |
| **3D Viewer Loaded** | Full 3D avatar with orbit controls | Rotate, zoom, pan, fullscreen, toggle auto-rotate |
| **3D Viewer Error** | "Could not load 3D model" + fallback image | Retry, view 2D |
| **WebGL Unavailable** | "3D viewer requires WebGL 2.0" message | View 2D photos |
| **Selecting Version** | Click version → highlight + "Set Active" button | Set active, cancel |
| **Setting Active** | Brief loading, toast "Avatar changed" | Continue |
| **Deleting - Confirm** | Modal: "Delete [avatar]?" with consequences | Confirm, cancel |
| **Deleting - Last Avatar** | Modal: "You must have at least one avatar" | Generate new first |
| **Deleting - Success** | Toast "Avatar deleted" | Continue |
| **Deleting - Error** | Toast "Could not delete avatar" | Retry |
| **Generate - Click** | Navigate to generate page | — |

### 2.10 Avatar Generation

| State | UI | Actions Available |
|---|---|---|
| **Step 1 Default** | Video/photo drop zone, manual measurements option | Click/drag files, camera, manual entry |
| **Step 1 - File Selected** | File thumbnail, validation status | Remove, proceed |
| **Step 1 - Invalid File** | "Invalid format. MP4 or JPG accepted." | Remove, retry |
| **Step 1 - File Too Large** | "File exceeds 50MB limit" | Compress, remove |
| **Step 1 - Proceed** | Next button enabled | Go to Step 2 |
| **Step 2 - Processing** | Progress bar + step indicators | Wait |
| **Step 2 - Pose Detection** | "Detecting body pose..." | — |
| **Step 2 - Measurements** | "Calculating measurements..." | — |
| **Step 2 - Generation** | "Creating your 3D avatar..." | — |
| **Step 2 - Texture** | "Applying textures..." | — |
| **Step 2 - Optimization** | "Optimizing model..." | — |
| **Step 2 - Complete** | All steps green ✓ | Proceed to Step 3 |
| **Step 2 - Failed** | Specific step shows error, retry button per step | Retry step, skip to manual |
| **Step 2 - Timeout** | "Generation taking longer. You can check back later." | Save progress, wait |
| **Step 3 - Preview** | 3D viewer with generated avatar | Rotate, zoom, regenerate, adjust |
| **Step 3 - Adjustment** | Sliders: height, weight, skin tone, hair | Modify → live preview update |
| **Step 3 - Regenerate** | Re-runs generation with adjustments | Wait for regeneration |
| **Step 4 - Confirm** | Name input, "Set Active" checkbox, "Save" button | Name it, save, cancel |
| **Step 4 - Saving** | "Saving avatar..." | Wait |
| **Step 4 - Success** | Toast "Avatar created!", redirect to avatar page | None (auto-redirect) |
| **Step 4 - Error** | "Could not save avatar" | Retry, cancel |
| **Manual Entry** | Measurement form: height, weight, chest, waist, hips etc. | Enter values, submit |
| **Manual - Submitting** | "Generating avatar from measurements..." | Wait |
| **Manual - Success** | Same as Step 3 preview | — |
| **Manual - Error** | "Invalid measurement values" | Fix values |

### 2.11 Analytics

| State | UI | Actions Available |
|---|---|---|
| **Loading** | KPI skeletons (4 cards), chart skeletons (2 charts) | None |
| **Loaded (has data)** | KPIs, charts, data table | Date range selector, export, interact with charts |
| **Loaded (insufficient data)** | "More data needed for accurate analytics" banner | Continue browsing |
| **Date Range Changing** | Brief loading on charts, KPIs remain | Select new range |
| **Chart - Loading** | Skeleton chart shape | None |
| **Chart - Loaded** | Interactive chart with tooltips | Hover/tap for values, legend toggle |
| **Chart - Empty** | "No data for this period" | Change date range |
| **Chart - Error** | "Could not load chart" with retry | Retry |
| **KPI - Trend Positive** | Up arrow in success-500 color | — |
| **KPI - Trend Negative** | Down arrow in error-500 color | — |
| **KPI - Loading** | "--" display | — |
| **KPI - Error** | "Err" display | Retry available |
| **Export - Loading** | Button spinner "Generating report..." | Cancel |
| **Export - Ready** | Download link, toast "Report ready" | Download, share, dismiss |
| **Export - Error** | "Could not generate report" | Retry |
| **Data Table - Sorting** | Column header shows sort arrow | Click header to sort |
| **Data Table - Paginating** | Page change, brief loading | Navigate pages |
| **Error - Full page** | "Analytics unavailable" | Retry, go to dashboard |

### 2.12 Settings / Profile

| State | UI | Actions Available |
|---|---|---|
| **Loading** | Skeleton form fields | None |
| **Loaded** | Settings sections with current values | Edit fields, toggle switches |
| **Editing - Profile** | Input fields for name, email, language etc. | Edit, save, cancel |
| **Saving - Profile** | Save spinner, inputs disabled | Wait |
| **Save Success** | Toast "Profile updated" | Continue |
| **Save Error** | Toast "Could not update profile" | Retry |
| **Editing - Email** | Email change triggers verification flow | Enter new email, verify |
| **Email Verification - Sent** | "Verification link sent to new email" | Check email |
| **Notification Toggle** | Switch animates on/off, saved immediately | Toggle |
| **Notification - Changing Time** | Time picker for daily reminder | Set time |
| **Privacy - Toggle** | Switch saved immediately, consent recorded | Toggle |
| **Privacy - AI Consent Off** | Warning: "AI features won't process new garments" | Confirm, toggle back |
| **Data Export - Requested** | "Preparing your data. You'll receive an email when ready." | Wait |
| **Data Export - Ready** | Download link appears | Download |
| **Data Export - Error** | "Could not export data. Try again." | Retry |
| **Delete Account - Initiate** | Click red "Delete Account" button | Confirm intent |
| **Delete Account - Confirm 1** | Modal: "Are you sure? This cannot be undone." | Continue, cancel |
| **Delete Account - Confirm 2** | Modal: Type "DELETE" to confirm | Type, submit, cancel |
| **Delete Account - Reason** | Dropdown: select reason (optional) + textarea | Select, type |
| **Delete Account - Submitting** | "Processing deletion..." spinner | None (irreversible) |
| **Delete Account - Success** | "Account deleted. We're sorry to see you go.", redirect to landing | None |
| **Delete Account - Error** | "Could not process deletion. Contact support." | Contact support link |

### 2.13 Notifications

| State | UI | Actions Available |
|---|---|---|
| **Loading** | Skeleton list (5 items) | None |
| **Loaded (has notifications)** | Notification list with unread/read states, count badge | Tap item, mark read, view all |
| **Loaded (empty)** | "No notifications" illustration | — |
| **Mark All Read** | All dots removed, toast "All marked as read" | Undo (3s) |
| **Mark Single Read** | Item weight normalizes, dot removed | — |
| **Tap Notification** | Deep link to relevant page | Navigate |
| **Swipe Dismiss (mobile)** | Item slides out with undo toast | Undo (3s) |
| **New Notification (in-app)** | Bell bounces, toast appears (if not on notification page) | Tap to view |
| **Error - Load** | "Could not load notifications" | Retry |

### 2.14 3D Viewer (General)

| State | UI | Actions Available |
|---|---|---|
| **Loading - Model** | Progress bar "Loading model..." (0-100%) | Cancel (if applicable) |
| **Loading - Textures** | Sub-step "Applying textures..." | Wait |
| **Loading - Complete** | Full 3D render appears | All 3D interactions |
| **Loaded - Auto-rotate** | Model slowly rotates (2s per rotation) | Pause, interact |
| **Loaded - Interactive** | User can rotate, zoom, pan | Mouse/touch drag, scroll/pinch, right-click drag |
| **Fullscreen** | 3D viewer fills viewport/virtual | Exit fullscreen, all 3D interactions |
| **Environment Change** | Background changes smoothly (1s transition) | Select preset |
| **Error - Model Load** | "Failed to load 3D model" with fallback image | Retry, view fallback |
| **Error - WebGL** | "WebGL not available" with 2D fallback | View 2D, check browser support |
| **Error - Performance** | "Lowering quality for better performance" (auto) | Continue with reduced quality |
| **Idle** | No interaction for 30s → auto-rotate resumes | Interact to stop auto-rotate |
| **Fallback 2D** | Static image with 360° button (image carousel) | Click/tap to rotate through views |

### 2.15 Image Gallery (Fullscreen)

| State | UI | Actions Available |
|---|---|---|
| **Loading** | BlurHash placeholder, spinner | None |
| **Loaded** | Full-size image centered | Zoom, pan, navigate |
| **Zoomed** | Image at 2x-5x, pan enabled | Pan, pinch zoom, double-tap to reset |
| **Navigating** | Swipe left/right to change image | Swipe or arrow buttons |
| **Error** | "Could not load image" | Retry, close |
| **Fullscreen Exit** | Tap close or Escape, animated shrink | Exit |

### 2.16 Search (Global)

| State | UI | Actions Available |
|---|---|---|
| **Closed** | Search icon in topbar | Tap to open |
| **Opened (mobile)** | Full-screen overlay with search input focused | Type query |
| **Opened (desktop)** | Expanded search input with recent searches | Type query |
| **Typing** | Debounced results (300ms), suggestions dropdown | Select suggestion, submit |
| **Searching** | Spinner in input field | Wait or clear |
| **Results - Has matches** | Results grid/list with result count "24 results" | Tap result, refine query |
| **Results - No matches** | "No results found for '[query]'" | Modify query, clear |
| **Recent Searches** | List of recent queries with clock icon | Tap to re-search, clear recent |
| **Clear** | X button clears input and results | Input cleared, back to default |
| **Close** | Exit search, return to previous view | — |

### 2.17 Not Found (404)

| State | UI | Actions Available |
|---|---|---|
| **Default** | "Page not found" with illustration | Go home, go to closet, use navigation |

### 2.18 Error (500)

| State | UI | Actions Available |
|---|---|---|
| **Default** | "Something went wrong" with illustration, error code | Retry, go home, contact support |

### 2.19 Maintenance

| State | UI | Actions Available |
|---|---|---|
| **Active** | Full-page "We'll be right back" with estimated time | None (refresh periodically) |
| **Ending** | "We'll be back shortly" countdown | Wait |
| **Resolved** | Auto-redirect to app | None |

---

## 3. Component-Level State Matrix

| Component | Default | Hover | Active | Disabled | Loading | Error | Empty | Focus |
|---|---|---|---|---|---|---|---|---|
| **Button** | Normal colors | Darker bg | Scale 0.98, darker | Opacity 50% | Spinner replaces text | N/A | N/A | Focus ring |
| **Input** | Neutral-300 border | Neutral-400 border | N/A | Neutral-200, neutral-100 bg | N/A | Red border, error message | N/A | Primary ring |
| **Select** | Same as input | Same as input | Open dropdown | Same as input disabled | N/A | Same as input error | Placeholder text | Same as input |
| **Textarea** | Same as input | Same as input | N/A | Same as input disabled | N/A | Same as input error | Placeholder text | Same as input |
| **Card** | White bg, shadow-sm | Shadow-md, scale 1.02 | Scale 0.98 | Opacity 50% | Skeleton shimmer | N/A | N/A | Focus ring |
| **Modal** | Hidden | N/A | N/A | N/A | Spinner on confirm btn | Error state content | N/A | Focus trapped |
| **Dropdown** | Closed | N/A | N/A | N/A | N/A | N/A | "No options" | Open/close |
| **Badge** | Colored bg | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| **Toast** | Hidden | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| **Tooltip** | Hidden | Visible after delay | N/A | Hidden | N/A | N/A | N/A | Visible on focus |
| **Tabs** | Tab inactive | Tab hover bg | Tab active | Tab greyed | N/A | N/A | N/A | Focus on active |
| **Accordion** | Collapsed | Header hover | Expanded | Opacity 50% | N/A | N/A | N/A | Focus on header |
| **Progress** | 0% (empty) | N/A | N/A | N/A | Indeterminate animating | Error color | N/A | N/A |
| **Search Bar** | Icon/input | Input hover | Input focus | N/A | Spinner in input | "Search failed" | "No results" | Focus ring |
| **Filter Panel** | Closed | N/A | N/A | N/A | N/A | N/A | "No filter options" | Focus on first filter |
| **Image Uploader** | Empty zone | Hover drop zone | Files selected | N/A | Uploading per file | File error | Empty zone | Focus on zone |
| **Date Picker** | Closed | N/A | Calendar open | Greyed | N/A | N/A | N/A | Focus on selected |
| **Switch** | Off | N/A | On | Greyed | N/A | N/A | N/A | Focus ring |
| **Checkbox** | Unchecked | N/A | Checked | Greyed | N/A | N/A | N/A | Focus ring |
| **Spinner** | Animating | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| **Skeleton** | Shimmer animating | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| **Empty State** | Shown | N/A | N/A | N/A | N/A | N/A | N/A | Focus on CTA |

---

## 4. Network States

| State | Indicator | Behavior |
|---|---|---|
| **Online** | None | Normal operation |
| **Slow Connection** | Subtle "Loading..." after 5s | Requests may be slow, show loading states |
| **Offline** | Top banner "Sin conexión" | Cached content, actions queued |
| **Reconnecting** | Banner "Reconectando..." with spinner | Auto-retry with exponential backoff |
| **Reconnected** | Brief toast "Conexión restaurada" | Sync pending actions, refresh data |
| **Poor Connection** | Intermittent loading states | Debounced requests, retry logic |

---

## 5. Data States per Entity

| Entity | Pending | Loading | Empty | Partial | Complete | Error |
|---|---|---|---|---|---|---|
| **Garments** | Queued for AI | Skeleton grid | "No garments" | Some loaded | Full wardrobe | Retry option |
| **Garment Detail** | — | Skeleton split view | "Not found" | Some fields missing | Full detail | Retry, go back |
| **Outfits** | AI calculating | Skeleton grid | "No outfits" | — | Outfit list | Retry |
| **Outfit Detail** | AI processing | Skeleton grid | "Not found" | Missing garments | Full detail | Retry, go back |
| **Calendar Events** | Syncing | Skeleton grid | "No events" | Partial sync | Full calendar | Retry |
| **Avatar** | Generating | 3D viewer skeleton | "No avatar" | — | 3D viewer | Retry, fallback |
| **Analytics** | Computing | Chart skeletons | "Insufficient data" | Some charts ready | All charts | Retry per chart |
| **Notifications** | — | Skeleton list | "No notifications" | — | Full list | Retry |
| **Activity Feed** | — | Skeleton list | "No activity" | — | Full feed | Inline error |

---

## 6. Action States

| Action | Idle | Processing | Success | Error | Undo Available |
|---|---|---|---|---|---|
| **Create Garment** | Upload form | "Saving..." | "Garment added!" + redirect | "Could not save" | ❌ |
| **Update Garment** | Edit form | "Saving changes..." | "Changes saved!" | "Could not update" | ❌ |
| **Delete Garment** | Confirm modal | "Deleting..." | "Deleted!" + redirect | "Could not delete" | ❌ (confirmation required) |
| **Create Outfit** | Builder | "Saving..." | "Outfit created!" | "Could not save" | ❌ |
| **Delete Outfit** | Confirm modal | "Deleting..." | "Deleted!" + redirect | "Could not delete" | ❌ |
| **Mark as Worn** | Button visible | "Logging..." | "Worn! (+1)" | "Could not log" | ✅ (3s undo) |
| **Upload Image** | Drop zone | "Uploading..." | "Uploaded ✓" | "Upload failed" | ❌ |
| **AI Processing** | Pending | "Analyzing..." | "Analysis complete" | "Analysis failed" | ❌ (retry) |
| **Generate Avatar** | Start screen | "Generating..." | "Avatar ready!" | "Generation failed" | ❌ (retry) |
| **Assign Outfit** | Assign button | "Assigning..." | "Outfit assigned!" | "Could not assign" | ✅ (3s undo) |
| **Toggle Favorite** | Heart icon | "Updating..." | Heart filled/empty | "Could not update" | ❌ |
| **Batch Delete** | "Delete N items?" | "Deleting..." | "N items deleted!" | "Could not delete" | ❌ (confirmation required) |
| **Export Data** | Export button | "Preparing..." | "Download ready" | "Export failed" | N/A |
| **Save Settings** | Settings form | "Saving..." | "Changes saved" | "Could not save" | ❌ |
| **Delete Account** | Confirmation flow | "Processing..." | "Account deleted" | "Could not process" | ❌ (irreversible) |

---

## 7. State Transition Rules

### 7.1 General Rules

1. **Loading always precedes content**: Every data-driven view shows a loading state before content
2. **Empty states are explicit**: Never show a blank space — always show meaningful empty state
3. **Errors are recoverable**: Every error state provides a clear path to resolution (retry, go back, contact support)
4. **Transitions are smooth**: 200-300ms for state transitions
5. **States are deterministic**: Given the same state + input, the same UI always results
6. **Network-aware**: States adapt to online/offline status
7. **Optimistic updates**: UI updates immediately for expected-success actions, with rollback on failure

### 7.2 State Priority (when multiple states apply)

```
Error > Loading > Empty > Offline > Content
```

If multiple states could apply (e.g., loading + offline), the highest priority state is shown.

### 7.3 Race Condition Handling

| Scenario | Resolution |
|---|---|
| User navigates away during save | Complete save in background, show result if they return |
| Multiple rapid toggles | Debounce to last value only |
| Form submit while already submitting | Block double submission, ignore additional clicks |
| Search while previous search pending | Cancel previous request via AbortController |
| Upload while network drops | Queue upload, resume when online |
| Delete while item updates | Prioritize delete, ignore stale update response |
