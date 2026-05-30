# Cloudinary Image Optimization

## Overview

Cloudinary serves as the primary image management and optimization layer for garment images, user uploads, and avatar thumbnails. This guide covers upload configuration, transformation pipelines, and CDN delivery optimization.

---

## 1. Upload API Configuration

### Backend Setup (NestJS)

```typescript
// src/cloudinary/cloudinary.config.ts
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

export const configureCloudinary = (config: ConfigService) => {
  cloudinary.config({
    cloud_name: config.get('CLOUDINARY_CLOUD_NAME'),
    api_key: config.get('CLOUDINARY_API_KEY'),
    api_secret: config.get('CLOUDINARY_API_SECRET'),
    secure: true,
  });
};
```

```typescript
// src/cloudinary/cloudinary.module.ts
import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';

@Module({
  providers: [CloudinaryService],
  exports: [CloudinaryService],
})
export class CloudinaryModule {}
```

### Upload Service

```typescript
// src/cloudinary/cloudinary.service.ts
import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse, UploadApiOptions } from 'cloudinary';
import { Readable } from 'stream';

export type AssetType = 'garment' | 'avatar' | 'outfit' | 'user_photo' | 'temp';

@Injectable()
export class CloudinaryService {
  private readonly folderMap: Record<AssetType, string> = {
    garment: 'closet/garments',
    avatar: 'closet/avatars',
    outfit: 'closet/outfits',
    user_photo: 'closet/users',
    temp: 'closet/temp',
  };

  async uploadImage(
    file: Buffer | Express.Multer.File,
    assetType: AssetType,
    options?: Partial<UploadApiOptions>,
  ): Promise<UploadApiResponse> {
    const folder = this.folderMap[assetType];

    const uploadOptions: UploadApiOptions = {
      folder,
      resource_type: 'image',
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      ...options,
    };

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );

      if (file instanceof Buffer) {
        const bufferStream = new Readable();
        bufferStream.push(file);
        bufferStream.push(null);
        bufferStream.pipe(uploadStream);
      } else {
        const bufferStream = new Readable();
        bufferStream.push(file.buffer);
        bufferStream.push(null);
        bufferStream.pipe(uploadStream);
      }
    });
  }

  async uploadImageFromUrl(
    url: string,
    assetType: AssetType,
    options?: Partial<UploadApiOptions>,
  ): Promise<UploadApiResponse> {
    const folder = this.folderMap[assetType];
    return cloudinary.uploader.upload(url, {
      folder,
      ...options,
    });
  }

  async deleteImage(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }

  async deleteImages(publicIds: string[]): Promise<void> {
    await cloudinary.api.delete_resources(publicIds);
  }
}
```

### Signed Upload Endpoint

```typescript
// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const assetType = formData.get('assetType') as string;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
  }

  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const result = await cloudinaryService.uploadImage(buffer, assetType as AssetType, {
      eager: [
        { width: 300, height: 300, crop: 'fill', quality: 'auto' },
        { width: 600, height: 600, crop: 'fill', quality: 'auto' },
        { width: 1200, height: 1200, crop: 'limit', quality: 'auto' },
      ],
      eager_async: true,
    });

    return NextResponse.json({
      publicId: result.public_id,
      url: result.secure_url,
      thumbnailUrl: cloudinary.url(result.public_id, {
        width: 150,
        height: 150,
        crop: 'fill',
        quality: 'auto',
      }),
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
```

---

## 2. Image Transformation Parameters

### Garment Image Transformations

