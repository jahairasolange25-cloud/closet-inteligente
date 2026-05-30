'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Center } from '@react-three/drei';
import { R3FErrorBoundary } from '@/components/ui/r3f-error-boundary';
import { useAdaptiveDpr } from './use-adaptive-dpr';

function AvatarPlaceholderMesh() {
  return (
    <Center>
      <group>
        {/* Head */}
        <mesh position={[0, 1.6, 0]}>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color="#d4a574" roughness={0.8} />
        </mesh>
        {/* Torso */}
        <mesh position={[0, 1.1, 0]}>
          <boxGeometry args={[0.4, 0.5, 0.2]} />
          <meshStandardMaterial color="#6366f1" roughness={0.6} />
        </mesh>
        {/* Left arm */}
        <mesh position={[-0.28, 1.05, 0]} rotation={[0, 0, 0.2]}>
          <capsuleGeometry args={[0.07, 0.4, 8, 8]} />
          <meshStandardMaterial color="#6366f1" roughness={0.6} />
        </mesh>
        {/* Right arm */}
        <mesh position={[0.28, 1.05, 0]} rotation={[0, 0, -0.2]}>
          <capsuleGeometry args={[0.07, 0.4, 8, 8]} />
          <meshStandardMaterial color="#6366f1" roughness={0.6} />
        </mesh>
        {/* Left leg */}
        <mesh position={[-0.12, 0.55, 0]}>
          <capsuleGeometry args={[0.08, 0.5, 8, 8]} />
          <meshStandardMaterial color="#374151" roughness={0.7} />
        </mesh>
        {/* Right leg */}
        <mesh position={[0.12, 0.55, 0]}>
          <capsuleGeometry args={[0.08, 0.5, 8, 8]} />
          <meshStandardMaterial color="#374151" roughness={0.7} />
        </mesh>
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
              <AvatarPlaceholderMesh />
              <Environment preset="studio" />
            </Suspense>
            <OrbitControls
              enablePan={false}
              minPolarAngle={Math.PI / 4}
              maxPolarAngle={Math.PI * 0.75}
              minDistance={1.5}
              maxDistance={4}
              target={[0, 1.1, 0]}
            />
          </Canvas>
        )}
      </div>
    </R3FErrorBoundary>
  );
}
