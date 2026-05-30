# Component Tree

## Overview

React 18 component hierarchy using Next.js 14 App Router with TypeScript.
All components follow the `src/` directory structure with feature-based organization.

---

## Directory Structure

```
src/
  app/                           # Next.js App Router pages
    layout.tsx                   # Root layout
    (auth)/
      login/page.tsx
      register/page.tsx
      forgot-password/page.tsx
    (dashboard)/
      layout.tsx
      page.tsx                   # HomePage
      closet/
        page.tsx
        [id]/page.tsx
        new/page.tsx
      outfits/
        page.tsx
        [id]/page.tsx
        new/page.tsx
      calendar/page.tsx
      avatar/
        page.tsx
        [id]/page.tsx
      profile/page.tsx
      analytics/page.tsx
      settings/page.tsx
      notifications/page.tsx

  components/
    ui/                          # Shared UI primitives
    layout/                      # Layout components
    features/
      auth/
      garments/
      outfits/
      avatar/
      calendar/
      notifications/
      analytics/
      settings/

  stores/                        # Zustand stores
  hooks/                         # Custom hooks + TanStack Query hooks
  lib/                           # Utilities (api client, types, helpers)
  providers/                     # React context providers
  types/                         # TypeScript type definitions
  assets/                        # Static assets
```

---

## Component Hierarchy

```
<Providers>                           # QueryClientProvider, ThemeProvider, Toaster
  <AppLayout>                         # Root layout with all providers
    <AuthProvider>                    # Auth state context
      {authenticated ? (
        <DashboardLayout>             # Sidebar + topbar + content
          <Header>
            <Logo />
            <SearchBar />
            <AvatarMenu />
            <NotificationBell />
          </Header>
          <Sidebar>
            <NavItem />               # Home, Closet, Outfits, Calendar, Avatar, Analytics
            <UserInfo />
          </Sidebar>
          <MainContent>
            <Outlet />                # Page content renders here
          </MainContent>
          <MobileNav />
        </DashboardLayout>
      ) : (
        <AuthLayout>
          <Outlet />
        </AuthLayout>
      )}
    </AuthProvider>
  </AppLayout>
</Providers>
```

---

## Page Components

### HomePage (`/`)

```
<HomePage>
  <PageHeader title="Mi Armario" />
  <DailyOutfitCard>
    <OutfitPreview />
    <OutfitInfo />
    <ActionButtons />
  </DailyOutfitCard>
  <QuickActions>
    <QuickActionButton icon="camera" label="Añadir Prenda" />
    <QuickActionButton icon="magic" label="Generar Outfit" />
    <QuickActionButton icon="calendar" label="Planificar Día" />
  </QuickActions>
  <RecentActivity>
    <ActivityItem />
    <ActivityItem />
  </RecentActivity>
  <AnalyticsSummary>
    <StatCard title="Prendas" value={stats.totalGarments} />
    <StatCard title="Outfits" value={stats.totalOutfits} />
    <StatCard title="Planificados" value={stats.scheduledDays} />
  </AnalyticsSummary>
</HomePage>
```

### ClosetPage (`/closet`)

```
<ClosetPage>
  <PageHeader title="Mi Closet">
    <AddGarmentButton />
    <FilterButton />
  </PageHeader>
  <FilterPanel>
    <CategoryFilter />
    <ColorFilter />
    <StateFilter />
    <TagFilter />
    <SortSelect />
    <SearchInput />
  </FilterPanel>
  <ResponsiveGrid>
    <GarmentCard>        {/* repeated */}
      <GarmentImage />
      <GarmentOverlay>
        <FavoriteButton />
        <QuickActions />
      </GarmentOverlay>
      <GarmentLabel>
        <GarmentName />
        <GarmentCategory />
      </GarmentLabel>
    </GarmentCard>
  </ResponsiveGrid>
  <Pagination />
  <EmptyState />          {/* when no garments */}
  <LoadingSpinner />      {/* during loading */}
  <ErrorBoundary>
    <ErrorFallback />
  </ErrorBoundary>
</ClosetPage>
```