```typescript
// lib/cloudinary/transformations.ts
import { v2 as cloudinary } from 'cloudinary';

export class ImageTransformer {
  /**
   * Generate responsive image URLs for garment display.
   * Adaptive to device pixel ratio and viewport size.
   */
  getGarmentUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      quality?: 'auto' | 'best' | 'good' | 'eco' | 'low';
      format?: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';
      crop?: 'fill' | 'limit' | 'pad' | 'scale';
      dpr?: 'auto' | number;
    } = {},
  ): string {
    return cloudinary.url(publicId, {
      transformation: [
        // Background removal first
        { effect: 'background_removal' },
        // Auto format and quality
        {
          quality: options.quality || 'auto',
          fetch_format: options.format || 'auto',
          dpr: options.dpr || 'auto',
        },
        // Resize
        {
          width: options.width || 800,
          height: options.height || 800,
          crop: options.crop || 'fill',
          gravity: 'auto',
        },
        // Sharpen for product images
        { effect: 'sharpen:100' },
      ],
      secure: true,
    });
  }

  /**
   * Thumbnail with face/garment detection gravity.
   */
  getThumbnailUrl(publicId: string, size: number = 150): string {
    return cloudinary.url(publicId, {
      width: size,
      height: size,
      crop: 'thumb',
      gravity: 'auto',
      quality: 'auto',
      fetch_format: 'auto',
      secure: true,
    });
  }

  /**
   * Zoomable high-res URL with progressive loading.
   */
  getZoomUrl(publicId: string): string {
    return cloudinary.url(publicId, {
      width: 2000,
      height: 2000,
      crop: 'limit',
      quality: 'auto',
      fetch_format: 'auto',
      flags: 'progressive',
      secure: true,
    });
  }

  /**
   * Background-removed isolated garment for catalog.
   */
  getIsolatedUrl(publicId: string, background: string = '#FFFFFF'): string {
    return cloudinary.url(publicId, {
      transformation: [
        { effect: 'background_removal' },
        { background: background },
        { width: 800, height: 800, crop: 'pad' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
      secure: true,
    });
  }

  /**
   * Outfit collage URL (multiple garments composited).
   */
  getOutfitCollageUrl(
    garmentPublicIds: string[],
    layout: 'grid' | 'row' | 'stack' = 'grid',
  ): string {
    // Uses Cloudinary's layered image composition
    const layers = garmentPublicIds.map((id, i) => ({
      public_id: id,
      transformation: [
        { effect: 'background_removal' },
        { width: 400, height: 400, crop: 'fill' },
      ],
    }));

    return cloudinary.url('outfit_collage_' + Date.now(), {
      transformation: layers.map((layer) => ({
        overlay: layer.public_id,
        ...layer.transformation[0],
        ...layer.transformation[1],
      })),
      quality: 'auto',
      secure: true,
    });
  }
}

export const imageTransformer = new ImageTransformer();
```

---

## 3. Thumbnail Generation Configuration

```typescript
// lib/cloudinary/thumbnails.ts
export const THUMBNAIL_PRESETS = {
  // Garment listing thumbnails
  garment_small: { w: 150, h: 150, crop: 'thumb', quality: 'auto' },
  garment_medium: { w: 300, h: 300, crop: 'fill', quality: 'auto' },
  garment_large: { w: 600, h: 600, crop: 'fill', quality: 'auto' },

  // Avatar thumbnails
  avatar_small: { w: 64, h: 64, crop: 'thumb', gravity: 'face', quality: 'auto' },
  avatar_medium: { w: 150, h: 150, crop: 'thumb', gravity: 'face', quality: 'auto' },
  avatar_large: { w: 300, h: 300, crop: 'thumb', gravity: 'face', quality: 'auto' },

  // Outfit thumbnails
  outfit_small: { w: 200, h: 150, crop: 'fill', quality: 'auto' },
  outfit_medium: { w: 400, h: 300, crop: 'fill', quality: 'auto' },

  // Calendar event thumbnails
  event_small: { w: 100, h: 100, crop: 'thumb', quality: 'auto' },
} as const;

export type ThumbnailPreset = keyof typeof THUMBNAIL_PRESETS;

export const getThumbnailUrl = (
  publicId: string,
  preset: ThumbnailPreset,
): string => {
  const config = THUMBNAIL_PRESETS[preset];
  return cloudinary.url(publicId, {
    ...config,
    fetch_format: 'auto',
    secure: true,
  });
};
```

---

## 4. Responsive Image Delivery

### srcset Generation

