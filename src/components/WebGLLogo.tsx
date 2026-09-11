"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface WebGLLogoProps {
  className?: string;
  light?: boolean;
}

/**
 * Procedural wordmark canvas generator (100% in-memory, ZERO network images).
 * Accurately reproduces the authentic SHANFA GLOBAL geometry:
 * - Magenta "S"
 * - High-contrast "HANFA" (Black or Pure White based on light theme)
 * - Skewed luxury velvet plum pill container with bold white "GLOBAL"
 */
function createWordmarkCanvas(light: boolean): {
  colorCanvas: HTMLCanvasElement;
  bumpCanvas: HTMLCanvasElement;
} {
  const width = 1440;
  const height = 240;

  // 1. Color Canvas
  const colorCanvas = document.createElement("canvas");
  colorCanvas.width = width;
  colorCanvas.height = height;
  const ctx = colorCanvas.getContext("2d", { willReadFrequently: true });

  // 2. Bump Map Canvas (for 3D beveling & physical surface normals)
  const bumpCanvas = document.createElement("canvas");
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bCtx = bumpCanvas.getContext("2d", { willReadFrequently: true });

  if (!ctx || !bCtx) return { colorCanvas, bumpCanvas };

  ctx.clearRect(0, 0, width, height);

  const brandPlum = "#890754";
  const brandPlumLight = "#a80b67";
  const brandPlumDark = "#730545";
  const textColor = light ? "#FFFFFF" : "#0A0A0C";

  // Large, bold typography filling the height with maximum mobile clarity
  const fontFace =
    '900 156px "Inter", "Montserrat", "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif';
  ctx.font = fontFace;
  ctx.textBaseline = "middle";

  const baselineY = 122;
  const startX = 8;

  // 1. Draw "S" in Signature Velvet Plum Gradient
  const plumGrad = ctx.createLinearGradient(0, 30, 0, 210);
  plumGrad.addColorStop(0, brandPlumLight);
  plumGrad.addColorStop(1, brandPlum);
  ctx.fillStyle = plumGrad;
  ctx.fillText("S", startX, baselineY);

  const sWidth = ctx.measureText("S").width;

  // 2. Draw "HANFA" in high contrast
  ctx.fillStyle = textColor;
  ctx.fillText("HANFA", startX + sWidth + 6, baselineY);

  const hanfaWidth = ctx.measureText("HANFA").width;

  // 3. Draw Skewed Velvet Plum "GLOBAL" Badge
  const badgeX = startX + sWidth + 6 + hanfaWidth + 20;
  const badgeTop = 8;
  const badgeBottom = 232;
  const badgeRight = width - 8;
  const badgeWidth = badgeRight - badgeX;
  const slant = 36; // italic slant offset
  const r = 32; // corner radius

  ctx.save();
  ctx.beginPath();
  // Top-left
  ctx.moveTo(badgeX + slant + r, badgeTop);
  // Top edge
  ctx.lineTo(badgeX + badgeWidth - r, badgeTop);
  // Top-right corner
  ctx.quadraticCurveTo(badgeX + badgeWidth, badgeTop, badgeX + badgeWidth - 4, badgeTop + r);
  // Right slanted edge
  ctx.lineTo(badgeX + badgeWidth - slant + 4, badgeBottom - r);
  // Bottom-right corner
  ctx.quadraticCurveTo(
    badgeX + badgeWidth - slant,
    badgeBottom,
    badgeX + badgeWidth - slant - r,
    badgeBottom
  );
  // Bottom edge
  ctx.lineTo(badgeX + r, badgeBottom);
  // Bottom-left corner
  ctx.quadraticCurveTo(badgeX, badgeBottom, badgeX + 4, badgeBottom - r);
  // Left slanted edge
  ctx.lineTo(badgeX + slant - 4, badgeTop + r);
  // Top-left corner close
  ctx.quadraticCurveTo(badgeX + slant, badgeTop, badgeX + slant + r, badgeTop);
  ctx.closePath();

  // Velvet Plum Badge Gradient
  const badgeGrad = ctx.createLinearGradient(badgeX, badgeTop, badgeX + badgeWidth, badgeBottom);
  badgeGrad.addColorStop(0, brandPlumDark);
  badgeGrad.addColorStop(0.35, brandPlum);
  badgeGrad.addColorStop(1, brandPlumLight);
  ctx.fillStyle = badgeGrad;
  ctx.fill();

  // Subtle luxury beveled top highlight
  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  ctx.lineWidth = 3.5;
  ctx.stroke();

  // 4. Draw "GLOBAL" inside badge
  ctx.fillStyle = "#FFFFFF";
  ctx.font = fontFace;
  ctx.textAlign = "center";
  const badgeCenterX = badgeX + badgeWidth / 2 - slant / 2;
  ctx.fillText("GLOBAL", badgeCenterX, baselineY + 2);
  ctx.restore();

  // 5. Generate High-Fidelity Bump Map for 3D Bevel & Lighting
  bCtx.fillStyle = "#808080"; // Neutral height
  bCtx.fillRect(0, 0, width, height);

  const imgData = ctx.getImageData(0, 0, width, height);
  const src = imgData.data;
  const bumpData = bCtx.createImageData(width, height);
  const dst = bumpData.data;

  for (let i = 0; i < src.length; i += 4) {
    const alpha = src[i + 3];
    if (alpha > 15) {
      // Raised embossed surface with subtle luminance modulation
      const lum = (src[i] * 0.299 + src[i + 1] * 0.587 + src[i + 2] * 0.114) / 255;
      const heightVal = Math.min(255, 140 + Math.round((alpha / 255) * (80 + lum * 35)));
      dst[i] = heightVal;
      dst[i + 1] = heightVal;
      dst[i + 2] = heightVal;
      dst[i + 3] = 255;
    } else {
      dst[i] = 128;
      dst[i + 1] = 128;
      dst[i + 2] = 128;
      dst[i + 3] = 255;
    }
  }
  bCtx.putImageData(bumpData, 0, 0);

  return { colorCanvas, bumpCanvas };
}

