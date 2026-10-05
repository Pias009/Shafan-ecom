"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Float } from "@react-three/drei";

// Desktop-only real 3D visual — a single procedural mesh, no model asset
// needed. Dynamically imported with ssr:false by the overlay; never sent to
// mobile (see SesiOnboardingOverlay.tsx for the device split).
export default function SesiOnboardingScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 4], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.6} />
      <pointLight position={[3, 3, 4]} intensity={40} color="#ec4899" />
      <pointLight position={[-3, -2, 2]} intensity={15} color="#ffffff" />

      <Suspense fallback={null}>
        <Float speed={1.4} rotationIntensity={1.1} floatIntensity={1.2}>
          <mesh>
            <icosahedronGeometry args={[1.3, 1]} />
            <meshStandardMaterial
              color="#f9a8d4"
              roughness={0.25}
              metalness={0.35}
              emissive="#db2777"
              emissiveIntensity={0.15}
            />
          </mesh>
        </Float>
      </Suspense>
    </Canvas>
  );
}
