# Ready Player Me Avatar Integration

## Overview

Ready Player Me provides cross-platform avatar generation from body measurements and photos. This guide covers API integration, model handling, and frontend rendering for the Closet Inteligente Digital platform.

---

## 1. API Authentication & Configuration

### API Credentials Setup

```typescript
// lib/ready-player-me/config.ts
export const RPM_CONFIG = {
  appId: process.env.NEXT_PUBLIC_RPM_APP_ID!,
  apiKey: process.env.RPM_API_KEY!,
  baseUrl: 'https://api.readyplayer.me/v1',
  avatarsUrl: 'https://models.readyplayer.me/v1',
  webhookSecret: process.env.RPM_WEBHOOK_SECRET!,
} as const;

export interface AvatarConfig {
  gender: 'male' | 'female' | 'neutral';
  bodyType: 'fullbody' | 'halfbody';
  textureQuality: 'low' | 'medium' | 'high';
  meshLod: number; // 0-3, 0 = highest quality
  format: 'glb' | 'vrm' | 'fbx';
  compression: 'high' | 'medium' | 'low' | 'none';
}
```

### SDK Installation

```bash
npm install @readyplayerme/avatar-sdk
npm install three @react-three/fiber @react-three/drei
npm install @gltf-transform/core @gltf-transform/extensions
```

---

## 2. Avatar Creation from Body Measurements

### Backend Service (NestJS)

```typescript
// src/ready-player-me/ready-player-me.service.ts
import { Injectable, HttpService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface BodyMeasurements {
  height: number;
  shoulderWidth: number;
  chest: number;
  waist: number;
  hip: number;
  inseam: number;
  armLength: number;
  neck: number;
}

interface AvatarRequest {
  measurements: BodyMeasurements;
  skinTone?: string;
  outfitStyle?: 'casual' | 'formal' | 'sporty';
  gender?: 'male' | 'female' | 'neutral';
}

interface AvatarResponse {
  id: string;
  modelUrl: string;
  thumbnailUrl: string;
  status: 'processing' | 'completed' | 'failed';
}

@Injectable()
export class ReadyPlayerMeService {
  private readonly baseUrl = 'https://api.readyplayer.me/v1';
  private readonly apiKey: string;

  constructor(private config: ConfigService, private http: HttpService) {
    this.apiKey = config.getOrThrow('RPM_API_KEY');
  }

  async createAvatar(request: AvatarRequest): Promise<AvatarResponse> {
    const { data } = await this.http
      .post(
        `${this.baseUrl}/avatars`,
        {
          data: {
            type: 'full-body',
            bodyType: 'fullbody',
            gender: request.gender || 'neutral',
            measurements: this.mapMeasurements(request.measurements),
            skinTone: request.skinTone,
            outfit: request.outfitStyle || 'casual',
          },
          partner: this.config.get('RPM_APP_ID'),
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
        },
      )
      .toPromise();

    return {
      id: data.id,
      modelUrl: data.modelUrl,
      thumbnailUrl: data.thumbnailUrl,
      status: data.status,
    };
  }

  private mapMeasurements(m: BodyMeasurements) {
    return {
      heightCm: m.height,
      shoulderWidthCm: m.shoulderWidth,
      chestCircumferenceCm: m.chest,
      waistCircumferenceCm: m.waist,
      hipCircumferenceCm: m.hip,
      inseamCm: m.inseam,
      armLengthCm: m.armLength,
      neckCircumferenceCm: m.neck,
    };
  }

  async getAvatar(avatarId: string): Promise<AvatarResponse> {
    const { data } = await this.http
      .get(`${this.baseUrl}/avatars/${avatarId}`, {
        headers: { 'x-api-key': this.apiKey },
      })
      .toPromise();
    return data;
  }

  async deleteAvatar(avatarId: string): Promise<void> {
    await this.http
      .delete(`${this.baseUrl}/avatars/${avatarId}`, {
        headers: { 'x-api-key': this.apiKey },
      })
      .toPromise();
  }
}
```

### Avatar Creation from Photo (2D-to-3D)

