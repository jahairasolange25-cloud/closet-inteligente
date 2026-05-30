# Closet Inteligente Digital — Layout Specifications

> **Version:** 1.0.0
> **Status:** APPROVED
> **Last Updated:** 2026-05-25

---

## 1. App Shell Layout

The application shell consists of three primary zones: **Sidebar** (desktop), **Topbar** (all), and **Main Content Area**.

### 1.1 Desktop Layout (lg and above, >1024px)

```
┌──────────┬──────────────────────────────────────────────┐
│          │  ┌────────────────────────────────────────┐  │
│          │  │  TOPBAR (64px)                         │  │
│          │  │  [Menu ☰] [Breadcrumb] [Search] [Bell │  │
│  SIDEBAR │  │   🔔] [Avatar ▼]                      │  │
│  (280px)  │  └────────────────────────────────────────┘  │
│          │                                               │
│  [Logo]  │  ┌────────────────────────────────────────┐  │
│          │  │                                        │  │
│  [Nav]   │  │  MAIN CONTENT AREA                    │  │
│          │  │  (flex: 1, overflow-y: auto)           │  │
│  [Nav]   │  │                                        │  │
│          │  │  ┌──────────┐ ┌──────────┐ ┌────────┐ │  │
│  [Nav]   │  │  │ Card     │ │ Card     │ │ Card   │ │  │
│          │  │  └──────────┘ └──────────┘ └────────┘ │  │
│  [Divider]│  │                                        │  │
│          │  │  ┌──────────────────────────────────┐  │  │
│  [Footer]│  │  │ Content table / list / grid       │  │  │
│          │  │  └──────────────────────────────────┘  │  │
│          │  │                                        │  │
│          │  └────────────────────────────────────────┘  │
└──────────┴──────────────────────────────────────────────┘
```

### 1.2 Tablet Layout (md, 768-1024px)

```
┌────────────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────────┐    │
│  │  TOPBAR (56px)        [Search] [Bell] [Avatar] │    │
│  └────────────────────────────────────────────────┘    │
│                                                         │
│  ┌────────────────────────────────────────────────┐    │
│  │                                                │    │
│  │  MAIN CONTENT AREA                             │    │
│  │  (with sidebar as overlay on toggle)           │    │
│  │                                                │    │
│  │  ┌──────────┐ ┌──────────┐                     │    │
│  │  │ Card     │ │ Card     │                     │    │
│  │  └──────────┘ └──────────┘                     │    │
│  │                                                │    │
│  └────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────┘
```

### 1.3 Mobile Layout (xs-sm, <768px)

```
┌────────────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────────┐    │
│  │  TOPBAR (56px)   [Back] [Title] [Actions]      │    │
│  └────────────────────────────────────────────────┘    │
│                                                         │
│  ┌────────────────────────────────────────────────┐    │
│  │                                                │    │
│  │  MAIN CONTENT AREA (single column)             │    │
│  │  (no sidebar — all navigation via topbar or    │    │
│  │   hamburger overlay or bottom nav)             │    │
│  │                                                │    │
│  └────────────────────────────────────────────────┘    │
│                                                         │
│  ┌────────────────────────────────────────────────┐    │
│  │  BOTTOM NAVIGATION (64px)                       │    │
│  │  [Home] [Closet] [Outfits] [Calendar] [Profile] │    │
│  └────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────┘
```

---

## 2. Sidebar Specifications

### 2.1 Desktop Sidebar (lg+)

| Property | Value |
|---|---|
| Width | `280px` (17.5rem) |
| Background | `white` or `neutral-900` (dark) |
| Border | `1px solid neutral-200` or `neutral-800` (dark) |
| Z-index | `z-sidebar` (60) |
| Position | `fixed left-0 top-0 h-screen` |
| Overflow | `overflow-y-auto overflow-x-hidden` |
| Transition | `width 250ms ease-smooth` |

### 2.2 Sidebar Sections

