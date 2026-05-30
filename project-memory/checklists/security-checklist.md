# Security Checklist

---

## Authentication Security

### Password Policies
- [ ] Minimum password length: 8 characters
- [ ] Require mixed case (upper and lowercase)
- [ ] Require at least one number
- [ ] Require at least one special character
- [ ] Password strength meter shown during registration
- [ ] Common/breached passwords rejected (check against known password lists)
- [ ] Passwords are hashed with bcrypt (salt rounds >= 12)
- [ ] Passwords are never stored in plaintext
- [ ] Passwords are never logged
- [ ] Passwords are never returned in API responses
- [ ] Password reset tokens are single-use and time-limited (15 minutes)
- [ ] Password change requires current password verification
- [ ] Password history enforced (no reuse of last 5 passwords)

### JWT Implementation
- [ ] JWTs are signed with RS256 or HS256 (strong algorithm)
- [ ] JWT secret/key is strong (minimum 256 bits)
- [ ] Access token expiry: 15 minutes
- [ ] Refresh token expiry: 7 days
- [ ] Refresh token rotation: old token invalidated on refresh
- [ ] JWT contains minimal claims (sub, iat, exp, jti)
- [ ] No sensitive data in JWT payload (no passwords, PII)
- [ ] JWT verification on every protected request
- [ ] Token blacklist for immediate revocation
- [ ] Refresh tokens stored as hash in database (not plaintext)
- [ ] JWT audience and issuer claims validated

### Session Management
- [ ] Session timeout after period of inactivity (30 minutes)
- [ ] Concurrent session limit (max 5 active sessions)
- [ ] Session invalidation on password change
- [ ] Force logout from all devices option
- [ ] Remember-me token has separate, longer expiry (30 days)
- [ ] Session fixation protection (regenerate session ID on login)
- [ ] Device tracking (record device info with sessions)
- [ ] Suspicious login detection (new device/location alert)

### Brute Force Protection
- [ ] Rate limiting: 5 failed login attempts per IP per minute
- [ ] Account lockout: 15 minutes after 5 failed attempts
- [ ] Progressive delay: increase delay with each failed attempt
- [ ] CAPTCHA after 3 failed attempts (reCAPTCHA v3 or hCaptcha)
- [ ] Login attempt logging (IP, user agent, timestamp, success/failure)
- [ ] Alerting on brute force patterns (multiple accounts, single IP)

---

## API Security

### Request Validation
- [ ] All input validated with whitelist approach (allow known valid, reject everything else)
- [ ] SQL injection prevented (parameterized queries, ORM, escaped inputs)
- [ ] No eval(), setTimeout(string), or Function() with user input
- [ ] JSON parsing with size limits (prevent prototype pollution)
- [ ] XML parsing disabled if not needed (prevent XXE)
- [ ] Server-side request forgery (SSRF) protection (validate redirect URLs, block internal IPs)
- [ ] Open redirect prevention (validate redirect URLs against whitelist)

### HTTP Security Headers
- [ ] `Content-Security-Policy` (CSP) configured:
  - [ ] Script sources restricted to self and trusted CDNs
  - [ ] Style sources restricted to self and 'unsafe-inline' (for Tailwind)
  - [ ] Image sources include Cloudinary domain
  - [ ] Connect sources include API domain and WebSocket
  - [ ] Frame ancestors set to 'none' or specific origins
  - [ ] Report-URI for CSP violation reporting
- [ ] `Strict-Transport-Security` (HSTS): max-age=31536000, includeSubDomains, preload
- [ ] `X-Content-Type-Options`: nosniff
- [ ] `X-Frame-Options`: DENY (or SAMEORIGIN if iframes needed)
- [ ] `X-XSS-Protection`: 1; mode=block
- [ ] `Referrer-Policy`: strict-origin-when-cross-origin
- [ ] `Permissions-Policy`: geolocation=(), camera=(), microphone=()
- [ ] `Cache-Control`: no-store for sensitive responses
- [ ] `Cross-Origin-Resource-Policy`: same-origin
- [ ] `Cross-Origin-Opener-Policy`: same-origin
- [ ] `Cross-Origin-Embedder-Policy`: require-corp

### CORS Configuration
- [ ] CORS enabled only for specific origins (not `*`)
- [ ] Production CORS includes only production frontend domain
- [ ] Credentials (cookies) only sent to specific origins
- [ ] Allowed methods restricted to needed ones (GET, POST, PUT, DELETE, PATCH)
- [ ] Allowed headers restricted to needed ones
- [ ] Preflight (OPTIONS) caching configured (max age)
- [ ] CORS validation is case-sensitive (no origin bypass)