```typescript
// src/ready-player-me/photo-avatar.service.ts
@Injectable()
export class PhotoAvatarService {
  constructor(private rpmService: ReadyPlayerMeService) {}

  async createFromPhoto(
    photoBuffer: Buffer,
    measurements: BodyMeasurements,
  ): Promise<AvatarResponse> {
    const formData = new FormData();
    formData.append('photo', photoBuffer, 'photo.jpg');
    formData.append('measurements', JSON.stringify(this.mapMeasurements(measurements)));

    const { data } = await this.http
      .post(`${this.baseUrl}/avatars/from-photo`, formData, {
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'multipart/form-data',
        },
      })
      .toPromise();

    return {
      id: data.id,
      modelUrl: data.modelUrl,
      thumbnailUrl: data.thumbnailUrl,
      status: 'processing',
    };
  }
}
```

---

## 3. Avatar Customization Parameters

### Available Customization Options

```typescript
// lib/ready-player-me/customization.ts
export interface AvatarCustomization {
  // Body
  bodyType: 'fullbody' | 'halfbody';
  gender: 'male' | 'female' | 'neutral';
  proportions: {
    height: number;     // 0.5 - 1.5 (relative)
    weight: number;     // 0.0 - 1.0
    muscle: number;     // 0.0 - 1.0
    breastSize: number; // 0.0 - 1.0
  };

  // Face
  faceShape: {
    jawWidth: number;       // 0.0 - 1.0
    cheekboneHeight: number; // 0.0 - 1.0
    chinShape: number;       // 0.0 - 1.0
    noseShape: number;       // 0.0 - 1.0
    eyeShape: number;        // 0.0 - 1.0
    eyebrowShape: number;    // 0.0 - 1.0
    lipShape: number;        // 0.0 - 1.0
  };

  // Skin
  skin: {
    color: string;           // hex color
    undertone: 'warm' | 'cool' | 'neutral';
    texture: 'smooth' | 'natural' | 'detailed';
    freckles: number;        // 0.0 - 1.0
    wrinkles: number;        // 0.0 - 1.0
  };

  // Hair
  hair: {
    style: string;           // style ID from RPM catalog
    color: string;           // hex color
    length: number;          // 0.0 - 1.0
    texture: 'straight' | 'wavy' | 'curly' | 'coily';
    density: number;         // 0.0 - 1.0
  };

  // Eyes
  eyes: {
    color: string;           // hex color
    shape: 'round' | 'almond' | 'hooded';
    size: number;            // 0.0 - 1.0
  };

  // Outfit
  outfit: {
    top: string;             // asset ID
    bottom: string;          // asset ID
    shoes: string;           // asset ID
    accessories: string[];   // asset IDs
    style: 'casual' | 'formal' | 'sporty' | 'traditional';
  };
}
```

### Apply Customization

```typescript
// app/api/avatar/customize/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { avatarId, customization } = await request.json();

  const response = await fetch(
    `https://api.readyplayer.me/v1/avatars/${avatarId}/customize`,
    {
      method: 'PATCH',
      headers: {
        'x-api-key': process.env.RPM_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: customization }),
    },
  );

  if (!response.ok) {
    return NextResponse.json(
      { error: 'Customization failed' },
      { status: response.status },
    );
  }

  const data = await response.json();
  return NextResponse.json({
    avatarId: data.id,
    modelUrl: data.modelUrl,
    thumbnailUrl: data.thumbnailUrl,
  });
}
```

---

## 4. GLB Model Format Handling

### Download and Optimize GLB

```typescript
// lib/ready-player-me/model-handler.ts
import { GLTF } from 'three-stdlib';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

export class AvatarModelHandler {
  private dracoLoader: DRACOLoader;

  constructor() {
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath(
      'https://www.gstatic.com/draco/versioned/decoders/1.5.6/',
    );
  }

  async loadModel(url: string): Promise<GLTF> {
    const loader = new GLTFLoader();
    loader.setDRACOLoader(this.dracoLoader);

    return new Promise((resolve, reject) => {
      loader.load(
        url,
        (gltf) => resolve(gltf),
        (progress) =>
          console.log(
            `Loading: ${(progress.loaded / progress.total) * 100}%`,
          ),
        (error) => reject(error),
      );
    });
  }

