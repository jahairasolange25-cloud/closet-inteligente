# 3D Rendering Architecture

## Overview

React Three Fiber (R3F) scene hierarchy for avatar and garment visualization.
Built on Three.js with TypeScript, optimized for both desktop and mobile.

---

## Scene Hierarchy

```
<Canvas>                         # R3F canvas
  <Suspense fallback={<LoadingSpinner />}>
    <Scene>
      <LightingSetup />          # Ambient + directional + hemisphere
      <Environment />            # HDR environment map

      <AvatarScene>              # Avatar wrapper
        <AvatarModel>            # GLTF/GLB model
          <GarmentLayer />        # Draped garment meshes
        </AvatarModel>
      </AvatarScene>

      <Floor />
      <CameraControls />
      <PostProcessing />
      <PerformanceMonitor />
    </Scene>
  </Suspense>
  <ErrorBoundary fallback={<ModelError />} />
</Canvas>
```

---

## Avatar Rendering Pipeline

### 1. Model Loading

```typescript
// src/components/features/avatar/avatar-model.tsx
import { useGLTF, useAnimations } from '@react-three/drei';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface AvatarModelProps {
  modelUrl: string;
  animate?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

function AvatarModel({ modelUrl, animate, onLoad, onError }: AvatarModelProps) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations, materials } = useGLTF(modelUrl, true, undefined, (error) => {
    onError?.(error);
  });

  const { actions, mixer } = useAnimations(animations, group);

  useEffect(() => {
    if (animate) {
      const idleAction = actions['idle'] || actions['standing'] || Object.values(actions)[0];
      if (idleAction) {
        idleAction.reset().play();
        idleAction.setEffectiveTimeScale(0.5);
      }
    }

    onLoad?.();
    return () => {
      mixer.stopAllAction();
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material?.dispose();
          }
        }
      });
    };
  }, [scene, actions]);

  return (
    <primitive
      ref={group}
      object={scene}
      position={[0, 0, 0]}
      scale={[1, 1, 1]}
      frustumCulled={true}
    />
  );
}
```

### 2. Garment Layer on Avatar

```typescript
// Garment layer applied as texture overlay or separate mesh
interface GarmentLayerProps {
  garmentImageUrl: string;
  slot: 'upper' | 'lower' | 'footwear' | 'accessory';
  avatarModel: THREE.Group;
}

function GarmentLayer({ garmentImageUrl, slot, avatarModel }: GarmentLayerProps) {
  const texture = useTexture(garmentImageUrl);

  // Find the target mesh on the avatar for this slot
  const targetMesh = useMemo(() => {
    const meshNames: Record<string, string[]> = {
      upper: ['UpperBody', 'Torso', 'Chest', 'Body_Upper'],
      lower: ['LowerBody', 'Legs', 'Hips', 'Body_Lower'],
      footwear: ['Foot', 'Shoe', 'Feet'],
      accessory: ['Accessory', 'Bag', 'Hat'],
    };

    const names = meshNames[slot];
    let found: THREE.Mesh | null = null;

    avatarModel.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const childName = child.name.toLowerCase();
        if (names.some((n) => childName.includes(n.toLowerCase()))) {
          found = child;
        }
      }
    });

    return found;
  }, [avatarModel, slot]);

  if (!targetMesh) return null;

  // Clone material and apply texture
  const material = useMemo(() => {
    const mat = (targetMesh.material as THREE.MeshStandardMaterial).clone();
    mat.map = texture;
    mat.needsUpdate = true;
    return mat;
  }, [targetMesh, texture]);

  return <primitive object={targetMesh} material={material} />;
}
```

---

## Lighting Setup

```typescript
function LightingSetup() {
  return (
    <>
      {/* Ambient light for base illumination */}
      <ambientLight intensity={0.5} color="#ffffff" />

      {/* Main directional light (key light) */}
      <directionalLight
        position={[5, 5, 5]}
        intensity={1.0}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      {/* Fill light from opposite side */}
      <directionalLight
        position={[-3, 2, 4]}
        intensity={0.3}
        color="#ffeedd"
      />

      {/* Back rim light */}
      <directionalLight
        position={[0, 3, -5]}
        intensity={0.4}
        color="#ffffff"
      />

      {/* Hemisphere for sky/ground color */}
      <hemisphereLight
        args={['#ffffff', '#444444', 0.6]}
      />

      {/* Point light for accent */}
      <pointLight position={[0, 4, 2]} intensity={0.2} color="#ffffff" />

      {/* Soft shadow catcher */}
      <SoftShadows size={1} samples={16} />
    </>
  );
}
```

