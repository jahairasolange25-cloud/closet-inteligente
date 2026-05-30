# Avatar Fitting Pipeline

> **Last Updated:** 2026-05-27
> **Status:** Architectural Foundation — No cloth physics simulation yet.

---

## Overview

The avatar fitting pipeline positions and renders 3D garments on a humanoid avatar.
It does NOT simulate cloth physics — it positions pre-built garment meshes at
attachment points on the avatar skeleton with correct layer ordering.

---

## Architecture

```
Garment Image → AI Segmentation → Mesh Generation → Skeleton Attachment → Layer Sorting → Render

                    ┌──────────────────────────────────────────────────┐
                    │  Avatar Scene (React Three Fiber)                │
                    │                                                  │
                    │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
                    │  │ Avatar   │  │ Garment  │  │ Garment      │  │
                    │  │ Skeleton │→│ Layer 1  │→│ Layer 2      │  │
                    │  │ (GLTF)   │  │ (Shirt)  │  │ (Jacket)     │  │
                    │  └──────────┘  └──────────┘  └──────────────┘  │
                    │         │            │               │          │
                    │         ▼            ▼               ▼          │
                    │  ┌──────────────────────────────────────────┐   │
                    │  │  Attachment Point Resolver                │   │
                    │  │  Maps: slot → bone → offset → scale      │   │
                    │  └──────────────────────────────────────────┘   │
                    └──────────────────────────────────────────────────┘
```

---

## Pipeline Steps

### 1. GLTF Garment Loader

Loads garment meshes from Cloudinary/object storage.

```typescript
interface GarmentMeshLoader {
  load(garmentId: string, modelUrl: string): Promise<THREE.Group>;
  unload(garmentId: string): void;
  getCacheStats(): { cached: number; totalSize: number };
}
```

### 2. Garment Attachment System

Positions garment meshes at the correct skeleton bone with offset.

```typescript
interface GarmentAttachmentSystem {
  attach(
    garment: THREE.Group,
    slot: GarmentFitSlot,
    skeleton: THREE.Skeleton,
  ): AttachResult;
  detach(garmentId: string): void;
  update(garmentId: string, position: Vector3, rotation: Euler): void;
}
```

### 3. Skeleton Mapping

Maps garment slots to avatar skeleton bone hierarchy.

| Garment Slot | Target Bone | Offset Position | Layer |
|---|---|---|---|
| Upper Base | UpperChest | [0, 0.05, -0.02] | 0 |
| Upper Mid | Chest | [0, 0.02, 0] | 1 |
| Upper Outer | Chest | [0, 0, 0.03] | 2 |
| Lower | Hips | [0, -0.02, 0] | 0 |
| Footwear | LeftFoot / RightFoot | [0, 0, 0] | 0 |
| Accessory | Head / Hand | [0, 0.1, 0] / [0, 0, 0] | 3 |

### 4. Clothing Layer Ordering

```
Layer 0: Base (underwear, base layer)
Layer 1: Mid (shirts, blouses, pants)
Layer 2: Outer (jackets, coats, sweaters)
Layer 3: Accessory (hats, bags, jewelry)
```

Rendered in layer order — higher layers render on top.

### 5. Cloth Conflict Detection

Detects overlapping garments and resolves via conflict rules:

| Conflict | Resolution |
|---|---|
| Full body + Upper | Hide upper |
| Full body + Lower | Hide lower |
| Mid + Outer (same slot) | Allow overlap |
| Accessory + any | Allow overlap |

### 6. Body Measurement Normalization

Scales garment meshes to match avatar body measurements.

```typescript
function normalizeGarmentScale(
  garment: THREE.Mesh,
  bodyMeasurements: BodyMeasurementSet,
  slot: GarmentFitSlot,
): void;
```

---

## Render Pipeline Optimization

### LOD Levels

| Level | Distance | Triangles | Textures |
|---|---|---|---|
| High | 0-2m | 50K | 1024x1024 |
| Medium | 2-5m | 25K | 512x512 |
| Low | 5m+ | 10K | 256x256 |

### Texture Compression

- Input: PNG/JPEG (from upload)
- Compressed: WebP (quality 80) or KTX2 (with Basis Universal)
- Max texture size: 1024x1024

### GPU Memory Management

- Dispose geometries/materials on unmount
- Share textures across same garment type instances
- Use instanced mesh for thumbnail grid

---

## State Persistence

```typescript
interface AvatarState {
  avatarId: string;
  currentOutfit: GarmentFitConfiguration[];
  layerVisibility: Record<string, boolean>;
  cameraPreset: CameraPreset;
  lastUpdated: Date;
}
```

Persisted to local storage (session) + backend API (for saved outfits).

---

## Performance Metrics

| Metric | Target | Measurement |
|---|---|---|
| Load time (first garment) | < 2s | useProgress |
| Load time (subsequent) | < 500ms | Cache hit |
| Render FPS | 30+ | Stats.js |
| Memory usage | < 200MB | performance.memory |
| Texture memory | < 100MB | GL.getExtension |

---

## Out of Scope (Next Phase)

- Cloth physics simulation (no GPU particles, no spring constraints)
- Fabric draping / folding
- Collision detection between garment and body mesh
- Real-time mesh deformation
- Wrinkle simulation

---

## File Structure

```
frontend/src/components/features/avatar/
  ├── avatar-scene.tsx          — Scene root with Canvas
  ├── avatar-model.tsx          — GLTF model loader
  ├── garment-layer.tsx         — Single garment on avatar
  ├── garment-fit-system.ts     — Attachment point resolver
  ├── skeleton-mapping.ts       — Bone hierarchy mapping
  ├── cloth-conflict-detector.ts— Conflict detection
  ├── layer-manager.ts          — Render ordering
  ├── camera-controls.tsx       — Orbit controls + presets
  ├── lighting-setup.tsx        — Scene lighting
  ├── performance-monitor.tsx   — FPS + memory tracking
  generators/
  ├── texture-compressor.ts     — WebP/KTX2 compression
  └── garment-mesh-generator.ts — Mesh from segmentation
```