  async optimizeModel(gltf: GLTF, quality: 'high' | 'medium' | 'low') {
    const { Document, NodeIO, Logger } = await import(
      '@gltf-transform/core'
    );
    const { draco } = await import('@gltf-transform/extensions');

    const io = new NodeIO();
    const doc = new Document();

    // Convert GLTF to glTF-Transform document
    const buffer = await this.gltfToBuffer(gltf);
    const document = await io.readJSON(buffer);

    // Apply Draco compression
    const dracoExtension = document.createExtension(draco);
    dracoExtension.setCompressionLevel(
      quality === 'high' ? 5 : quality === 'medium' ? 10 : 15,
    );
    dracoExtension.setQuantizationBits(
      quality === 'high' ? 14 : quality === 'medium' ? 12 : 10,
    );

    return document;
  }

  private async gltfToBuffer(gltf: GLTF): Promise<ArrayBuffer> {
    const { Document } = await import('@gltf-transform/core');
    return new ArrayBuffer(0); // Implement conversion
  }

  getModelSize(url: string): Promise<number> {
    return fetch(url, { method: 'HEAD' }).then(
      (r) => Number(r.headers.get('content-length')) || 0,
    );
  }
}
```

---

## 5. Model Optimization for Web

### Compression Pipeline

```typescript
// lib/ready-player-me/optimization.ts
export class AvatarOptimizer {
  /**
   * Optimizes GLB model for web delivery.
   * - Reduces vertex count via decimation
   * - Applies Draco mesh compression
   * - Generates LOD levels
   * - Converts textures to WebP/KTX2
   */

  private readonly TARGET_SIZES = {
    high: { maxVertices: 50000, textureSize: 2048 },
    medium: { maxVertices: 25000, textureSize: 1024 },
    low: { maxVertices: 10000, textureSize: 512 },
  };

  async optimizeForWeb(
    modelUrl: string,
    quality: keyof typeof this.TARGET_SIZES = 'medium',
  ): Promise<{ url: string; lodUrls: string[] }> {
    const target = this.TARGET_SIZES[quality];

    // Step 1: Download and decompress
    const response = await fetch(modelUrl);
    const buffer = await response.arrayBuffer();

    // Step 2: Apply optimization via glTF-Transform pipeline
    const optimized = await this.applyOptimization(buffer, target);

    // Step 3: Generate LODs
    const lods = await this.generateLODs(optimized, target);

    // Step 4: Upload optimized model to CDN
    const url = await this.uploadToCloudinary(optimized, quality);

    return { url, lodUrls: lods };
  }

  private async applyOptimization(
    buffer: ArrayBuffer,
    target: { maxVertices: number; textureSize: number },
  ): Promise<ArrayBuffer> {
    // Implementation would use @gltf-transform/cli or custom pipeline
    // For production, delegate to a worker thread or microservice
    return buffer;
  }

  private async generateLODs(
    buffer: ArrayBuffer,
    target: { maxVertices: number; textureSize: number },
  ): Promise<string[]> {
    // Generate LOD 1 (50% vertices), LOD 2 (25% vertices), LOD 3 (10% vertices)
    const lodLevels = [
      { reduction: 0.5 },
      { reduction: 0.25 },
      { reduction: 0.1 },
    ];

    const lodUrls = [];
    for (const level of lodLevels) {
      const lodBuffer = await this.decimate(buffer, level.reduction);
      const url = await this.uploadToCloudinary(lodBuffer, 'low');
      lodUrls.push(url);
    }

    return lodUrls;
  }

  private async decimate(
    buffer: ArrayBuffer,
    ratio: number,
  ): Promise<ArrayBuffer> {
    // Use Three.js SimplifyModifier or meshoptimizer
    // This should run in a Web Worker to avoid blocking UI
    return buffer;
  }

