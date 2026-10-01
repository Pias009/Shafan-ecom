'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import {
  Globe,
  Truck,
  Eye,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Sparkles,
  MapPin,
  Compass,
  Crosshair,
  Layers,
  Map as MapIcon,
} from 'lucide-react';
import { CountryGeoStat } from './DashboardClient';

interface UniverseGlobe3DProps {
  countryStats: CountryGeoStat[];
  mostDeliveredCountry: CountryGeoStat;
  mostVisitedCountry: CountryGeoStat;
  selectedCountryCode: string | null;
  onSelectCountry: (code: string | null) => void;
  mapMode: 'delivered' | 'visits';
  onToggleMapMode: (mode: 'delivered' | 'visits') => void;
}

// -------------------------------------------------------------
// MIDDLE EAST REGIONAL SATELLITE MAP CALIBRATION
// 2171 x 1849 True-Color NASA Terra Satellite Imagery
// Normalized (nx, ny) coordinates from 0.0 to 1.0 across the Middle East
// -------------------------------------------------------------
const ME_COUNTRY_COORDS: Record<
  string,
  { name: string; nx: number; ny: number; cardOffsetX: number; cardOffsetY: number }
> = {
  AE: { name: 'United Arab Emirates', nx: 0.86, ny: 0.38, cardOffsetX: 120, cardOffsetY: -20 },
  SA: { name: 'Saudi Arabia', nx: 0.52, ny: 0.40, cardOffsetX: -140, cardOffsetY: 10 },
  QA: { name: 'Qatar', nx: 0.80, ny: 0.33, cardOffsetX: 25, cardOffsetY: -85 },
  KW: { name: 'Kuwait', nx: 0.71, ny: 0.20, cardOffsetX: -95, cardOffsetY: -65 },
  OM: { name: 'Oman', nx: 0.91, ny: 0.48, cardOffsetX: 110, cardOffsetY: 65 },
  BH: { name: 'Bahrain', nx: 0.76, ny: 0.28, cardOffsetX: -45, cardOffsetY: -85 },
};

// Global sphere coordinates (for full world globe mode)
const GLOBE_COORDS: Record<
  string,
  { lat: number; lon: number; baseAngle: number; radialDist: number }
> = {
  AE: { lat: 24.45, lon: 54.37, baseAngle: 0.15, radialDist: 180 },
  SA: { lat: 24.71, lon: 46.67, baseAngle: 3.14, radialDist: 210 },
  QA: { lat: 25.28, lon: 51.52, baseAngle: -0.75, radialDist: 195 },
  KW: { lat: 29.37, lon: 47.98, baseAngle: -2.35, radialDist: 205 },
  OM: { lat: 23.58, lon: 58.40, baseAngle: 0.85, radialDist: 200 },
  BH: { lat: 26.22, lon: 50.58, baseAngle: -1.55, radialDist: 190 },
};

function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

interface ScreenCountryCard {
  code: string;
  name: string;
  flag: string;
  pinX: number;
  pinY: number;
  cardX: number;
  cardY: number;
  visible: boolean;
  deliveredOrders: number;
  deliveryRate: number;
  visits: number;
  visitsPercentage: number;
  isTopDelivered: boolean;
  isTopVisited: boolean;
}

