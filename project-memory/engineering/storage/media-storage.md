# Media Storage

## Overview

Cloudinary (primary) + Google Drive (backup) storage architecture for all user-generated media.

---

## Cloudinary Configuration

### Cloudinary Account Setup

| Parameter | Value |
|-----------|-------|
| Cloud Name | `closet-inteligente` |
| API Key | (environment variable) |
| API Secret | (environment variable) |
| Upload Presets | 1 per environment |
| Environment | `production` / `staging` / `development` |
| Region | `us-east-1` (auto) |
| Storage type | `upload` (default) |

### Upload Presets

```json
// Production preset: closet_prod
{
  "name": "closet_prod",
  "unsigned": false,
  "folder": "closet/production",
  "allowed_formats": ["jpg", "png", "webp", "mp4", "glb", "gltf"],
  "max_file_size": 200000000,
  "transformation": "q_auto,f_auto",
  "tags": ["production"]
}

// Staging preset: closet_staging
{
  "name": "closet_staging",
  "unsigned": false,
  "folder": "closet/staging",
  "allowed_formats": ["jpg", "png", "webp", "mp4", "glb", "gltf"],
  "max_file_size": 200000000,
  "transformation": "q_auto,f_auto",
  "tags": ["staging"]
}

// Development preset: closet_dev
{
  "name": "closet_dev",
  "unsigned": true,
  "folder": "closet/development",
  "allowed_formats": ["jpg", "png", "webp", "mp4", "glb", "gltf"],
  "max_file_size": 200000000,
  "transformation": "q_auto,f_auto",
  "tags": ["development"]
}
```

### NestJS Cloudinary Provider

```typescript
// src/storage/providers/cloudinary.provider.ts
import { v2 as cloudinary } from 'cloudinary';

export const CloudinaryProvider = {
  provide: 'CLOUDINARY',
  useFactory: (config: ConfigService) => {
    cloudinary.config({
      cloud_name: config.get('CLOUDINARY_CLOUD_NAME'),
      api_key: config.get('CLOUDINARY_API_KEY'),
      api_secret: config.get('CLOUDINARY_API_SECRET'),
      secure: true,
    });
    return cloudinary;
  },
  inject: [ConfigService],
};
```

---

## Google Drive Integration

### Service Account

```typescript
// src/storage/providers/google-drive.provider.ts
import { google } from 'googleapis';

export const GoogleDriveProvider = {
  provide: 'GOOGLE_DRIVE',
  useFactory: (config: ConfigService) => {
    const credentials = JSON.parse(
      config.get('GOOGLE_DRIVE_CREDENTIALS')
    );
    const auth = new google.auth.JWT(
      credentials.client_email,
      null,
      credentials.private_key,
      ['https://www.googleapis.com/auth/drive.file']
    );
    return google.drive({ version: 'v3', auth });
  },
  inject: [ConfigService],
};
```

### Backup to Google Drive

```typescript
async function backupToDrive(fileId: string): Promise<void> {
  const file = await prisma.storageFile.findUnique({ where: { id: fileId } });
  if (!file) throw new NotFoundException('File not found');

  // Download from Cloudinary
  const response = await axios.get(file.publicUrl, { responseType: 'stream' });

  // Upload to Google Drive
  const driveFile = await googleDrive.files.create({
    requestBody: {
      name: `${file.id}_${file.fileName}`,
      parents: [BACKUP_FOLDER_ID],
      description: `Backup of ${file.fileName} - User ${file.userId}`,
    },
    media: {
      mimeType: file.mimeType,
      body: response.data,
    },
    fields: 'id, name, size, createdTime',
  });

  // Store Drive reference
  await prisma.storageFile.update({
    where: { id: fileId },
    data: {
      storageKey: `drive:${driveFile.data.id}`,
    },
  });
}
```

---

## Storage Bucket Structure