  private async uploadToCloudinary(
    buffer: ArrayBuffer,
    quality: string,
  ): Promise<string> {
    const formData = new FormData();
    formData.append('file', new Blob([buffer]), `avatar_${quality}.glb`);

    const response = await fetch('/api/upload/avatar-model', {
      method: 'POST',
      body: formData,
    });

    const { url } = await response.json();
    return url;
  }

  async estimateDownloadSize(
    modelUrl: string,
  ): Promise<{ original: number; optimized: number }> {
    const original = await fetch(modelUrl).then((r) =>
      Number(r.headers.get('content-length')),
    );

    // Typical Draco compression ratios: 5:1 to 10:1
    const optimized = Math.round(original * 0.2);

    return { original, optimized };
  }
}
```

---

## 6. React Three Fiber Integration

### Avatar Loading Component

```typescript
// components/avatar/AvatarViewer.tsx
'use client';

import { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import * as THREE from 'three';

interface AvatarViewerProps {
  modelUrl: string;
  quality?: 'high' | 'medium' | 'low';
  showControls?: boolean;
  autoRotate?: boolean;
  backgroundColor?: string;
}

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath(
  'https://www.gstatic.com/draco/versioned/decoders/1.5.6/',
);

function AvatarModel({ url, quality }: { url: string; quality: string }) {
  const ref = useRef<THREE.Group>(null);
  const [error, setError] = useState(false);

  const gltf = useLoader(GLTFLoader, url, (loader) => {
    loader.setDRACOLoader(dracoLoader);
  });

  // Optimize materials on load
  useFrame(() => {
    if (ref.current) {
      ref.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.frustumCulled = true;
          if (quality === 'low') {
            child.material = new THREE.MeshBasicMaterial({
              map: child.material.map,
            });
          }
        }
      });
    }
  });

  if (error) return <FallbackAvatar />;

  return <primitive ref={ref} object={gltf.scene} scale={1} />;
}

function LoadingSpinner() {
  return (
    <mesh>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshStandardMaterial color="#8888ff" wireframe />
    </mesh>
  );
}

function FallbackAvatar() {
  return (
    <group>
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#e0e0e0" />
      </mesh>
      <mesh position={[0, 0.8, 0]}>
        <capsuleGeometry args={[0.3, 1.0, 8, 16]} />
        <meshStandardMaterial color="#d0d0d0" />
      </mesh>
    </group>
  );
}

export function AvatarViewer({
  modelUrl,
  quality = 'medium',
  showControls = true,
  autoRotate = true,
  backgroundColor = '#f5f5f5',
}: AvatarViewerProps) {
  const [loading, setLoading] = useState(true);

  return (
    <div className="w-full h-full min-h-[400px] rounded-xl overflow-hidden">
      <Canvas
        camera={{ position: [0, 1.2, 2.5], fov: 40 }}
        style={{ background: backgroundColor }}
      >
        <Suspense fallback={<LoadingSpinner />}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} />
          <directionalLight position={[-5, 5, 5]} intensity={0.3} />
          <Environment preset="studio" />
          <ContactShadows
            position={[0, -1, 0]}
            opacity={0.4}
            scale={5}
            blur={2}
          />

          <AvatarModel url={modelUrl} quality={quality} />

          {showControls && (
            <OrbitControls
              enablePan={false}
              enableZoom={true}
              minDistance={1.5}
              maxDistance={4}
              autoRotate={autoRotate}
              autoRotateSpeed={2}
            />
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}
```

### LOD-Based Avatar (Performance)

```typescript
// components/avatar/LodAvatarViewer.tsx
import { useState, useEffect } from 'react';

interface LodLevel {
  maxDistance: number;
  url: string;
}

export function LodAvatarViewer({
  lodUrls,
}: {
  lodUrls: string[];
}) {
  const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('high');

  useEffect(() => {
    // Detect device capability
    const gpuTier = detectGPUCapability();

    if (gpuTier === 'low') {
      setQuality('low');
    } else if (gpuTier === 'medium') {
      setQuality('medium');
    }

    // Add resize observer for viewport-based LOD
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        if (width < 300) setQuality('low');
        else if (width < 600) setQuality('medium');
        else setQuality('high');
      }
    });

    observer.observe(document.getElementById('avatar-container')!);
    return () => observer.disconnect();
  }, []);

  const qualityIndex = { high: 0, medium: 1, low: 2 }[quality];
  const modelUrl = lodUrls[qualityIndex] || lodUrls[0];

  return <AvatarViewer modelUrl={modelUrl} quality={quality} />;
}

