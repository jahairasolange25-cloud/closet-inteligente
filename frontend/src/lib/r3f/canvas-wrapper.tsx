'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Center, useGLTF } from '@react-three/drei';
import { R3FErrorBoundary } from '@/components/ui/r3f-error-boundary';
import { useAvatarStore } from '@/stores/avatar-store';
import { useAdaptiveDpr } from './use-adaptive-dpr';
import type { Avatar } from '@/types/avatar';

function AvatarGLBMesh({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return (
    <Center>
      <primitive object={scene} />
    </Center>
  );
}

function ParametricBodyMesh({ avatar }: { avatar: Avatar | null }) {
  const h = (avatar?.height_cm ?? 170) / 100;
  const TAU = 2 * Math.PI;

  // Circumference → radius
  const chestR = (avatar?.chest_cm ?? 92) / (TAU * 100);
  const waistR = (avatar?.waist_cm ?? 76) / (TAU * 100);
  const hipsR  = (avatar?.hips_cm  ?? 97) / (TAU * 100);
  const shldrHW = (avatar?.shoulder_width_cm ?? 44) / 200; // half-width
  const armLen  = avatar?.arm_length_cm != null
    ? avatar.arm_length_cm / 100
    : h * 0.38;
  const legsH = (avatar?.inseam_cm ?? 80) / 100;

  // Section heights (proportional to total height)
  const headH    = h / 8;
  const neckH    = h * 0.045;
  const shldrH   = h * 0.05;
  const chestSecH = h * 0.16;
  const abdH     = h * 0.08;
  const hipsRegH = h * 0.10;

  // Y positions from floor (y = 0)
  const yHipsBase  = legsH;
  const yAbdBase   = yHipsBase  + hipsRegH;
  const yChestBase = yAbdBase   + abdH;
  const yShldrBase = yChestBase + chestSecH;
  const yNeckBase  = yShldrBase + shldrH;
  const yHeadBase  = yNeckBase  + neckH;

  const skin  = '#d4a574';
  const shirt = '#6366f1';
  const pants = '#374151';
  const S = 12;

  return (
    <Center>
      <group>
        {/* Head */}
        <mesh position={[0, yHeadBase + headH * 0.5, 0]}>
          <sphereGeometry args={[headH * 0.46, S, S]} />
          <meshStandardMaterial color={skin} roughness={0.85} />
        </mesh>

        {/* Neck */}
        <mesh position={[0, yNeckBase + neckH * 0.5, 0]}>
          <cylinderGeometry args={[headH * 0.17, headH * 0.19, neckH, S]} />
          <meshStandardMaterial color={skin} roughness={0.85} />
        </mesh>

        {/* Shoulders — tapers from shoulder width down to chest radius */}
        <mesh position={[0, yShldrBase + shldrH * 0.5, 0]}>
          <cylinderGeometry args={[shldrHW * 0.88, chestR, shldrH, S]} />
          <meshStandardMaterial color={shirt} roughness={0.6} />
        </mesh>

        {/* Chest section — chest to waist */}
        <mesh position={[0, yChestBase + chestSecH * 0.5, 0]}>
          <cylinderGeometry args={[chestR, waistR * 1.05, chestSecH, S]} />
          <meshStandardMaterial color={shirt} roughness={0.6} />
        </mesh>

        {/* Abdomen — waist to hips */}
        <mesh position={[0, yAbdBase + abdH * 0.5, 0]}>
          <cylinderGeometry args={[waistR * 1.05, hipsR * 0.9, abdH, S]} />
          <meshStandardMaterial color={pants} roughness={0.65} />
        </mesh>

        {/* Hips region — flares out toward max hipsR */}
        <mesh position={[0, yHipsBase + hipsRegH * 0.5, 0]}>
          <cylinderGeometry args={[hipsR * 0.9, hipsR, hipsRegH, S]} />
          <meshStandardMaterial color={pants} roughness={0.65} />
        </mesh>

        {/* Legs (left = -1, right = +1) */}
        {([-1, 1] as const).map((side) => (
          <mesh key={side} position={[side * hipsR * 0.44, legsH * 0.5, 0]}>
            <capsuleGeometry args={[hipsR * 0.31, legsH * 0.84, 8, 8]} />
            <meshStandardMaterial color={pants} roughness={0.7} />
          </mesh>
        ))}

        {/* Arms (left = -1, right = +1) */}
        {([-1, 1] as const).map((side) => (
          <mesh
            key={side}
            position={[side * (shldrHW + 0.015), yShldrBase - armLen * 0.45, 0]}
            rotation={[0, 0, side * -0.1]}
          >
            <capsuleGeometry args={[chestR * 0.22, armLen, 8, 8]} />
            <meshStandardMaterial color={shirt} roughness={0.6} />
          </mesh>
        ))}
      </group>
    </Center>
  );
}

function SceneFallback() {
  return (
    <mesh>
      <boxGeometry args={[0.1, 0.1, 0.1]} />
      <meshStandardMaterial color="#e5e7eb" />
    </mesh>
  );
}

export function AvatarCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const dpr = useAdaptiveDpr();
  const avatar = useAvatarStore((s) => s.avatar);
  const fullBodyUrl = avatar?.full_body_url ?? null;

  // Lazy mount: delay Canvas initialization until element is visible
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsMounted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <R3FErrorBoundary>
      <div
        ref={containerRef}
        className="aspect-[3/4] w-full max-w-sm mx-auto rounded-2xl overflow-hidden bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900 border border-neutral-200 dark:border-neutral-700"
      >
        {isMounted && (
          <Canvas
            camera={{ position: [0, 1.2, 2.5], fov: 45 }}
            shadows
            dpr={dpr}
            gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
            aria-label="Avatar 3D"
            frameloop="demand"
          >
            <ambientLight intensity={0.6} />
            <directionalLight position={[2, 4, 2]} intensity={1} castShadow />
            <Suspense fallback={<SceneFallback />}>
              {fullBodyUrl ? (
                <AvatarGLBMesh url={fullBodyUrl} />
              ) : (
                <ParametricBodyMesh avatar={avatar} />
              )}
              <Environment preset="studio" />
            </Suspense>
            <OrbitControls
              enablePan={false}
              minPolarAngle={Math.PI / 4}
              maxPolarAngle={Math.PI * 0.75}
              minDistance={1.5}
              maxDistance={4}
              target={[0, 0, 0]}
            />
          </Canvas>
        )}
      </div>
    </R3FErrorBoundary>
  );
}
