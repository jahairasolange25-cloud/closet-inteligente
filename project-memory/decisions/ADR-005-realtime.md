# ADR-005: Realtime Communication

## STATUS
Accepted

## CONTEXT
The Closet Inteligente Digital platform requires realtime communication capabilities for several features: collaborative virtual fitting rooms where users can style outfits together in real time, live styling sessions between personal shoppers and clients, real-time notifications for outfit shares and comments, presence indicators showing which users are viewing the same garment, and live updates when AI analysis completes for uploaded garment photos. The solution must handle room-based messaging, support automatic reconnection in unreliable network conditions, and scale to hundreds of concurrent styling sessions.

## DECISION
We will use **Socket.IO** for realtime bidirectional communication.

Socket.IO provides the feature set required for our realtime collaboration features out of the box:
- **Room management** — each virtual fitting session, styling consultation, or garment view page maps to a Socket.IO room, enabling targeted message delivery
- **Automatic reconnection** — handles network interruptions gracefully with exponential backoff, critical for mobile users with unstable connections
- **Fallback transport** — WebSocket with long-polling fallback ensures compatibility across network configurations (corporate proxies, restrictive firewalls)
- **Event acknowledgment** — guarantees message delivery for critical events (outfit composition changes, share actions)
- **Middleware support** — authentication middleware validates JWT tokens on connection and room join

Socket.IO runs on the NestJS backend alongside the HTTP server, sharing the same port and process. This simplifies deployment by avoiding a separate realtime infrastructure. For features requiring guaranteed delivery (notifications), Socket.IO events trigger Firebase Cloud Messaging as a fallback for offline users.

## CONSEQUENCES

**Positive:**
- Room-based architecture maps cleanly to collaborative features (fitting rooms, styling sessions)
- Reconnection and fallback transport provide reliable connectivity across diverse network conditions
- Shared port with HTTP server simplifies deployment and reduces infrastructure complexity
- Event acknowledgment enables reliable delivery for critical messaging
- Well-documented integration with NestJS via @nestjs/platform-socket.io
- Broadcasting to rooms (excluding sender) is idiomatic and efficient

**Negative:**
- Socket.IO adds protocol overhead compared to raw WebSocket (handshake, packet encoding)
- Horizontal scaling requires a Redis adapter (@socket.io/redis-adapter) to broadcast across instances, adding infrastructure dependency
- Connection state per instance — sticky sessions or Redis adapter needed when scaling beyond one backend process
- Long-polling fallback increases server load during fallback scenarios
- Socket.IO version upgrades can introduce breaking API changes in middleware and namespace patterns

## ALTERNATIVES CONSIDERED

### Native WebSocket (ws library)
- **Pros:** Minimal overhead, full control over protocol, no framework opinion
- **Cons:** No built-in room management — must implement manually, no automatic reconnection, no fallback transport, no event acknowledgment, requires significant boilerplate for production readiness

### Server-Sent Events (SSE)
- **Pros:** Simpler than WebSocket, native HTTP-based, automatic reconnection via EventSource API, works through most proxies
- **Cons:** Unidirectional (server to client only) — client cannot send messages without separate HTTP requests, limited to text data, browser tab connection limit (6 per domain), no room-based broadcasting

### Supabase Realtime
- **Pros:** Integrated with our PostgreSQL database, no additional infrastructure, listens to database changes directly
- **Cons:** Database-centric — only broadcasts row-level changes, not suitable for arbitrary application messages, no room management beyond channel scoping, less control over message format and delivery guarantees, not designed for high-frequency collaborative interactions

## DATE
2026-05-25

## REVIEWERS
Lead Backend Engineer, Frontend Lead, DevOps Engineer
