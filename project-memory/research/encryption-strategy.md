# Encryption Strategy

## Overview

The encryption strategy ensures all user data, media files, and communications are protected at rest and in transit. This covers AES-256 encryption for media files, database encryption, TLS for transit, signed URL access control, and GDPR compliance measures.

---

## 1. Encryption at Rest: Database

### Transparent Data Encryption (TDE)

PostgreSQL encryption is handled at two levels:

1. **Supabase-managed disk encryption**: All data at rest is encrypted using AES-256 on the storage layer.
2. **Application-level column encryption**: Sensitive fields are encrypted via pgcrypto extension.

```sql
-- Enable pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt sensitive user fields
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  email_encrypted BYTEA,  -- AES-256 encrypted email for search
  phone_encrypted BYTEA,  -- AES-256 encrypted phone
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to encrypt sensitive data
CREATE OR REPLACE FUNCTION encrypt_sensitive(data TEXT, key TEXT)
RETURNS BYTEA AS $$
BEGIN
  RETURN encrypt(
    convert_to(data, 'utf8'),
    digest(key, 'sha256'),  -- Derive 256-bit key from passphrase
    'aes'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrypt
CREATE OR REPLACE FUNCTION decrypt_sensitive(data BYTEA, key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN convert_from(
    decrypt(data, digest(key, 'sha256'), 'aes'),
    'utf8'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Column-Level Encryption (Application Layer)

```typescript
// src/encryption/database-encryption.service.ts
import * as crypto from 'crypto';