### GarmentDetailPage (`/closet/[id]`)

```
<GarmentDetailPage>
  <BackButton />
  <GarmentDetailLayout>
    <GarmentImageSection>
      <ImageCarousel>
        <MainImage />
        <ThumbnailStrip />
      </ImageCarousel>
    </GarmentImageSection>
    <GarmentInfoSection>
      <GarmentTitle>
        <GarmentName />
        <FavoriteButton />
      </GarmentTitle>
      <GarmentAttributes>
        <AttributeItem label="Categoría" value={garment.category} />
        <AttributeItem label="Color" value={<ColorSwatch color={garment.color} />} />
        <AttributeItem label="Marca" value={garment.brand} />
        <AttributeItem label="Talla" value={garment.size} />
        <AttributeItem label="Material" value={<MaterialTags materials={garment.material} />} />
      </GarmentAttributes>
      <AiDetectionPanel>
        <ProcessingStatusBar />
        <DetectedColors />
        <DetectedPatterns />
      </AiDetectionPanel>
      <GarmentActions>
        <EditButton />
        <MarkWornButton />
        <StateDropdown />
        <DeleteButton />
      </GarmentActions>
    </GarmentInfoSection>
  </GarmentDetailLayout>
</GarmentDetailPage>
```

### OutfitPage (`/outfits`)

```
<OutfitPage>
  <PageHeader title="Mis Outfits">
    <CreateOutfitButton />
    <RecommendButton />
  </PageHeader>
  <OutfitTabs>
    <Tab label="Todos" />
    <Tab label="Favoritos" />
    <Tab label="Generados por IA" />
    <Tab label="Planificados" />
  </OutfitTabs>
  <ResponsiveGrid>
    <OutfitCard>          {/* repeated */}
      <OutfitPreview>
        <AvatarPreview />
      </OutfitPreview>
      <OutfitInfo>
        <OutfitName />
        <OutfitGarments>
          <MiniGarmentCard />  {/* per garment */}
        </OutfitGarments>
        <OutfitMeta>
          <OccasionBadge />
          <ScoreBadge />
        </OutfitMeta>
      </OutfitInfo>
    </OutfitCard>
  </ResponsiveGrid>
  <Pagination />
</OutfitPage>
```

### CalendarPage (`/calendar`)

```
<CalendarPage>
  <PageHeader title="Planificador">
    <TodayButton />
    <FillWeekButton />
  </PageHeader>
  <CalendarView>
    <CalendarHeader>
      <MonthNavigation />
      <ViewToggle views={['month', 'week', 'day']} />
    </CalendarHeader>
    <CalendarGrid>
      <DayColumn>          {/* repeated */}
        <DayHeader date={date} />
        <ScheduledOutfit>
          <MiniOutfitPreview />
          <OutfitName />
          <EditButton />
        </ScheduledOutfit>
        <EmptyDaySlot onClick={openScheduler} />
      </DayColumn>
    </CalendarGrid>
  </CalendarView>
  <ScheduleModal>
    <OutfitSelector />
    <DatePicker />
    <NotesInput />
    <RecurringOptions />
  </ScheduleModal>
</CalendarPage>
```

### AvatarPage (`/avatar`)

```
<AvatarPage>
  <PageHeader title="Mi Avatar">
    <CreateAvatarButton />
  </PageHeader>
  <AvatarList>
    <AvatarCard>          {/* repeated */}
      <ThreeJSViewport>
        <Canvas>
          <Suspense fallback={<LoadingSpinner />}>
            <AvatarModel modelUrl={avatar.modelUrl} />
            <LightingSetup />
            <CameraControls />
          </Suspense>
        </Canvas>
      </ThreeJSViewport>
      <AvatarInfo>
        <AvatarName />
        <VersionBadge />
        <ActiveBadge />
      </AvatarInfo>
      <AvatarActions>
        <SetActiveButton />
        <GenerateButton />
        <EditButton />
        <DeleteButton />
      </AvatarActions>
    </AvatarCard>
  </AvatarList>
  <GenerateAvatarModal>
    <VideoUploader onUpload={handleUpload} />
    <ProgressBar value={generationProgress} />
    <StatusMessage />
  </GenerateAvatarModal>
</AvatarPage>
```