---

## Camera Controls

```typescript
import { OrbitControls } from '@react-three/drei';

function CameraControls() {
  return (
    <OrbitControls
      enablePan={false}
      enableZoom={true}
      enableRotate={true}
      minPolarAngle={Math.PI / 4}    // 45 degrees
      maxPolarAngle={Math.PI / 1.5}  // 120 degrees
      minAzimuthAngle={-Math.PI / 3}
      maxAzimuthAngle={Math.PI / 3}
      minDistance={1.5}
      maxDistance={4.0}
      target={[0, 0.9, 0]}          // Center on avatar torso
      autoRotate={false}
      rotateSpeed={0.8}
      zoomSpeed={1.0}
      dampingFactor={0.1}
      enabled={true}
    />
  );
}
```

### Camera Presets

```typescript
type CameraPreset = 'front' | 'side' | 'back' | 'fullbody' | 'detail';

const CAMERA_PRESETS: Record<CameraPreset, CameraPosition> = {
  front: {
    position: [0, 0.9, 2.5],
    target: [0, 0.9, 0],
  },
  side: {
    position: [2.5, 0.9, 0],
    target: [0, 0.9, 0],
  },
  back: {
    position: [0, 0.9, -2.5],
    target: [0, 0.9, 0],
  },
  fullbody: {
    position: [0, 1.0, 3.5],
    target: [0, 1.0, 0],
  },
  detail: {
    position: [0, 0.5, 1.5],
    target: [0, 0.5, 0],
  },
};
```

---

## Animation System

```typescript
// src/components/features/avatar/avatar-animations.ts
import { useAnimations, useGLTF } from '@react-three/drei';

interface AvatarAnimationController {
  playIdle: () => void;
  playTurn: () => void;
  playPose: (poseName: string) => void;
  stopAll: () => void;
}

function useAvatarAnimations(modelUrl: string): AvatarAnimationController {
  const { animations } = useGLTF(modelUrl);
  const group = useRef<THREE.Group>(null);
  const { actions, mixer } = useAnimations(animations, group);

  const playIdle = useCallback(() => {
    const action = actions['idle'] || actions['standing'] || Object.values(actions)[0];
    if (action) {
      action.reset().fadeIn(0.5).play();
      action.setEffectiveTimeScale(0.5 + Math.random() * 0.3);
    }
  }, [actions]);

  const playTurn = useCallback(() => {
    const turnLeft = actions['turn_left'] || actions['turn'];
    const turnRight = actions['turn_right'];
    const action = turnLeft || turnRight || Object.values(actions)[0];
    if (action) {
      action.reset().fadeIn(0.3).setLoop(THREE.LoopOnce, 1).play();
    }
  }, [actions]);

  return { playIdle, playTurn, playPose: playIdle, stopAll: () => mixer.stopAllAction() };
}
```

---

## Performance Optimization

### Level of Detail (LOD)

```typescript
import { LOD } from '@react-three/drei';

function AvatarWithLOD({ modelUrl }: { modelUrl: string }) {
  const { scene: highDetail } = useGLTF(modelUrl);
  const { scene: mediumDetail } = useGLTF(modelUrl.replace('.glb', '_medium.glb'));
  const { scene: lowDetail } = useGLTF(modelUrl.replace('.glb', '_low.glb'));

  return (
    <LOD distance={[0, 3, 6]}>
      <mesh geometry={highDetail.children[0].geometry} material={highDetail.children[0].material} />
      <mesh geometry={mediumDetail.children[0].geometry} material={mediumDetail.children[0].material} />
      <mesh geometry={lowDetail.children[0].geometry} material={lowDetail.children[0].material} />
    </LOD>
  );
}
```

| Level | Distance | Triangles | Texture Size |
|-------|----------|-----------|--------------|
| High | 0–3m | 50,000 | 1024×1024 |
| Medium | 3–6m | 25,000 | 512×512 |
| Low | 6m+ | 10,000 | 256×256 |

### Instancing

```typescript
// For garment grid view (many garment cards)
function GarmentThumbnailGrid({ garments }: { garments: Garment[] }) {
  const meshes = useMemo(() => {
    return garments.map((g) => ({
      position: [/* calculated grid position */],
      texture: g.thumbnailUrl,
    }));
  }, [garments]);

  return (
    <instancedMesh args={[null, null, garments.length]}>
      <boxGeometry args={[1, 1.3, 0.05]} />
      <meshStandardMaterial />
      {meshes.map((m, i) => (
        <primitive key={i} object={m} />
      ))}
    </instancedMesh>
  );
}
```