### Rate Limiting
- [ ] Global rate limit: 1000 requests per minute per IP
- [ ] Auth endpoints: 5 requests per minute per IP
- [ ] File upload endpoints: 10 requests per minute per IP
- [ ] Search endpoints: 30 requests per minute per IP
- [ ] AI processing endpoints: 5 requests per minute per user
- [ ] Rate limit headers returned: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
- [ ] Rate limit exceeded returns 429 with Retry-After header
- [ ] Rate limiting is applied per user AND per IP
- [ ] Rate limiting is applied to WebSocket connections

### API Key Management
- [ ] API keys are generated with sufficient entropy (minimum 32 bytes)
- [ ] API keys are stored as hash (not plaintext)
- [ ] API keys have configurable expiration
- [ ] API keys can be revoked individually
- [ ] API key permissions/scopes are enforced
- [ ] API key usage is logged and monitorable
- [ ] Internal service API keys are rotated regularly

---

## Database Security

### Access Control
- [ ] Database credentials are not hardcoded in code
- [ ] Database connections use TLS/SSL
- [ ] Database users have least-privilege access:
  - [ ] Application user: CRUD on application tables only
  - [ ] Migration user: schema changes only
  - [ ] Read-only user: reporting/analytics only
- [ ] No database superuser used in application
- [ ] Network access restricted to application servers only
- [ ] Database port not exposed to public internet
- [ ] IP whitelisting for database access

### Data Protection
- [ ] Sensitive data encrypted at rest (TDE or column-level encryption)
- [ ] Personally Identifiable Information (PII) identified and documented
- [ ] PII encrypted in database columns (email, name, phone, address)
- [ ] User passwords are hashed (bcrypt), not encrypted
- [ ] Refresh tokens are stored as hash
- [ ] Database backups are encrypted
- [ ] Data retention policies implemented and enforced

### Query Security
- [ ] All queries use parameterized statements (no string concatenation)
- [ ] Row-Level Security (RLS) enabled in Supabase
- [ ] RLS policies restrict users to their own data
- [ ] Stored procedures used for complex operations (where appropriate)
- [ ] Query timeout configured (30s default)
- [ ] Maximum rows returned per query limited (pagination enforced)
- [ ] Dangerous functions disabled (xp_cmdshell, COPY TO PROGRAM)

### Audit Logging
- [ ] All schema changes logged
- [ ] All data deletions logged (who, what, when)
- [ ] All authentication events logged
- [ ] All failed access attempts logged
- [ ] Audit logs are immutable (append-only)
- [ ] Audit logs are retained for minimum 90 days
- [ ] Audit logs are backed up

---

## File Upload Security

### Validation
- [ ] File type validation by extension AND magic bytes (MIME type spoofing prevention)
- [ ] Allowed types: image/jpeg, image/png, image/webp for garment images; model/gltf-binary for 3D
- [ ] Maximum file size: 10MB for images, 50MB for 3D models
- [ ] File name sanitization (remove path separators, special characters)
- [ ] Rename uploaded files to UUID-based names (prevent filename collision/exploitation)
- [ ] Reject files with embedded scripts (SVG with script tags, HTML files)
- [ ] Image re-encoding strips metadata (EXIF, GPS, thumbnails)

### Storage
- [ ] Uploaded files stored outside webroot
- [ ] Direct file access URLs are signed/temporary
- [ ] Content-Disposition header set to attachment
- [ ] Files scanned for malware (ClamAV integration)
- [ ] Storage bucket has proper access controls (private by default)
- [ ] CDN delivery with URL signing for private content
- [ ] Deleted files are permanently removed after retention period

### Image Processing Security
- [ ] Image processing libraries are up-to-date (prevent ImageMagick vulns)
- [ ] Image processing done in isolated/sandboxed environment
- [ ] Image bombs (decompression bombs) are detected and rejected
- [ ] Memory limits enforced during image processing
- [ ] Processing timeout configured (30s max)

---

## Third-Party Integration Security

### Cloudinary
- [ ] API secret stored in environment variable (not code)
- [ ] Upload presets with proper settings:
  - [ ] Signed uploads required
  - [ ] Max file size limit
  - [ ] Allowed file types
  - [ ] Moderation enabled (auto or manual)
- [ ] Private CDN delivery with signed URLs
- [ ] Delivery URLs use HTTPS only

### Firebase Cloud Messaging
- [ ] Firebase server key stored securely
- [ ] FCM tokens are stored encrypted in database
- [ ] Invalid/expired FCM tokens are cleaned up
- [ ] Notification sending is authorized (verify user owns token)

### Supabase
- [ ] Row-Level Security (RLS) policies are tested
- [ ] Service role key is used only in backend (never exposed to client)
- [ ] Anon key has minimal permissions
- [ ] Supabase API endpoints are not exposed to public