### ProfilePage (`/profile`)

```
<ProfilePage>
  <PageHeader title="Mi Perfil" />
  <ProfileForm>
    <AvatarUpload />
    <FormField label="Nombre" input={<Input />} />
    <FormField label="Email" input={<Input disabled />} />
    <FormField label="Idioma" input={<Select options={languages} />} />
    <FormField label="Tema" input={<ThemeToggle />} />
  </ProfileForm>
  <StatsSection>
    <StatCard />
    <StatCard />
    <StatCard />
  </StatsSection>
  <DangerZone>
    <ExportDataButton />
    <DeleteAccountButton />
  </DangerZone>
</ProfilePage>
```

### AnalyticsPage (`/analytics`)

```
<AnalyticsPage>
  <PageHeader title="Estadísticas">
    <PeriodSelector periods={['7d', '30d', '90d', '1y']} />
  </PageHeader>
  <AnalyticsGrid>
    <ChartCard title="Prendas por Categoría">
      <PieChart />
    </ChartCard>
    <ChartCard title="Outfits por Temporada">
      <BarChart />
    </ChartCard>
    <ChartCard title="Uso Diario">
      <LineChart />
    </ChartCard>
    <ChartCard title="Colores Populares">
      <ColorChart />
    </ChartCard>
    <ChartCard title="Precisión IA">
      <GaugeChart />
    </ChartCard>
    <ChartCard title="Actividad">
      <Heatmap />
    </ChartCard>
  </AnalyticsGrid>
</AnalyticsPage>
```

### SettingsPage (`/settings`)

```
<SettingsPage>
  <PageHeader title="Configuración" />
  <SettingsSection title="Notificaciones">
    <ToggleRow label="Push" />
    <ToggleRow label="Email" />
    <ToggleRow label="Recordatorios" />
  </SettingsSection>
  <SettingsSection title="Privacidad">
    <ToggleRow label="Consentimiento IA" />
    <ToggleRow label="Compartir datos" />
  </SettingsSection>
  <SettingsSection title="Sync">
    <ToggleRow label="Sincronización automática" />
    <SyncStatus />
  </SettingsSection>
  <SettingsSection title="Apariencia">
    <ThemeSelector />
    <LanguageSelector />
  </SettingsSection>
</SettingsPage>
```

### LoginPage (`/auth/login`)

```
<LoginPage>
  <AuthCard>
    <Logo />
    <Title>Iniciar Sesión</Title>
    <LoginForm>
      <FormField label="Email" input={<Input type="email" />} />
      <FormField label="Contraseña" input={<Input type="password" />} />
      <ForgotPasswordLink />
      <SubmitButton label="Iniciar Sesión" />
    </LoginForm>
    <SocialAuthButtons>
      <GoogleButton />
      <AppleButton />
    </SocialAuthButtons>
    <RegisterLink />
    <ErrorAlert />
  </AuthCard>
</LoginPage>
```

### RegisterPage (`/auth/register`)

```
<RegisterPage>
  <AuthCard>
    <Logo />
    <Title>Crear Cuenta</Title>
    <RegisterForm>
      <FormField label="Nombre" input={<Input />} />
      <FormField label="Email" input={<Input type="email" />} />
      <FormField label="Contraseña" input={<Input type="password" />} />
      <PasswordStrengthIndicator />
      <CheckboxField label="Acepto términos y condiciones" />
      <CheckboxField label="Acepto uso de IA para mejorar" />
      <SubmitButton label="Crear Cuenta" />
    </RegisterForm>
    <LoginLink />
    <ErrorAlert />
  </AuthCard>
</RegisterPage>
```

---

## Layout Components

### AppLayout

```
<AppLayout>
  <QueryClientProvider>
    <ThemeProvider>
      <Toaster />
      {children}          {/* AuthLayout or DashboardLayout */}
    </ThemeProvider>
  </QueryClientProvider>
</AppLayout>
```

