"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useReducedMotion } from "../hooks/useReducedMotion";

interface AuroraLandscapeProps {
  speed?: number;
}

// Northern lights over snowy mountains with starfield
export function AuroraLandscape({ speed = 0.25 }: AuroraLandscapeProps) {
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

    // Hash and noise
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float hash21(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
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

    // Stars
    float stars(vec2 uv, float density) {
      vec2 cell = floor(uv * density);
      vec2 f = fract(uv * density);
      float star = 0.0;

      float h = hash21(cell);
      if (h > 0.97) {
        vec2 center = vec2(hash21(cell + 0.1), hash21(cell + 0.2));
        float d = length(f - center);
        float brightness = (h - 0.97) / 0.03;
        // Twinkling
        float twinkle = sin(uTime * 2.0 + h * 100.0) * 0.3 + 0.7;
        star = smoothstep(0.03, 0.0, d) * brightness * twinkle;
      }
      return star;
    }

    // Aurora curtain - flowing ribbons of light
    float auroraCurtain(vec2 uv, float offset, float freq, float time) {
      float x = uv.x * freq + offset;

      // Flowing wave shape with domain warping
      float wave = sin(x * 1.0 + time * 0.8) * 0.15;
      wave += sin(x * 2.3 - time * 0.5) * 0.08;
      wave += sin(x * 0.7 + time * 1.2) * 0.12;

      // Domain-warped displacement for organic motion
      float warp = fbm(vec2(x * 0.3 + time * 0.2, time * 0.1 + offset)) * 0.15;
      wave += warp;

      // Vertical center of this curtain
      float center = 0.62 + wave;

      // Distance from curtain center
      float d = abs(uv.y - center);

      // Soft falloff with bright core
      float curtain = exp(-d * d * 80.0);

      // Add fine structure - vertical rays
      float rays = fbm(vec2(x * 4.0, uv.y * 8.0 + time * 0.3));
      curtain *= 0.7 + rays * 0.6;

      // Fade at edges of screen
      curtain *= smoothstep(0.0, 0.15, uv.x) * smoothstep(1.0, 0.85, uv.x);

      // Only show in upper portion
      curtain *= smoothstep(0.35, 0.55, uv.y);

      return curtain;
    }

    // Snow mountain ridge
    float snowRidge(vec2 uv, float baseY, float height, float scale, float seed) {
      float x = uv.x * scale + seed;

      float h = baseY;
      // Jagged peaks
      float peak = warpedFbm(vec2(x * 0.15, seed), 2.0);
      h += peak * height;

      // Sharp ridgeline
      float ridge = abs(fbm(vec2(x * 0.5, seed * 0.7)) - 0.5) * 2.0;
      h += ridge * height * 0.25;

      // Fine detail
      h += fbm(vec2(x * 3.0, seed)) * height * 0.08;

      return 1.0 - smoothstep(h - 0.005, h + 0.005, uv.y);
    }

    // Night sky gradient
    vec3 nightSky(vec2 uv) {
      vec3 top = vec3(0.02, 0.02, 0.06);
      vec3 mid = vec3(0.04, 0.04, 0.10);
      vec3 horizon = vec3(0.06, 0.08, 0.14);

      vec3 sky = mix(horizon, mid, smoothstep(0.2, 0.5, uv.y));
      sky = mix(sky, top, smoothstep(0.5, 0.9, uv.y));

      return sky;
    }

    void main() {
      vec2 uv = vUv;
      float aspect = uResolution.x / uResolution.y;
      vec2 uvAspect = vec2(uv.x * aspect, uv.y);
      float time = uTime;

      float parallax = time * 0.01;

      // Night sky base
      vec3 col = nightSky(uv);

      // Subtle sky gradient glow near horizon
      float horizonGlow = exp(-(uv.y - 0.3) * (uv.y - 0.3) * 15.0) * 0.08;
      col += vec3(0.05, 0.1, 0.15) * horizonGlow;

      // Stars - multiple layers for depth
      float s1 = stars(uvAspect, 80.0);
      float s2 = stars(uvAspect + 100.0, 120.0);
      float s3 = stars(uvAspect + 200.0, 200.0);
      float starField = s1 + s2 * 0.7 + s3 * 0.4;
      // Dim stars where aurora is bright
      col += vec3(0.9, 0.92, 1.0) * starField * 0.8;

      // Aurora Borealis - multiple overlapping curtains
      // Curtain 1 - main green band
      float a1 = auroraCurtain(uvAspect, 0.0, 1.5, time);
      vec3 auroraGreen = vec3(0.1, 0.9, 0.4);
      col += auroraGreen * a1 * 0.45;

      // Curtain 2 - cyan/teal ribbon
      float a2 = auroraCurtain(uvAspect, 3.0, 1.8, time * 0.8);
      vec3 auroraCyan = vec3(0.1, 0.7, 0.8);
      col += auroraCyan * a2 * 0.35;

      // Curtain 3 - purple/magenta edge
      float a3 = auroraCurtain(uvAspect, 6.0, 1.2, time * 1.1);
      vec3 auroraPurple = vec3(0.5, 0.15, 0.7);
      col += auroraPurple * a3 * 0.3;

      // Curtain 4 - subtle blue
      float a4 = auroraCurtain(uvAspect, 9.0, 2.0, time * 0.6);
      vec3 auroraBlue = vec3(0.15, 0.3, 0.8);
      col += auroraBlue * a4 * 0.2;

      // Diffuse aurora glow - soft ambient wash
      float auroraTotal = a1 + a2 + a3 + a4;
      float diffuseGlow = smoothstep(0.4, 0.7, uv.y) * smoothstep(0.95, 0.7, uv.y);
      col += vec3(0.05, 0.12, 0.08) * diffuseGlow * smoothstep(0.0, 0.5, auroraTotal);

      // Dim stars behind aurora
      col -= vec3(0.9, 0.92, 1.0) * starField * 0.4 * clamp(auroraTotal, 0.0, 1.0);

      // Mountain layers - dark snowy silhouettes
      vec3 mtn4col = vec3(0.06, 0.08, 0.14); // Most distant - slightly blue
      vec3 mtn3col = vec3(0.05, 0.06, 0.11);
      vec3 mtn2col = vec3(0.03, 0.04, 0.08);
      vec3 mtn1col = vec3(0.01, 0.02, 0.04); // Foreground - nearly black

      // Layer 4 - Distant range
      vec2 uv4 = vec2(uvAspect.x + parallax * 0.1, uv.y);
      float m4 = snowRidge(uv4, 0.22, 0.22, 0.7, 50.0);
      // Snow caps on distant peaks
      float snow4 = snowRidge(uv4, 0.30, 0.18, 0.7, 50.0);
      vec3 mtn4withSnow = mix(mtn4col, mtn4col + vec3(0.15, 0.17, 0.22), (1.0 - snow4) * m4);
      col = mix(col, mtn4withSnow, m4);

      // Layer 3
      vec2 uv3 = vec2(uvAspect.x + parallax * 0.3, uv.y);
      float m3 = snowRidge(uv3, 0.16, 0.28, 1.0, 30.0);
      float snow3 = snowRidge(uv3, 0.28, 0.20, 1.0, 30.0);
      vec3 mtn3withSnow = mix(mtn3col, mtn3col + vec3(0.12, 0.14, 0.18), (1.0 - snow3) * m3);
      col = mix(col, mtn3withSnow, m3);

      // Layer 2
      vec2 uv2 = vec2(uvAspect.x + parallax * 0.6, uv.y);
      float m2 = snowRidge(uv2, 0.08, 0.32, 1.5, 10.0);
      float snow2 = snowRidge(uv2, 0.22, 0.22, 1.5, 10.0);
      vec3 mtn2withSnow = mix(mtn2col, mtn2col + vec3(0.10, 0.11, 0.15), (1.0 - snow2) * m2);
      col = mix(col, mtn2withSnow, m2);

      // Layer 1 - Foreground
      vec2 uv1 = vec2(uvAspect.x + parallax * 1.0, uv.y);
      float m1 = snowRidge(uv1, 0.0, 0.25, 2.5, 0.0);
      float snow1 = snowRidge(uv1, 0.12, 0.18, 2.5, 0.0);
      vec3 mtn1withSnow = mix(mtn1col, mtn1col + vec3(0.08, 0.09, 0.12), (1.0 - snow1) * m1);
      col = mix(col, mtn1withSnow, m1);

      // Frozen ground / snow floor
      float groundMask = smoothstep(0.06, 0.01, uv.y);
      vec3 snowGround = vec3(0.08, 0.10, 0.16);
      snowGround += fbm(uvAspect * 15.0) * 0.04;
      col = mix(col, snowGround, groundMask);

      // Aurora reflection on snow/ground
      float reflectionZone = smoothstep(0.25, 0.0, uv.y);
      float reflectedAurora = auroraTotal * reflectionZone * 0.08;
      col += vec3(0.1, 0.3, 0.2) * reflectedAurora;

      // Subtle atmospheric mist between mountains
      float mist = exp(-uv.y * 8.0) * 0.1;
      float mistNoise = fbm(uvAspect * vec2(3.0, 1.0) + time * 0.02);
      col = mix(col, vec3(0.08, 0.12, 0.18), mist * mistNoise);

      // Tone mapping
      col = pow(col, vec3(0.95));

      // Vignette
      float vig = 1.0 - dot(vUv - 0.5, vUv - 0.5) * 0.5;
      col *= vig;

      // Cool color grade
      col = mix(col, col * vec3(0.92, 0.98, 1.08), 0.2);

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
