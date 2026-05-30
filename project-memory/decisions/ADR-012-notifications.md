# ADR-012: Notifications

## STATUS
Accepted

## CONTEXT
The Closet Inteligente Digital platform requires a notification system to alert users about various events: outfit shares and collaboration invites from other users, styling session reminders and upcoming virtual appointments, AI analysis completion (garment digitization, style recommendations), new followers and social interactions (likes, comments), promotional content and personalized style suggestions, and wardrobe organization reminders. The system must support push notifications on mobile web (PWA) and desktop browsers, in-app notification center with read/unread tracking, scheduled/delayed notifications for reminders, and integration with Socket.IO for real-time in-app delivery.

## DECISION
We will use **Firebase Cloud Messaging (FCM)** for push notifications.

FCM provides cross-platform push notification delivery for web (via service workers and the Push API), with support for notification scheduling, targeting by user segments, and integration with the backend notification service. The architecture uses a dual delivery model:

1. **In-app realtime notifications** — delivered via Socket.IO when the user is actively browsing
2. **Push notifications** — delivered via FCM when the user is offline or the browser tab is backgrounded
3. **Notification center** — notifications are persisted in PostgreSQL (notifications table) with read/unread status, fetched via REST API

FCM was chosen over alternatives because of its free tier, cross-platform browser support (Chrome, Firefox, Edge, Safari via web push), reliable delivery infrastructure, compatibility with PWA service worker architecture, and straightforward integration with the existing backend.

## CONSEQUENCES

**Positive:**
- Cross-platform push notification delivery for all major browsers via a single provider
- Free tier with generous limits — cost-effective for initial user base
- Integration with service workers enables notifications even when the app tab is closed
- FCM topics enable targeted notification campaigns (e.g., all users interested in "streetwear")
- Scheduled notifications via FCM APIs for styling reminders and event alerts
- Backend notification service can use @nestjs/firebase for Type-safe FCM integration

**Negative:**
- Google dependency — FCM requires Google Play Services on Android and is blocked in China
- Notification delivery is best-effort — no guaranteed delivery, especially on iOS where push delivery is subject to Apple's control
- Service worker registration and push permission UX adds friction to the user onboarding flow
- Push notification token management (refresh, expiration) adds backend complexity
- FCM topic management can become complex with fine-grained user segmentation
- Users must explicitly grant permission — many will decline, requiring fallback communication channels (email)

## ALTERNATIVES CONSIDERED

### OneSignal
- **Pros:** Unified push for web, iOS, Android with single SDK, advanced segmentation, A/B testing, richer analytics dashboard
- **Cons:** Cost at scale (pricing tier jumps), third-party dependency with its own SDK versioning, data privacy concerns (user data on OneSignal servers), less direct control over delivery pipeline

### Pushover
- **Pros:** Simple API, straightforward delivery, low cost
- **Cons:** Requires users to install Pushover app — no native browser/web push, no in-app notification center integration, limited to personal use rather than production SaaS

### Custom WebSocket push (Socket.IO only)
- **Pros:** No third-party dependencies, full control over delivery, integrated with existing realtime architecture, no permission prompts
- **Cons:** Only works when the user has an active browser tab open — no delivery for offline users, no push to mobile notifications, no service worker integration, battery drain concerns with persistent connections on mobile

## DATE
2026-05-25

## REVIEWERS
Lead Backend Engineer, Frontend Lead, Product Manager