function detectGPUCapability(): 'high' | 'medium' | 'low' {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2');

  if (!gl) return 'low';

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = debugInfo
    ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
    : '';

  const isMobile = /Mobile|iPhone|iPad|Android/i.test(navigator.userAgent);
  const isLowEnd = /Intel HD Graphics|Intel UHD|Mali-4|Adreno 5/i.test(renderer);

  if (isMobile || isLowEnd) return 'low';

  const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  if (maxTextureSize < 4096) return 'medium';

  return 'high';
}
```

---

## 7. Avatar Version Management

```typescript
// src/avatars/avatar-version.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface AvatarVersion {
  id: string;
  avatarId: string;
  modelUrl: string;
  thumbnailUrl: string;
  version: number;
  changes: string;
  createdAt: Date;
}

@Injectable()
export class AvatarVersionService {
  constructor(private prisma: PrismaService) {}

  async createVersion(
    userId: string,
    modelUrl: string,
    thumbnailUrl: string,
    changes: string,
  ): Promise<AvatarVersion> {
    const currentAvatar = await this.prisma.avatar.findUnique({
      where: { userId },
    });

    const newVersion = await this.prisma.avatarVersion.create({
      data: {
        avatarId: currentAvatar.id,
        modelUrl,
        thumbnailUrl,
        version: (currentAvatar.currentVersion || 0) + 1,
        changes,
      },
    });

    await this.prisma.avatar.update({
      where: { userId },
      data: { currentVersion: newVersion.version },
    });

    return newVersion;
  }

  async getVersionHistory(avatarId: string): Promise<AvatarVersion[]> {
    return this.prisma.avatarVersion.findMany({
      where: { avatarId },
      orderBy: { version: 'desc' },
      take: 20,
    });
  }

  async rollbackToVersion(
    userId: string,
    targetVersion: number,
  ): Promise<void> {
    const version = await this.prisma.avatarVersion.findFirst({
      where: {
        avatar: { userId },
        version: targetVersion,
      },
    });

    if (!version) throw new Error('Version not found');

    // Update current avatar model URL to point to this version
    await this.prisma.avatar.update({
      where: { userId },
      data: {
        modelUrl: version.modelUrl,
        thumbnailUrl: version.thumbnailUrl,
        currentVersion: version.version,
      },
    });
  }

  async autoSave(
    userId: string,
    customization: Record<string, unknown>,
  ): Promise<void> {
    // Debounced auto-save (called after each customization change)
    await this.prisma.avatarAutoSave.upsert({
      where: { userId },
      update: { customization, updatedAt: new Date() },
      create: { userId, customization },
    });
  }

  async restoreAutoSave(userId: string): Promise<Record<string, unknown> | null> {
    const autoSave = await this.prisma.avatarAutoSave.findUnique({
      where: { userId },
    });
    return autoSave?.customization || null;
  }
}
```

---

## 8. Error Handling

```typescript
// lib/ready-player-me/errors.ts
export class AvatarGenerationError extends Error {
  constructor(
    message: string,
    public code: AvatarErrorCode,
    public retryable: boolean = false,
  ) {
    super(message);
    this.name = 'AvatarGenerationError';
  }
}

export type AvatarErrorCode =
  | 'INVALID_MEASUREMENTS'
  | 'PHOTO_QUALITY_TOO_LOW'
  | 'API_RATE_LIMITED'
  | 'QUOTA_EXCEEDED'
  | 'MODEL_GENERATION_FAILED'
  | 'TIMEOUT'
  | 'INVALID_RESPONSE'
  | 'AUTH_FAILED';

