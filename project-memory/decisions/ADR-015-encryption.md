# ADR-015: Media Encryption

## STATUS
Accepted

## CONTEXT
The Closet Inteligente Digital platform handles sensitive user-generated content including personal wardrobe photographs, 3D body scan data for avatar creation, and user-uploaded garment images that may contain personal information or be located in private spaces. Regulatory compliance (GDPR, LGPD for Brazilian users) requires encryption of personal data at rest. Additionally, the platform may partner with fashion brands that require their digital garment assets to be encrypted during storage and transmission. The encryption solution must support Cloudinary integration for cloud storage, signed URL access control, and performance-optimized media delivery through CDN.

## DECISION
We will use **AES-256 encryption** for media file encryption at rest.

AES-256 is implemented at multiple layers:
- **Storage encryption** — Cloudinary automatically encrypts uploaded files at rest using AES-256 (server-side encryption)
- **Client-side encryption** — Sensitive user garment photos are encrypted with AES-256-GCM before upload, with encryption keys managed separately (not stored on Cloudinary)
- **Transport encryption** — All media uploads/downloads require HTTPS/TLS 1.3
- **Access control** — Signed URLs with expiration timestamps prevent unauthorized access to encrypted media
- **Key management** — Encryption keys are stored in environment variables and managed via NestJS configuration module, with key rotation procedures documented

For the client-side encryption layer (sensitive photos), AES-256-GCM is used because it provides authenticated encryption (integrity + confidentiality) with a nonce for each encryption operation, preventing replay attacks on encrypted media.

## CONSEQUENCES

**Positive:**
- AES-256 is an industry-standard, NIST-approved algorithm with extensive security auditing
- Cloudinary provides server-side AES-256 encryption at rest at no additional cost
- Client-side AES-256-GCM provides end-to-end encryption for the most sensitive user data
- Authenticated encryption (GCM mode) detects tampering with encrypted media files
- Key management via environment variables integrates with existing backend configuration
- Signed URL layer ensures only authorized users can access decrypted media via the CDN

**Negative:**
- Client-side encryption prevents Cloudinary from performing server-side transformations on encrypted images (must decrypt, transform, re-encrypt)
- Key management complexity — key rotation requires re-encrypting all affected user files
- Encryption/decryption overhead on client devices during upload and viewing
- Size overhead from GCM authentication tag (16 bytes per file) and nonce (12 bytes)
- Encrypted media cannot be served directly from CDN without decryption gateway
- Loss of encryption key means permanent loss of access to encrypted user assets

## ALTERNATIVES CONSIDERED

### AES-128
- **Pros:** Faster encryption/decryption, lower computational overhead, sufficient for most commercial applications
- **Cons:** Lower security margin, may not meet enterprise/brand partner compliance requirements, Cloudinary server-side encryption uses AES-256 by default, potential future regulatory changes may require 256-bit

### 3DES (Triple DES)
- **Pros:** Widely supported in legacy systems, well-understood algorithm
- **Cons:** Significantly slower than AES, 56-bit effective security per DES operation (112-bit with 3DES), deprecated by NIST since 2023, not recommended for new systems, no hardware acceleration on modern CPUs

### ChaCha20
- **Pros:** Faster than AES on devices without hardware AES acceleration (mobile devices), secure design (Bernstein), no padding overhead (stream cipher), resistant to timing attacks
- **Cons:** Not supported by Cloudinary server-side encryption at rest, less widely audited than AES for storage use cases, fewer integration libraries in Node.js for file encryption, non-standard for cloud storage encryption, hardware AES acceleration on modern CPUs makes ChaCha20's speed advantage negligible on desktop/server hardware

## DATE
2026-05-25

## REVIEWERS
Security Engineer, Lead Backend Engineer, CTO
