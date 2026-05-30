# ADR-010: Authentication

## STATUS
Accepted

## CONTEXT
The Closet Inteligente Digital platform requires user authentication for accounts, virtual wardrobe access, outfit creation, social interactions, and premium feature access. The project specification requires email/password registration and login as the primary authentication method, with potential expansion to social login providers (Google, Apple) in later phases. The authentication system must be stateless for API scalability, support refresh token rotation for security, integrate with Supabase RLS for database-level authorization, and work seamlessly with both the REST API and Socket.IO WebSocket connections.

## DECISION
We will use **JWT-based authentication with bcrypt** for password hashing.

The authentication architecture uses a dual-token system:
- **Access token (JWT)** — short-lived (15 minutes), signed with RS256, contains user ID and role claims, sent via Authorization header for REST API and query parameter (with proper security) for Socket.IO handshake
- **Refresh token** — long-lived (7 days), opaque random string stored in Redis with user association and device fingerprint, rotated on each use (old token invalidated when new one issued)
- **Password hashing** — bcrypt with cost factor 12, salted per password

JWT is chosen over session-based auth because the backend may scale horizontally across multiple instances without a centralized session store (beyond the refresh token blacklist in Redis). The stateless nature of JWTs means access token validation requires no database lookup, reducing latency for API requests. NestJS provides excellent JWT integration via @nestjs/jwt and @nestjs/passport.

## CONSEQUENCES

**Positive:**
- Stateless access token validation — no database lookup on each request, improving API response times
- Horizontal scaling friendly — any backend instance can validate access tokens independently
- Refresh token rotation provides security — compromised refresh tokens become invalid after first use
- bcrypt is well-tested and resistant to GPU/ASIC attacks for password hashing
- NestJS Passport integration provides guard-based protection on routes
- JWT claims enable authorization decisions without database queries (role, subscription tier)

**Negative:**
- JWT revocation requires token blacklisting — invalidated tokens remain valid until expiration unless added to a Redis blacklist
- Token size varies with claims — large claims increase HTTP header size on every request
- Refresh token rotation adds complexity to the auth flow on the client side
- No built-in social login — requires separate implementation (though Passport strategies exist)
- JWTs in Socket.IO handshake URLs may be logged by proxies — requires careful security review
- Mobile token storage (Secure Enclave/Keychain) requires platform-specific handling

## ALTERNATIVES CONSIDERED

### OAuth 2.0 (Authorization Code Flow with PKCE)
- **Pros:** Industry standard for delegated authorization, supports social login providers, well-tested security model
- **Cons:** Over-engineered for first-party email/password auth, requires authorization server setup, more complex flow for mobile apps, additional redirects impact UX, specification requires social login provider which is a later-phase feature

### Firebase Authentication
- **Pros:** Managed service, built-in social providers, anonymous auth, easy client SDK integration, passwordless email links
- **Cons:** Vendor lock-in — migrating away from Firebase Auth is difficult, limited customization for user profiles, pricing at scale, cannot run custom auth logic (e.g., specific password policies), Supabase Auth provides a similar managed solution without Google lock-in

### Session-based authentication (server-side sessions with cookies)
- **Pros:** Traditional, well-understood, token revocation is immediate (delete session from store), httpOnly cookies are secure against XSS
- **Cons:** Requires centralized session store for horizontal scaling (Redis needed anyway), cookie management complexity with cross-origin requests (CORS, SameSite), not suitable for mobile app auth without additional token mechanism, CSRF protection required

## DATE
2026-05-25

## REVIEWERS
Lead Backend Engineer, Security Engineer, CTO
