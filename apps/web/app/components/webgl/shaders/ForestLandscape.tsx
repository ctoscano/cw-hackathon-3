"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useReducedMotion } from "../hooks/useReducedMotion";

interface ForestLandscapeProps {
  speed?: number;
}

export function ForestLandscape({ speed = 0.2 }: ForestLandscapeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { invalidate, size } = useThree();
  const reducedMotion = useReducedMotion();

  const actualSpeed = reducedMotion ? 0 : speed;

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
    }),
    [size.width, size.height],
  );

  useFrame((state, delta) => {
    uniforms.uTime.value += delta * actualSpeed;
    uniforms.uResolution.value.set(state.size.width, state.size.height);
    invalidate();
  });

  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    precision mediump float;

    varying vec2 vUv;
    uniform float uTime;
    uniform vec2 uResolution;

    // Hash functions
    float hash(float n) { return fract(sin(n) * 43758.5453123); }
    float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }

    // 2D Noise
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      float a = hash2(i);
      float b = hash2(i + vec2(1.0, 0.0));
      float c = hash2(i + vec2(0.0, 1.0));
      float d = hash2(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    // FBM
    float fbm(vec2 p) {
      float value = 0.0;
      float amplitude = 0.5;
      for (int i = 0; i < 5; i++) {
        value += amplitude * noise(p);
        p *= 2.0;
        amplitude *= 0.5;
      }
      return value;
    }

    // Pine tree shape - more realistic
    float pineTree(vec2 uv, float x, float height, float width, float seed) {
      vec2 p = uv - vec2(x, 0.0);

      // Trunk
      float trunkWidth = width * 0.08;
      float trunk = step(abs(p.x), trunkWidth) * step(0.0, p.y) * step(p.y, height * 0.35);

      // Tree canopy - multiple triangular layers
      float tree = 0.0;
      float layers = 5.0;
      for (float i = 0.0; i < 5.0; i++) {
        float layerStart = height * (0.15 + i * 0.15);
        float layerHeight = height * (0.35 - i * 0.04);
        float layerWidth = width * (1.0 - i * 0.12);

        // Add some variation
        float wobble = sin(seed + i * 3.0) * width * 0.05;

        float y = p.y - layerStart;
        if (y > 0.0 && y < layerHeight) {
          float t = y / layerHeight;
          float w = layerWidth * (1.0 - t * 0.9);
          tree = max(tree, step(abs(p.x + wobble), w));
        }
      }

      // Pointed top
      float topY = height * 0.85;
      float topHeight = height * 0.2;
      float topT = (p.y - topY) / topHeight;
      if (topT > 0.0 && topT < 1.0) {
        float topW = width * 0.3 * (1.0 - topT);
        tree = max(tree, step(abs(p.x), topW));
      }

      return max(trunk, tree);
    }

    // Forest layer with varied trees
    float forestLayer(vec2 uv, float baseY, float scale, float density, float seed) {
      float forest = 0.0;

      for (float i = 0.0; i < 15.0; i++) {
        float treeSeed = seed + i * 100.0;
        float x = hash(treeSeed) * 1.4 - 0.2; // Spread across and beyond screen
        float heightVar = hash(treeSeed + 1.0) * 0.5 + 0.5;
        float widthVar = hash(treeSeed + 2.0) * 0.3 + 0.7;

        float treeHeight = (0.15 + heightVar * 0.2) * scale;
        float treeWidth = (0.02 + widthVar * 0.015) * scale;

        forest = max(forest, pineTree(uv, x, baseY + treeHeight, treeWidth, treeSeed));
      }

      return forest;
    }

    // Deer silhouette
    float deer(vec2 uv, vec2 pos, float size) {
      vec2 p = (uv - pos) / size;

      // Body (ellipse)
      float body = smoothstep(0.05, 0.0, length(p * vec2(1.0, 2.0)) - 0.08);

      // Head
      vec2 headP = p - vec2(0.08, 0.04);
      float head = smoothstep(0.02, 0.0, length(headP * vec2(1.2, 1.0)) - 0.025);

      // Neck
      float neck = smoothstep(0.01, 0.0, abs(p.x - 0.05) - 0.015) *
                   step(0.02, p.y) * step(p.y, 0.06);

      // Legs
      float legs = 0.0;
      legs += smoothstep(0.008, 0.0, abs(p.x + 0.04)) * step(-0.08, p.y) * step(p.y, -0.02);
      legs += smoothstep(0.008, 0.0, abs(p.x + 0.0)) * step(-0.08, p.y) * step(p.y, -0.02);
      legs += smoothstep(0.008, 0.0, abs(p.x - 0.04)) * step(-0.08, p.y) * step(p.y, -0.02);

      // Antlers (simple)
      float antlers = 0.0;
      vec2 antlerBase = p - vec2(0.09, 0.065);
      antlers += smoothstep(0.005, 0.0, abs(antlerBase.x - antlerBase.y * 0.5)) *
                 step(0.0, antlerBase.y) * step(antlerBase.y, 0.04);
      antlers += smoothstep(0.005, 0.0, abs(antlerBase.x + antlerBase.y * 0.3)) *
                 step(0.0, antlerBase.y) * step(antlerBase.y, 0.035);

      // Ear
      vec2 earP = p - vec2(0.1, 0.06);
      float ear = smoothstep(0.01, 0.0, length(earP * vec2(2.0, 1.0)) - 0.015);

      return max(max(max(body, head), max(neck, legs)), max(antlers, ear));
    }

    // God rays
    float godRays(vec2 uv, vec2 sunPos, float time) {
      vec2 delta = uv - sunPos;
      float angle = atan(delta.y, delta.x);

      float rays = 0.0;
      rays += sin(angle * 8.0 + time * 0.2) * 0.5 + 0.5;
      rays += sin(angle * 12.0 - time * 0.15) * 0.3 + 0.3;
      rays *= exp(-length(delta) * 1.5);

      return rays * 0.3;
    }

    void main() {
      vec2 uv = vUv;
      float time = uTime;

      // Sun position (top right, partially hidden by trees)
      vec2 sunPos = vec2(0.75, 0.8);

      // === SKY ===
      // Morning sky gradient
      vec3 skyTop = vec3(0.4, 0.55, 0.7);       // Soft blue
      vec3 skyMid = vec3(0.7, 0.65, 0.55);      // Warm transition
      vec3 skyLow = vec3(0.95, 0.85, 0.65);     // Golden horizon

      vec3 skyColor = mix(skyLow, skyMid, smoothstep(0.3, 0.6, uv.y));
      skyColor = mix(skyColor, skyTop, smoothstep(0.6, 1.0, uv.y));

      // Sun and glow
      float sunDist = length((uv - sunPos) * vec2(1.0, 1.2));
      float sun = smoothstep(0.08, 0.07, sunDist);
      float innerGlow = exp(-sunDist * 6.0) * 0.7;
      float outerGlow = exp(-sunDist * 2.0) * 0.4;

      skyColor = mix(skyColor, vec3(1.0, 0.98, 0.9), sun);
      skyColor += vec3(1.0, 0.9, 0.7) * innerGlow;
      skyColor += vec3(1.0, 0.8, 0.5) * outerGlow;

      // God rays
      float rays = godRays(uv, sunPos, time);
      skyColor += vec3(1.0, 0.9, 0.7) * rays;

      vec3 color = skyColor;

      // === DISTANT MOUNTAINS (very faint) ===
      float mountain = fbm(vec2(uv.x * 3.0, 0.0)) * 0.15 + 0.35;
      if (uv.y < mountain) {
        vec3 mountainColor = vec3(0.6, 0.65, 0.7);
        color = mix(mountainColor, color, smoothstep(mountain - 0.1, mountain, uv.y) * 0.5 + 0.3);
      }

      // === FOREST LAYERS ===

      // Far forest (most mist, lightest)
      float farForest = forestLayer(uv, 0.25, 0.5, 15.0, 100.0);
      if (farForest > 0.0) {
        vec3 farTreeColor = vec3(0.35, 0.42, 0.45);
        // Add mist
        farTreeColor = mix(farTreeColor, vec3(0.7, 0.75, 0.75), 0.5);
        color = mix(color, farTreeColor, farForest * 0.7);
      }

      // Mist layer 1 (between far and mid)
      float mist1 = fbm(vec2(uv.x * 2.0 + time * 0.02, uv.y * 3.0));
      mist1 = smoothstep(0.3, 0.6, mist1) * smoothstep(0.5, 0.25, uv.y) * smoothstep(0.1, 0.2, uv.y);
      color = mix(color, vec3(0.85, 0.88, 0.85), mist1 * 0.5);

      // Mid forest
      float midForest = forestLayer(uv, 0.18, 0.7, 12.0, 200.0);
      if (midForest > 0.0) {
        vec3 midTreeColor = vec3(0.2, 0.28, 0.3);
        midTreeColor = mix(midTreeColor, vec3(0.5, 0.55, 0.5), 0.25);
        color = mix(color, midTreeColor, midForest * 0.85);
      }

      // Mist layer 2 (between mid and near)
      float mist2 = fbm(vec2(uv.x * 3.0 + time * 0.03 + 10.0, uv.y * 4.0));
      mist2 = smoothstep(0.35, 0.65, mist2) * smoothstep(0.35, 0.15, uv.y) * smoothstep(0.05, 0.12, uv.y);
      color = mix(color, vec3(0.8, 0.82, 0.78), mist2 * 0.4);

      // Near forest (darkest, most detail)
      float nearForest = forestLayer(uv, 0.1, 1.0, 10.0, 300.0);
      if (nearForest > 0.0) {
        vec3 nearTreeColor = vec3(0.08, 0.12, 0.1);
        color = mix(color, nearTreeColor, nearForest * 0.95);
      }

      // === FOREGROUND TREES (silhouettes) ===
      // Very close large trees on edges
      float leftTree = pineTree(uv, -0.05, 0.7, 0.08, 500.0);
      float rightTree = pineTree(uv, 1.02, 0.65, 0.07, 600.0);
      float edgeTree = pineTree(uv, 0.92, 0.55, 0.05, 700.0);

      float foregroundTrees = max(max(leftTree, rightTree), edgeTree);
      if (foregroundTrees > 0.0) {
        color = mix(color, vec3(0.02, 0.04, 0.03), foregroundTrees * 0.98);
      }

      // === DEER ===
      float deerSilhouette = deer(uv, vec2(0.3, 0.12), 0.15);
      color = mix(color, vec3(0.05, 0.07, 0.05), deerSilhouette * 0.9);

      // === GROUND PLANE ===
      if (uv.y < 0.08) {
        vec3 groundColor = vec3(0.1, 0.12, 0.08);
        // Grass texture
        float grassNoise = noise(uv * vec2(100.0, 50.0) + time * 0.5);
        grassNoise += noise(uv * vec2(200.0, 100.0)) * 0.5;
        groundColor += vec3(0.05, 0.08, 0.03) * grassNoise * 0.3;

        // Ground mist
        float groundMist = smoothstep(0.0, 0.08, uv.y);
        groundColor = mix(vec3(0.7, 0.75, 0.7), groundColor, groundMist);

        color = mix(groundColor, color, smoothstep(0.06, 0.1, uv.y));
      }

      // === POST PROCESSING ===
      // Subtle orange tint from morning light
      color = mix(color, color * vec3(1.1, 1.0, 0.9), 0.2);

      // Vignette
      float vignette = 1.0 - length((uv - 0.5) * vec2(0.7, 1.0)) * 0.4;
      color *= vignette;

      // Film grain
      float grain = hash2(uv * 800.0 + time) * 0.02;
      color += grain - 0.01;

      // Subtle glow from sun direction
      float sunGlow = smoothstep(1.0, 0.0, length(uv - sunPos)) * 0.1;
      color += vec3(1.0, 0.9, 0.7) * sunGlow * 0.15;

      gl_FragColor = vec4(color, 1.0);
    }
  `;

  return (
    <mesh ref={meshRef} scale={[20, 20, 1]}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  );
}