```
┌──────────────────────┐
│  ┌────────────────┐  │  <- Logo area (64px)
│  │  LOGO (32px)   │  │
│  └────────────────┘  │
├──────────────────────┤
│                      │
│  ┌────────────────┐  │  <- Main navigation
│  │  ● Dashboard   │  │     Each item: 44px height
│  │  ○ Closet      │  │     Active: primary-50 bg
│  │  ○ Outfits     │  │     Hover: neutral-100 bg
│  │  ○ Calendar    │  │     Icon: 20x20
│  │  ○ Avatar      │  │     Gap: 4px between items
│  │  ○ Analytics   │  │
│  │  ○ Settings    │  │
│  └────────────────┘  │
│                      │
├─── Section Divider ──┤  <- "Wardrobe" section label
│                      │
│  ┌────────────────┐  │  <- Secondary navigation
│  │  ○ AI Assistant │  │
│  │  ○ Style Quiz   │  │
│  └────────────────┘  │
│                      │
├─── Spacer (flex-1) ──┤
│                      │
│  ┌────────────────┐  │  <- Bottom section
│  │  ○ Help        │  │
│  │  ○ Dark Mode   │  │  <- Toggle switch
│  └────────────────┘  │
└──────────────────────┘
```

### 2.3 Collapsed Sidebar

On tablets or user preference, sidebar collapses to icon-only:

| Property | Value |
|---|---|
| Collapsed Width | `64px` (4rem) |
| Icon Size | `24px` |
| Transition | `width 250ms ease-smooth` |
| Tooltip | Shows label on hover with 300ms delay |
| Toggle | Hamburger button in topbar or `Ctrl+B` shortcut |

### 2.4 Mobile Sidebar Overlay

On mobile, a hamburger button opens sidebar as an overlay:

| Property | Value |
|---|---|
| Width | `280px` (matches desktop) |
| Backdrop | `rgba(0,0,0,0.5)` with backdrop-blur-sm |
| Open Trigger | Hamburger button in topbar |
| Close Trigger | Escape key, backdrop click, close button |
| Animation | Slide from left, 300ms ease-emphasized-out |
| Z-index | `z-modal` (100) |

---

## 3. Topbar Specifications

### 3.1 Properties

| Property | Desktop (lg+) | Tablet/Mobile (<lg) |
|---|---|---|
| Height | `64px` | `56px` |
| Padding X | `24px` | `16px` |
| Background | `white/80` | `white/80` |
| Backdrop | `backdrop-blur-md` | `backdrop-blur-md` |
| Border Bottom | `1px solid neutral-200` | `1px solid neutral-200` |
| Z-index | `z-header` (80) | `z-header` (80) |
| Position | `sticky top-0` | `sticky top-0` |

### 3.2 Topbar Sections

```
Desktop:
┌──────────────────────────────────────────────────────────────┐
│ [☰ Menu] [Breadcrumb: Home > Closet > T-Shirts]   [🔍 Search] │
│                                                       [🔔 3]  │
│                                                       [👤 ▼]  │
└──────────────────────────────────────────────────────────────┘

Mobile:
┌──────────────────────────────────────────────────────────────┐
│ [← Back]           Page Title              [🔍] [🔔] [⚙]    │
└──────────────────────────────────────────────────────────────┘
```

### 3.3 Topbar Elements

| Element | Desktop | Mobile |
|---|---|---|
| Menu toggle | Visible (hamburger) | Visible (hamburger) |
| Back button | Hidden | Visible (except on root pages) |
| Breadcrumb | Visible | Hidden |
| Page title | Hidden (in breadcrumb) | Visible |
| Search | Input field | Icon → fullscreen search overlay |
| Notifications | Bell icon with count badge | Bell icon with count badge |
| User avatar | Avatar with dropdown menu | Avatar icon (profile shortcut) |
| Actions | Context-dependent buttons | Overflow menu (3-dot) |

---

## 4. Bottom Navigation (Mobile, <md)