@Injectable()
export class DatabaseEncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(private config: ConfigService) {
    const keyHex = config.getOrThrow('DB_ENCRYPTION_KEY');
    this.key = Buffer.from(keyHex, 'hex');
  }

  encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag().toString('hex');

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag,
    };
  }

  decrypt(encrypted: string, iv: string, tag: string): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(iv, 'hex'),
    );
    decipher.setAuthTag(Buffer.from(tag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Deterministic encryption for searchable fields (e.g., email).
   * Use with caution: less secure than randomized encryption.
   */
  encryptDeterministic(text: string): string {
    const cipher = crypto.createCipheriv(
      'aes-256-ecb',
      this.key,
      null,
    );
    cipher.setAutoPadding(true);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  /**
   * Hash for indexing (not reversible).
   */
  hashForIndex(text: string): string {
    return crypto
      .createHmac('sha256', this.key)
      .update(text)
      .digest('hex');
  }
}
```

---

## 2. AES-256 Encryption for Media Files

```typescript
// src/encryption/media-encryption.service.ts
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

@Injectable()
export class MediaEncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(private config: ConfigService) {
    const keyHex = config.getOrThrow('MEDIA_ENCRYPTION_KEY');
    this.key = Buffer.from(keyHex, 'hex');
  }

  /**
   * Encrypt a media buffer before upload to Cloudinary.
   */
  encryptBuffer(buffer: Buffer): { encrypted: Buffer; iv: string; tag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    const encrypted = Buffer.concat([
      cipher.update(buffer),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    return { encrypted, iv: iv.toString('hex'), tag: tag.toString('hex') };
  }

  /**
   * Decrypt a media buffer for client delivery.
   */
  decryptBuffer(encrypted: Buffer, iv: string, tag: string): Buffer {
    const decipher = crypto.createCipheriv(
      this.algorithm,
      this.key,
      Buffer.from(iv, 'hex'),
    );
    decipher.setAuthTag(Buffer.from(tag, 'hex'));

    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
  }

  /**
   * Encrypt a file stream (for large videos).
   */
  async encryptFile(inputPath: string, outputPath: string): Promise<{ iv: string; tag: string }> {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    const input = createReadStream(inputPath);
    const output = createWriteStream(outputPath);

    // Write IV at the start of the file
    output.write(iv);

    await pipeline(input, cipher, output);

    // Append auth tag at the end
    const tag = cipher.getAuthTag();
    await fs.appendFile(outputPath, tag);

    return { iv: iv.toString('hex'), tag: tag.toString('hex') };
  }

  /**
   * Decrypt a file stream.
   */
  async decryptFile(inputPath: string, outputPath: string, iv: string, tag: string): Promise<void> {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(iv, 'hex'),
    );
    decipher.setAuthTag(Buffer.from(tag, 'hex'));

    const input = createReadStream(inputPath);
    const output = createWriteStream(outputPath);

    // Skip IV and tag in input
    // In practice, read them from the file header

    await pipeline(input, decipher, output);
  }

  /**
   * Generate a random encryption key.
   */
  static generateKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate a random initialization vector.
   */
  static generateIV(): string {
    return crypto.randomBytes(16).toString('hex');
  }
}
```

### Media Encryption Wrapper (Storage Service)

```typescript
// src/encryption/storage-encryption.service.ts
export class StorageEncryptionService {
  constructor(
    private readonly mediaEncryption: MediaEncryptionService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Upload an encrypted image to Cloudinary.
   * The file is encrypted before upload and decrypted on delivery
   * via signed URLs with client-side decryption.
   */
  async uploadEncrypted(
    file: Buffer,
    userId: string,
    assetType: AssetType,
  ): Promise<UploadResult> {
    // Encrypt before upload
    const { encrypted, iv, tag } = this.mediaEncryption.encryptBuffer(file);

    // Store encryption metadata
    const encryptionKey = await this.storeEncryptionKey(userId, { iv, tag });

    // Upload encrypted blob
    const uploadResult = await this.cloudinaryService.uploadImage(
      encrypted,
      assetType,
      {
        public_id: `encrypted/${userId}/${encryptionKey.id}`,
        resource_type: 'raw', // Upload as raw to avoid re-encoding
      },
    );

    return {
      publicId: uploadResult.public_id,
      encryptionKeyId: encryptionKey.id,
      size: encrypted.length,
    };
  }

  /**
   * Generate a signed decryption URL.
   */
  async getDecryptedUrl(
    publicId: string,
    encryptionKeyId: string,
    userId: string,
    expiresInSeconds: number = 3600,
  ): Promise<string> {
    // Verify user has access
    const encryptionKey = await this.getEncryptionKey(encryptionKeyId, userId);
    if (!encryptionKey) {
      throw new UnauthorizedException('Access denied to encrypted media');
    }

    // Generate a one-time use signed URL
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

    // Store access grant
    await this.storeAccessGrant(token, {
      publicId,
      iv: encryptionKey.iv,
      tag: encryptionKey.tag,
      userId,
      expiresAt,
    });

    return `/api/media/decrypt/${token}`;
  }

  private async storeEncryptionKey(
    userId: string,
    keyData: { iv: string; tag: string },
  ): Promise<{ id: string }> {
    const { data, error } = await supabase
      .from('encryption_keys')
      .insert({
        user_id: userId,
        iv: keyData.iv,
        tag: keyData.tag,
      })
      .select('id')
      .single();

    if (error) throw error;
    return { id: data.id };
  }

  private async getEncryptionKey(
    keyId: string,
    userId: string,
  ): Promise<{ iv: string; tag: string } | null> {
    const { data } = await supabase
      .from('encryption_keys')
      .select('iv, tag')
      .eq('id', keyId)
      .eq('user_id', userId)
      .single();

    return data;
  }
}
```

---

## 3. Key Management Strategy

```typescript
// src/encryption/key-management.service.ts
export class KeyManagementService {
  private keyVersions: Map<string, KeyVersion> = new Map();

  constructor(private config: ConfigService) {
    this.loadKeyVersions();
  }

  async getCurrentKey(keyType: KeyType): Promise<KeyVersion> {
    return this.keyVersions.get(keyType)!;
  }

  async getKey(keyType: KeyType, version: number): Promise<KeyVersion | null> {
    // Could fetch from vault or KMS
    return null;
  }

  async rotateKey(keyType: KeyType): Promise<void> {
    const newKey = MediaEncryptionService.generateKey();
    const newVersion: KeyVersion = {
      id: crypto.randomUUID(),
      key: Buffer.from(newKey, 'hex'),
      version: (this.keyVersions.get(keyType)?.version || 0) + 1,
      createdAt: new Date(),
      status: 'active',
    };

    // Store in secrets manager
    await this.storeKeyInVault(keyType, newVersion);

    // Mark old key as deprecated
    const oldKey = this.keyVersions.get(keyType);
    if (oldKey) {
      oldKey.status = 'deprecated';
      await this.updateKeyInVault(keyType, oldKey);
    }

    this.keyVersions.set(keyType, newVersion);
  }

  async reEncryptData(
    keyType: KeyType,
    oldVersion: number,
    newVersion: number,
  ): Promise<void> {
    // Re-encrypt all data encrypted with old key using new key
    // This is a resource-intensive operation
  }

  private async storeKeyInVault(keyType: KeyType, key: KeyVersion): Promise<void> {
    // Store in AWS KMS / HashiCorp Vault / environment variables
  }

  private loadKeyVersions(): void {
    this.keyVersions.set('database', {
      id: 'db-key-1',
      key: Buffer.from(this.config.get('DB_ENCRYPTION_KEY'), 'hex'),
      version: 1,
      createdAt: new Date(),
      status: 'active',
    });
    this.keyVersions.set('media', {
      id: 'media-key-1',
      key: Buffer.from(this.config.get('MEDIA_ENCRYPTION_KEY'), 'hex'),
      version: 1,
      createdAt: new Date(),
      status: 'active',
    });
  }
}

interface KeyVersion {
  id: string;
  key: Buffer;
  version: number;
  createdAt: Date;
  status: 'active' | 'deprecated' | 'compromised';
}

type KeyType = 'database' | 'media' | 'api' | 'jwt';
```

---

## 4. Encryption in Transit (TLS 1.3)

```typescript
// src/config/tls.config.ts
export const tlsConfig = {
  // TLS 1.3 enforced
  minVersion: 'TLSv1.3',
  // Strong cipher suites only
  ciphers: [
    'TLS_AES_256_GCM_SHA384',
    'TLS_CHACHA20_POLY1305_SHA256',
    'TLS_AES_128_GCM_SHA256',
  ].join(':'),
  // Disable older vulnerable protocols
  secureOptions: crypto.constants.SSL_OP_NO_TLSv1 |
                 crypto.constants.SSL_OP_NO_TLSv1_1 |
                 crypto.constants.SSL_OP_NO_TLSv1_2,
};

// HSTS configuration
export const hstsConfig = {
  maxAge: 31536000, // 1 year
  includeSubDomains: true,
  preload: true,
};
```

### Next.js Security Headers

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; img-src 'self' https://res.cloudinary.com https://*.googleapis.com; script-src 'self' 'unsafe-inline' https://widget.cloudinary.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.readyplayer.me;",
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
];

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};
```

---

## 5. Signed URL Generation

```typescript
// src/encryption/signed-url.service.ts
import * as crypto from 'crypto';

@Injectable()
export class SignedUrlService {
  private readonly secret: string;
  private readonly defaultExpiry = 3600; // 1 hour

  constructor(private config: ConfigService) {
    this.secret = config.getOrThrow('URL_SIGNING_SECRET');
  }

  /**
   * Generate a signed URL for accessing encrypted media.
   */
  signUrl(path: string, userId: string, expiresIn?: number): string {
    const expiry = Math.floor(Date.now() / 1000) + (expiresIn || this.defaultExpiry);
    const payload = `${path}:${userId}:${expiry}`;
    const signature = this.createSignature(payload);

    const params = new URLSearchParams({
      expires: expiry.toString(),
      signature,
      user: userId,
    });

    return `${path}?${params.toString()}`;
  }

  /**
   * Verify and decode a signed URL.
   */
  verifyUrl(url: string, userId: string): { valid: boolean; path: string } {
    const parsed = new URL(url, 'http://localhost');
    const expires = parseInt(parsed.searchParams.get('expires') || '0');
    const signature = parsed.searchParams.get('signature') || '';
    const path = parsed.pathname;

    // Check expiry
    if (Date.now() / 1000 > expires) {
      return { valid: false, path };
    }

    // Verify signature
    const expectedPayload = `${path}:${userId}:${expires}`;
    const expectedSig = this.createSignature(expectedPayload);

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return { valid: false, path };
    }

    return { valid: true, path };
  }

  /**
   * Generate a one-time use token (for download links).
   */
  generateOneTimeToken(path: string, userId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const hash = crypto
      .createHmac('sha256', this.secret)
      .update(`${path}:${userId}:${token}`)
      .digest('hex');

    return `${token}:${hash}`;
  }

  private createSignature(payload: string): string {
    return crypto
      .createHmac('sha256', this.secret)
      .update(payload)
      .digest('hex')
      .substring(0, 16);
  }
}
```

### Decryption Endpoint

```typescript
// app/api/media/decrypt/[token]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } },
) {
  const { token } = params;

  // Verify token and get encryption params
  const accessGrant = await getAccessGrant(token);
  if (!accessGrant || accessGrant.expiresAt < Math.floor(Date.now() / 1000)) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  // Fetch encrypted media from Cloudinary
  const response = await fetch(
    cloudinary.url(accessGrant.publicId, { resource_type: 'raw' }),
  );
  const encryptedBuffer = Buffer.from(await response.arrayBuffer());

  // Decrypt
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    encryptionKey,
    Buffer.from(accessGrant.iv, 'hex'),
  );
  decipher.setAuthTag(Buffer.from(accessGrant.tag, 'hex'));

  const decrypted = Buffer.concat([
    decipher.update(encryptedBuffer),
    decipher.final(),
  ]);

  // Invalidate one-time token
  await invalidateAccessGrant(token);

  // Return decrypted media with appropriate content type
  return new NextResponse(decrypted, {
    headers: {
      'Content-Type': 'image/jpeg',
      'Content-Disposition': 'inline',
      'Cache-Control': 'private, max-age=0',
    },
  });
}
```

---

## 6. Client-Side Decryption Considerations

```typescript
// lib/encryption/client-decryption.ts
export class ClientDecryptionService {
  private keyCache = new Map<string, CryptoKey>();

  /**
   * Decrypt media on the client side for offline access.
   * Only used for cached/prefetched content.
   */
  async decryptBuffer(
    encrypted: ArrayBuffer,
    iv: string,
    keyMaterial: string,
  ): Promise<ArrayBuffer> {
    const key = await this.getKey(keyMaterial);
    const ivBuffer = Buffer.from(iv, 'hex');

    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer,
        tagLength: 128,
      },
      key,
      encrypted,
    );

    return decrypted;
  }

  private async getKey(keyMaterial: string): Promise<CryptoKey> {
    if (this.keyCache.has(keyMaterial)) {
      return this.keyCache.get(keyMaterial)!;
    }

    const keyData = Buffer.from(keyMaterial, 'hex');
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM' },
      false,
      ['decrypt'],
    );

    this.keyCache.set(keyMaterial, key);
    return key;
  }

  /**
   * Check if Web Crypto API supports AES-GCM.
   */
  static isSupported(): boolean {
    return typeof crypto !== 'undefined' && 
           typeof crypto.subtle !== 'undefined' &&
           'decrypt' in crypto.subtle;
  }
}
```

---

## 7. Key Rotation Policy

```typescript
// src/encryption/key-rotation.policy.ts
export const KEY_ROTATION_POLICY = {
  database: {
    rotationPeriodDays: 90,      // Rotate database encryption key quarterly
    gracePeriodDays: 7,          // Old key remains valid for 7 days
    reEncryptOnRotation: false,  // Don't re-encrypt; decrypt with old, encrypt with new
    alertBeforeDays: 14,         // Alert 2 weeks before rotation
  },
  media: {
    rotationPeriodDays: 180,     // Rotate media key every 6 months
    gracePeriodDays: 30,         // Old key valid for 30 days (cached content)
    reEncryptOnRotation: false,  // Too expensive; decrypt with old when accessed
    alertBeforeDays: 30,
  },
  jwt: {
    rotationPeriodDays: 30,      // Rotate JWT signing key monthly
    gracePeriodDays: 1,          // 24 hour overlap for in-flight tokens
    reEncryptOnRotation: true,   // Revoke old tokens
    alertBeforeDays: 7,
  },
  api: {
    rotationPeriodDays: 365,     // Rotate API keys yearly
    gracePeriodDays: 30,         // 30 day overlap for integration updates
    reEncryptOnRotation: false,
    alertBeforeDays: 60,
  },
};

export class KeyRotationScheduler {
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkKeyExpiry() {
    for (const [keyType, policy] of Object.entries(KEY_ROTATION_POLICY)) {
      const currentKey = await this.keyManagement.getCurrentKey(keyType as KeyType);
      const ageDays = (Date.now() - currentKey.createdAt.getTime()) / 86400000;

      if (ageDays >= policy.rotationPeriodDays - policy.alertBeforeDays) {
        await this.sendRotationAlert(keyType, policy.rotationPeriodDays - ageDays);
      }

      if (ageDays >= policy.rotationPeriodDays) {
        await this.keyManagement.rotateKey(keyType as KeyType);
        await this.logRotation(keyType, currentKey.version);
      }
    }
  }
}
```

---

## 8. Secure Key Storage

```typescript
// src/config/secrets.config.ts
export const SECRETS = {
  // Environment variables (local development)
  local: [
    'DB_ENCRYPTION_KEY',
    'MEDIA_ENCRYPTION_KEY',
    'URL_SIGNING_SECRET',
    'JWT_SECRET',
  ],

  // HashiCorp Vault (production)
  vault: {
    address: process.env.VAULT_ADDR || 'https://vault.internal:8200',
    token: process.env.VAULT_TOKEN,
    secretsPath: 'closet/secrets',
    engine: 'kv-v2',
  },

  // AWS KMS (alternative)
  awsKms: {
    region: process.env.AWS_REGION,
    keyId: process.env.KMS_KEY_ID,
  },
};

/**
 * Fetch secrets from Vault at startup.
 */
export async function loadSecretsFromVault(): Promise<void> {
  if (process.env.NODE_ENV !== 'production') return;

  const response = await fetch(
    `${SECRETS.vault.address}/v1/${SECRETS.vault.secretsPath}/data/config`,
    {
      headers: {
        'X-Vault-Token': SECRETS.vault.token!,
      },
    },
  );

  if (!response.ok) throw new Error('Failed to fetch secrets from Vault');

  const { data } = await response.json();
  
  // Set environment variables
  for (const [key, value] of Object.entries(data.data)) {
    process.env[key] = value as string;
  }
}
```

---

## 9. Encryption Performance Impact

```typescript
// src/encryption/performance-benchmark.ts
export async function benchmarkEncryption(): Promise<BenchmarkResult> {
  const service = new MediaEncryptionService({
    get: (key: string) => MediaEncryptionService.generateKey(),
  } as any);

  const sizes = [
    { label: 'Small (100KB)', size: 100 * 1024 },
    { label: 'Medium (1MB)', size: 1024 * 1024 },
    { label: 'Large (10MB)', size: 10 * 1024 * 1024 },
  ];

  const results: BenchmarkResult[] = [];

  for (const { label, size } of sizes) {
    const buffer = crypto.randomBytes(size);

    const encryptStart = performance.now();
    const { encrypted } = service.encryptBuffer(buffer);
    const encryptTime = performance.now() - encryptStart;

    const decryptStart = performance.now();
    service.decryptBuffer(encrypted, 'iv', 'tag');
    const decryptTime = performance.now() - decryptStart;

    results.push({
      label,
      encryptMs: Math.round(encryptTime * 100) / 100,
      decryptMs: Math.round(decryptTime * 100) / 100,
      throughputMbps: Math.round((size / (encryptTime / 1000)) / (1024 * 1024) * 100) / 100,
      overheadPercent: Math.round(((encrypted.length - buffer.length) / buffer.length) * 10000) / 100,
    });
  }

  return results[1]; // Return medium size result
}

interface BenchmarkResult {
  label: string;
  encryptMs: number;
  decryptMs: number;
  throughputMbps: number;
  overheadPercent: number;
}
```

### Expected Performance

| File Size | Encrypt | Decrypt | Throughput | Storage Overhead |
|-----------|---------|---------|------------|------------------|
| 100 KB | 0.5ms | 0.4ms | 200 MB/s | 0.1% |
| 1 MB | 3ms | 2.5ms | 340 MB/s | 0.1% |
| 10 MB | 28ms | 24ms | 360 MB/s | 0.1% |
| 100 MB | 280ms | 250ms | 360 MB/s | 0.1% |

---

## 10. Compliance Requirements (GDPR)

### Data Protection Measures

```typescript
// src/compliance/gdpr.service.ts
@Injectable()
export class GdprComplianceService {
  /**
   * GDPR Article 17: Right to erasure (right to be forgotten).
   */
  async deleteUserData(userId: string): Promise<void> {
    const encryptionService = new DatabaseEncryptionService(this.config);

    await this.prisma.$transaction(async (tx) => {
      // 1. Delete encrypted media
      const mediaKeys = await tx.encryptionKeys.findMany({
        where: { userId },
      });
      for (const key of mediaKeys) {
        // Delete from Cloudinary
        await this.cloudinaryService.deleteImage(`encrypted/${userId}/${key.id}`);
      }

      // 2. Anonymize user record (keep ID for referential integrity)
      await tx.user.update({
        where: { id: userId },
        data: {
          email: `deleted-${userId}@anonymized.local`,
          displayName: 'Deleted User',
          avatarUrl: null,
          encryptedEmail: null,
          deletedAt: new Date(),
        },
      });

      // 3. Delete or anonymize related data
      await tx.garment.deleteMany({ where: { userId } });
      await tx.outfit.deleteMany({ where: { userId } });
      await tx.calendarEvent.deleteMany({ where: { userId } });
      await tx.notification.deleteMany({ where: { userId } });
      await tx.avatar.deleteMany({ where: { userId } });
      await tx.encryptionKey.deleteMany({ where: { userId } });

      // 4. Log deletion for audit
      await tx.deletionLog.create({
        data: { userId, deletedAt: new Date(), reason: 'GDPR erasure request' },
      });
    });
  }

  /**
   * GDPR Article 15: Right to access.
   */
  async exportUserData(userId: string): Promise<Buffer> {
    const data = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        garments: true,
        outfits: { include: { garments: true } },
        calendarEvents: true,
        avatars: { include: { versions: true } },
      },
    });

    // Encrypt the export
    const json = JSON.stringify(data, null, 2);
    const encryptionService = new DatabaseEncryptionService(this.config);
    const { encrypted } = encryptionService.encrypt(json);

    return Buffer.from(encrypted);
  }

  /**
   * GDPR Article 32: Security of processing.
   */
  async getSecurityAuditLog(userId: string): Promise<AuditEntry[]> {
    return this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
  }
}

interface AuditEntry {
  id: string;
  userId: string;
  action: string;
  resource: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}
```

---

## 11. Encryption Summary

| Layer | Method | Key Length | Algorithm | Notes |
|-------|--------|------------|-----------|-------|
| Database (disk) | Supabase managed | AES-256 | Managed by cloud provider | Transparent, no app changes |
| Database (columns) | pgcrypto | AES-256 | AES-GCM | Sensitive fields only |
| Media files | Application-level | AES-256 | AES-256-GCM | Before upload to Cloudinary |
| Transit | TLS | 256-bit | TLS_AES_256_GCM_SHA384 | TLS 1.3 only |
| Signed URLs | HMAC | SHA-256 | HMAC-SHA256 | URL access control |
| Authentication | bcrypt | 72 chars | bcrypt | Password hashing |
| JWT | RS256 | 2048-bit | RSA with SHA-256 | Token signing |