**State:** Theme, Toaster notifications, QueryClient
**File:** `src/app/layout.tsx`

### AuthLayout

```
<AuthLayout>
  <main className="auth-container">
    <Background />
    <AuthContent>
      {children}
    </AuthContent>
    <Footer>
      <LanguageSelector />
      <LegalLinks />
    </Footer>
  </main>
</AuthLayout>
```

**File:** `src/app/(auth)/layout.tsx`

### DashboardLayout

```
<DashboardLayout>
  <div className="dashboard-grid">
    <DashboardSidebar>
      <SidebarHeader>
        <Logo />
        <CollapseButton />
      </SidebarHeader>
      <SidebarNav>
        <NavSection label="Principal">
          <NavItem icon="home" label="Inicio" href="/" />
        </NavSection>
        <NavSection label="Armario">
          <NavItem icon="shirt" label="Mi Closet" href="/closet" />
          <NavItem icon="sparkles" label="Outfits" href="/outfits" />
          <NavItem icon="calendar" label="Planificador" href="/calendar" />
        </NavSection>
        <NavSection label="Personalización">
          <NavItem icon="user" label="Mi Avatar" href="/avatar" />
          <NavItem icon="chart" label="Estadísticas" href="/analytics" />
        </NavSection>
        <NavSection label="Cuenta">
          <NavItem icon="profile" label="Perfil" href="/profile" />
          <NavItem icon="settings" label="Configuración" href="/settings" />
        </NavSection>
      </SidebarNav>
      <SidebarFooter>
        <UserProfileBadge />
        <LogoutButton />
      </SidebarFooter>
    </DashboardSidebar>
    <DashboardHeader>
      <SearchBar />
      <NotificationBell />
      <ThemeToggle />
      <AvatarMenu />
    </DashboardHeader>
    <DashboardContent>
      {children}
    </DashboardContent>
    <MobileBottomNav>
      <MobileNavItem icon="home" href="/" />
      <MobileNavItem icon="closet" href="/closet" />
      <MobileNavItem icon="outfits" href="/outfits" />
      <MobileNavItem icon="calendar" href="/calendar" />
      <MobileNavItem icon="profile" href="/profile" />
    </MobileBottomNav>
  </div>
</DashboardLayout>
```

**File:** `src/app/(dashboard)/layout.tsx`

---

## Feature Components

### Auth Components

| Component | File | Description |
|-----------|------|-------------|
| LoginForm | `features/auth/login-form.tsx` | Email/password form |
| RegisterForm | `features/auth/register-form.tsx` | Registration with validation |
| ForgotPasswordForm | `features/auth/forgot-password-form.tsx` | Password reset request |
| ResetPasswordForm | `features/auth/reset-password-form.tsx` | New password set |
| SocialAuthButtons | `features/auth/social-auth-buttons.tsx` | Google/Apple OAuth |
| PasswordStrengthIndicator | `features/auth/password-strength.tsx` | Visual password meter |

### Garment Components

| Component | File | Description |
|-----------|------|-------------|
| GarmentCard | `features/garments/garment-card.tsx` | Grid card with image + info |
| GarmentDetail | `features/garments/garment-detail.tsx` | Full detail view |
| GarmentForm | `features/garments/garment-form.tsx` | Create/edit form |
| GarmentImageUploader | `features/garments/garment-image-uploader.tsx` | Drag & drop upload |
| GarmentImagePreview | `features/garments/garment-image-preview.tsx` | Zoomable image |
| ProcessingStatusBar | `features/garments/processing-status-bar.tsx` | AI pipeline progress |
| DetectedColors | `features/garments/detected-colors.tsx` | AI-detected colors |
| CategoryFilter | `features/garments/category-filter.tsx` | Category selection |
| ColorFilter | `features/garments/color-filter.tsx` | Color palette selection |
| StateFilter | `features/garments/state-filter.tsx` | Available/washing/etc |
| TagFilter | `features/garments/tag-filter.tsx` | Tag multi-select |

### Outfit Components