| Property | Value |
|---|---|
| Height | `64px` including safe-area-bottom |
| Background | `white` or `neutral-900` (dark) |
| Border Top | `1px solid neutral-200` or `neutral-800` |
| Z-index | `z-sticky` (10) |
| Position | `fixed bottom-0` |
| Safe Area | `pb-safe` (env(safe-area-inset-bottom)) |

### 4.1 Bottom Nav Items

| Icon | Label | Route |
|---|---|---|
| `LayoutDashboard` | Inicio | `/` |
| `Shirt` | Closet | `/wardrobe` |
| `Shirt` (with diff) | Outfits | `/outfits` |
| `Calendar` | Calendario | `/calendar` |
| `User` | Perfil | `/profile` |

### 4.2 Bottom Nav Behavior

- Active item: `text-primary-500` with filled icon
- Inactive items: `text-neutral-400`
- Badge: Notifications shown on Profile icon (red dot)
- Label visible always (not icon-only)
- Hides on scroll down, shows on scroll up (auto-hide pattern)
- No text truncation — labels are short (max 10 chars)

---

## 5. Navigation Hierarchy

```
Level 1                Level 2                Level 3
─────────────────────────────────────────────────────────────
Dashboard              —                      —
Closet (Wardrobe)      Garment Detail         Edit Garment
                       Add Garment            Upload Photos
                       Category Filter        3D View
Outfits                Outfit Detail          Edit Outfit
                       Create Outfit          AI Recommend
                       Outfit Builder         3D Preview
Calendar               Day View               Event Detail
                       Month View             Assign Outfit
Avatar                 Avatar Viewer          Generate Avatar
                       Avatar Versions        Video Upload
Analytics              Charts                 Export Data
                       Reports                Date Range
Settings               Profile                Edit Profile
                       Notifications          Schedule Config
                       Privacy                Data Export
                       Account                Delete Account
AI Assistant           Style Quiz             Results
                       Recommendations        Feedback
Help                   FAQ                    Contact
                       Tutorial               —
```

---

## 6. Breadcrumb Patterns

### 6.1 Format

```
Home > Section > Subsection > Item Name
```

### 6.2 Implementation

| Property | Value |
|---|---|
| Separator | `/` (forward slash) in `text-neutral-400` |
| Font | `body-sm` (14px) |
| Color inactive | `neutral-500` |
| Color active (last) | `neutral-700` or `neutral-300` (dark) |
| Color hover | `primary-600` or `primary-400` (dark) |
| Truncation | Max 3 items; truncate middle with ellipsis |
| Mobile | Hidden — replaced by page title |

### 6.3 Page-to-Breadcrumb Mapping

| Page | Breadcrumb |
|---|---|
| `/` | `Home` |
| `/wardrobe` | `Home > My Closet` |
| `/wardrobe/[id]` | `Home > My Closet > {garment.name}` |
| `/wardrobe/new` | `Home > My Closet > Add Garment` |
| `/outfits` | `Home > Outfits` |
| `/outfits/[id]` | `Home > Outfits > {outfit.name}` |
| `/outfits/builder` | `Home > Outfits > Create Outfit` |
| `/calendar` | `Home > Calendar` |
| `/calendar?date=...` | `Home > Calendar > {formatted date}` |
| `/avatar` | `Home > My Avatar` |
| `/analytics` | `Home > Analytics` |
| `/profile` | `Home > Settings` |
| `/profile/notifications` | `Home > Settings > Notifications` |
| `/profile/privacy` | `Home > Settings > Privacy` |

---

## 7. Page Template Types

### 7.1 Dashboard Template