```typescript
// components/cloudinary/ResponsiveImage.tsx
'use client';

import Image from 'next/image';
import { v2 as cloudinary } from 'cloudinary';
import { useState } from 'react';

interface ResponsiveImageProps {
  publicId: string;
  alt: string;
  widths?: number[];
  sizes?: string;
  priority?: boolean;
  className?: string;
  useBackgroundRemoval?: boolean;
}

export function ResponsiveImage({
  publicId,
  alt,
  widths = [320, 480, 640, 768, 1024, 1280, 1536],
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  priority = false,
  className,
  useBackgroundRemoval = false,
}: ResponsiveImageProps) {
  const [loaded, setLoaded] = useState(false);

  /**
   * Builds the Cloudinary URL for a given width.
   * Uses auto format, auto quality, and optional background removal.
   */
  const getUrl = (width: number): string => {
    const transformations: any[] = [];

    if (useBackgroundRemoval) {
      transformations.push({ effect: 'background_removal' });
    }

    transformations.push(
      { quality: 'auto', fetch_format: 'auto' },
      { width, crop: 'limit' },
    );

    return cloudinary.url(publicId, {
      transformation: transformations,
      secure: true,
    });
  };

  const srcset = widths.map((w) => `${getUrl(w)} ${w}w`).join(', ');
  const defaultSrc = getUrl(widths[Math.floor(widths.length / 2)]);

  return (
    <Image
      src={defaultSrc}
      alt={alt}
      fill
      sizes={sizes}
      srcSet={srcset}
      priority={priority}
      className={`transition-opacity duration-300 ${
        loaded ? 'opacity-100' : 'opacity-0'
      } ${className || ''}`}
      onLoad={() => setLoaded(true)}
      loading={priority ? 'eager' : 'lazy'}
    />
  );
}
```

### Next.js <Image> with Cloudinary Loader

```typescript
// lib/cloudinary/loader.ts
import { ImageLoaderProps } from 'next/image';

export const cloudinaryLoader = ({
  src,
  width,
  quality,
}: ImageLoaderProps): string => {
  const params = [
    'f_auto',
    'q_' + (quality || 'auto'),
    'w_' + width,
    'c_limit',
  ];

  // If src is a Cloudinary public ID, construct URL directly
  if (!src.startsWith('http')) {
    return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${params.join(',')}/v1/${src}`;
  }

  return src;
};
```

```tsx
// next.config.js
module.exports = {
  images: {
    loader: 'custom',
    loaderFile: './lib/cloudinary/loader.ts',
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [320, 480, 640, 768, 1024, 1280, 1536],
    imageSizes: [64, 100, 150, 200, 300],
  },
};
```

---

## 5. Image Format Optimization

```typescript
// lib/cloudinary/format-optimization.ts
export type OutputFormat = 'auto' | 'webp' | 'avif' | 'jpeg' | 'png' | 'gif';

interface FormatStrategy {
  formats: OutputFormat[];
  quality: number | 'auto';
  flags?: string;
}

export const FORMAT_STRATEGIES: Record<string, FormatStrategy> = {
  // Photorealistic garment images
  garment: {
    formats: ['avif', 'webp', 'jpeg'],
    quality: 'auto',
  },
  // Illustrations, patterns, graphics
  graphic: {
    formats: ['avif', 'webp', 'png'],
    quality: 'auto',
  },
  // Thumbnails (speed priority)
  thumbnail: {
    formats: ['webp', 'jpeg'],
    quality: 60,
  },
  // High-quality zoom images
  zoom: {
    formats: ['avif', 'webp', 'jpeg'],
    quality: 90,
    flags: 'progressive',
  },
};