```
closet/
├── production/
│   ├── users/
│   │   └── {userId}/
│   │       ├── garments/
│   │       │   ├── {garmentId}/
│   │       │   │   ├── original.jpg
│   │       │   │   ├── compressed.webp
│   │       │   │   └── thumbnails/
│   │       │   │       ├── xs.webp      # 64x64
│   │       │   │       ├── sm.webp      # 150x150
│   │       │   │       └── md.webp      # 300x300
│   │       │   └── ...
│   │       ├── avatars/
│   │       │   └── {avatarId}/
│   │       │       ├── {version}/
│   │       │       │   ├── model.glb
│   │       │       │   └── thumbnail.webp
│   │       │       └── ...
│   │       ├── outfits/
│   │       │   └── {outfitId}/
│   │       │       └── preview.webp
│   │       └── videos/
│   │           └── {avatarId}/
│   │               └── body-scan.mp4
│   └── exports/
│       └── {exportId}/
│           ├── data.json.gz
│           └── data.csv.gz
├── staging/
│   └── ... (same structure)
└── development/
    └── ... (same structure)
```

---

## Image Optimization Pipeline (Sharp)

```typescript
// src/storage/providers/image-optimizer.ts
import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs/promises';

interface OptimizationOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  format: 'jpeg' | 'png' | 'webp';
  fit: 'cover' | 'contain' | 'inside' | 'outside';
}

async function optimizeImage(
  inputPath: string,
  outputPath: string,
  options: OptimizationOptions
): Promise<OptimizationResult> {
  const pipeline = sharp(inputPath)
    .rotate() // Auto-orient based on EXIF
    .resize({
      width: options.maxWidth,
      height: options.maxHeight,
      fit: options.fit || 'inside',
      withoutEnlargement: true,
    });

  switch (options.format) {
    case 'jpeg':
      pipeline.jpeg({
        quality: options.quality,
        mozjpeg: true,
        chromaSubsampling: '4:4:4',
        trellisQuantisation: true,
        overshootDeringing: true,
        optimiseScans: true,
      });
      break;
    case 'png':
      pipeline.png({
        quality: options.quality,
        palette: true,
        compressionLevel: 9,
        adaptiveFiltering: true,
      });
      break;
    case 'webp':
      pipeline.webp({
        quality: options.quality,
        alphaQuality: 80,
        nearLossless: false,
        smartSubsample: true,
        effort: 6,
      });
      break;
  }

  await pipeline.toFile(outputPath);

  const original = await sharp(inputPath).metadata();
  const optimized = await sharp(outputPath).metadata();

  return {
    originalSize: original.size || 0,
    optimizedSize: optimized.size || 0,
    compressionRatio: original.size ? original.size / optimized.size : 0,
    originalDimensions: {
      width: original.width || 0,
      height: original.height || 0,
    },
    optimizedDimensions: {
      width: optimized.width || 0,
      height: optimized.height || 0,
    },
    format: options.format,
  };
}
```

### Optimization Profiles

| Use Case | Max Width | Max Height | Quality | Format | Fit |
|----------|-----------|------------|---------|--------|-----|
| Garment compressed | 2048 | 2048 | 85% | WebP | inside |
| Garment thumbnail XS | 64 | 64 | 75% | WebP | cover |
| Garment thumbnail SM | 150 | 150 | 80% | WebP | cover |
| Garment thumbnail MD | 300 | 300 | 80% | WebP | cover |
| Outfit preview | 1024 | 1024 | 85% | WebP | inside |
| Avatar thumbnail | 300 | 400 | 85% | WebP | cover |
| User avatar | 200 | 200 | 80% | WebP | cover |

---

## Signed URL Generation

```typescript
async function generateSignedUrl(
  publicId: string,
  expiresIn: number = 3600
): Promise<string> {
  // Cloudinary signed URL with expiration
  const timestamp = Math.floor(Date.now() / 1000) + expiresIn;

  const signature = cloudinary.utils.api_sign_request(
    {
      public_id: publicId,
      timestamp,
      type: 'authenticated',
    },
    process.env.CLOUDINARY_API_SECRET!
  );

  const signedUrl = cloudinary.utils.private_download_url(
    publicId,
    'auto',
    {
      sign_url: true,
      expires_at: timestamp,
      attachment: false,
    }
  );

  return signedUrl;
}

async function generateUploadSignature(folder: string): Promise<UploadSignature> {
  const timestamp = Math.floor(Date.now() / 1000);
  const params = {
    timestamp,
    folder,
    transformation: 'q_auto:good,f_auto',
    type: 'authenticated',
  };

  const signature = cloudinary.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    timestamp,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    folder,
  };
}
```

---

## Encryption (AES-256)