```
┌──────────────────────────────────────────────────────────────┐
│  TOPBAR                                                        │
├──────────────────────────────────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                        │
│  │ Stat │ │ Stat │ │ Stat │ │ Stat │   <- Summary cards row   │
│  │ Card │ │ Card │ │ Card │ │ Card │     2 cols ≤md, 4 cols lg│
│  └──────┘ └──────┘ └──────┘ └──────┘                        │
│                                                                │
│  ┌────────────────────────┐ ┌────────────────┐                │
│  │  Daily Outfit          │ │  Quick Actions  │  <- Two panel │
│  │  Recommendation Card   │ │  [Add Garment]  │     layout     │
│  │  [View] [Wear Now]     │ │  [Create Outfit]│                │
│  └────────────────────────┘ │  [AI Suggest]   │                │
│                             │  [Scan Wardrobe]│                │
│                             └────────────────┘                │
│                                                                │
│  ┌────────────────────────────────────────────────┐            │
│  │  Recent Activity Feed                           │            │
│  │  ┌─[icon] Garment "Blue Shirt" added ───────┐  │            │
│  │  ├─[icon] Outfit "Weekend Casual" created ───┤  │            │
│  │  ├─[icon] AI detection complete for 3 items ─┤  │            │
│  │  └─[icon] Weather alert: Rain expected ──────┘  │            │
│  └────────────────────────────────────────────────┘            │
│                                                                │
│  ┌────────────────────────────────────────────────┐            │
│  │  Notification Summary                           │            │
│  │  • 3 garments unworn for 60+ days              │            │
│  │  • 1 upcoming event needs outfit               │            │
│  └────────────────────────────────────────────────┘            │
└──────────────────────────────────────────────────────────────┘
```

### 7.2 List Template

```
┌──────────────────────────────────────────────────────────────┐
│  TOPBAR                                                        │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Search Bar                    [Filter ▼] [Sort ▼]     │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Active Filters: [Category: Tops ✕] [Color: Blue ✕]   │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌──────┐ ┌──────┐ ┌──────┐                                  │
│  │ Item │ │ Item │ │ Item │    <- Grid or list                │
│  └──────┘ └──────┘ └──────┘      2 cols ≤sm, 3 cols md       │
│  ┌──────┐ ┌──────┐ ┌──────┐      4 cols lg, 5 cols xl        │
│  │ Item │ │ Item │ │ Item │                                   │
│  └──────┘ └──────┘ └──────┘                                   │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  < 1  2  3  ...  12 >                Showing 1-20 of 240│  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### 7.3 Detail Template

```
┌──────────────────────────────────────────────────────────────┐
│  TOPBAR  [← Back]                                            │
├──────────────────────────────────────────────────────────────┤
│  ┌───────────────────┐ ┌────────────────────────────────┐   │
│  │                   │ │  Title / Heading               │   │
│  │  Media Area       │ │  ───────────────────────────── │   │
│  │  (image gallery   │ │  Attribute 1: Value            │   │
│  │    or 3D viewer)  │ │  Attribute 2: Value            │   │
│  │                   │ │  Attribute 3: Value            │   │
│  │                   │ │  ───────────────────────────── │   │
│  │                   │ │  Description / Notes           │   │
│  │                   │ │  ───────────────────────────── │   │
│  │                   │ │  Action Buttons                │   │
│  │                   │ │  [Edit] [Delete] [Share]       │   │
│  └───────────────────┘ └────────────────────────────────┘   │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Related / Associated Items (outfits, history)          │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘

On mobile: stacked vertically (media full-width, details below)
```

### 7.4 Form Template

```
┌──────────────────────────────────────────────────────────────┐
│  TOPBAR  [← Back]  [Save as Draft]  [Save]                   │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Step Indicator  (if multi-step)                        │  │
│  │  ① Photos  ➔  ② Details  ➔  ③ AI Review  ➔  ④ Confirm  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                                                        │  │
│  │  Form Section 1                                        │  │
│  │  ┌─────────────┐  ┌─────────────┐                     │  │
│  │  │ Input       │  │ Input       │                     │  │
│  │  └─────────────┘  └─────────────┘                     │  │
│  │  ┌──────────────────────────────┐                     │  │
│  │  │ Textarea                     │                     │  │
│  │  └──────────────────────────────┘                     │  │
│  │  ┌─────────────┐  ┌─────────────┐                     │  │
│  │  │ Select      │  │ Select      │                     │  │
│  │  └─────────────┘  └─────────────┘                     │  │
│  │                                                        │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │  Form Actions                                     │  │  │
│  │  │  [Cancel]  [Save & Add Another]  [Save]           │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘

Mobile: full-width inputs, sticky CTA at bottom
```

### 7.5 Calendar Template

```
┌──────────────────────────────────────────────────────────────┐
│  TOPBAR  [< March 2026 >]    [Today]   [Month] [Day]        │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Day Headers:  Sun  Mon  Tue  Wed  Thu  Fri  Sat       │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │                    1    2    3    4    5    6           │  │
│  │                ┌──┐                                    │  │
│  │   7    8    9  │10│  11   12   13     <- Dates with   │  │
│  │                │📅│                        outfit dots  │  │
│  │  14   15   16  17   18   19   20                       │  │
│  │                                                        │  │
│  │  21   22   23   24   25   26   27                      │  │
│  │                                                        │  │
│  │  28   29   30   31                                     │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
│  Day View (below or right on desktop):                         │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  March 10, 2026                                        │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │  Morning                                         │  │  │
│  │  │  ┌─ Outfit: "Office Casual" ────────── [Edit] ─┐│  │  │
│  │  │  │  [img] [img] [img]       ┌──────────────┐   ││  │  │
│  │  │  │                         │ Weather: 22°C │   ││  │  │
│  │  │  └─────────────────────────└──────────────┘───┘│  │  │
│  │  ├──────────────────────────────────────────────────┤  │  │
│  │  │  No events for this time                        │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │  [Assign Outfit]  [Weather Check]  [Clear Outfit]     │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### 7.6 Analytics Template

```
┌──────────────────────────────────────────────────────────────┐
│  TOPBAR  [< Last 30 Days  >]  [Export ▼]                     │
├──────────────────────────────────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                       │
│  │ KPI 1│ │ KPI 2│ │ KPI 3│ │ KPI 4│  <- Key metrics row   │
│  └──────┘ └──────┘ └──────┘ └──────┘                       │
│                                                                │
│  ┌─────────────────────────┐  ┌─────────────────────────┐    │
│  │  Bar Chart              │  │  Line Chart              │    │
│  │  (Most Worn Categories) │  │  (Usage Over Time)       │    │
│  └─────────────────────────┘  └─────────────────────────┘    │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Data Table (sortable, paginated)                      │  │
│  │  ┌────┬──────┬──────┬──────┬──────┬──────┐             │  │
│  │  │ #  │ Item │ Wear │ Cost │ CO₂  │  ▾   │             │  │
│  │  ├────┼──────┼──────┼──────┼──────┼──────┤             │  │
│  │  │ 1  │ ...  │ ...  │ ...  │ ...  │      │             │  │
│  │  └────┴──────┴──────┴──────┴──────┴──────┘             │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## 8. Empty State Layouts

### 8.1 Empty Closet

```
┌──────────────────────────────────────────────────────────────┐
│                                                               │
│                    ┌──────────────────────┐                   │
│                    │                      │                   │
│                    │   🧥 (Icon 64px)     │                   │
│                    │                      │                   │
│                    └──────────────────────┘                   │
│                                                               │
│               Your closet is empty                            │
│          Add your first garment to get started                │
│                                                               │
│          ┌──────────────────────────────┐                     │
│          │  + Add Your First Garment    │                     │
│          └──────────────────────────────┘                     │
│                                                               │
│          ┌──────────────────────────────┐                     │
│          │  📷 Scan Multiple Garments   │                     │
│          └──────────────────────────────┘                     │
│                                                               │
│               or drag and drop photos here                    │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 8.2 Empty Outfits

