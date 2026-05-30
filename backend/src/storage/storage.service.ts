import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { validateFileMagicBytes } from '../common/utils/file-magic';

const UPLOAD_MAX_RETRIES = 3;
const UPLOAD_RETRY_BASE_MS = 500;

export interface TempUploadResult {
  temp_url: string;
  file_hash: string;
}

export interface CloudinaryUploadResult {
  url: string;
  public_id: string;
  format: string;
  bytes: number;
  width: number;
  height: number;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/webp', 'application/pdf'] as const;
const MAX_FILE_SIZE = 50 * 1024 * 1024;

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly uploadDir: string;

  constructor() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });
    }

    this.uploadDir = join(process.cwd(), 'uploads', 'temp');
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadTemp(file: Express.Multer.File): Promise<TempUploadResult> {
    const fileId = randomUUID();
    const ext = this.getExtension(file.mimetype);
    const fileName = `${fileId}${ext}`;
    const filePath = join(this.uploadDir, fileName);

    writeFileSync(filePath, file.buffer);

    return {
      temp_url: `/uploads/temp/${fileName}`,
      file_hash: fileId,
    };
  }

  async upload(
    file: Express.Multer.File,
    folder?: string,
    transforms?: { width?: number; height?: number; crop?: string; format?: string; quality?: number },
  ): Promise<CloudinaryUploadResult> {
    if (!file) {
      throw new BadRequestException('FILE_REQUIRED');
    }

    if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.mimetype)) {
      throw new BadRequestException('INVALID_FILE_TYPE');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('FILE_TOO_LARGE');
    }

    try {
      validateFileMagicBytes(file, ALLOWED_MIME_TYPES);
    } catch (err: any) {
      throw new BadRequestException(err.message ?? 'INVALID_FILE_CONTENT');
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      throw new ServiceUnavailableException('STORAGE_NOT_CONFIGURED');
    }

    const sanitizedFolder = (folder ?? 'uploads').replace(/[^a-zA-Z0-9_-]/g, '_');

    const uploadOptions: any = {
      folder: sanitizedFolder,
      public_id: randomUUID(),
      resource_type: 'auto',
    };

    if (transforms) {
      if (transforms.width) uploadOptions.width = transforms.width;
      if (transforms.height) uploadOptions.height = transforms.height;
      if (transforms.crop) uploadOptions.crop = transforms.crop;
      if (transforms.format) uploadOptions.format = transforms.format;
      if (transforms.quality) uploadOptions.quality = transforms.quality;
    }

    return this.uploadWithRetry(file.buffer, uploadOptions);
  }

  private async uploadWithRetry(
    buffer: Buffer,
    options: Record<string, unknown>,
    attempt = 0,
  ): Promise<CloudinaryUploadResult> {
    try {
      return await new Promise<CloudinaryUploadResult>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(options as any, (error, result) => {
          if (error || !result) {
            reject(error ?? new Error('Empty Cloudinary response'));
            return;
          }
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
            bytes: result.bytes,
            width: result.width,
            height: result.height,
          });
        });
        uploadStream.end(buffer);
      });
    } catch (err: any) {
      if (attempt < UPLOAD_MAX_RETRIES) {
        const delay = UPLOAD_RETRY_BASE_MS * Math.pow(2, attempt);
        this.logger.warn(`[Storage] Upload attempt ${attempt + 1} failed, retrying in ${delay}ms: ${err.message}`);
        await new Promise((r) => setTimeout(r, delay));
        return this.uploadWithRetry(buffer, options, attempt + 1);
      }
      this.logger.error(`[Storage] Upload failed after ${UPLOAD_MAX_RETRIES + 1} attempts: ${err.message}`);
      throw new ServiceUnavailableException('CLOUDINARY_UPLOAD_FAILED');
    }
  }

  async delete(publicId: string): Promise<{ success: boolean; message: string }> {
    const sanitizedId = publicId.replace(/^uploads\//, '');

    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(sanitizedId, (error, result) => {
        if (error) {
          reject(new ServiceUnavailableException('CLOUDINARY_DELETE_FAILED'));
          return;
        }

        if (result.result === 'not found') {
          resolve({ success: false, message: 'File not found' });
          return;
        }

        resolve({ success: result.result === 'ok', message: 'File deleted' });
      });
    });
  }

  private readonly PRESET_TRANSFORMS: Record<string, object> = {
    thumbnail: { width: 200, height: 200, crop: 'fill', format: 'webp', quality: 80 },
    preview:   { width: 800, height: 800, crop: 'limit', format: 'webp', quality: 85 },
    full:      {},
  };

  async generateSignedUrl(
    publicId: string,
    expiresIn: number = 3600,
    preset?: string,
  ): Promise<{ url: string; expires_at: string; public_id: string }> {
    const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;

    const urlOptions: any = {
      sign_url: true,
      type: 'authenticated',
      expires_at: expiresAt,
    };

    if (preset && this.PRESET_TRANSFORMS[preset]) {
      const t = this.PRESET_TRANSFORMS[preset];
      if (Object.keys(t).length > 0) {
        urlOptions.transformation = t;
      }
    }

    const url = cloudinary.url(publicId, urlOptions);

    return {
      url,
      expires_at: new Date(expiresAt * 1000).toISOString(),
      public_id: publicId,
    };
  }

  private getExtension(mimeType: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/heic': '.heic',
      'image/webp': '.webp',
      'video/mp4': '.mp4',
      'video/quicktime': '.mov',
      'video/x-msvideo': '.avi',
    };
    return map[mimeType] || '.bin';
  }
}