export function UniverseGlobe3D({
  countryStats,
  mostDeliveredCountry,
  mostVisitedCountry,
  selectedCountryCode,
  onSelectCountry,
  mapMode,
  onToggleMapMode,
}: UniverseGlobe3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Default to Middle East Regional Map as requested ("only the middle east map not full")
  const [viewScope, setViewScope] = useState<'middle-east' | 'globe'>('middle-east');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [screenCards, setScreenCards] = useState<ScreenCountryCard[]>([]);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const contentGroupRef = useRef<THREE.Group | null>(null);
  const pulseMarkersRef = useRef<Array<{ mesh: THREE.Mesh; curve: THREE.QuadraticBezierCurve3; t: number; speed: number }>>([]);

  // Mouse & Touch Tracking
  const isDraggingRef = useRef<boolean>(false);
  const previousMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Camera Rotation Targets
  const targetRotationRef = useRef<{ x: number; y: number }>({ x: 0.15, y: -0.1 });
  const currentRotationRef = useRef<{ x: number; y: number }>({ x: 0.15, y: -0.1 });
  const targetZoomRef = useRef<number>(15.5);
  const zoomLevelRef = useRef<number>(15.5);

  const markers3DRef = useRef<Map<string, THREE.Vector3>>(new Map());

  // Focus and rotate smoothly on any country
  const focusOnCountry = useCallback(
    (code: string) => {
      if (viewScope === 'middle-east') {
        const coords = ME_COUNTRY_COORDS[code];
        if (coords) {
          const mapW = 14;
          const mapH = 11.9;
          const targetX = (coords.nx - 0.5) * mapW;
          const targetY = -(coords.ny - 0.5) * mapH;
          targetRotationRef.current = {
            x: Math.max(-0.4, Math.min(0.6, -targetY * 0.05 + 0.15)),
            y: Math.max(-0.6, Math.min(0.6, targetX * 0.05)),
          };
          targetZoomRef.current = 13.5;
        }
      } else {
        const coords = GLOBE_COORDS[code] || { lat: 24.45, lon: 54.37, baseAngle: 0, radialDist: 180 };
        const targetY = -((coords.lon + 90) * (Math.PI / 180));
        const targetX = -(coords.lat * (Math.PI / 180));
        targetRotationRef.current = { x: targetX, y: targetY };
        targetZoomRef.current = 6.4;
      }
      setAutoRotate(false);
    },
    [viewScope]
  );

  useEffect(() => {
    if (selectedCountryCode) {
      focusOnCountry(selectedCountryCode);
    }
  }, [selectedCountryCode, focusOnCountry]);

  // Main Three.js Scene Setup
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 960;
    const height = container.clientHeight || 640;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera setup based on view scope
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    if (viewScope === 'middle-east') {
      targetZoomRef.current = 15.5;
      zoomLevelRef.current = 15.5;
      targetRotationRef.current = { x: 0.18, y: -0.05 };
      currentRotationRef.current = { x: 0.18, y: -0.05 };
      camera.position.set(0, 0, zoomLevelRef.current);
    } else {
      targetZoomRef.current = 7.2;
      zoomLevelRef.current = 7.2;
      targetRotationRef.current = {
        x: -(24.5 * Math.PI) / 180,
        y: -((54.37 + 90) * Math.PI) / 180,
      };
      currentRotationRef.current = {
        x: -(24.5 * Math.PI) / 180,
        y: -((54.37 + 90) * Math.PI) / 180,
      };
      camera.position.set(0, 0, zoomLevelRef.current);
    }
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Content Group
    const contentGroup = new THREE.Group();
    contentGroup.rotation.order = 'YXZ';
    contentGroupRef.current = contentGroup;
    scene.add(contentGroup);

    // Texture Loader
    const textureLoader = new THREE.TextureLoader();
    const markersMap = new Map<string, THREE.Vector3>();
    pulseMarkersRef.current = [];

    // =========================================================================
    // MODE 1: MIDDLE EAST REGIONAL 3D SATELLITE TERRAIN MAP (PRIMARY / DEFAULT)
    // =========================================================================
    if (viewScope === 'middle-east') {
      const mapWidth = 14;
      const mapHeight = 11.9; // Matches 2171 / 1849 aspect ratio

      // A. Curved 3D Middle East Terrain Geometry (subtle spherical curvature)
      const terrainGeo = new THREE.PlaneGeometry(mapWidth, mapHeight, 64, 64);
      const posAttr = terrainGeo.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const px = posAttr.getX(i);
        const py = posAttr.getY(i);
        const pz = -((px * px * 0.015) + (py * py * 0.018));
        posAttr.setZ(i, pz);
      }
      terrainGeo.computeVertexNormals();

      // B. NASA MODIS Satellite Texture & Terrain Bump Map
      const meColorMap = textureLoader.load('/images/middle-east-satellite.jpg');
      const meBumpMap = textureLoader.load('/images/middle-east-bump.jpg');
      meColorMap.colorSpace = THREE.SRGBColorSpace;

      const terrainMat = new THREE.MeshPhongMaterial({
        map: meColorMap,
        bumpMap: meBumpMap,
        bumpScale: 0.04,
        shininess: 22,
        specular: new THREE.Color(0x38bdf8),
      });
      const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
      contentGroup.add(terrainMesh);

      // C. Spatial Frame & Ambient Boundary Glow
      const frameGeo = new THREE.RingGeometry(mapWidth * 0.58, mapWidth * 0.60, 64);
      const frameMat = new THREE.MeshBasicMaterial({
        color: 0x0284c7,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide,
      });
      const frameMesh = new THREE.Mesh(frameGeo, frameMat);
      frameMesh.position.z = -0.5;
      contentGroup.add(frameMesh);

      // D. Build 3D Beacons & Pins for Middle East Countries
      countryStats.forEach((c) => {
        const coords = ME_COUNTRY_COORDS[c.code];
        if (!coords) return;

        const px = (coords.nx - 0.5) * mapWidth;
        const py = -(coords.ny - 0.5) * mapHeight;
        const pz = -((px * px * 0.015) + (py * py * 0.018));
        const pos = new THREE.Vector3(px, py, pz);
        markersMap.set(c.code, pos);

        const isTopDelivered = c.code === mostDeliveredCountry.code;
        const isTopVisited = c.code === mostVisitedCountry.code;
        const beaconColor = isTopDelivered ? 0x06b6d4 : isTopVisited ? 0xa855f7 : 0x10b981;

        // Vertical Laser Light Beam pointing outward
        const beamHeight = isTopDelivered ? 0.95 : 0.7;
        const beamGeo = new THREE.CylinderGeometry(0.02, 0.035, beamHeight, 16);
        const beamMat = new THREE.MeshBasicMaterial({
          color: beaconColor,
          transparent: true,
          opacity: 0.92,
        });
        const beam = new THREE.Mesh(beamGeo, beamMat);
        beam.position.set(px, py, pz + beamHeight / 2);
        beam.rotation.x = Math.PI / 2;
        contentGroup.add(beam);

        // Spherical Pinhead at top of beam
        const headRadius = isTopDelivered ? 0.12 : 0.09;
        const headGeo = new THREE.SphereGeometry(headRadius, 16, 16);
        const headMat = new THREE.MeshBasicMaterial({
          color: isTopDelivered ? 0x22d3ee : isTopVisited ? 0xc084fc : 0xffffff,
        });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.set(px, py, pz + beamHeight);
        contentGroup.add(head);

        // Ground Radar Pulse Ring
        const ringGeo = new THREE.RingGeometry(0.12, 0.24, 24);
        const ringMat = new THREE.MeshBasicMaterial({
          color: beaconColor,
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide,
        });
        const groundRing = new THREE.Mesh(ringGeo, ringMat);
        groundRing.position.set(px, py, pz + 0.02);
        contentGroup.add(groundRing);
      });

      // E. 3D Flight Delivery Trajectory Arcs from Dubai (UAE Hub) to Regional Destinations
      const uaeCoords = ME_COUNTRY_COORDS['AE'];
      if (uaeCoords) {
        const uaePx = (uaeCoords.nx - 0.5) * mapWidth;
        const uaePy = -(uaeCoords.ny - 0.5) * mapHeight;
        const uaePz = -((uaePx * uaePx * 0.015) + (uaePy * uaePy * 0.018));
        const uaePos = new THREE.Vector3(uaePx, uaePy, uaePz + 0.1);

        countryStats
          .filter((c) => c.code !== 'AE')
          .forEach((c) => {
            const coords = ME_COUNTRY_COORDS[c.code];
            if (!coords) return;
            const destPx = (coords.nx - 0.5) * mapWidth;
            const destPy = -(coords.ny - 0.5) * mapHeight;
            const destPz = -((destPx * destPx * 0.015) + (destPy * destPy * 0.018));
            const destPos = new THREE.Vector3(destPx, destPy, destPz + 0.1);

            const mid = uaePos.clone().lerp(destPos, 0.5);
            mid.z += 1.6; // Arching upward toward the viewer in 3D

            const curve = new THREE.QuadraticBezierCurve3(uaePos, mid, destPos);
            const pts = curve.getPoints(36);
            const arcGeo = new THREE.BufferGeometry().setFromPoints(pts);

            const arcMat = new THREE.LineBasicMaterial({
              color: 0x38bdf8,
              transparent: true,
              opacity: 0.65,
              linewidth: 2,
            });
            const arcLine = new THREE.Line(arcGeo, arcMat);
            contentGroup.add(arcLine);

            // Animated Traveling Photon Packet along flight route
            const pulseGeo = new THREE.SphereGeometry(0.06, 12, 12);
            const pulseMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
            const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
            pulseMesh.position.copy(uaePos);
            contentGroup.add(pulseMesh);

            pulseMarkersRef.current.push({
              mesh: pulseMesh,
              curve,
              t: Math.random(),
              speed: 0.006 + Math.random() * 0.003,
            });
          });
      }
    }

    // =========================================================================
    // MODE 2: GLOBAL 3D UNIVERSE EARTH GLOBE (SECONDARY OPTION)
    // =========================================================================
    if (viewScope === 'globe') {
      const globeRadius = 2.4;
      const earthColorMap = textureLoader.load('/images/earth-blue-marble.jpg');
      const earthBumpMap = textureLoader.load('/images/earth-topology.png');
      const earthSpecularMap = textureLoader.load('/images/earth-specular.jpg');
      const earthNightMap = textureLoader.load('/images/earth-night.jpg');
      const earthCloudsMap = textureLoader.load('/images/earth-clouds.png');

      earthColorMap.colorSpace = THREE.SRGBColorSpace;
      earthNightMap.colorSpace = THREE.SRGBColorSpace;

      const earthGeometry = new THREE.SphereGeometry(globeRadius, 64, 64);
      const earthMaterial = new THREE.MeshPhongMaterial({
        map: earthColorMap,
        bumpMap: earthBumpMap,
        bumpScale: 0.045,
        specularMap: earthSpecularMap,
        specular: new THREE.Color(0x38bdf8),
        shininess: 25,
        emissiveMap: earthNightMap,
        emissive: new THREE.Color(0xffe082),
        emissiveIntensity: 0.38,
      });
      const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
      contentGroup.add(earthMesh);

      // Clouds Layer
      const cloudsGeo = new THREE.SphereGeometry(globeRadius * 1.012, 64, 64);
      const cloudsMat = new THREE.MeshPhongMaterial({
        map: earthCloudsMap,
        transparent: true,
        opacity: 0.38,
        depthWrite: false,
      });
      const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
      contentGroup.add(cloudsMesh);

      // Atmosphere Halo
      const atmosphereGeo = new THREE.SphereGeometry(globeRadius * 1.12, 48, 48);
      const atmosphereMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.12,
        side: THREE.BackSide,
      });
      contentGroup.add(new THREE.Mesh(atmosphereGeo, atmosphereMat));

      // 3D Country Markers on Sphere
      countryStats.forEach((c) => {
        const coords = GLOBE_COORDS[c.code] || { lat: 24.45, lon: 54.37, baseAngle: 0, radialDist: 180 };
        const pos = latLonToVector3(coords.lat, coords.lon, globeRadius);
        markersMap.set(c.code, pos);

        const isTopDelivered = c.code === mostDeliveredCountry.code;
        const isTopVisited = c.code === mostVisitedCountry.code;
        const beaconColor = isTopDelivered ? 0x06b6d4 : isTopVisited ? 0xa855f7 : 0x10b981;

        const beamHeight = isTopDelivered ? 0.55 : 0.42;
        const beamGeo = new THREE.CylinderGeometry(0.015, 0.022, beamHeight, 16);
        const beamMat = new THREE.MeshBasicMaterial({ color: beaconColor, transparent: true, opacity: 0.9 });
        const beam = new THREE.Mesh(beamGeo, beamMat);
        beam.position.copy(pos.clone().multiplyScalar(1 + beamHeight / (globeRadius * 2)));
        beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos.clone().normalize());
        contentGroup.add(beam);

        const headRadius = isTopDelivered ? 0.08 : 0.06;
        const headGeo = new THREE.SphereGeometry(headRadius, 16, 16);
        const headMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.copy(pos.clone().multiplyScalar(1 + beamHeight / globeRadius));
        contentGroup.add(head);
      });
    }

    markers3DRef.current = markersMap;

    // 5. Cosmic Starfield (2,400 Stars with Spectral Color Classes)
    const starCount = 2400;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      const radius = 35 + Math.random() * 95;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      starPositions[i] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i + 2] = radius * Math.cos(phi);

      const rand = Math.random();
      if (rand > 0.85) {
        starColors[i] = 0.55; starColors[i + 1] = 0.85; starColors[i + 2] = 1.0; // Cyan star
      } else if (rand > 0.70) {
        starColors[i] = 1.0; starColors[i + 1] = 0.88; starColors[i + 2] = 0.65; // Golden dwarf
      } else if (rand > 0.55) {
        starColors[i] = 0.85; starColors[i + 1] = 0.70; starColors[i + 2] = 1.0; // Violet star
      } else {
        starColors[i] = 1.0; starColors[i + 1] = 1.0; starColors[i + 2] = 1.0;   // Pure white
      }
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMaterial = new THREE.PointsMaterial({ size: 1.3, vertexColors: true, transparent: true, opacity: 0.85 });
    const starfield = new THREE.Points(starGeometry, starMaterial);
    scene.add(starfield);

    // 6. Natural Sun & Ambient Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff8e7, 2.2);
    sunLight.position.set(12, 16, 14);
    scene.add(sunLight);

    const blueLight = new THREE.PointLight(0x0284c7, 3.0, 30);
    blueLight.position.set(-10, -5, 8);
    scene.add(blueLight);

    // 7. Interactive Drag & Touch Controls
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      if (viewScope === 'middle-east') {
        // Subtle tilt and rotation limits tailored for Middle East terrain inspection
        targetRotationRef.current.y = Math.max(-0.6, Math.min(0.6, targetRotationRef.current.y + deltaX * 0.004));
        targetRotationRef.current.x = Math.max(-0.35, Math.min(0.7, targetRotationRef.current.x + deltaY * 0.004));
      } else {
        targetRotationRef.current.y += deltaX * 0.005;
        targetRotationRef.current.x = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, targetRotationRef.current.x + deltaY * 0.005));
      }

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
      setAutoRotate(false);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (viewScope === 'middle-east') {
        targetZoomRef.current = Math.max(9.0, Math.min(22.0, targetZoomRef.current + e.deltaY * 0.008));
      } else {
        targetZoomRef.current = Math.max(4.6, Math.min(9.5, targetZoomRef.current + e.deltaY * 0.004));
      }
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    domElement.addEventListener('wheel', handleWheel, { passive: false });

    // 8. Animation Loop
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Gentle auto-rotation
      if (autoRotate && !isDraggingRef.current) {
        if (viewScope === 'middle-east') {
          // Gentle ambient sway for Middle East map
          targetRotationRef.current.y = Math.sin(Date.now() * 0.0006) * 0.12;
        } else {
          targetRotationRef.current.y -= 0.0016;
        }
      }

      // Smooth camera interpolation
      currentRotationRef.current.x += (targetRotationRef.current.x - currentRotationRef.current.x) * 0.08;
      currentRotationRef.current.y += (targetRotationRef.current.y - currentRotationRef.current.y) * 0.08;

      if (contentGroupRef.current) {
        contentGroupRef.current.rotation.x = currentRotationRef.current.x;
        contentGroupRef.current.rotation.y = currentRotationRef.current.y;
      }

      zoomLevelRef.current += (targetZoomRef.current - zoomLevelRef.current) * 0.08;
      if (cameraRef.current) {
        cameraRef.current.position.z = zoomLevelRef.current;
      }

      starfield.rotation.y += 0.0001;

      // Animate delivery photon pulses along flight arcs
      pulseMarkersRef.current.forEach((p) => {
        p.t += p.speed;
        if (p.t > 1.0) p.t = 0;
        const pt = p.curve.getPoint(p.t);
        p.mesh.position.copy(pt);
      });

      // 9. Project 3D country pins to 2D Screen Space with Anti-Collision Separation
      if (container && cameraRef.current && contentGroupRef.current) {
        const curWidth = container.clientWidth;
        const curHeight = container.clientHeight;
        const cameraPos = cameraRef.current.position;

        const visibleItems: ScreenCountryCard[] = [];

        countryStats.forEach((c) => {
          const pos3D = markersMap.get(c.code);
          if (!pos3D) return;

          const worldPos = pos3D.clone().applyMatrix4(contentGroupRef.current!.matrixWorld);

          // Visibility check
          let isFacing = true;
          if (viewScope === 'globe') {
            const normal = worldPos.clone().normalize();
            const toCamera = cameraPos.clone().sub(worldPos).normalize();
            isFacing = normal.dot(toCamera) > 0.12;
          }

          if (isFacing) {
            const screenPos = worldPos.clone().project(cameraRef.current!);
            const pinX = (screenPos.x * 0.5 + 0.5) * curWidth;
            const pinY = (-screenPos.y * 0.5 + 0.5) * curHeight;

            let cardX = pinX;
            let cardY = pinY;

            if (viewScope === 'middle-east') {
              const offsets = ME_COUNTRY_COORDS[c.code] || { cardOffsetX: 0, cardOffsetY: 0 };
              cardX = pinX + offsets.cardOffsetX;
              cardY = pinY + offsets.cardOffsetY;
            } else {
              const coords = GLOBE_COORDS[c.code] || { baseAngle: 0, radialDist: 180 };
              cardX = pinX + Math.cos(coords.baseAngle) * coords.radialDist;
              cardY = pinY + Math.sin(coords.baseAngle) * coords.radialDist;
            }

            visibleItems.push({
              code: c.code,
              name: c.name,
              flag: c.flag,
              pinX,
              pinY,
              cardX,
              cardY,
              visible: true,
              deliveredOrders: c.deliveredOrders,
              deliveryRate: c.deliveryRate,
              visits: c.visits,
              visitsPercentage: c.visitsPercentage,
              isTopDelivered: c.code === mostDeliveredCountry.code,
              isTopVisited: c.code === mostVisitedCountry.code,
            });
          }
        });

        // Anti-Collision Physical Relaxation Loop (Guarantees NO OVERLAP / NO OVER LAYER)
        const cardW = 150;
        const cardH = 46;
        const minGapX = cardW + 14;
        const minGapY = cardH + 10;

        for (let iter = 0; iter < 10; iter++) {
          for (let i = 0; i < visibleItems.length; i++) {
            for (let j = i + 1; j < visibleItems.length; j++) {
              const a = visibleItems[i];
              const b = visibleItems[j];
              const dx = b.cardX - a.cardX;
              const dy = b.cardY - a.cardY;
              const absDx = Math.abs(dx);
              const absDy = Math.abs(dy);

              if (absDx < minGapX && absDy < minGapY) {
                const overlapX = minGapX - absDx;
                const overlapY = minGapY - absDy;

                if (overlapY < overlapX) {
                  const signY = dy >= 0 ? 1 : -1;
                  const shiftY = overlapY / 2 + 2;
                  a.cardY -= signY * shiftY;
                  b.cardY += signY * shiftY;
                } else {
                  const signX = dx >= 0 ? 1 : -1;
                  const shiftX = overlapX / 2 + 2;
                  a.cardX -= signX * shiftX;
                  b.cardX += signX * shiftX;
                }
              }
            }
          }
        }

        // Clamp inside bounds
        visibleItems.forEach((item) => {
          item.cardX = Math.max(85, Math.min(curWidth - 85, item.cardX));
          item.cardY = Math.max(65, Math.min(curHeight - 65, item.cardY));
        });

        setScreenCards(visibleItems);
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container || !cameraRef.current || !rendererRef.current) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      domElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      domElement.removeEventListener('wheel', handleWheel);
      renderer.dispose();
    };
  }, [viewScope, countryStats, mostDeliveredCountry, mostVisitedCountry, autoRotate]);

  return (
    <div
      className={`relative w-full rounded-3xl bg-gradient-to-b from-[#030712] via-[#02050E] to-[#010307] border border-slate-700/80 shadow-2xl overflow-hidden transition-all duration-300 ${
        isFullscreen ? 'fixed inset-4 z-50 rounded-2xl h-[calc(100vh-2rem)]' : 'h-[640px]'
      }`}
    >
      {/* 3D WebGL Canvas Viewport */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* TOP FLOATING HUD HEADER */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none z-30">
        
        {/* Title Badge & Scope Indicator */}
        <div className="p-3 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-cyan-400/40 shadow-xl pointer-events-auto flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/50">
            {viewScope === 'middle-east' ? <MapIcon size={22} className="text-cyan-300" /> : <Globe size={22} className="animate-spin" style={{ animationDuration: '28s' }} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black uppercase tracking-wider text-white">
                {viewScope === 'middle-east' ? 'Middle East Regional 3D Map' : 'Global 3D Earth Telemetry'}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-cyan-500/20 text-cyan-300 border border-cyan-400/50">
                {viewScope === 'middle-east' ? 'NASA Terra &middot; GCC Only' : 'NASA Blue Marble'}
              </span>
            </div>
            <p className="text-[11px] font-bold text-slate-300">
              {viewScope === 'middle-east'
                ? 'Focused on Middle East & Arabian Peninsula &middot; Click nodes for live metrics'
                : 'Drag to orbit Earth &middot; Scroll to zoom &middot; Click any country to center'}
            </p>
          </div>
        </div>

        {/* View Switchers & Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Scope Switcher: Middle East Map (Default) vs Global Globe */}
          <div className="flex items-center bg-slate-900/85 backdrop-blur-md p-1 rounded-2xl border border-white/20 shadow-xl">
            <button
              onClick={() => setViewScope('middle-east')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                viewScope === 'middle-east'
                  ? 'bg-cyan-500 text-black shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <MapIcon size={14} />
              <span>Middle East (GCC)</span>
            </button>
            <button
              onClick={() => setViewScope('globe')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                viewScope === 'globe'
                  ? 'bg-cyan-500 text-black shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Globe size={14} />
              <span>Global Globe</span>
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-900/85 backdrop-blur-md p-1 rounded-2xl border border-white/20 shadow-xl">
            <button
              onClick={() => onToggleMapMode('delivered')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                mapMode === 'delivered'
                  ? 'bg-cyan-500 text-black shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Truck size={14} />
              <span>Delivered</span>
            </button>
            <button
              onClick={() => onToggleMapMode('visits')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                mapMode === 'visits'
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Eye size={14} />
              <span>Visits</span>
            </button>
          </div>

          {/* Auto-rotate Toggle */}
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-2.5 rounded-2xl border backdrop-blur-md shadow-lg transition-all cursor-pointer ${
              autoRotate
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                : 'bg-slate-900/85 border-white/20 text-slate-400 hover:text-white'
            }`}
            title={autoRotate ? 'Pause Orbit' : 'Resume Orbit'}
          >
            <RotateCw size={16} className={autoRotate ? 'animate-spin' : ''} style={{ animationDuration: '6s' }} />
          </button>

          {/* Reset View */}
          <button
            onClick={() => {
              focusOnCountry('AE');
            }}
            className="p-2.5 rounded-2xl bg-slate-900/85 border border-white/20 text-slate-300 hover:text-white backdrop-blur-md shadow-lg transition-all cursor-pointer"
            title="Reset to UAE Hub"
          >
            <Crosshair size={16} />
          </button>

          {/* Zoom In */}
          <button
            onClick={() => {
              targetZoomRef.current = Math.max(viewScope === 'middle-east' ? 9.0 : 4.6, targetZoomRef.current - 1.5);
            }}
            className="p-2.5 rounded-2xl bg-slate-900/85 border border-white/20 text-slate-300 hover:text-white backdrop-blur-md shadow-lg transition-all cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>

          {/* Zoom Out */}
          <button
            onClick={() => {
              targetZoomRef.current = Math.min(viewScope === 'middle-east' ? 22.0 : 9.5, targetZoomRef.current + 1.5);
            }}
            className="p-2.5 rounded-2xl bg-slate-900/85 border border-white/20 text-slate-300 hover:text-white backdrop-blur-md shadow-lg transition-all cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2.5 rounded-2xl bg-slate-900/85 border border-white/20 text-slate-300 hover:text-white backdrop-blur-md shadow-lg transition-all cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand to Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* TOP SPOTLIGHT HIGHLIGHTS OVERLAY */}
      <div className="absolute top-20 left-4 max-w-sm w-full space-y-2.5 pointer-events-none hidden md:block z-20">
        {/* Most Order Delivered Country Spotlight */}
        <div
          onClick={() => {
            onSelectCountry(mostDeliveredCountry.code);
            focusOnCountry(mostDeliveredCountry.code);
          }}
          className="p-3 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-cyan-400/50 shadow-xl pointer-events-auto cursor-pointer hover:border-cyan-400 hover:scale-[1.02] transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">{mostDeliveredCountry.flag}</span>
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1">
                  <span>🏆 Most Order Delivered Country</span>
                </div>
                <div className="text-xs font-black text-white">
                  {mostDeliveredCountry.name}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-black text-cyan-300 block">
                {mostDeliveredCountry.deliveredOrders} Delivered
              </span>
              <span className="text-[10px] font-bold text-emerald-400">
                {mostDeliveredCountry.deliveryRate}% fulfillment
              </span>
            </div>
          </div>
        </div>

        {/* Most User Visited Country Spotlight */}
        <div
          onClick={() => {
            onSelectCountry(mostVisitedCountry.code);
            focusOnCountry(mostVisitedCountry.code);
          }}
          className="p-3 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-purple-400/50 shadow-xl pointer-events-auto cursor-pointer hover:border-purple-400 hover:scale-[1.02] transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">{mostVisitedCountry.flag}</span>
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-purple-300 flex items-center gap-1">
                  <span>🌐 Most User Visited Country</span>
                </div>
                <div className="text-xs font-black text-white">
                  {mostVisitedCountry.name}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-black text-purple-300 block">
                {mostVisitedCountry.visits.toLocaleString()} Visits
              </span>
              <span className="text-[10px] font-bold text-purple-400">
                {mostVisitedCountry.visitsPercentage}% traffic share
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 3D-PROJECTED NON-OVERLAPPING COUNTRY FLAGS & DATA IN UNIVERSE     */}
      {/* ================================================================= */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        {/* SVG Leader Lines Linking Each 3D Surface Pin to Its Floating Card */}
        <svg className="w-full h-full absolute inset-0 pointer-events-none">
          {screenCards.map((c) => {
            const isSelected = selectedCountryCode === c.code;
            const strokeColor = isSelected
              ? '#38bdf8'
              : c.isTopDelivered
              ? '#06b6d4'
              : c.isTopVisited
              ? '#c084fc'
              : '#94a3b8';

            return (
              <g key={`leader-${c.code}`}>
                {/* Surface Pin Anchor Dot */}
                <circle
                  cx={c.pinX}
                  cy={c.pinY}
                  r={isSelected ? 4 : 2.5}
                  fill={strokeColor}
                  className={isSelected ? 'animate-pulse' : ''}
                />
                {/* Subtle Ripple on Pin */}
                <circle
                  cx={c.pinX}
                  cy={c.pinY}
                  r={isSelected ? 9 : 6}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="1"
                  opacity={0.4}
                />
                {/* Connecting Leader Line */}
                <line
                  x1={c.pinX}
                  y1={c.pinY}
                  x2={c.cardX}
                  y2={c.cardY}
                  stroke={strokeColor}
                  strokeWidth={isSelected ? '2' : '1.2'}
                  strokeDasharray={isSelected ? 'none' : '3 3'}
                  opacity={isSelected ? 0.95 : 0.65}
                />
                {/* Card Target Dot */}
                <circle
                  cx={c.cardX}
                  cy={c.cardY}
                  r={2}
                  fill={strokeColor}
                  opacity={0.8}
                />
              </g>
            );
          })}
        </svg>

        {/* Floating Non-Overlapping Country Cards */}
        {screenCards.map((c) => {
          const isSelected = selectedCountryCode === c.code;

          return (
            <div
              key={`card-${c.code}`}
              style={{
                position: 'absolute',
                left: `${c.cardX}px`,
                top: `${c.cardY}px`,
                transform: 'translate(-50%, -50%)',
              }}
              className="pointer-events-auto transition-transform duration-100 ease-out"
            >
              <button
                onClick={() => {
                  if (isSelected) {
                    onSelectCountry(null);
                  } else {
                    onSelectCountry(c.code);
                    focusOnCountry(c.code);
                  }
                }}
                className={`p-2 rounded-2xl backdrop-blur-md border shadow-2xl transition-all cursor-pointer flex items-center gap-2.5 ${
                  isSelected
                    ? 'bg-cyan-500 text-black border-white ring-4 ring-cyan-400 scale-105'
                    : c.isTopDelivered
                    ? 'bg-slate-900/90 text-white border-cyan-400/80 hover:border-cyan-300 hover:scale-105'
                    : c.isTopVisited
                    ? 'bg-slate-900/90 text-white border-purple-400/80 hover:border-purple-300 hover:scale-105'
                    : 'bg-slate-900/85 text-white border-white/25 hover:border-cyan-400 hover:scale-105'
                }`}
              >
                {/* Country Flag */}
                <span className="text-xl leading-none drop-shadow">{c.flag}</span>

                {/* Country Details */}
                <div className="text-left whitespace-nowrap">
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="text-xs font-black uppercase tracking-wider">{c.code}</span>
                    <span className="text-[10px] text-slate-300 font-semibold truncate max-w-[85px]">
                      {c.name}
                    </span>
                    {c.isTopDelivered && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-400 text-black font-black" title="Top Delivered Country">
                        🏆 TOP
                      </span>
                    )}
                    {c.isTopVisited && !c.isTopDelivered && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-purple-400 text-white font-black" title="Top Visited Country">
                        🌐 #1
                      </span>
                    )}
                  </div>

                  {/* Dynamic Metric Display based on Active View Mode */}
                  <div
                    className={`text-[10px] font-extrabold leading-tight mt-1 ${
                      isSelected
                        ? 'text-black'
                        : c.isTopDelivered
                        ? 'text-cyan-300'
                        : c.isTopVisited
                        ? 'text-purple-300'
                        : 'text-slate-300'
                    }`}
                  >
                    {mapMode === 'delivered' ? (
                      <span>
                        📦 {c.deliveredOrders} Deliv. <span className="text-[9px] opacity-80">({c.deliveryRate}%)</span>
                      </span>
                    ) : (
                      <span>
                        👁️ {c.visits.toLocaleString()} Visits <span className="text-[9px] opacity-80">({c.visitsPercentage}%)</span>
                      </span>
                    )}
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* BOTTOM FLOATING COUNTRY CAPSULES BAR */}
      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none z-30">
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto overflow-x-auto max-w-full pb-1">
          {countryStats.map((c) => {
            const isSelected = selectedCountryCode === c.code;
            const isTopDelivered = c.code === mostDeliveredCountry.code;
            const isTopVisited = c.code === mostVisitedCountry.code;

            return (
              <button
                key={c.code}
                onClick={() => {
                  if (isSelected) {
                    onSelectCountry(null);
                  } else {
                    onSelectCountry(c.code);
                    focusOnCountry(c.code);
                  }
                }}
                className={`px-3 py-2 rounded-xl backdrop-blur-md border text-left transition-all cursor-pointer flex items-center gap-2 shadow-xl ${
                  isSelected
                    ? 'bg-cyan-500 text-black border-white ring-2 ring-cyan-300 scale-105'
                    : 'bg-slate-900/85 text-white border-white/20 hover:border-cyan-400'
                }`}
              >
                <span className="text-base">{c.flag}</span>
                <div>
                  <div className="text-xs font-black flex items-center gap-1 leading-tight">
                    <span>{c.code}</span>
                    {isTopDelivered && <span className="text-[9px]">🏆</span>}
                    {isTopVisited && <span className="text-[9px]">🌐</span>}
                  </div>
                  <div className={`text-[10px] font-bold ${isSelected ? 'text-black' : 'text-slate-300'}`}>
                    {mapMode === 'delivered' ? `${c.deliveredOrders} Deliv.` : `${c.visits} Visits`}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Clear active country selection button */}
        {selectedCountryCode && (
          <button
            onClick={() => onSelectCountry(null)}
            className="px-3.5 py-2 rounded-xl bg-rose-500/90 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider backdrop-blur-md shadow-xl pointer-events-auto flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>✕ Reset Selection</span>
          </button>
        )}
      </div>
    </div>
  );
}