```
┌──────────────────────────────────────────────────────────────┐
│                                                               │
│                    ┌──────────────────────┐                   │
│                    │                      │                   │
│                    │   👔 (Icon 64px)     │                   │
│                    │                      │                   │
│                    └──────────────────────┘                   │
│                                                               │
│               No outfits yet                                  │
│          Create your first outfit from your wardrobe          │
│                                                               │
│          ┌──────────────────────────────┐                     │
│          │  + Create Your First Outfit  │                     │
│          └──────────────────────────────┘                     │
│                                                               │
│          ┌──────────────────────────────┐                     │
│          │  🤖 AI-Generated Outfit      │                     │
│          └──────────────────────────────┘                     │
│                                                               │
│          Tip: Add at least 5 garments first!                  │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 8.3 Empty Calendar Day

```
┌──────────────────────────────────────────────────────────────┐
│  March 10, 2026                                              │
│                                                               │
│  ☀️ 22°C — Sunny                                             │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                                                        │  │
│  │         No outfit planned for this day                 │  │
│  │                                                        │  │
│  │    ┌──────────────────────────────┐                    │  │
│  │    │  🎯 Assign an Outfit         │                    │  │
│  │    └──────────────────────────────┘                    │  │
│  │                                                        │  │
│  │    ┌──────────────────────────────┐                    │  │
│  │    │  🤖 AI Suggest for Today     │                    │  │
│  │    └──────────────────────────────┘                    │  │
│  │                                                        │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### 8.4 Empty Analytics

```
┌──────────────────────────────────────────────────────────────┐
│                                                               │
│                    ┌──────────────────────┐                   │
│                    │                      │                   │
│                    │   📊 (Icon 64px)     │                   │
│                    │                      │                   │
│                    └──────────────────────┘                   │
│                                                               │
│               Analytics coming soon                           │
│          Data will appear once you wear your garments         │
│                                                               │
│          Tip: Start adding garments and logging wears!        │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 9. Error State Layouts

### 9.1 Generic Error

```
┌──────────────────────────────────────────────────────────────┐
│                                                               │
│                    ┌──────────────────────┐                   │
│                    │                      │                   │
│                    │   ⚠️ (Icon 64px)     │                   │
│                    │                      │                   │
│                    └──────────────────────┘                   │
│                                                               │
│               Something went wrong                            │
│          We couldn't load your wardrobe. Please try again.    │
│                                                               │
│          ┌──────────────────────────────┐                     │
│          │  🔄 Try Again                │                     │
│          └──────────────────────────────┘                     │
│                                                               │
│          Error code: ERR_LOAD_FAILED                          │
│          If this persists, contact support.                   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 9.2 Network Error

```
┌──────────────────────────────────────────────────────────────┐
│                                                               │
│                    ┌──────────────────────┐                   │
│                    │                      │                   │
│                    │   📡 (Icon 64px)     │                   │
│                    │                      │                   │
│                    └──────────────────────┘                   │
│                                                               │
│               No internet connection                          │
│          You're offline. Some features may not work.          │
│                                                               │
│          ┌──────────────────────────────┐                     │
│          │  🔄 Try Again                │                     │
│          └──────────────────────────────┘                     │
│                                                               │
│          Viewing cached wardrobe data...                      │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 9.3 Not Found (404)

```
┌──────────────────────────────────────────────────────────────┐
│                                                               │
│                    ┌──────────────────────┐                   │
│                    │                      │                   │
│                    │   🔍 (Icon 64px)     │                   │
│                    │                      │                   │
│                    └──────────────────────┘                   │
│                                                               │
│               404 — Page not found                            │
│          The page you're looking for doesn't exist.           │
│                                                               │
│          ┌──────────────────────────────┐                     │
│          │  🏠 Go Home                  │                     │
│          └──────────────────────────────┘                     │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 10. Loading State Layouts

### 10.1 Page Load