```typescript
// src/storage/providers/encryption.service.ts
import * as crypto from 'crypto';

export class EncryptionService {
  private algorithm = 'aes-256-cbc';
  private key: Buffer;

  constructor(config: ConfigService) {
    // 32-byte key derived from environment secret
    this.key = crypto.scryptSync(
      config.get('STORAGE_ENCRYPTION_KEY'),
      'closet-salt',
      32
    );
  }

  encrypt(buffer: Buffer): { encrypted: Buffer; iv: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    const encrypted = Buffer.concat([
      cipher.update(buffer),
      cipher.final(),
    ]);

    return {
      encrypted,
      iv: iv.toString('hex'),
    };
  }

  decrypt(encrypted: Buffer, ivHex: string): Buffer {
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);

    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
  }
}
```

**Files encrypted at rest:**
- User body videos (avatar generation)
- Export files (GDPR data)
- Backup copies in Google Drive

---

## Private Bucket Configuration

```typescript
// Cloudinary authenticated files
const UPLOAD_OPTIONS = {
  // Default: public
  garment_images: {
    type: 'upload',
    access_mode: 'public',
    folder: 'garments',
  },
  // Private: requires signed URL
  body_videos: {
    type: 'authenticated',
    access_mode: 'private',
    folder: 'videos',
  },
  export_files: {
    type: 'authenticated',
    access_mode: 'private',
    folder: 'exports',
    expiration: 604800, // 7 days
  },
};
```

---

## Backup Strategy

### Automated Backup Schedule

| Backup Type | Frequency | Retention | Target | Size Estimate |
|-------------|-----------|-----------|--------|--------------|
| Database | Daily | 30 days | Google Drive | ~2 GB |
| Media files | Weekly | 90 days | Google Drive | ~50 GB |
| Full system | Monthly | 1 year | Google Drive | ~200 GB |

### Backup Script (cron job)

```typescript
// src/infrastructure/cron/storage-backup.cron.ts
@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
async function dailyBackup(): Promise<void> {
  // 1. Database backup via pg_dump
  const dbDump = await exec('pg_dump', [
    '--format=custom',
    '--compress=9',
    `--file=/tmp/backups/db_${date}.dump`,
    process.env.DATABASE_URL,
  ]);

  // 2. Upload to Google Drive
  await uploadToDrive(`/tmp/backups/db_${date}.dump`, {
    folderId: BACKUP_DB_FOLDER_ID,
    name: `database_${date}.dump`,
  });

  // 3. Clean local files
  await fs.unlink(`/tmp/backups/db_${date}.dump`);

  // 4. Clean old backups (> 30 days)
  await cleanOldBackups(BACKUP_DB_FOLDER_ID, 30);
}
```

---

## Retention Policies

| Resource Type | Active Retention | Deleted Retention | Permanent Deletion |
|---------------|-----------------|-------------------|-------------------|
| Garment images | Indefinite (while active) | 30 days | After 30 days soft-delete |
| Avatar models | Indefinite (while active) | 30 days | After 30 days soft-delete |
| Avatar videos | Until generation complete | 7 days | After successful generation |
| Outfit previews | Indefinite | 30 days | After 30 days soft-delete |
| Export files | 7 days | — | After 7 days |
| Audit logs | 1 year | — | After 1 year |
| Analytics events | 90 days | — | After 90 days |
| User data (GDPR delete) | — | — | 30 days after request |

---

## Cleanup Policies

### Scheduled Cleanup (cron)

```typescript
// Run daily at 3 AM
@Cron('0 3 * * *')
async function cleanupExpiredFiles(): Promise<void> {
  // Delete old export files
  const expiredExports = await prisma.export.findMany({
    where: {
      status: 'completed',
      expiresAt: { lt: new Date() },
    },
  });

  for (const exportJob of expiredExports) {
    if (exportJob.fileUrl) {
      await storageService.deleteFile(exportJob.fileUrl, true);
    }
    await prisma.export.delete({ where: { id: exportJob.id } });
  }

  // Delete old body videos after generation
  const oldVideos = await prisma.storageFile.findMany({
    where: {
      resourceType: 'video',
      createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
  });

  for (const video of oldVideos) {
    await storageService.deleteFile(video.id, video.userId, true);
  }
}
```

---

## File Size Limits

