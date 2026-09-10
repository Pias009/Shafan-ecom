"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface WhiteSeaWaveCanvasProps {
  className?: string;
}

export function WhiteSeaWaveCanvas({ className = "" }: WhiteSeaWaveCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let geometry: THREE.PlaneGeometry | null = null;
    let waveMaterial: THREE.ShaderMaterial | null = null;
    let animationFrameId: number;
    let isWebGlActive = false;

    // Try creating WebGL renderer directly
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: false,
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      isWebGlActive = true;
    } catch {
      isWebGlActive = false;
    }

    // --- CASE 1: WebGL is available ---
    if (isWebGlActive && renderer) {
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xffffff);

      camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      camera.position.set(0, -2.0, 3.2);
      camera.lookAt(0, 0.3, 0);

      geometry = new THREE.PlaneGeometry(16, 10, 96, 64);

      waveMaterial = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uMouse: { value: new THREE.Vector2(0, 0) },
          uResolution: { value: new THREE.Vector2(1, 1) },
        },
        vertexShader: `
          uniform float uTime;
          uniform vec2 uMouse;
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          varying float vElevation;
          varying vec2 vUv;

          void main() {
            vUv = uv;
            vec3 pos = position;

            // Wave active only from bottom (uv.y = 0.0) up to middle (uv.y ≈ 0.55).
            // Upper section (uv.y > 0.65) is completely flat (waveMask = 0.0).
            float waveMask = smoothstep(0.68, 0.20, uv.y);

            // Ultra-smooth, elegant, fluid ocean swells (no high-frequency noise)
            float k1 = 1.05;
            float phase1 = (pos.x * 0.75 + pos.y * 0.5) * k1 + uTime * 0.85;
            float w1 = sin(phase1) * 0.36;
            float dw1_dx = cos(phase1) * 0.36 * (0.75 * k1);
            float dw1_dy = cos(phase1) * 0.36 * (0.5 * k1);

            float k2 = 1.35;
            float phase2 = (pos.x * -0.55 + pos.y * 0.85) * k2 + uTime * 1.05;
            float w2 = sin(phase2) * 0.22;
            float dw2_dx = cos(phase2) * 0.22 * (-0.55 * k2);
            float dw2_dy = cos(phase2) * 0.22 * (0.85 * k2);

            // Gentle, silky mouse interaction
            float dist = distance(pos.xy, uMouse * vec2(4.5, 2.5));
            float mouseWave = sin(dist * 3.8 - uTime * 2.4) * exp(-dist * 0.85) * 0.18;

            float totalElevation = (w1 + w2 + mouseWave) * waveMask;
            pos.z += totalElevation;
            vElevation = totalElevation;

            // Analytical normal pointing upward
            float total_dzdx = (dw1_dx + dw2_dx) * waveMask;
            float total_dzdy = (dw1_dy + dw2_dy) * waveMask;
            vec3 localNormal = normalize(vec3(-total_dzdx, -total_dzdy, 1.0));
            vNormal = normalize(normalMatrix * localNormal);

            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            vViewPosition = -mvPosition.xyz;
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform float uTime;
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          varying float vElevation;
          varying vec2 vUv;

          void main() {
            vec3 normal = normalize(vNormal);
            vec3 viewDir = normalize(vViewPosition);

            // Soft directional sunlight
            vec3 lightDir = normalize(vec3(0.5, 0.75, 1.0));
            float diffuse = max(dot(normal, lightDir), 0.0);

            // Silky smooth specular highlight
            vec3 halfDir = normalize(lightDir + viewDir);
            float spec = pow(max(dot(normal, halfDir), 0.0), 28.0);

            // Smooth luxury white sea palette:
            // Troughs: Gentle porcelain silver-shadow (#dbe3ec)
            // Mid: Pure silk white
            // Crests: Diamond white (#ffffff)
            vec3 troughColor = vec3(0.86, 0.89, 0.93);
            vec3 crestColor = vec3(1.0, 1.0, 1.0);

            float h = smoothstep(-0.4, 0.4, vElevation);
            vec3 waterColor = mix(troughColor, crestColor, h);

            // Soft wave crest highlight
            float crestGlow = smoothstep(0.10, 0.40, vElevation);
            waterColor = mix(waterColor, crestColor, crestGlow * 0.85);

            // Specular sunlight glint
            waterColor += crestColor * (spec * 0.70);

            // Upper section smoothly dissolves into pure white (middle to top is clean white):
            float upperWhite = smoothstep(0.32, 0.60, vUv.y);
            vec3 finalColor = mix(waterColor, vec3(1.0, 1.0, 1.0), upperWhite);

            gl_FragColor = vec4(finalColor, 1.0);
          }
        `,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(geometry, waveMaterial);
      mesh.rotation.x = -Math.PI * 0.30;
      scene.add(mesh);

      const updateSize = () => {
        if (!container || !renderer || !camera || !waveMaterial) return;
        const width = container.clientWidth || 800;
        const height = container.clientHeight || 300;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
        waveMaterial.uniforms.uResolution.value.set(width, height);
      };

      const resizeObserver = new ResizeObserver(() => updateSize());
      resizeObserver.observe(container);
      updateSize();

      const handleMouseMove = (e: MouseEvent) => {
        if (!waveMaterial) return;
        const rect = container.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
        waveMaterial.uniforms.uMouse.value.set(x, y);
      };

      container.addEventListener("mousemove", handleMouseMove);

      let isVisible = true;
      const intersectionObserver = new IntersectionObserver(
        ([entry]) => {
          isVisible = entry.isIntersecting;
        },
        { threshold: 0.05 }
      );
      intersectionObserver.observe(container);

      const clock = new THREE.Clock();
      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        if (!isVisible || !renderer || !scene || !camera || !waveMaterial) return;

        waveMaterial.uniforms.uTime.value = clock.getElapsedTime();
        renderer.render(scene, camera);
      };

      animate();

      return () => {
        cancelAnimationFrame(animationFrameId);
        container.removeEventListener("mousemove", handleMouseMove);
        resizeObserver.disconnect();
        intersectionObserver.disconnect();

        geometry?.dispose();
        waveMaterial?.dispose();
        renderer?.dispose();
      };
    } else {
      // --- CASE 2: High-Performance 2D Canvas Fallback ---
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      let width = (canvas.width = container.clientWidth || 800);
      let height = (canvas.height = container.clientHeight || 300);

      const handleResize = () => {
        width = canvas.width = container.clientWidth || 800;
        height = canvas.height = container.clientHeight || 300;
      };

      const resizeObserver = new ResizeObserver(() => handleResize());
      resizeObserver.observe(container);

      let time = 0;
      const animate2D = () => {
        animationFrameId = requestAnimationFrame(animate2D);
        time += 0.016;

        ctx.clearRect(0, 0, width, height);

        // Pure white background for upper section
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);

        // Smooth waves rolling only from bottom to middle (y from 0.55*height to height)
        const waves = [
          { y: height * 0.58, amp: 16, freq: 0.006, speed: 0.9, color: "rgba(222, 230, 240, 0.40)" },
          { y: height * 0.70, amp: 20, freq: 0.005, speed: 0.7, color: "rgba(235, 242, 248, 0.65)" },
          { y: height * 0.84, amp: 16, freq: 0.007, speed: 1.1, color: "rgba(246, 249, 252, 0.90)" },
        ];

        waves.forEach((w) => {
          ctx.beginPath();
          ctx.moveTo(0, height);
          ctx.lineTo(0, w.y);

          for (let x = 0; x <= width; x += 10) {
            const y =
              w.y +
              Math.sin(x * w.freq + time * w.speed) * w.amp +
              Math.cos(x * w.freq * 0.6 + time * 0.6) * (w.amp * 0.35);
            ctx.lineTo(x, y);
          }

          ctx.lineTo(width, height);
          ctx.closePath();

          ctx.fillStyle = w.color;
          ctx.fill();

          ctx.strokeStyle = "rgba(255, 255, 255, 0.90)";
          ctx.lineWidth = 2;
          ctx.stroke();
        });
      };

      animate2D();

      return () => {
        cancelAnimationFrame(animationFrameId);
        resizeObserver.disconnect();
      };
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
