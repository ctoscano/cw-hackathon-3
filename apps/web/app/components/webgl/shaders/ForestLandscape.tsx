"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useReducedMotion } from "../hooks/useReducedMotion";

interface ForestLandscapeProps {
  speed?: number;
}

// Misty forest with volumetric fog and god rays
export function ForestLandscape({ speed = 0.3 }: ForestLandscapeProps) {
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

    const float PI = 3.141592653589793;
    const mat2 m = mat2(0.80, 0.60, -0.60, 0.80);

    // Hash functions
    float hash(float n) {
      return fract(sin(n) * 43758.5453123);
    }

    float hash2(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    // 2D Noise
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float n = i.x + i.y * 57.0;
      return mix(
        mix(hash(n), hash(n + 1.0), f.x),
        mix(hash(n + 57.0), hash(n + 58.0), f.x),
        f.y
      );
    }

    // FBM
    float fbm(vec2 p) {
      float f = 0.0;
      f += 0.5000 * noise(p); p = m * p * 2.02;
      f += 0.2500 * noise(p); p = m * p * 2.03;
      f += 0.1250 * noise(p); p = m * p * 2.01;
      f += 0.0625 * noise(p);
      return f / 0.9375;
    }

    // Pine tree silhouette - classic triangular shape
    float tree(vec2 uv, float x, float height, float width) {
      vec2 p = uv - vec2(x, 0.0);

      // Trunk
      float trunkW = width * 0.12;
      float trunk = smoothstep(trunkW, trunkW * 0.7, abs(p.x)) *
                    step(0.0, p.y) * step(p.y, height * 0.25);

      // Main triangular canopy - single clean triangle
      float canopy = 0.0;
      float baseY = height * 0.1;
      float canopyH = height * 0.95;
      float y = p.y - baseY;

      if(y > 0.0 && y < canopyH) {
        float t = y / canopyH;
        float w = width * (1.0 - t * 0.95);
        canopy = smoothstep(w + 0.003, w - 0.003, abs(p.x));
      }

      return max(trunk, canopy);
    }

    // Forest layer - more trees, larger sizes
    float forestLayer(vec2 uv, float baseY, float scale, float seed) {
      float forest = 0.0;

      for(float i = 0.0; i < 18.0; i++) {
        float treeSeed = seed + i * 73.0;
        float x = hash(treeSeed) * 1.4 - 0.2;
        float h = (0.15 + hash(treeSeed + 1.0) * 0.2) * scale;
        float w = (0.025 + hash(treeSeed + 2.0) * 0.02) * scale;

        forest = max(forest, tree(uv, x, baseY + h, w));
      }

      return forest;
    }

    // Volumetric light rays
    float godRays(vec2 uv, vec2 lightPos, float time) {
      vec2 delta = uv - lightPos;
      float dist = length(delta);
      float angle = atan(delta.y, delta.x);

      // Multiple ray frequencies
      float rays = 0.0;
      rays += sin(angle * 6.0 + time * 0.1) * 0.5 + 0.5;
      rays += sin(angle * 10.0 - time * 0.15) * 0.3 + 0.3;
      rays += sin(angle * 15.0 + time * 0.08) * 0.2 + 0.2;

      // Fade with distance
      rays *= exp(-dist * 1.2);

      // Noise variation
      rays *= 0.7 + fbm(vec2(angle * 3.0, time * 0.1)) * 0.6;

      return rays * 0.4;
    }

    // Fog layers
    float fog(vec2 uv, float time, float layer) {
      vec2 fogUv = uv * vec2(2.0, 1.0) + vec2(time * 0.02 * layer, 0.0);
      float f = fbm(fogUv * 3.0 + layer * 10.0);
      f *= fbm(fogUv * 6.0 - layer * 5.0);
      return f;
    }

    void main() {
      vec2 uv = vUv;
      float time = uTime;
      float aspect = uResolution.x / uResolution.y;

      // Light source position (morning sun, upper right)
      vec2 lightPos = vec2(0.75, 0.9);

      // === SKY ===
      // Deeper, more saturated morning gradient
      vec3 skyTop = vec3(0.35, 0.5, 0.7);
      vec3 skyMid = vec3(0.7, 0.55, 0.45);
      vec3 skyLow = vec3(0.9, 0.7, 0.5);

      float skyGrad = pow(uv.y, 0.6);
      vec3 sky = mix(skyLow, skyMid, smoothstep(0.2, 0.5, skyGrad));
      sky = mix(sky, skyTop, smoothstep(0.5, 1.0, skyGrad));

      // Sun glow - reduced intensity
      float sunDist = length((uv - lightPos) * vec2(1.0, 1.3));
      float sunCore = smoothstep(0.05, 0.03, sunDist);
      float sunGlow1 = exp(-sunDist * 6.0) * 0.5;
      float sunGlow2 = exp(-sunDist * 2.5) * 0.25;

      sky = mix(sky, vec3(1.0, 0.95, 0.85), sunCore);
      sky += vec3(1.0, 0.9, 0.7) * sunGlow1;
      sky += vec3(1.0, 0.8, 0.5) * sunGlow2;

      // God rays in sky - reduced
      float rays = godRays(uv, lightPos, time);
      sky += vec3(1.0, 0.9, 0.7) * rays * 0.7;

      vec3 color = sky;

      // === DISTANT HILLS ===
      float hills = fbm(vec2(uv.x * 2.0 + 5.0, 0.0)) * 0.1 + 0.55;
      float hillMask = smoothstep(hills + 0.02, hills - 0.02, uv.y);
      vec3 hillColor = vec3(0.35, 0.42, 0.45);
      color = mix(color, hillColor, hillMask * 0.8);

      // === BACK FOREST LAYER (distant, more faded) ===
      float backForest = forestLayer(uv, 0.45, 0.6, 100.0);
      vec3 backTreeColor = vec3(0.25, 0.32, 0.35);
      // Light atmospheric perspective
      backTreeColor = mix(backTreeColor, vec3(0.45, 0.5, 0.52), 0.3);
      color = mix(color, backTreeColor, backForest * 0.9);

      // Subtle mist band
      float fog1 = fog(uv, time, 1.0);
      float fogMask1 = smoothstep(0.6, 0.4, uv.y) * smoothstep(0.3, 0.45, uv.y);
      color = mix(color, vec3(0.55, 0.58, 0.55), fog1 * fogMask1 * 0.2);

      // === MID FOREST LAYER ===
      float midForest = forestLayer(uv, 0.3, 0.85, 200.0);
      vec3 midTreeColor = vec3(0.12, 0.18, 0.15);
      midTreeColor = mix(midTreeColor, vec3(0.25, 0.3, 0.28), 0.2);
      color = mix(color, midTreeColor, midForest * 0.95);

      // Light mist
      float fog2 = fog(uv, time * 1.2, 2.0);
      float fogMask2 = smoothstep(0.4, 0.2, uv.y) * smoothstep(0.1, 0.25, uv.y);
      color = mix(color, vec3(0.5, 0.55, 0.5), fog2 * fogMask2 * 0.15);

      // Subtle god rays
      color += vec3(1.0, 0.9, 0.7) * rays * fogMask2 * 0.08;

      // === NEAR FOREST LAYER ===
      float nearForest = forestLayer(uv, 0.12, 1.1, 300.0);
      vec3 nearTreeColor = vec3(0.06, 0.1, 0.08);
      color = mix(color, nearTreeColor, nearForest * 0.98);

      // === FOREGROUND SILHOUETTE TREES ===
      float leftTree = tree(uv, -0.03, 0.85, 0.12);
      float rightTree = tree(uv, 1.02, 0.78, 0.11);
      float edgeTree = tree(uv, 0.85, 0.6, 0.08);
      float extraTree = tree(uv, 0.15, 0.55, 0.07);

      vec3 silhouetteColor = vec3(0.02, 0.04, 0.03);
      float allForeground = max(max(max(leftTree, rightTree), edgeTree), extraTree);
      color = mix(color, silhouetteColor, allForeground * 0.99);

      // === GROUND ===
      float groundY = 0.08 + fbm(vec2(uv.x * 5.0, 0.0)) * 0.015;
      if(uv.y < groundY + 0.02) {
        vec3 groundColor = vec3(0.15, 0.18, 0.12);

        // Grass variation
        float grassNoise = noise(uv * vec2(80.0, 40.0) + time * 0.3);
        groundColor += vec3(0.05, 0.08, 0.03) * grassNoise * 0.4;

        // Ground fog
        float groundFog = smoothstep(0.0, 0.06, uv.y);
        groundColor = mix(vec3(0.8, 0.82, 0.78), groundColor, groundFog);

        color = mix(groundColor, color, smoothstep(groundY - 0.01, groundY + 0.02, uv.y));
      }

      // === POST PROCESSING ===

      // Warm morning tint - subtle
      color = mix(color, color * vec3(1.05, 1.0, 0.95), 0.2);

      // Add contrast - darken shadows, preserve highlights
      color = pow(color, vec3(1.1));
      color = color * 1.05 - 0.02;
      color = clamp(color, 0.0, 1.0);

      // Vignette - stronger
      float vignette = 1.0 - length((uv - 0.5) * vec2(0.9, 1.1)) * 0.4;
      color *= vignette;

      // Very subtle film grain
      float grain = hash2(uv * 500.0 + time) * 0.012;
      color += grain - 0.006;

      // Final sun influence - reduced
      float sunInfluence = exp(-length(uv - lightPos) * 2.0) * 0.05;
      color += vec3(1.0, 0.85, 0.6) * sunInfluence;

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