| Resource Type | Max File Size | Warning at | Rejection |
|---------------|--------------|------------|-----------|
| Garment image | 15 MB | 10 MB | > 15 MB |
| Avatar video | 200 MB | 150 MB | > 200 MB |
| 3D model | 50 MB | 30 MB | > 50 MB |
| Export (JSON) | 100 MB | — | > 100 MB |
| Export (CSV) | 100 MB | — | > 100 MB |
| User avatar photo | 5 MB | 3 MB | > 5 MB |

---

## Supported Formats

### Images

| Format | Extension | MIME Type | Support |
|--------|-----------|-----------|---------|
| JPEG | `.jpg`, `.jpeg` | `image/jpeg` | Full |
| PNG | `.png` | `image/png` | Full |  
| WebP | `.webp` | `image/webp` | Full (preferred) |
| AVIF | `.avif` | `image/avif` | Read-only |
| GIF | `.gif` | `image/gif` | Read-only |
| SVG | `.svg` | `image/svg+xml` | Not supported |

### Videos

| Format | Extension | MIME Type | Codec | Support |
|--------|-----------|-----------|-------|---------|
| MP4 | `.mp4` | `video/mp4` | H.264 | Full |
| WebM | `.webm` | `video/webm` | VP9 | Read-only |
| MOV | `.mov` | `video/quicktime` | Various | Not supported |

### 3D Models

| Format | Extension | MIME Type | Support |
|--------|-----------|-----------|---------|
| GLTF | `.gltf` | `model/gltf+json` | Full |
| GLB | `.glb` | `model/gltf-binary` | Full (preferred) |
| OBJ | `.obj` | `text/plain` | Not supported |
| FBX | `.fbx` | `application/octet-stream` | Not supported |

### Documents

| Format | Extension | MIME Type | Support |
|--------|-----------|-----------|---------|
| JSON | `.json` | `application/json` | Full (exports) |
| CSV | `.csv` | `text/csv` | Full (exports) |
| GZip | `.gz` | `application/gzip` | Full (compressed exports) |

---

## File Validation

```typescript
// src/storage/validators/file.validator.ts
import { BadRequestException } from '@nestjs/common';

const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/webp'],
  video: ['video/mp4'],
  model: ['model/gltf+json', 'model/gltf-binary'],
  document: ['application/json', 'text/csv', 'application/gzip'],
};

const MAX_FILE_SIZES: Record<string, number> = {
  image: 15 * 1024 * 1024,  // 15 MB
  video: 200 * 1024 * 1024, // 200 MB
  model: 50 * 1024 * 1024,  // 50 MB
  document: 100 * 1024 * 1024, // 100 MB
};

export function validateFile(
  file: Express.Multer.File,
  resourceType: 'image' | 'video' | 'model' | 'document'
): void {
  const allowedMimes = ALLOWED_MIME_TYPES[resourceType];
  const maxSize = MAX_FILE_SIZES[resourceType];

  if (!allowedMimes.includes(file.mimetype)) {
    throw new BadRequestException(
      `Formato ${file.mimetype} no soportado. Formatos: ${allowedMimes.join(', ')}`
    );
  }

  if (file.size > maxSize) {
    throw new BadRequestException(
      `Archivo demasiado grande. Máximo: ${maxSize / 1024 / 1024}MB`
    );
  }

  // Additional checks for images
  if (resourceType === 'image') {
    const sharp = require('sharp');
    sharp(file.buffer)
      .metadata()
      .then((metadata) => {
        if (metadata.width < 300 || metadata.height < 300) {
          throw new BadRequestException(
            `Resolución mínima: 300x300px. Actual: ${metadata.width}x${metadata.height}`
          );
        }
      });
  }
}
```

---

## Checksum Verification

```typescript
async function verifyFileIntegrity(fileId: string): Promise<boolean> {
  const fileRecord = await prisma.storageFile.findUnique({
    where: { id: fileId },
  });

  if (!fileRecord?.checksumSha256) return true; // Legacy files

  // Download and re-hash
  const response = await axios.get(fileRecord.publicUrl, {
    responseType: 'arraybuffer',
  });

  const hash = crypto.createHash('sha256').update(response.data).digest('hex');

  if (hash !== fileRecord.checksumSha256) {
    await prisma.storageFile.update({
      where: { id: fileId },
      data: { isDeleted: true, deletedAt: new Date() },
    });
    return false;
  }

  return true;
}
```