| Component | File | Description |
|-----------|------|-------------|
| OutfitCard | `features/outfits/outfit-card.tsx` | Grid card with preview |
| OutfitDetail | `features/outfits/outfit-detail.tsx` | Full detail with garments |
| OutfitForm | `features/outfits/outfit-form.tsx` | Create/edit form |
| OutfitPreview | `features/outfits/outfit-preview.tsx` | 3D rendered preview |
| GarmentSlot | `features/outfits/garment-slot.tsx` | Garment placeholder in outfit |
| RecommendationList | `features/outfits/recommendation-list.tsx` | AI recommendations |
| RecommendationCard | `features/outfits/recommendation-card.tsx` | Single recommendation |
| OccasionBadge | `features/outfits/occasion-badge.tsx` | Occasion tag |
| SeasonSelector | `features/outfits/season-selector.tsx` | Season picker |

### Avatar Components

| Component | File | Description |
|-----------|------|-------------|
| AvatarCard | `features/avatar/avatar-card.tsx` | Avatar grid card |
| AvatarDetail | `features/avatar/avatar-detail.tsx` | Full avatar detail |
| ThreeJSViewport | `features/avatar/three-js-viewport.tsx` | 3D canvas container |
| AvatarModel | `features/avatar/avatar-model.tsx` | GLTF model renderer |
| AvatarForm | `features/avatar/avatar-form.tsx` | Avatar metadata form |
| VideoUploader | `features/avatar/video-uploader.tsx` | Body video upload |
| GenerationProgress | `features/avatar/generation-progress.tsx` | Progress indicator |
| BodyMeasurements | `features/avatar/body-measurements.tsx` | Measurement display |
| VersionHistory | `features/avatar/version-history.tsx` | Version timeline |

### Calendar Components

| Component | File | Description |
|-----------|------|-------------|
| CalendarGrid | `features/calendar/calendar-grid.tsx` | Month/week/day grid |
| DayColumn | `features/calendar/day-column.tsx` | Single day column |
| DayHeader | `features/calendar/day-header.tsx` | Day number + name |
| ScheduledOutfit | `features/calendar/scheduled-outfit.tsx` | Outfit on calendar |
| MonthNavigation | `features/calendar/month-navigation.tsx` | Month arrows |
| ViewToggle | `features/calendar/view-toggle.tsx` | Month/week/day toggle |
| ScheduleModal | `features/calendar/schedule-modal.tsx` | Schedule creation |
| OutfitSelector | `features/calendar/outfit-selector.tsx` | Outfit picker |

### Notification Components

| Component | File | Description |
|-----------|------|-------------|
| NotificationBell | `features/notifications/notification-bell.tsx` | Bell icon with badge |
| NotificationList | `features/notifications/notification-list.tsx` | Dropdown list |
| NotificationItem | `features/notifications/notification-item.tsx` | Single notification |
| NotificationSettings | `features/notifications/notification-settings.tsx` | Preferences form |

### Analytics Components

| Component | File | Description |
|-----------|------|-------------|
| StatCard | `features/analytics/stat-card.tsx` | Stat number card |
| PieChart | `features/analytics/pie-chart.tsx` | Category distribution |
| BarChart | `features/analytics/bar-chart.tsx` | Comparative bars |
| LineChart | `features/analytics/line-chart.tsx` | Trend line |
| ColorChart | `features/analytics/color-chart.tsx` | Color distribution |
| GaugeChart | `features/analytics/gauge-chart.tsx` | Single metric gauge |
| Heatmap | `features/analytics/heatmap.tsx` | Activity calendar |
| PeriodSelector | `features/analytics/period-selector.tsx` | Time range picker |
| InsightsPanel | `features/analytics/insights-panel.tsx` | AI insights |

### Settings Components

| Component | File | Description |
|-----------|------|-------------|
| SettingsSection | `features/settings/settings-section.tsx` | Section wrapper |
| ToggleRow | `features/settings/toggle-row.tsx` | Label + toggle |
| ThemeSelector | `features/settings/theme-selector.tsx` | Theme radio group |
| LanguageSelector | `features/settings/language-selector.tsx` | Language dropdown |
| SyncStatus | `features/settings/sync-status.tsx` | Connection indicator |
| ConsentForm | `features/settings/consent-form.tsx` | Privacy consents |

