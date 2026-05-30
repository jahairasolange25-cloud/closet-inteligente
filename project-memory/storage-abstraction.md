# Storage Abstraction — Closet Inteligente Digital

> **Last Updated:** 2026-05-27
> **Status:** Design
> **Purpose:** Abstract storage operations behind a provider-agnostic interface.

---

## Provider Interface

```typescript
interface StorageProvider {
  name: string;

  upload(
    file: Buffer | ReadStream,
    options: UploadOptions,
  ): Promise<UploadResult>;

  download(
    path: string,
    options?: DownloadOptions,
  ): Promise<Buffer>;

  delete(
    path: string,
    options?: DeleteOptions,
  ): Promise<void>;

  getSignedUrl(
    path: string,
    options: SignedUrlOptions,
  ): Promise<string>;

  exists(
    path: string,
  ): Promise<boolean>;

  list(
    prefix: string,
    options?: ListOptions,
  ): Promise<StorageEntry[]>;
}

interface UploadOptions {
  folder?: string;
  resourceType?: 'image' | 'model' | 'document' | 'raw';
  publicAccess?: boolean;
  transformations?: ImageTransform[];
  metadata?: Record<string, string>;
}

interface UploadResult {
  url: string;
  publicId: string;
  provider: string;
  width?: number;
  height?: number;
  format?: string;
  size: number;
}

interface StorageEntry {
  path: string;
  url: string;
  size: number;
  lastModified: Date;
  mimeType: string;
}
```

---

## Provider Implementations

### CloudinaryProvider

```typescript
class CloudinaryProvider implements StorageProvider {
  name = 'cloudinary';

  async upload(file: Buffer, options: UploadOptions): Promise<UploadResult> {
    // Upload to Cloudinary with transformations
    // Returns optimized URL with CDN
  }

  async getSignedUrl(path: string, options: SignedUrlOptions): Promise<string> {
    // Generate signed Cloudinary URL with expiry
  }
}
```

### S3CompatibleProvider

```typescript
class S3CompatibleProvider implements StorageProvider {
  name = 's3';
  private s3: S3Client;

  constructor(endpoint?: string) {
    this.s3 = new S3Client({
      endpoint: endpoint || undefined, // MinIO custom endpoint
      region: process.env.S3_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
      },
      forcePathStyle: !!endpoint, // MinIO requires path-style
    });
  }

  async upload(file: Buffer, options: UploadOptions): Promise<UploadResult> {
    // Upload to S3-compatible storage
  }
}
```

---

## Provider Selection

```typescript
@Injectable()
class StorageOrchestrator {
  private providers: Map<string, StorageProvider> = new Map();
  private primary: StorageProvider;

  constructor() {
    const cloudinary = new CloudinaryProvider();
    const s3 = new S3CompatibleProvider(
      process.env.S3_ENDPOINT, // MinIO for dev, S3 for prod
    );

    this.providers.set('cloudinary', cloudinary);
    this.providers.set('s3', s3);

    this.primary = process.env.PRIMARY_STORAGE === 's3' ? s3 : cloudinary;
  }

  async upload(file: Buffer, options: UploadOptions): Promise<UploadResult> {
    try {
      return await this.primary.upload(file, options);
    } catch (error) {
      // Fallback to secondary provider
      const fallback = this.getFallback(this.primary.name);
      return await fallback.upload(file, options);
    }
  }

  async getSignedUrl(
    path: string,
    options: SignedUrlOptions,
  ): Promise<string> {
    // Try primary, fallback to secondary
    for (const provider of [this.primary, this.getFallback(this.primary.name)]) {
      try {
        if (await provider.exists(path)) {
          return await provider.getSignedUrl(path, options);
        }
      } catch {
        continue;
      }
    }
    throw new Error('Asset not found on any provider');
  }

  private getFallback(currentName: string): StorageProvider {
    for (const [name, provider] of this.providers) {
      if (name !== currentName) return provider;
    }
    return this.primary;
  }
}
```

---

## Resource Type Routing

| Resource Type | Primary Provider | Fallback | CDN |
|---|---|---|---|
| Garment images | Cloudinary | S3 | Cloudinary CDN |
| Thumbnails | Cloudinary | S3 | Cloudinary CDN |
| 3D models | S3 | Cloudinary | Cloudflare |
| Exports | S3 | — | Signed S3 URL |
| AI model weights | S3 | — | — |

---

## Image Transformation Pipeline

```typescript
interface ImageTransform {
  type: 'resize' | 'crop' | 'quality' | 'format' | 'effect';
  params: Record<string, any>;
}

const GARMENT_TRANSFORMS: ImageTransform[] = [
  { type: 'resize', params: { width: 2048, fit: 'inside' } },
  { type: 'quality', params: { value: 85 } },
  { type: 'format', params: { value: 'auto' } },
];

const THUMBNAIL_TRANSFORMS: ImageTransform[] = [
  { type: 'resize', params: { width: 300, height: 300, fit: 'cover' } },
  { type: 'quality', params: { value: 75 } },
  { type: 'format', params: { value: 'webp' } },
];
```

---

## Migration Path

1. **Current:** Direct Cloudinary integration in `StorageService`
2. **Phase 1:** Wrap with `StorageProvider` interface (backward compatible)
3. **Phase 2:** Add S3 provider for dev/staging
4. **Phase 3:** Make Cloudinary primary, S3 fallback
5. **Phase 4:** Add CDN layer with signed URLs
6. **Phase 5:** Multi-provider active-active for high availability