### Texture Compression

```typescript
async function compressModelTexture(modelUrl: string): Promise<CompressedTexture> {
  // Compress to KTX2 with Basis Universal
  const compressed = await compressTexture(modelUrl, {
    format: 'ktx2',
    encoder: {
      format: 'bc7',  // Desktop: BC7, Mobile: ETC1S
      quality: 128,
    },
  });

  return compressed;
}
```

### GPU Memory Management

```typescript
// Dispose resources when components unmount
function useDisposeOnUnmount(scene: THREE.Group) {
  useEffect(() => {
    return () => {
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    };
  }, [scene]);
}
```

---

## Loading States

```typescript
function LoadingSpinner() {
  const { progress } = useProgress();

  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <ringGeometry args={[0.3, 0.5, 64]} />
        <meshStandardMaterial
          color="#6366f1"
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>
      <Html center>
        <div className="text-center">
          <p className="text-sm text-gray-500">
            {progress.toFixed(0)}%
          </p>
        </div>
      </Html>
    </group>
  );
}
```

### Loading States

| State | Component | Description |
|-------|-----------|-------------|
| Loading | `LoadingSpinner` | Progress bar with percentage |
| Model loading | `Suspense` with `fallback` | Three.js loader |
| Texture loading | `useProgress` hook | Individual asset progress |
| Error | `ErrorBoundary` fallback | Model failed to load |
| Empty | `EmptyState` | No avatar selected |

---

## Error States

```typescript
function ModelError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <group>
      <Html center>
        <div className="flex flex-col items-center p-4 bg-red-50 rounded-lg">
          <AlertTriangle className="w-8 h-8 text-red-500" />
          <p className="text-sm text-red-600 mt-2">
            Error al cargar el modelo
          </p>
          <button
            onClick={onRetry}
            className="mt-2 text-sm text-red-700 underline"
          >
            Intentar de nuevo
          </button>
        </div>
      </Html>
    </group>
  );
}
```

---

## Mobile Considerations

### Canvas Configuration

```typescript
function MobileOptimizedCanvas({ children }: { children: React.ReactNode }) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <Canvas
      dpr={isMobile ? [1, 1.5] : [1, 2]}  // Lower DPR on mobile
      gl={{
        antialias: !isMobile,        // Disable AA on mobile
        alpha: true,
        stencil: false,
        depth: true,
        powerPreference: isMobile ? 'low-power' : 'high-performance',
        failIfMajorPerformanceCaveat: false,
      }}
      camera={{
        position: [0, isMobile ? 1.2 : 0.9, isMobile ? 3.5 : 2.5],
        fov: isMobile ? 50 : 45,
        near: 0.1,
        far: 20,
      }}
      onCreated={(state) => {
        state.gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      }}
    >
      {children}
    </Canvas>
  );
}
```

### Touch Controls

```typescript
function TouchControls() {
  const { gl, camera } = useThree();
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (!isMobile) return null;

  return (
    <OrbitControls
      enablePan={false}
      enableZoom={true}
      enableRotate={true}
      rotateSpeed={0.5}
      zoomSpeed={0.5}
      minDistance={2}
      maxDistance={5}
      target={[0, 0.9, 0]}
      touches={{
        ONE: THREE.TOUCH.ROTATE_PAN,
        TWO: THREE.TOUCH.DOLLY_PAN,
      }}
    />
  );
}
```

### Performance Budget

| Metric | Desktop Target | Mobile Target |
|--------|---------------|---------------|
| FPS | 60 | 30 |
| Triangle count | 100K | 50K |
| Draw calls | 100 | 50 |
| Texture memory | 200 MB | 100 MB |
| Model file size | 5 MB | 3 MB |
| Initial load time | < 3s | < 5s |

### Adaptive Quality

```typescript
function useAdaptiveQuality() {
  const { gl } = useThree();
  const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('high');

  useEffect(() => {
    const checkPerformance = () => {
      const fps = getFPS();
      const memory = (performance as any).memory?.usedJSHeapSize;

      if (fps < 30) setQuality('low');
      else if (fps < 45) setQuality('medium');
      else setQuality('high');
    };

    const interval = setInterval(checkPerformance, 5000);
    return () => clearInterval(interval);
  }, []);

  return quality;
}
```