export const ERROR_MESSAGES: Record<AvatarErrorCode, string> = {
  INVALID_MEASUREMENTS:
    'Body measurements are outside supported ranges. Please retry.',
  PHOTO_QUALITY_TOO_LOW:
    'Uploaded photo quality is insufficient. Use a well-lit, front-facing photo.',
  API_RATE_LIMITED: 'Too many requests. Please wait a moment and try again.',
  QUOTA_EXCEEDED: 'Monthly avatar generation quota reached.',
  MODEL_GENERATION_FAILED:
    'Avatar generation failed. Please try again.',
  TIMEOUT: 'Generation timed out. Your avatar is taking longer than expected.',
  INVALID_RESPONSE:
    'Received an unexpected response from the avatar service.',
  AUTH_FAILED: 'Authentication with avatar service failed.',
};
```

### Error Handling in React

```typescript
// hooks/useAvatarGeneration.ts
import { useState, useCallback } from 'react';
import { AvatarGenerationError, AvatarErrorCode } from '@/lib/ready-player-me/errors';

interface UseAvatarGenerationOptions {
  onSuccess?: (avatarId: string, modelUrl: string) => void;
  onError?: (error: AvatarGenerationError) => void;
  retryCount?: number;
}

export function useAvatarGeneration(options: UseAvatarGenerationOptions = {}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<AvatarGenerationError | null>(null);

  const generate = useCallback(
    async (measurements: BodyMeasurements, photo?: File) => {
      setIsGenerating(true);
      setProgress(0);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('measurements', JSON.stringify(measurements));
        if (photo) formData.append('photo', photo);

        // Poll for avatar generation status
        const response = await fetch('/api/avatar/generate', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new AvatarGenerationError(
            ERROR_MESSAGES[errorData.code as AvatarErrorCode],
            errorData.code,
            errorData.retryable,
          );
        }

        const { avatarId, modelUrl } = await response.json();

        // Poll for completion
        await this.pollForCompletion(avatarId, (p) => setProgress(p));

        options.onSuccess?.(avatarId, modelUrl);
        return { avatarId, modelUrl };
      } catch (err) {
        const avatarError =
          err instanceof AvatarGenerationError
            ? err
            : new AvatarGenerationError('Unexpected error', 'MODEL_GENERATION_FAILED', true);

        setError(avatarError);
        options.onError?.(avatarError);
        throw avatarError;
      } finally {
        setIsGenerating(false);
      }
    },
    [options],
  );

  const retry = useCallback(() => {
    if (error?.retryable) {
      setError(null);
    }
  }, [error]);

  const reset = useCallback(() => {
    setError(null);
    setProgress(0);
    setIsGenerating(false);
  }, []);

  return { generate, isGenerating, progress, error, retry, reset };
}