/**
 * Creates a procedural 4-point diamond star geometry for luxury specular glints.
 */
function createDiamondStarShape(): THREE.Shape {
  const shape = new THREE.Shape();
  const outer = 0.12;

  shape.moveTo(0, outer);
  shape.quadraticCurveTo(0, 0, outer, 0);
  shape.quadraticCurveTo(0, 0, 0, -outer);
  shape.quadraticCurveTo(0, 0, -outer, 0);
  shape.quadraticCurveTo(0, 0, 0, outer);
  shape.closePath();
  return shape;
}

export function WebGLLogo({ className = "", light = false }: WebGLLogoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = useState(false);

  // Mouse tilt tracking with smooth damping
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    setMounted(true);
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let animationFrameId: number;

    // 1. Initialize WebGL Renderer
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.5));
      renderer.setClearColor(0x000000, 0);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
    } catch (e) {
      console.warn("WebGL not supported for Logo:", e);
      return;
    }

    // 2. Setup Scene & Camera with adaptive zoom fit
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 6.0, 0.1, 50);

    // Root Group for 3D Tilt, Hover, and Parallax
    const logoGroup = new THREE.Group();
    scene.add(logoGroup);

    // 3. Generate Procedural In-Memory Textures (NO external images!)
    const { colorCanvas, bumpCanvas } = createWordmarkCanvas(light);

    const wordmarkTexture = new THREE.CanvasTexture(colorCanvas);
    wordmarkTexture.generateMipmaps = true;
    wordmarkTexture.minFilter = THREE.LinearMipmapLinearFilter;
    wordmarkTexture.magFilter = THREE.LinearFilter;
    wordmarkTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const bumpTexture = new THREE.CanvasTexture(bumpCanvas);
    bumpTexture.generateMipmaps = true;
    bumpTexture.minFilter = THREE.LinearMipmapLinearFilter;
    bumpTexture.magFilter = THREE.LinearFilter;

    // 4. 3D Logo Mesh with Physical Clearcoat Material
    const planeWidth = 4.0;
    const planeHeight = planeWidth / 6.0; // 0.6667
    const planeGeo = new THREE.PlaneGeometry(planeWidth, planeHeight, 32, 8);

    const planeMat = new THREE.MeshPhysicalMaterial({
      map: wordmarkTexture,
      bumpMap: bumpTexture,
      bumpScale: 0.045,
      transparent: true,
      roughness: 0.24,
      metalness: 0.32,
      clearcoat: 0.85,
      clearcoatRoughness: 0.12,
      reflectivity: 0.92,
      side: THREE.FrontSide,
    });

    const logoMesh = new THREE.Mesh(planeGeo, planeMat);
    logoGroup.add(logoMesh);

    // 5. Procedural 3D Diamond Star Glints (Sparkles)
    const starGeo = new THREE.ShapeGeometry(createDiamondStarShape());
    const starMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });

    // Star 1: Placed over the top curve of "S"
    const starS = new THREE.Mesh(starGeo, starMat);
    starS.position.set(-1.82, 0.16, 0.08);
    logoGroup.add(starS);

    // Star 2: Placed over the "GLOBAL" badge peak
    const starBadge = new THREE.Mesh(starGeo, starMat.clone());
    starBadge.position.set(1.52, 0.22, 0.08);
    logoGroup.add(starBadge);

    // 6. Floating 3D Stardust Micro-Particles
    const particleCount = 20;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particlePhases = new Float32Array(particleCount);
    const particleSpeeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * planeWidth * 1.05;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * planeHeight * 1.35;
      particlePositions[i * 3 + 2] = 0.05 + Math.random() * 0.25;
      particlePhases[i] = Math.random() * Math.PI * 2;
      particleSpeeds[i] = 0.6 + Math.random() * 0.8;
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));

    // Procedural glowing round speck texture
    const dotCanvas = document.createElement("canvas");
    dotCanvas.width = 32;
    dotCanvas.height = 32;
    const dotCtx = dotCanvas.getContext("2d");
    if (dotCtx) {
      const grad = dotCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, "rgba(255, 240, 250, 1)");
      grad.addColorStop(0.35, "rgba(235, 120, 190, 0.65)");
      grad.addColorStop(1, "rgba(137, 7, 84, 0)");
      dotCtx.fillStyle = grad;
      dotCtx.fillRect(0, 0, 32, 32);
    }
    const dotTexture = new THREE.CanvasTexture(dotCanvas);

    const particleMat = new THREE.PointsMaterial({
      size: 0.08,
      map: dotTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    logoGroup.add(particles);

    // 7. Dynamic WebGL Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, light ? 1.6 : 1.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, light ? 2.0 : 2.4);
    keyLight.position.set(2, 3, 3.5);
    scene.add(keyLight);

    // Dynamic Specular Sweep PointLight (Glides across logo creating liquid metallic shine)
    const sweepLight = new THREE.PointLight(0xffe8f6, 4.2, 3.6);
    sweepLight.position.set(-2.4, 0.1, 0.45);
    scene.add(sweepLight);

    // 8. Responsive Auto-Fitting Camera (Fills 93% of canvas across all viewports)
    const fitCameraToContainer = () => {
      if (!container || !renderer) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) return;

      const aspect = width / height;
      camera.aspect = aspect;

      // Calculate exact camera Z distance to fill container with ~93% coverage (room for 3D tilt)
      const fovRad = (camera.fov * Math.PI) / 180;
      const tanHalfFov = Math.tan(fovRad / 2);
      const coverageMargin = 1.08;

      const distH = (planeHeight * coverageMargin) / (2 * tanHalfFov);
      const distW = (planeWidth * coverageMargin) / (2 * tanHalfFov * aspect);

      camera.position.z = Math.max(distH, distW);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    const resizeObserver = new ResizeObserver(fitCameraToContainer);
    resizeObserver.observe(container);
    fitCameraToContainer();

    // 9. Render & Animation Loop
    const clock = new THREE.Clock();

    const animate = () => {
      const time = clock.getElapsedTime();

      // Organic Specular Sweep Cycle across the entire logo
      const sweepPeriod = 3.8;
      const sweepProgress = (time % sweepPeriod) / sweepPeriod;
      const sweepX = -2.5 + sweepProgress * 5.0;

      sweepLight.position.x = sweepX;
      sweepLight.position.y = Math.sin(sweepProgress * Math.PI) * 0.18;
      sweepLight.intensity = 4.8 * Math.sin(sweepProgress * Math.PI);

      // Star Sparkle 1 ("S" glint trigger)
      const distS = Math.abs(sweepX - starS.position.x);
      if (distS < 0.35) {
        const factor = 1 - distS / 0.35;
        starS.scale.setScalar(factor * 1.3);
        starS.rotation.z = time * 2.5;
        (starS.material as THREE.MeshBasicMaterial).opacity = factor;
      } else {
        (starS.material as THREE.MeshBasicMaterial).opacity = 0;
      }

      // Star Sparkle 2 ("GLOBAL" badge glint trigger)
      const distBadge = Math.abs(sweepX - starBadge.position.x);
      if (distBadge < 0.35) {
        const factor = 1 - distBadge / 0.35;
        starBadge.scale.setScalar(factor * 1.25);
        starBadge.rotation.z = -time * 2.5;
        (starBadge.material as THREE.MeshBasicMaterial).opacity = factor;
      } else {
        (starBadge.material as THREE.MeshBasicMaterial).opacity = 0;
      }

      // Subtle Stardust Drift
      const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < particleCount; i++) {
        const phase = particlePhases[i];
        const spd = particleSpeeds[i];
        posAttr.setY(i, Math.sin(time * spd + phase) * planeHeight * 0.45);
      }
      posAttr.needsUpdate = true;

      // Smooth 3D Mouse Parallax (Antigravity Lerp)
      const mouse = mouseRef.current;
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      logoGroup.rotation.y = mouse.x * 0.26;
      logoGroup.rotation.x = -mouse.y * 0.18;
      // Gentle natural breathing motion when stationary
      logoGroup.position.y = Math.sin(time * 1.8) * 0.012;

      renderer?.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // 10. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();

      planeGeo.dispose();
      planeMat.dispose();
      wordmarkTexture.dispose();
      bumpTexture.dispose();

      starGeo.dispose();
      starMat.dispose();
      (starBadge.material as THREE.Material).dispose();

      particleGeo.dispose();
      particleMat.dispose();
      dotTexture.dispose();

      renderer?.dispose();
    };
  }, [light]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    mouseRef.current.targetX = x;
    mouseRef.current.targetY = y;
  };

  const handlePointerLeave = () => {
    mouseRef.current.targetX = 0;
    mouseRef.current.targetY = 0;
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`relative w-full h-full cursor-pointer select-none overflow-visible ${className}`}
      title="SHANFA GLOBAL"
      style={{ touchAction: "none" }}
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full pointer-events-none transition-opacity duration-300"
        style={{ opacity: mounted ? 1 : 0 }}
      />
    </div>
  );
}