```typescript
// Full-page skeleton loader
<SkeletonPage>
  <SkeletonHeader />
  <SkeletonGrid columns={4}>
    <SkeletonCard />
    <SkeletonCard />
    <SkeletonCard />
    <SkeletonCard />
  </SkeletonGrid>
  <SkeletonTable rows={5} />
</SkeletonPage>
```

### 10.2 Section Load (Content Placeholder)

- Cards shimmer with `animate-shimmer`
- Text blocks appear with `animate-pulse-soft`
- Images show BlurHash placeholder (stored in DB)
- Lists show alternating row skeletons (3-5 rows)
- Charts show skeleton chart outline

### 10.3 Initial App Load

```
┌──────────────────────────────────────────────────────────────┐
│                                                               │
│                                                               │
│                    ┌──────────────────────┐                   │
│                    │                      │                   │
│                    │   [Logo Mark]        │                   │
│                    │                      │                   │
│                    └──────────────────────┘                   │
│                                                               │
│                    Closet Inteligente                         │
│                                                               │
│                       ◌ ◌ ◌                                  │
│                    (Loading spinner)                          │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 11. Modal/Dialog Overlay Specifications

### 11.1 Modal Variants

| Variant | Width | Description |
|---|---|---|
| `modal-sm` | `400px` | Confirmations, alerts |
| `modal-md` | `560px` | Forms, edit dialogs |
| `modal-lg` | `720px` | Multi-step wizards, previews |
| `modal-xl` | `960px` | Full previews, image galleries |
| `modal-full` | `100vw` | Full-screen (mobile), image viewer |

### 11.2 Modal Properties

| Property | Value |
|---|---|
| Backdrop | `rgba(0,0,0,0.5)` or `rgba(0,0,0,0.7)` (dark) |
| Backdrop blur | `backdrop-blur-sm` |
| Backdrop click | Closes modal (except for form modals with unsaved data) |
| Animation | Scale in (200ms ease-out), fade in backdrop |
| Close | Escape key, X button, backdrop click |
| Focus trap | Yes — cycle Tab within modal |
| Body scroll | Locked (overflow: hidden) |
| Padding | `24px` |
| Border radius | `16px` (radius-3xl) |
| Shadow | `shadow-xl` |

### 11.3 Modal Anatomy

```
┌──────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────┐  │  <- Header
│  │  Title                    [✕]              │  │     padding: 24px 24px 0
│  └────────────────────────────────────────────┘  │
│                                                    │
│  ┌────────────────────────────────────────────┐  │  <- Content
│  │                                            │  │     padding: 16px 24px
│  │  Modal content (scrollable if overflow)    │  │     max-height: 80vh
│  │                                            │  │
│  └────────────────────────────────────────────┘  │
│                                                    │
│  ┌────────────────────────────────────────────┐  │  <- Footer
│  │  [Cancel]                 [Confirm]        │  │     padding: 0 24px 24px
│  └────────────────────────────────────────────┘  │     gap: 12px
└──────────────────────────────────────────────────┘
```

---

## 12. Toast Notification Positioning

### 12.1 Toast Positions

| Position | CSS | Use Case |
|---|---|---|
| `top-right` | `fixed top-4 right-4` | Desktop default |
| `top-left` | `fixed top-4 left-4` | Alternative |
| `top-center` | `fixed top-4 left-1/2 -translate-x-1/2` | Important alerts |
| `bottom-right` | `fixed bottom-4 right-4` | Mobile default (& on mobile with bottom nav) |
| `bottom-center` | `fixed bottom-20 left-1/2 -translate-x-1/2` | Mobile (above bottom nav) |

### 12.2 Toast Stacking

- Maximum visible toasts: **5**
- Stack direction: vertical, newest at bottom
- Gap between toasts: `12px`
- Animation: slide in from edge, 300ms ease-out
- Auto-dismiss: 5s (info), 7s (warning), 8s (error), 4s (success)
- Manual dismiss: X button or swipe right (mobile)
- Pause dismiss on hover

### 12.3 Z-index

- Toast container: `z-toast` (110) — above modals and all content

---

## 13. Z-Index Stacking Context

```
┌──────────────────────────────────────────────────────────────────────┐
│  Layer            Z-Index    Components                               │
├──────────────────────────────────────────────────────────────────────┤
│  Base Content     0          Page content, cards, text               │
│  Sticky           10         Sticky headers, sidebar                 │
│  Dropdown         20         Dropdowns, popovers, selects            │
│  Tooltip          40         Tooltips                                │
│  Nav Overlay      50         Mobile nav overlay                     │
│  Sidebar          60         Fixed sidebar panel                    │
│  FAB              70         Floating action button                 │
│  Header           80         Top navigation bar                     │
│  Modal Backdrop   90         Modal overlay background               │
│  Modal            100        Modal dialogs, drawers                 │
│  Toast            110        Toast notifications                    │
│  Loading          120        Full-page loading spinners             │
│  Global Tooltip   130        Global tooltips (above everything)     │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 14. Page Max-Width Constraints