async function pollForCompletion(
  avatarId: string,
  onProgress: (p: number) => void,
  maxAttempts = 60,
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`/api/avatar/status/${avatarId}`);
    const data = await response.json();

    onProgress(data.progress || (i / maxAttempts) * 100);

    if (data.status === 'completed') return;
    if (data.status === 'failed') {
      throw new AvatarGenerationError(
        ERROR_MESSAGES.MODEL_GENERATION_FAILED,
        'MODEL_GENERATION_FAILED',
        true,
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new AvatarGenerationError(ERROR_MESSAGES.TIMEOUT, 'TIMEOUT', true);
}
```

---

## 9. Rate Limiting & Quota Management

```typescript
// src/ready-player-me/rate-limiter.service.ts
import { Injectable } from '@nestjs/common';

interface QuotaInfo {
  used: number;
  limit: number;
  resetAt: Date;
}

@Injectable()
export class RateLimiterService {
  private readonly RATE_LIMIT = 10; // requests per minute
  private readonly MONTHLY_QUOTA = 1000; // avatars per month
  private requestLog: Map<string, number[]> = new Map();

  async checkRateLimit(userId: string): Promise<boolean> {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute

    const userRequests = this.requestLog.get(userId) || [];
    const recentRequests = userRequests.filter((t) => now - t < windowMs);

    if (recentRequests.length >= this.RATE_LIMIT) {
      return false;
    }

    recentRequests.push(now);
    this.requestLog.set(userId, recentRequests);
    return true;
  }

  async checkMonthlyQuota(userId: string): Promise<QuotaInfo> {
    // Query DB for avatar count this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const count = await this.prisma.avatar.count({
      where: {
        userId,
        createdAt: { gte: startOfMonth },
      },
    });

    return {
      used: count,
      limit: this.MONTHLY_QUOTA,
      resetAt: new Date(
        startOfMonth.getFullYear(),
        startOfMonth.getMonth() + 1,
        1,
      ),
    };
  }

  async getQuotaInfo(userId: string): Promise<QuotaInfo> {
    return this.checkMonthlyQuota(userId);
  }
}
```

### API Route with Rate Limiting

```typescript
// app/api/avatar/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id');

  // Check rate limit
  const rateLimitResponse = await fetch(
    `${process.env.BACKEND_URL}/api/rate-limit/check`,
    {
      headers: { 'x-user-id': userId! },
    },
  );
  const { allowed, quota } = await rateLimitResponse.json();

  if (!allowed) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        retryAfter: 60,
        code: 'API_RATE_LIMITED',
      },
      { status: 429 },
    );
  }

  if (quota.used >= quota.limit) {
    return NextResponse.json(
      {
        error: 'Monthly quota exceeded',
        resetAt: quota.resetAt,
        code: 'QUOTA_EXCEEDED',
      },
      { status: 403 },
    );
  }

  // Proceed with generation...
  return NextResponse.json({ avatarId: '...', modelUrl: '...' });
}
```

---

## 10. Webhook Configuration for Async Generation

### Webhook Handler (NestJS)

```typescript
// src/ready-player-me/webhook.controller.ts
import { Controller, Post, Body, Headers, HttpCode } from '@nestjs/common';
import * as crypto from 'crypto';

interface RPMWebhookPayload {
  type: 'avatar.created' | 'avatar.updated' | 'avatar.deleted' | 'avatar.failed';
  data: {
    id: string;
    modelUrl?: string;
    thumbnailUrl?: string;
    status: 'processing' | 'completed' | 'failed';
    error?: string;
  };
  timestamp: string;
}

@Controller('webhooks/ready-player-me')
export class RPMWebhookController {
  constructor(
    private readonly avatarService: AvatarService,
    private readonly config: ConfigService,
  ) {}

  @Post()
  @HttpCode(200)
  async handleWebhook(
    @Body() payload: RPMWebhookPayload,
    @Headers('x-rpm-signature') signature: string,
  ) {
    // Verify webhook signature
    this.verifySignature(payload, signature);

    switch (payload.type) {
      case 'avatar.created':
        await this.avatarService.markAsCompleted(
          payload.data.id,
          payload.data.modelUrl!,
          payload.data.thumbnailUrl!,
        );
        break;

      case 'avatar.failed':
        await this.avatarService.markAsFailed(
          payload.data.id,
          payload.data.error || 'Unknown error',
        );
        break;

      case 'avatar.updated':
        await this.avatarService.updateModelUrls(
          payload.data.id,
          payload.data.modelUrl!,
          payload.data.thumbnailUrl!,
        );
        break;
    }

    return { received: true };
  }

  private verifySignature(
    payload: RPMWebhookPayload,
    signature: string,
  ): void {
    const secret = this.config.get('RPM_WEBHOOK_SECRET');
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (signature !== expectedSig) {
      throw new Error('Invalid webhook signature');
    }
  }
}
```

### Webhook Registration

```bash
# Register webhook with RPM API
curl -X POST https://api.readyplayer.me/v1/webhooks \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-domain.com/api/webhooks/ready-player-me",
    "events": ["avatar.created", "avatar.updated", "avatar.failed"],
    "secret": "YOUR_WEBHOOK_SECRET"
  }'
```

### Polling Fallback (When Webhooks Fail)

```typescript
// src/ready-player-me/polling-fallback.ts
@Injectable()
export class AvatarPollingFallback {
  private readonly MAX_POLL_ATTEMPTS = 30;
  private readonly POLL_INTERVAL = 5000; // 5 seconds