---

## Shared UI Components

### `src/components/ui/`

| Component | Props | Description |
|-----------|-------|-------------|
| Button | `variant`, `size`, `loading`, `disabled`, `icon`, `onClick` | Primary/secondary/ghost/danger variants |
| Card | `children`, `className`, `onClick`, `padding` | Container card with shadow |
| Modal | `isOpen`, `onClose`, `title`, `size`, `children` | Portal-based modal |
| Dropdown | `trigger`, `items`, `align`, `onSelect` | Context menu / select |
| Input | `label`, `error`, `helperText`, `icon`, `type` | Text input with validation |
| Textarea | `label`, `error`, `rows`, `maxLength` | Multi-line input |
| Select | `label`, `options`, `value`, `onChange`, `error` | Styled select |
| DatePicker | `value`, `onChange`, `minDate`, `maxDate` | Date selector |
| LoadingSpinner | `size`, `color`, `overlay` | Animated spinner |
| ErrorBoundary | `fallback`, `children` | React error boundary |
| EmptyState | `icon`, `title`, `description`, `action` | Empty data state |
| Toast | `type`, `message`, `duration`, `onDismiss` | Notification toast |
| Tooltip | `content`, `position`, `children` | Hover tooltip |
| Badge | `variant`, `size`, `children` | Status/category badge |
| Avatar | `src`, `alt`, `size`, `status` | User avatar circle |
| ProgressBar | `value`, `max`, `color`, `label` | Linear progress |
| SearchBar | `value`, `onChange`, `placeholder`, `onSubmit` | Search input |
| FilterPanel | `filters`, `onChange`, `onReset` | Collapsible filter group |
| ImageUploader | `accept`, `maxSize`, `onUpload`, `preview` | Drag & drop upload |
| FilePreview | `src`, `type`, `onRemove` | Image/video preview |
| ResponsiveGrid | `children`, `minWidth`, `gap` | Auto-fit grid |
| Pagination | `page`, `totalPages`, `onChange` | Page navigation |
| Tabs | `tabs`, `activeTab`, `onChange` | Tab navigation |
| Accordion | `items`, `multiple` | Collapse sections |
| Alert | `type`, `message`, `dismissible` | Alert banner |
| Skeleton | `variant`, `width`, `height`, `count` | Loading skeleton |
| Chip | `label`, `variant`, `onDelete` | Tag/pill chip |
| Divider | `orientation`, `label` | Visual divider |
| IconButton | `icon`, `onClick`, `size`, `variant` | Icon-only button |
| Menu | `items`, `onSelect` | Menu list |
| Dialog | `isOpen`, `onClose`, `title`, `children`, `actions` | Confirmation dialog |
| Drawer | `isOpen`, `onClose`, `position`, `children` | Slide-in panel |
| SwipeableRow | `children`, `actions` | Mobile swipe actions |
| PullToRefresh | `onRefresh`, `children` | Pull to refresh |
| InfiniteScroll | `loadMore`, `hasMore`, `loader` | Infinite scroll |
| VirtualList | `items`, `itemHeight`, `renderItem` | Virtualized list |
| Stepper | `steps`, `activeStep` | Step indicator |
| ColorSwatch | `color`, `size`, `label` | Color circle |
| AnimatedPresence | `children` | Enter/exit animations |

---

## State Management Components (Zustand Stores)

### useAuthStore

**File:** `src/stores/auth-store.ts`

```typescript
interface AuthState {
  user: User | null;
  tokens: Tokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  setUser: (user: User | null) => void;
  clearError: () => void;
}
```

**Persistence:** `localStorage` for tokens, `sessionStorage` for user

### useGarmentStore

**File:** `src/stores/garment-store.ts`