export const getFormatOptimizedUrl = (
  publicId: string,
  strategy: keyof typeof FORMAT_STRATEGIES,
  width: number,
): string => {
  const config = FORMAT_STRATEGIES[strategy];
  return cloudinary.url(publicId, {
    transformation: [
      { quality: config.quality, fetch_format: 'auto' },
      { width, crop: 'limit' },
      ...(config.flags ? [{ flags: config.flags }] : []),
    ],
    secure: true,
  });
};
```

### Browser-Specific Delivery via User-Agent Detection

```typescript
// middleware/cloudinary-format.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const accept = request.headers.get('accept') || '';

  // Safari < 16.4 doesn't support AVIF well
  const isSafari = /^((?!chrome|android).)*safari/i.test(
    request.headers.get('user-agent') || '',
  );

  const ua = request.headers.get('user-agent')?.toLowerCase() || '';
  const prefersAvif = accept.includes('image/avif') && !isSafari;

  // Set cookie for format preference
  const response = NextResponse.next();
  response.cookies.set('prefer-avif', prefersAvif ? '1' : '0', {
    maxAge: 86400,
  });

  return response;
}
```

---

## 6. Quality Optimization (Auto-q, Auto-format)

```typescript
// lib/cloudinary/quality.ts
export class QualityOptimizer {
  /**
   * Auto-quality: Cloudinary analyzes the image and selects optimal
   * quality level based on content complexity.
   *
   * - 'auto:best': Visually lossless (large files)
   * - 'auto:good': Good visual quality (balanced)
   * - 'auto:eco': Lower quality, smaller files (thumbnails)
   * - 'auto:low': Smallest file size (preview)
   */
  static readonly QUALITY_LEVELS = {
    best: 'auto:best',
    good: 'auto:good',
    eco: 'auto:eco',
    low: 'auto:low',
  } as const;

  /**
   * Returns a Cloudinary URL with auto quality and auto format.
   * Deliveries are ~30-60% smaller than originals.
   */
  static optimize(
    publicId: string,
    quality: keyof typeof this.QUALITY_LEVELS = 'good',
    width?: number,
  ): string {
    return cloudinary.url(publicId, {
      quality: this.QUALITY_LEVELS[quality],
      fetch_format: 'auto',
      width: width || undefined,
      crop: width ? 'limit' : undefined,
      secure: true,
    });
  }

  /**
   * Estimate bandwidth savings from optimization.
   */
  static async estimateSavings(
    publicId: string,
  ): Promise<{ original: number; optimized: number; savingsPercent: number }> {
    // Get original resource info
    const resource = await cloudinary.api.resource(publicId, {
      image_metadata: true,
    });

    // Get optimized URL variant
    const optimizedUrl = this.optimize(publicId, 'good');
    const optimizedResponse = await fetch(optimizedUrl);
    const optimizedSize = Number(
      optimizedResponse.headers.get('content-length') || 0,
    );

    const originalSize = resource.bytes;
    const savings = Math.round(
      ((originalSize - optimizedSize) / originalSize) * 100,
    );

    return {
      original: originalSize,
      optimized: optimizedSize,
      savingsPercent: savings,
    };
  }
}
```

---

## 7. AI-Powered Image Processing

### Background Removal via Cloudinary AI

```typescript
// lib/cloudinary/ai-background.ts
export class AiBackgroundRemover {
  /**
   * Remove background from garment image using Cloudinary's AI.
   * Uses `e_background_removal` effect.
   */
  static removeBackground(
    publicId: string,
    options: {
      color?: string;       // Replace with solid color
      blurRadius?: number;  // Replace with blur
      imageOverlay?: string; // Replace with image
      outputFormat?: 'png' | 'webp' | 'jpeg';
    } = {},
  ): string {
    const transformations: any[] = [
      { effect: 'background_removal' },
    ];

    if (options.color) {
      transformations.push({ background: options.color });
    } else if (options.blurRadius) {
      transformations.push({ effect: `background_removal:blur_${options.blurRadius}` });
    }

    if (options.outputFormat) {
      transformations.push({ fetch_format: options.outputFormat });
    }

    transformations.push({ quality: 'auto' });

    return cloudinary.url(publicId, {
      transformation: transformations,
      secure: true,
    });
  }

  /**
   * Replace background for outfit visualization.
   * e.g., put garment on a transparent background for catalog.
   */
  static makeTransparent(publicId: string): string {
    return this.removeBackground(publicId, { outputFormat: 'png' });
  }