  async pollForCompletion(
    avatarId: string,
    onUpdate: (status: string, progress: number) => void,
  ): Promise<{ modelUrl: string; thumbnailUrl: string }> {
    for (let attempt = 0; attempt < this.MAX_POLL_ATTEMPTS; attempt++) {
      const response = await fetch(
        `${this.rpmService['baseUrl']}/avatars/${avatarId}`,
        {
          headers: { 'x-api-key': this.rpmService['apiKey'] },
        },
      );

      const data = await response.json();

      onUpdate(data.status, (attempt / this.MAX_POLL_ATTEMPTS) * 100);

      if (data.status === 'completed') {
        return {
          modelUrl: data.modelUrl,
          thumbnailUrl: data.thumbnailUrl,
        };
      }

      if (data.status === 'failed') {
        throw new AvatarGenerationError(
          data.error || ERROR_MESSAGES.MODEL_GENERATION_FAILED,
          'MODEL_GENERATION_FAILED',
          true,
        );
      }

      await new Promise((resolve) => setTimeout(resolve, this.POLL_INTERVAL));
    }

    throw new AvatarGenerationError(ERROR_MESSAGES.TIMEOUT, 'TIMEOUT', true);
  }
}
```

---

## 11. Full Avatar Generation Flow

```typescript
// app/api/avatar/generate/route.ts (Full implementation)
import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

export async function POST(request: NextRequest) {
  const body = await request.formData();
  const measurements = JSON.parse(body.get('measurements') as string);
  const photo = body.get('photo') as File | null;
  const userId = request.headers.get('x-user-id')!;

  // 1. Validate measurements
  if (!validateMeasurements(measurements)) {
    return NextResponse.json(
      { error: 'Invalid measurements', code: 'INVALID_MEASUREMENTS' },
      { status: 400 },
    );
  }

  // 2. Check rate limit and quota
  const [rateLimitOk, quotaInfo] = await Promise.all([
    checkRateLimit(userId),
    getQuotaInfo(userId),
  ]);

  if (!rateLimitOk) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', code: 'API_RATE_LIMITED', retryAfter: 60 },
      { status: 429 },
    );
  }

  if (quotaInfo.used >= quotaInfo.limit) {
    return NextResponse.json(
      {
        error: 'Monthly quota exceeded',
        code: 'QUOTA_EXCEEDED',
        resetAt: quotaInfo.resetAt,
      },
      { status: 403 },
    );
  }

  try {
    // 3. Create avatar via RPM API
    let avatarResponse;

    if (photo) {
      avatarResponse = await createAvatarFromPhoto(photo, measurements);
    } else {
      avatarResponse = await createAvatarFromMeasurements(measurements);
    }

    // 4. Return immediate response (async generation)
    return NextResponse.json({
      avatarId: avatarResponse.id,
      status: 'processing',
      estimatedTime: '30-60 seconds',
    });
  } catch (error) {
    console.error('Avatar generation failed:', error);

    // Classify error
    const statusCode = error instanceof AvatarGenerationError ? 500 : 502;
    return NextResponse.json(
      {
        error: 'Generation failed',
        code: 'MODEL_GENERATION_FAILED',
        retryable: true,
      },
      { status: statusCode },
    );
  }
}

function validateMeasurements(m: BodyMeasurements): boolean {
  const ranges = {
    height: [100, 250],
    shoulderWidth: [25, 65],
    chest: [60, 150],
    waist: [45, 130],
    hip: [60, 150],
    inseam: [55, 110],
    armLength: [40, 85],
    neck: [25, 55],
  };

  return Object.entries(ranges).every(([key, [min, max]]) => {
    const val = m[key as keyof BodyMeasurements];
    return val >= min && val <= max;
  });
}
```

---

## 12. Performance Targets

| Metric | Target | Threshold |
|--------|--------|-----------|
| Model load time (initial) | < 3s | 5s |
| Model load time (cached) | < 1s | 2s |
| Texture quality | 1024x1024 | 512x512 |
| Polygon count | < 30k | 50k |
| File size (compressed) | < 3MB | 5MB |
| Animation blend time | < 200ms | 500ms |
| Avatar generation time | < 60s | 120s |
| LOD transitions | < 100ms | 300ms |