```typescript
interface GarmentState {
  garments: Garment[];
  currentGarment: Garment | null;
  filters: GarmentFilters;
  pagination: PaginationState;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchGarments: (filters?: GarmentFilters) => Promise<void>;
  fetchGarment: (id: string) => Promise<void>;
  createGarment: (data: CreateGarmentDto) => Promise<Garment>;
  updateGarment: (id: string, data: UpdateGarmentDto) => Promise<void>;
  deleteGarment: (id: string) => Promise<void>;
  uploadImage: (id: string, file: File) => Promise<void>;
  setFilters: (filters: Partial<GarmentFilters>) => void;
  resetFilters: () => void;
  setPage: (page: number) => void;
  optimisticUpdate: (id: string, data: Partial<Garment>) => void;
}
```

### useOutfitStore

**File:** `src/stores/outfit-store.ts`

```typescript
interface OutfitState {
  outfits: Outfit[];
  currentOutfit: Outfit | null;
  recommendations: Recommendation[];
  dailyOutfit: Outfit | null;
  filters: OutfitFilters;
  pagination: PaginationState;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchOutfits: (filters?: OutfitFilters) => Promise<void>;
  fetchOutfit: (id: string) => Promise<void>;
  createOutfit: (data: CreateOutfitDto) => Promise<Outfit>;
  updateOutfit: (id: string, data: UpdateOutfitDto) => Promise<void>;
  deleteOutfit: (id: string) => Promise<void>;
  generatePreview: (id: string) => Promise<void>;
  getRecommendations: (prefs: RecommendationPrefs) => Promise<void>;
  fetchDailyOutfit: () => Promise<void>;
  setFilters: (filters: Partial<OutfitFilters>) => void;
}
```

### useAvatarStore

**File:** `src/stores/avatar-store.ts`

```typescript
interface AvatarState {
  avatars: Avatar[];
  currentAvatar: Avatar | null;
  generationProgress: number;
  generationStatus: 'idle' | 'uploading' | 'generating' | 'completed' | 'failed';
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchAvatars: () => Promise<void>;
  fetchAvatar: (id: string) => Promise<void>;
  createAvatar: (data: CreateAvatarDto) => Promise<Avatar>;
  updateAvatar: (id: string, data: UpdateAvatarDto) => Promise<void>;
  deleteAvatar: (id: string) => Promise<void>;
  generateFromVideo: (id: string, video: File) => Promise<void>;
  setActiveAvatar: (id: string) => Promise<void>;
  setGenerationProgress: (progress: number) => void;
}
```

### useCalendarStore

**File:** `src/stores/calendar-store.ts`

```typescript
interface CalendarState {
  entries: CalendarEntry[];
  selectedDate: string;
  viewMode: 'month' | 'week' | 'day';
  currentMonth: number;
  currentYear: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchRange: (startDate: string, endDate: string) => Promise<void>;
  scheduleOutfit: (data: ScheduleOutfitDto) => Promise<void>;
  updateEntry: (id: string, data: UpdateCalendarDto) => Promise<void>;
  unschedule: (id: string) => Promise<void>;
  fillWeek: (startDate: string) => Promise<void>;
  setSelectedDate: (date: string) => void;
  setViewMode: (mode: 'month' | 'week' | 'day') => void;
  navigateMonth: (direction: 1 | -1) => void;
}
```

### useNotificationStore

**File:** `src/stores/notification-store.ts`

```typescript
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  settings: NotificationSettings;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchNotifications: (page?: number) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  fetchSettings: () => Promise<void>;
  updateSettings: (data: Partial<NotificationSettings>) => Promise<void>;
  addNotification: (notification: Notification) => void; // from WebSocket
  setUnreadCount: (count: number) => void;
}
```

### useUIStore

**File:** `src/stores/ui-store.ts`

```typescript
interface UIState {
  isSidebarOpen: boolean;
  isMobileMenuOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  activeModal: string | null;
  toasts: Toast[];
  isOffline: boolean;

  // Actions
  toggleSidebar: () => void;
  toggleMobileMenu: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  setOffline: (isOffline: boolean) => void;
}
```

**Persistence:** `localStorage` for theme