  /**
   * Batch background removal (generate on upload via eager transform).
   */
  static async uploadWithBgRemoval(
    file: Buffer,
    assetType: AssetType,
  ): Promise<UploadApiResponse> {
    return cloudinaryService.uploadImage(file, assetType, {
      eager: [{ effect: 'background_removal', quality: 'auto' }],
      eager_async: true,
    });
  }
}
```

### Color Extraction via Cloudinary AI

```typescript
// lib/cloudinary/color-extraction.ts
export class ColorExtractor {
  /**
   * Extract dominant colors from an image using Cloudinary's AI.
   * Returns hex codes with percentage distribution.
   */
  static async extractColors(
    publicId: string,
    count: number = 6,
  ): Promise<{ hex: string; percentage: number; rgb: [number, number, number] }[]> {
    const url = cloudinary.url(publicId, {
      transformation: [
        { quality: 'auto' },
        { effect: `color_extract:${count}` },
      ],
      secure: true,
    });

    // Cloudinary returns color data as part of the image response headers
    const response = await fetch(url);
    const colors = response.headers.get('x-dominant-colors');

    if (!colors) {
      // Fallback: use Cloudinary API image analysis
      const resource = await cloudinary.api.resource(publicId, {
        colors: true,
      });

      return resource.colors.map(([hex, percentage]: [string, number]) => ({
        hex,
        percentage,
        rgb: this.hexToRgb(hex),
      }));
    }

    return JSON.parse(colors).map((c: any) => ({
      hex: c.color,
      percentage: c.percentage,
      rgb: this.hexToRgb(c.color),
    }));
  }

  /**
   * Extract color palette with names (fashion-specific).
   */
  static async extractFashionColors(
    publicId: string,
  ): Promise<{
    dominant: { hex: string; name: string };
    palette: { hex: string; name: string; percentage: number }[];
    isNeutral: boolean;
    seasonality: string[];
  }> {
    const colors = await this.extractColors(publicId, 6);
    const dominant = colors[0];

    return {
      dominant: {
        hex: dominant.hex,
        name: this.getColorName(dominant.rgb),
      },
      palette: colors.map((c) => ({
        hex: c.hex,
        name: this.getColorName(c.rgb),
        percentage: c.percentage,
      })),
      isNeutral: this.isNeutralColor(dominant.rgb),
      seasonality: this.getSeasonality(dominant.rgb),
    };
  }

  private static hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : [0, 0, 0];
  }

  private static getColorName(rgb: [number, number, number]): string {
    // Simplified color name mapping
    const [r, g, b] = rgb;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    if (delta < 10) {
      if (max < 50) return 'black';
      if (max < 150) return 'gray';
      return 'white';
    }

    if (max === r) return 'red';
    if (max === g) return 'green';
    if (max === b) return 'blue';

    return 'unknown';
  }

  private static isNeutralColor(rgb: [number, number, number]): boolean {
    const [r, g, b] = rgb;
    return Math.abs(r - g) < 30 && Math.abs(g - b) < 30 && Math.abs(r - b) < 30;
  }

  private static getSeasonality(rgb: [number, number, number]): string[] {
    const [r, g, b] = rgb;
    const seasons: string[] = [];

    if (r > 200 && g > 100 && b < 100) seasons.push('autumn');
    if (r > 150 && g > 150 && b > 200) seasons.push('winter');
    if (r < 150 && g > 180 && b < 150) seasons.push('spring');
    if (r > 200 && g > 200 && b < 150) seasons.push('summer');

    return seasons.length ? seasons : ['all-season'];
  }
}
```

---

## 8. Signed URL Generation for Private Images

```typescript
// lib/cloudinary/signed-urls.ts
import { v2 as cloudinary } from 'cloudinary';

export class SignedUrlGenerator {
  /**
   * Generate a signed URL with expiration for private garment images.
   * Only authorized users should access these URLs.
   */
  static generateSignedUrl(
    publicId: string,
    options: {
      expiresInSeconds?: number;   // Default: 3600 (1 hour)
      transformation?: any;
      attachment?: boolean;        // Force download
    } = {},
  ): string {
    const { expiresInSeconds = 3600, transformation, attachment } = options;

    const timestamp = Math.floor(Date.now() / 1000) + expiresInSeconds;

    const url = cloudinary.utils.private_download_url(
      publicId,
      'auto',
      {
        sign_url: true,
        expires_at: timestamp,
        attachment: attachment ? undefined : undefined,
        ...(transformation ? { transformation } : {}),
      },
    );

    return url;
  }

