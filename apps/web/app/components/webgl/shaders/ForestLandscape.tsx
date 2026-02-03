"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useReducedMotion } from "../hooks/useReducedMotion";

interface ForestLandscapeProps {
  speed?: number;
}

// Firewatch-style forest with IQ domain warping for organic detail
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

  // Domain warping + layered parallax for organic forest
  const fragmentShader = `
    precision highp float;

    varying vec2 vUv;
    uniform float uTime;
    uniform vec2 uResolution;

    // ============================================
    // NOISE FUNCTIONS (IQ style)
    // ============================================

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float hash3(vec3 p) {
      return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
    }

    // Smooth value noise
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f); // Smoothstep

      return mix(
        mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), f.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
        f.y
      );
    }

    // FBM with rotation for anisotropic look
    mat2 m = mat2(0.8, 0.6, -0.6, 0.8);

    float fbm(vec2 p) {
      float f = 0.0;
      f += 0.5000 * noise(p); p = m * p * 2.02;
      f += 0.2500 * noise(p); p = m * p * 2.03;
      f += 0.1250 * noise(p); p = m * p * 2.01;
      f += 0.0625 * noise(p);
      return f / 0.9375;
    }

    // ============================================
    // DOMAIN WARPING (IQ technique)
    // Creates organic, natural-looking patterns
    // ============================================

    float warpedFbm(vec2 p, float time) {
      // First warp layer
      vec2 q = vec2(
        fbm(p + vec2(0.0, 0.0)),
        fbm(p + vec2(5.2, 1.3))
      );

      // Second warp layer (nested warping for more organic look)
      vec2 r = vec2(
        fbm(p + 4.0 * q + vec2(1.7, 9.2) + time * 0.05),
        fbm(p + 4.0 * q + vec2(8.3, 2.8) + time * 0.03)
      );

      return fbm(p + 4.0 * r);
    }

    // ============================================
    // ORGANIC TREE SHAPES
    // ============================================

    // Organic pine tree with warped edges
    float tree(vec2 uv, float x, float width, float height, float seed) {
      vec2 p = uv - vec2(x, 0.0);

      // Add organic wobble to the tree shape
      float wobble = fbm(vec2(p.y * 8.0 + seed, seed)) * 0.15;

      float tree = 0.0;

      // Main triangular body with organic edges
      if (p.y > 0.0 && p.y < height) {
        float t = p.y / height;
        float w = width * (1.0 - t * 0.92);

        // Add organic edge variation
        w += wobble * width * (1.0 - t);

        tree = smoothstep(w + 0.003, w - 0.003, abs(p.x + wobble * 0.3));
      }

      // Trunk with slight curve
      float trunkW = width * 0.12;
      if (p.y > -height * 0.1 && p.y < height * 0.15) {
        float curve = sin(p.y * 10.0 + seed) * 0.005;
        tree = max(tree, smoothstep(trunkW + 0.002, trunkW - 0.002, abs(p.x + curve)));
      }

      return tree;
    }

    // Forest layer with organic tree placement
    float forestLayer(vec2 uv, float yBase, float scale, float seed, float density, float time) {
      float forest = 0.0;

      for (float i = -2.0; i < 18.0; i++) {
        float id = seed + i;
        // Use noise for organic tree placement
        float xOffset = noise(vec2(id * 0.1, seed)) * 0.3 - 0.15;
        float x = (i + xOffset) * density;
        float h = (0.12 + noise(vec2(id * 2.7, seed * 0.5)) * 0.22) * scale;
        float w = (0.025 + noise(vec2(id * 3.1, seed * 0.3)) * 0.025) * scale;

        forest = max(forest, tree(uv, x, w, yBase + h, id * 7.3));
      }

      return forest;
    }

    // Organic hill silhouette using domain warping
    float organicHills(vec2 uv, float baseY, float scale, float seed, float time) {
      // Domain warp the x coordinate for organic shape
      float warp = warpedFbm(uv * 2.0 + seed, time) * 0.15;
      float h = baseY;
      h += warpedFbm(vec2(uv.x * 3.0 + seed, seed * 0.5), time * 0.5) * scale;
      h += fbm(vec2(uv.x * 8.0 + seed * 2.0, 0.0)) * scale * 0.3;

      return smoothstep(h + 0.02, h - 0.02, uv.y + warp * 0.5);
    }

    // ============================================
    // ATMOSPHERIC FOG using domain warping
    // ============================================

    float organicFog(vec2 uv, float time, float layer) {
      vec2 fogUv = uv * vec2(3.0, 2.0) + vec2(time * 0.02 * layer, layer * 5.0);

      // Domain warp for organic fog shapes
      vec2 q = vec2(
        fbm(fogUv + vec2(0.0, 0.0)),
        fbm(fogUv + vec2(5.2, 1.3))
      );

      return fbm(fogUv + 3.0 * q) * fbm(fogUv * 2.0 - q);
    }

    // ============================================
    // MAIN
    // ============================================

    void main() {
      vec2 uv = vUv;
      float time = uTime;

      // ---- SKY with organic clouds ----
      vec3 skyTop = vec3(0.12, 0.22, 0.42);
      vec3 skyMid = vec3(0.55, 0.32, 0.35);
      vec3 skyLow = vec3(0.92, 0.55, 0.38);
      vec3 horizon = vec3(1.0, 0.82, 0.55);

      float skyGrad = uv.y;
      vec3 sky = mix(horizon, skyLow, smoothstep(0.25, 0.45, skyGrad));
      sky = mix(sky, skyMid, smoothstep(0.45, 0.65, skyGrad));
      sky = mix(sky, skyTop, smoothstep(0.65, 0.95, skyGrad));

      // Organic cloud wisps using domain warping
      float clouds = warpedFbm(uv * vec2(4.0, 2.0) + time * 0.01, time);
      clouds *= smoothstep(0.5, 0.8, uv.y) * smoothstep(1.0, 0.7, uv.y);
      sky = mix(sky, vec3(1.0, 0.9, 0.85), clouds * 0.25);

      // Sun
      vec2 sunPos = vec2(0.72, 0.58);
      float sunDist = length(uv - sunPos);
      float sun = smoothstep(0.07, 0.0, sunDist);
      float sunGlow = exp(-sunDist * 2.5) * 0.7;
      sky = mix(sky, vec3(1.0, 0.98, 0.92), sun);
      sky += vec3(1.0, 0.65, 0.35) * sunGlow;

      vec3 color = sky;

      // ---- LAYER COLORS ----
      vec3 col6 = vec3(0.52, 0.42, 0.52);  // Distant mountains
      vec3 col5 = vec3(0.38, 0.36, 0.42);  // Far forest
      vec3 col4 = vec3(0.26, 0.28, 0.32);  // Mid-far
      vec3 col3 = vec3(0.16, 0.20, 0.22);  // Mid
      vec3 col2 = vec3(0.08, 0.12, 0.14);  // Near
      vec3 col1 = vec3(0.02, 0.04, 0.05);  // Foreground

      float parallax = time * 0.03;

      // ---- LAYER 6: Distant mountains with organic shape ----
      float mountains = organicHills(vec2(uv.x + parallax * 0.05, uv.y), 0.68, 0.1, 0.0, time);
      color = mix(color, col6, mountains);

      // ---- LAYER 5: Far forest ----
      vec2 uv5 = vec2(uv.x + parallax * 0.15, uv.y);
      float forest5 = forestLayer(uv5, 0.52, 0.45, 500.0, 0.075, time);
      forest5 = max(forest5, organicHills(uv5, 0.54, 0.04, 10.0, time));
      color = mix(color, col5, forest5);

      // Add organic fog between layers
      float fog5 = organicFog(uv, time, 1.0);
      float fogMask5 = smoothstep(0.65, 0.5, uv.y) * smoothstep(0.45, 0.55, uv.y);
      color = mix(color, col5 * 1.3, fog5 * fogMask5 * 0.2);

      // ---- LAYER 4: Mid-far forest ----
      vec2 uv4 = vec2(uv.x + parallax * 0.3, uv.y);
      float forest4 = forestLayer(uv4, 0.42, 0.6, 400.0, 0.068, time);
      forest4 = max(forest4, organicHills(uv4, 0.44, 0.035, 20.0, time));
      color = mix(color, col4, forest4);

      // ---- LAYER 3: Mid forest ----
      vec2 uv3 = vec2(uv.x + parallax * 0.55, uv.y);
      float forest3 = forestLayer(uv3, 0.30, 0.78, 300.0, 0.062, time);
      forest3 = max(forest3, organicHills(uv3, 0.32, 0.025, 30.0, time));
      color = mix(color, col3, forest3);

      // Fog layer
      float fog3 = organicFog(uv, time * 1.2, 2.0);
      float fogMask3 = smoothstep(0.4, 0.25, uv.y) * smoothstep(0.15, 0.28, uv.y);
      color = mix(color, col3 * 1.4, fog3 * fogMask3 * 0.18);

      // ---- LAYER 2: Near forest ----
      vec2 uv2 = vec2(uv.x + parallax * 0.85, uv.y);
      float forest2 = forestLayer(uv2, 0.16, 1.0, 200.0, 0.058, time);
      color = mix(color, col2, forest2);

      // ---- LAYER 1: Foreground silhouettes ----
      vec2 uv1 = vec2(uv.x + parallax * 1.2, uv.y);
      float forest1 = 0.0;
      forest1 = max(forest1, tree(uv1, -0.08, 0.09, 0.78, 1.0));
      forest1 = max(forest1, tree(uv1, 0.12, 0.065, 0.58, 2.0));
      forest1 = max(forest1, tree(uv1, 0.88, 0.075, 0.65, 3.0));
      forest1 = max(forest1, tree(uv1, 1.06, 0.095, 0.82, 4.0));
      color = mix(color, col1, forest1);

      // Ground with organic edge
      float groundWarp = fbm(vec2(uv.x * 5.0, 0.0)) * 0.02;
      float ground = smoothstep(0.1 + groundWarp, 0.06 + groundWarp, uv.y);
      color = mix(color, col1, ground);

      // ---- POST PROCESSING ----
      // Vignette
      float vignette = 1.0 - length((uv - 0.5) * vec2(1.0, 0.7)) * 0.45;
      color *= vignette;

      // Subtle grain for organic feel
      float grain = (hash(uv * 500.0 + time) - 0.5) * 0.03;
      color += grain;

      // Warm color grade
      color = pow(color, vec3(0.95));
      color = mix(color, color * vec3(1.05, 1.0, 0.92), 0.15);

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
