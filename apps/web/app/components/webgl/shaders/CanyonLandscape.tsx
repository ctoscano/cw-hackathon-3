"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useReducedMotion } from "../hooks/useReducedMotion";

interface CanyonLandscapeProps {
  speed?: number;
}

// Desert canyon with layered silhouettes and warm colors
export function CanyonLandscape({ speed = 0.2 }: CanyonLandscapeProps) {
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
    precision highp float;

    varying vec2 vUv;
    uniform float uTime;
    uniform vec2 uResolution;

    // Noise functions
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    mat2 m = mat2(0.8, 0.6, -0.6, 0.8);

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
        f.y
      );
    }

    float fbm(vec2 p) {
      float f = 0.0;
      f += 0.5000 * noise(p); p = m * p * 2.02;
      f += 0.2500 * noise(p); p = m * p * 2.03;
      f += 0.1250 * noise(p); p = m * p * 2.01;
      f += 0.0625 * noise(p);
      return f / 0.9375;
    }

    float warpedFbm(vec2 p, float intensity) {
      vec2 q = vec2(fbm(p), fbm(p + vec2(5.2, 1.3)));
      return fbm(p + intensity * q);
    }

    // Mesa/canyon ridge shape
    float canyonRidge(vec2 uv, float baseY, float height, float scale, float seed) {
      float x = uv.x * scale + seed;

      // Mesa plateau shape
      float h = baseY;
      float plateau = warpedFbm(vec2(x * 0.1, seed), 2.5);
      plateau = smoothstep(0.3, 0.7, plateau);
      h += plateau * height * 0.8;

      // Cliff detail
      float cliff = abs(fbm(vec2(x * 0.3, seed * 0.5)) - 0.5) * 2.0;
      h += cliff * height * 0.3;

      // Fine erosion
      h += fbm(vec2(x * 2.0, seed)) * height * 0.1;

      return 1.0 - smoothstep(h - 0.008, h + 0.008, uv.y);
    }

    // Desert sky
    vec3 desertSky(vec2 uv, float time) {
      vec3 skyTop = vec3(0.35, 0.55, 0.85);
      vec3 skyMid = vec3(0.65, 0.75, 0.90);
      vec3 horizon = vec3(0.95, 0.85, 0.70);

      float y = uv.y;
      vec3 sky = mix(horizon, skyMid, smoothstep(0.15, 0.4, y));
      sky = mix(sky, skyTop, smoothstep(0.4, 0.8, y));

      // Heat haze
      float haze = exp(-y * 5.0) * 0.25;
      sky = mix(sky, vec3(1.0, 0.95, 0.9), haze);

      // Clouds
      vec2 cloudUv = uv * vec2(3.0, 1.0) + vec2(time * 0.01, 0.0);
      float clouds = warpedFbm(cloudUv, 2.0);
      clouds *= smoothstep(0.4, 0.6, uv.y) * smoothstep(0.9, 0.7, uv.y);
      sky = mix(sky, vec3(1.0), clouds * 0.2);

      return sky;
    }

    void main() {
      vec2 uv = vUv;
      uv.x *= uResolution.x / uResolution.y;
      float time = uTime;

      float parallax = time * 0.015;

      // Sky
      vec3 col = desertSky(vUv, time);

      // Sun
      vec2 sunPos = vec2(0.75, 0.65);
      float sunDist = length(vUv - sunPos);
      float sun = smoothstep(0.05, 0.02, sunDist);
      float sunGlow = exp(-sunDist * 3.0) * 0.6;
      col += vec3(1.0, 0.95, 0.85) * sun;
      col += vec3(1.0, 0.85, 0.6) * sunGlow;

      // Canyon layer colors - warm earth tones
      vec3 col5 = vec3(0.60, 0.45, 0.40);
      vec3 col4 = vec3(0.50, 0.35, 0.30);
      vec3 col3 = vec3(0.40, 0.28, 0.24);
      vec3 col2 = vec3(0.30, 0.20, 0.18);
      vec3 col1 = vec3(0.15, 0.10, 0.08);

      // Layer 5 - Most distant
      vec2 uv5 = vec2(uv.x + parallax * 0.1, uv.y);
      float m5 = canyonRidge(uv5, 0.30, 0.28, 0.8, 100.0);
      col = mix(col, col5, m5);

      // Layer 4
      vec2 uv4 = vec2(uv.x + parallax * 0.25, uv.y);
      float m4 = canyonRidge(uv4, 0.24, 0.35, 1.2, 80.0);
      col = mix(col, col4, m4);

      // Layer 3
      vec2 uv3 = vec2(uv.x + parallax * 0.5, uv.y);
      float m3 = canyonRidge(uv3, 0.18, 0.42, 1.6, 60.0);
      col = mix(col, col3, m3);

      // Layer 2
      vec2 uv2 = vec2(uv.x + parallax * 0.8, uv.y);
      float m2 = canyonRidge(uv2, 0.10, 0.48, 2.2, 40.0);
      col = mix(col, col2, m2);

      // Layer 1 - Foreground
      vec2 uv1 = vec2(uv.x + parallax * 1.2, uv.y);
      float m1 = canyonRidge(uv1, 0.0, 0.38, 3.0, 20.0);
      col = mix(col, col1, m1);

      // Desert floor
      float floorMask = smoothstep(0.06, 0.02, uv.y);
      vec3 sandCol = vec3(0.85, 0.75, 0.60);
      sandCol *= 0.9 + fbm(uv * 20.0) * 0.2;
      col = mix(col, sandCol * 0.4, floorMask);

      // Atmospheric dust
      float dust = warpedFbm(uv * vec2(2.0, 1.0) + time * 0.005, 2.0);
      dust *= smoothstep(0.5, 0.15, uv.y) * 0.12;
      col = mix(col, vec3(0.9, 0.8, 0.7), dust);

      // Tone mapping
      col = pow(col, vec3(0.95));

      // Vignette
      float vig = 1.0 - dot(vUv - 0.5, vUv - 0.5) * 0.4;
      col *= vig;

      // Warm color grade
      col = mix(col, col * vec3(1.05, 1.0, 0.92), 0.15);

      gl_FragColor = vec4(col, 1.0);
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