  /**
   * Generate authenticated URL (requires signed-in Cloudinary users).
   * These use Cloudinary's access control - only signed requests work.
   */
  static generateAuthenticatedUrl(publicId: string): string {
    return cloudinary.url(publicId, {
      type: 'authenticated',
      sign_url: true,
      secure: true,
    });
  }

  /**
   * Generate a signed upload preset for client-side uploads.
   */
  static async generateUploadSignature(): Promise<{
    signature: string;
    timestamp: number;
    cloudName: string;
    apiKey: string;
  }> {
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'closet/temp';

    const paramsToSign = {
      timestamp,
      folder,
      transformation: 'w_800,h_800,c_limit,q_auto,f_auto',
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET!,
    );

    return {
      signature,
      timestamp,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
      apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!,
    };
  }
}
```

### Client-Side Widget with Signed Upload

```typescript
// components/cloudinary/UploadWidget.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    cloudinary: any;
  }
}

interface UploadWidgetProps {
  assetType: AssetType;
  onUpload: (result: { publicId: string; url: string }) => void;
  onError?: (error: string) => void;
  children?: React.ReactNode;
}

export function UploadWidget({
  assetType,
  onUpload,
  onError,
  children,
}: UploadWidgetProps) {
  const widgetRef = useRef<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Load Cloudinary widget script
    const script = document.createElement('script');
    script.src = 'https://widget.cloudinary.com/v2.0/global/all.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      widgetRef.current = window.cloudinary.createUploadWidget(
        {
          cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
          apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
          uploadSignature: async (callback: any) => {
            const response = await fetch('/api/upload/signature');
            const data = await response.json();
            callback(data);
          },
          cropping: true,
          croppingAspectRatio: 1,
          showAdvancedOptions: false,
          folder: `closet/${assetType}`,
          sources: ['local', 'camera', 'url'],
          resourceType: 'image',
          clientAllowedFormats: ['jpeg', 'png', 'webp'],
          maxFileSize: 10485760, // 10MB
        },
        (error: any, result: any) => {
          if (error) {
            onError?.(error.message);
            return;
          }
          if (result.event === 'success') {
            onUpload({
              publicId: result.info.public_id,
              url: result.info.secure_url,
            });
          }
        },
      );
    };

    return () => {
      document.body.removeChild(script);
    };
  }, [assetType]);

  const openWidget = () => {
    widgetRef.current?.open();
    setIsOpen(true);
  };

  return (
    <div onClick={openWidget} className="cursor-pointer">
      {children || (
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          Upload Image
        </button>
      )}
    </div>
  );
}
```

---

## 9. Delivery Optimization via CDN

```typescript
// lib/cloudinary/delivery-optimization.ts
export class DeliveryOptimizer {
  /**
   * Configure CDN delivery with optimal settings.
   * Cloudinary uses Fastly globally.
   */

  /**
   * Preconnect hint for faster DNS resolution.
   */
  static getPreconnectLinks(): string[] {
    return [
      `https://res.cloudinary.com`,
      `https://${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}.res.cloudinary.com`,
    ];
  }