### Google Drive
- [ ] OAuth tokens have minimal scopes
- [ ] Tokens are stored encrypted
- [ ] Refresh tokens are handled securely
- [ ] API key restrictions (HTTP referrers, IP)

### Redis
- [ ] Redis requires authentication (password configured)
- [ ] Redis not exposed to public network
- [ ] Redis commands restricted (rename dangerous commands)
- [ ] TLS encryption for Redis connections
- [ ] Data in Redis is not sensitive (cache only, no PII if possible)

---

## Data Privacy (GDPR)

### Data Inventory
- [ ] All personal data collected is documented
- [ ] Purpose of data collection is defined for each data point
- [ ] Legal basis for processing is documented (consent, legitimate interest, etc.)
- [ ] Data categories: email, name, password hash, body measurements, garment images, avatar, calendar events, usage analytics

### Consent Management
- [ ] Consent obtained before data collection
- [ ] Consent records are stored (who, when, what)
- [ ] Consent withdrawal mechanism implemented
- [ ] Analytics tracking requires explicit opt-in (not pre-checked)
- [ ] Cookie consent banner implemented (if cookies used)

### User Rights
- [ ] Right to access: GET /api/export/all-data returns all user data
- [ ] Right to rectification: profile editing allows correcting personal data
- [ ] Right to erasure: DELETE /api/account deletes all user data permanently
- [ ] Right to restrict processing: settings page allows disabling analytics
- [ ] Right to data portability: export endpoint provides data in JSON format
- [ ] Right to object: unsubscribe mechanism in all marketing communications
- [ ] Automated decision-making: AI recommendations explained (optional, per GDPR)

### Data Retention
- [ ] Data retention policy documented and implemented:
  - [ ] Active user data: retained while account is active
  - [ ] Deleted accounts: data purged within 30 days
  - [ ] Analytics data: anonymized after 12 months
  - [ ] Session/log data: deleted after 90 days
  - [ ] Unverified accounts (never confirmed email): deleted after 30 days
- [ ] Automated data cleanup jobs implemented
- [ ] Backup data follows same retention policy

### Data Breach Response
- [ ] Data breach notification procedure documented
- [ ] 72-hour notification timeline for supervisory authority
- [ ] Breach notification template ready
- [ ] Contact information for data protection officer

---

## Infrastructure Security

### Network Security
- [ ] All traffic uses TLS 1.2 or 1.3 (no SSL, no TLS 1.0/1.1)
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] HSTS preload configured
- [ ] SSL certificate valid and auto-renewing (Let's Encrypt)
- [ ] Private API endpoints not exposed to internet
- [ ] Application behind reverse proxy (Nginx, Cloudflare)
- [ ] Web Application Firewall (WAF) enabled
- [ ] DDoS protection enabled
- [ ] Security groups/firewall rules restrict access to necessary ports only

### Container Security
- [ ] Docker images use minimal base images (Alpine, distroless)
- [ ] No root user in containers
- [ ] Containers run as non-root user
- [ ] Image vulnerability scanning in CI
- [ ] Base images updated regularly
- [ ] Secrets not baked into images (use Docker secrets or env vars)
- [ ] Container resource limits configured (CPU, memory)
- [ ] Read-only root filesystem where possible

### Cloud Security
- [ ] Cloud provider security best practices followed
- [ ] IAM roles use least privilege principle
- [ ] Access keys rotated every 90 days
- [ ] Cloud audit logging enabled
- [ ] Security groups restrict inbound/outbound traffic
- [ ] Encryption at rest enabled for all storage
- [ ] Backup encryption enabled

### Secrets Management
- [ ] Secrets stored in environment variables or secrets manager
- [ ] No secrets committed to version control
- [ ] `.env` files in `.gitignore`
- [ ] Secrets scanned for in CI (git secrets, truffleHog)
- [ ] Secrets rotated on a regular schedule
- [ ] Production secrets different from development/staging
- [ ] Secrets access logged and audited

### Monitoring & Logging
- [ ] Security events logged (auth failures, access violations, data changes)
- [ ] Logs shipped to centralized logging system
- [ ] Log retention: minimum 90 days for security events
- [ ] Logs include: timestamp, user ID, IP address, action, resource, status
- [ ] Personally Identifiable Information (PII) not logged
- [ ] Alerting configured for security events:
  - [ ] Multiple failed login attempts
  - [ ] Unauthorized access attempts
  - [ ] Suspicious IP addresses
  - [ ] Data export/download events
  - [ ] Account deletion events
  - [ ] API key usage anomalies

### Incident Response
- [ ] Incident response plan documented
- [ ] Incident severity levels defined (critical, high, medium, low)
- [ ] Contact information for security team
- [ ] Incident response runbooks created
- [ ] Post-incident review process defined
- [ ] Regular security incident drills conducted