| Page Type | Max Width | Centering |
|---|---|---|
| Dashboard | `1440px` | `mx-auto` |
| List/Grid pages | `1440px` | `mx-auto` |
| Detail pages | `1280px` | `mx-auto` |
| Form pages | `800px` | `mx-auto` |
| Calendar | `1440px` | `mx-auto` |
| Analytics | `1440px` | `mx-auto` |
| Auth pages | `440px` | `mx-auto` |
| Full-width pages | `100%` | None |

---

## 15. Grid System

### 15.1 Column Layouts by Breakpoint

| Breakpoint | Columns | Gutter | Margin |
|---|---|---|---|
| xs (<640px) | 2 (auto-fill, min 160px) | `12px` | `16px` |
| sm (640px) | 2 | `16px` | `24px` |
| md (768px) | 3 | `16px` | `32px` |
| lg (1024px) | 4 | `20px` | `32px` |
| xl (1280px) | 5 | `24px` | `48px` |
| 2xl (1536px) | 6 | `24px` | `auto` (container) |

### 15.2 Gutters and Margins

```css
/* Tailwind implementation */
.container-page {
  @apply w-full px-4 sm:px-6 md:px-8 lg:px-8 xl:px-12;
  @apply max-w-[1440px] mx-auto;
}

.grid-garments {
  @apply grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 
         lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6;
  @apply gap-3 sm:gap-4 md:gap-4 lg:gap-5 xl:gap-6;
}
```

---

## 16. Page Transition Animations

| Transition | Duration | Easing | Notes |
|---|---|---|---|
| Page enter | 300ms | `ease-emphasized-out` | Fade in + slide up 16px |
| Page exit | 200ms | `ease-emphasized-in` | Fade out |
| Route change | 250ms | `ease-smooth` | Using Next.js transition |
| Tab switch | 150ms | `ease-out` | Content cross-fade |
| Modal enter | 200ms | `ease-spring` | Scale 0.95 → 1 |
| Modal exit | 150ms | `ease-in` | Scale 1 → 0.95 |
| Drawer enter | 300ms | `ease-emphasized-out` | Slide from edge |
| Drawer exit | 200ms | `ease-emphasized-in` | Slide to edge |
| Accordion | 250ms | `ease-smooth` | Height transition |
| Dropdown | 150ms | `ease-out` | Scale Y |

---

## 17. Safe Area Insets (Mobile)

```css
/* Tailwind custom utilities */
.safe-top {
  padding-top: env(safe-area-inset-top, 0px);
}
.safe-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.safe-left {
  padding-left: env(safe-area-inset-left, 0px);
}
.safe-right {
  padding-right: env(safe-area-inset-right, 0px);
}
```

- Topbar: add `safe-top` padding
- Bottom navigation: add `safe-bottom` padding  
- Full-screen modals: add safe area padding on all sides
- Fixed elements: respect safe areas on all edges