  /**
   * Generate an optimized URL with all delivery enhancements.
   */
  static getOptimizedDeliveryUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      quality?: string;
      format?: string;
      cdnTtl?: number;      // CDN cache TTL in seconds
      progressive?: boolean;
    } = {},
  ): string {
    const transformations: any[] = [
      // Format and quality optimization
      {
        fetch_format: options.format || 'auto',
        quality: options.quality || 'auto',
      },
    ];

    // Progressive JPEG for faster perceived loading
    if (options.progressive !== false) {
      transformations.push({ flags: 'progressive' });
    }

    // Resize if dimensions provided
    if (options.width) {
      transformations.push({
        width: options.width,
        ...(options.height ? { height: options.height } : {}),
        crop: 'limit',
      });
    }

    return cloudinary.url(publicId, {
      transformation: transformations,
      secure: true,
      // CDN cache control
      ...(options.cdnTtl ? { resource_type: 'image', type: 'upload' } : {}),
    });
  }

  /**
   * Preload critical images with link headers.
   */
  static getPreloadHeaders(imageUrls: string[]): Record<string, string>[] {
    return imageUrls.map((url) => ({
      'Link': `<${url}>; rel=preload; as=image`,
    }));
  }

  /**
   * Dynamic URL switching based on connection speed.
   */
  static getAdaptiveUrl(
    publicId: string,
    connectionType: '4g' | '3g' | '2g' | 'slow-2g',
  ): string {
    const qualityMap = {
      '4g': 'auto:best',
      '3g': 'auto:good',
      '2g': 'auto:eco',
      'slow-2g': 'auto:low',
    };

    const widthMap = {
      '4g': 1200,
      '3g': 800,
      '2g': 400,
      'slow-2g': 200,
    };

    return cloudinary.url(publicId, {
      quality: qualityMap[connectionType],
      width: widthMap[connectionType],
      crop: 'limit',
      fetch_format: 'auto',
      secure: true,
    });
  }
}
```

---

## 10. Backup to Google Drive Strategy

```typescript
// src/cloudinary/backup.service.ts
import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryBackupService {
  private drive: any;

  constructor() {
    this.drive = google.drive({
      version: 'v3',
      auth: new google.auth.JWT(
        process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        undefined,
        process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        ['https://www.googleapis.com/auth/drive.file'],
      ),
    });
  }

  async backupToDrive(
    publicId: string,
    folderId: string = process.env.GOOGLE_DRIVE_BACKUP_FOLDER_ID!,
  ): Promise<{ fileId: string; webViewLink: string }> {
    // Download from Cloudinary
    const url = cloudinary.url(publicId, {
      quality: 'auto',
      fetch_format: 'auto',
      secure: true,
    });

    const response = await fetch(url);
    const buffer = Buffer.from(await response.arrayBuffer());

    // Upload to Google Drive
    const fileMetadata = {
      name: `${publicId.replace(/\//g, '_')}.jpg`,
      parents: [folderId],
      description: `Backup from Cloudinary. Original public ID: ${publicId}`,
    };

    const media = {
      mimeType: 'image/jpeg',
      body: Readable.from(buffer),
    };

    const driveResponse = await this.drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id, webViewLink',
    });

    return {
      fileId: driveResponse.data.id,
      webViewLink: driveResponse.data.webViewLink,
    };
  }

  async batchBackup(publicIds: string[]): Promise<{
    succeeded: string[];
    failed: { publicId: string; error: string }[];
  }> {
    const succeeded: string[] = [];
    const failed: { publicId: string; error: string }[] = [];

    for (const publicId of publicIds) {
      try {
        await this.backupToDrive(publicId);
        succeeded.push(publicId);
      } catch (error) {
        failed.push({ publicId, error: error.message });
      }
    }

    return { succeeded, failed };
  }

  async restoreFromDrive(driveFileId: string): Promise<UploadApiResponse> {
    const response = await this.drive.files.get(
      { fileId: driveFileId, alt: 'media' },
      { responseType: 'stream' },
    );

    const chunks: Buffer[] = [];
    for await (const chunk of response.data) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    return cloudinaryService.uploadImage(buffer, 'garment');
  }
}
```

---

## 11. Upload Pipeline Summary

```
User Upload (client)
    ↓
Cloudinary Upload Widget / API
    ↓
Pre-signed upload with signature verification
    ↓
Cloudinary receives image
    ↓
Eager transformations queued:
  - Background removal (AI)
  - Color extraction
  - Thumbnails (150x150, 300x300, 600x600)
  - Auto format (AVIF/WebP/JPEG)
  - Auto quality
    ↓
Delivery via Fastly CDN (global edge cache)
    ↓
Response with:
  - public_id
  - secure_url
  - eager[0].secure_url (thumbnail)
  - width, height, format, bytes
    ↓
Database record created (garments table)
    ↓
Async: Backup to Google Drive
```

---

## 12. Performance Targets

| Metric | Target |
|--------|--------|
| Upload time (1MB image) | < 2s |
| Thumbnail generation | < 3s (async) |
| CDN first-byte time | < 100ms |
| Cache hit ratio | > 90% |
| Image format savings vs original | 40-70% smaller |
| Background removal accuracy | > 95% |
| Color extraction accuracy | > 90% |
| Signed URL generation | < 10ms |
