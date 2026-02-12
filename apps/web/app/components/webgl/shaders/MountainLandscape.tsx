"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useReducedMotion } from "../hooks/useReducedMotion";

interface MountainLandscapeProps {
  speed?: number;
}

// Layered mountain silhouettes with IQ domain warping for organic shapes
export function MountainLandscape({ speed = 0.3 }: MountainLandscapeProps) {
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

    // ============================================
    // NOISE FUNCTIONS (IQ style)
    // ============================================

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
      f += 0.0625 * noise(p); p = m * p * 2.04;
      f += 0.03125 * noise(p);
      return f / 0.96875;
    }

    // Domain warping for organic mountain shapes
    float warpedFbm(vec2 p, float intensity) {
      vec2 q = vec2(
        fbm(p + vec2(0.0, 0.0)),
        fbm(p + vec2(5.2, 1.3))
      );
      vec2 r = vec2(
        fbm(p + intensity * q + vec2(1.7, 9.2)),
        fbm(p + intensity * q + vec2(8.3, 2.8))
      );
      return fbm(p + intensity * r);
    }

    // ============================================
    // MOUNTAIN SILHOUETTES
    // ============================================

    // Organic mountain ridge using domain warping
    float mountainRidge(vec2 uv, float baseY, float height, float scale, float seed, float time) {
      float x = uv.x * scale + seed;

      // Domain warped base shape
      float warp = warpedFbm(vec2(x * 0.3, seed), 2.5) * 0.05;

      // Main peak structure
      float h = baseY;
      h += warpedFbm(vec2(x * 0.15 + seed, 0.0), 3.0) * height * 0.7;
      h += fbm(vec2(x * 0.4 + seed * 2.0, 0.0)) * height * 0.3;

      // Sharp peaks
      float peaks = abs(fbm(vec2(x * 0.8, seed)) - 0.5) * 2.0;
      h += peaks * height * 0.25;

      // Fine detail
      h += fbm(vec2(x * 2.0 + seed, 0.0)) * height * 0.08;

      // Return 1 when below mountain line (uv.y < h), 0 when above
      return 1.0 - smoothstep(h - 0.008, h + 0.008, uv.y + warp);
    }

    // Snow caps on peaks
    float snowCap(vec2 uv, float baseY, float height, float scale, float seed, float snowLine) {
      float x = uv.x * scale + seed;

      float h = baseY;
      h += warpedFbm(vec2(x * 0.15 + seed, 0.0), 3.0) * height * 0.7;
      h += fbm(vec2(x * 0.4 + seed * 2.0, 0.0)) * height * 0.3;
      float peaks = abs(fbm(vec2(x * 0.8, seed)) - 0.5) * 2.0;
      h += peaks * height * 0.25;

      // Snow above snow line with organic edge
      float snowNoise = fbm(vec2(x * 3.0, seed * 0.5)) * 0.03;
      // Snow shows above snowLine but below mountain peak h
      float aboveSnowLine = smoothstep(snowLine - 0.02 + snowNoise, snowLine + 0.02 + snowNoise, uv.y);
      float belowPeak = 1.0 - smoothstep(h - 0.01, h + 0.01, uv.y);

      return aboveSnowLine * belowPeak;
    }

    // ============================================
    // SKY with clouds
    // ============================================

    float stars(vec2 uv) {
      vec2 id = floor(uv * 200.0);
      vec2 f = fract(uv * 200.0);
      float h = hash(id);
      if (h > 0.992) {
        float d = length(f - 0.5);
        float twinkle = sin(h * 100.0 + uTime * 2.0) * 0.3 + 0.7;
        return smoothstep(0.15, 0.0, d) * (h - 0.992) * 130.0 * twinkle;
      }
      return 0.0;
    }

    vec3 dawnSky(vec2 uv, float time) {
      // Dawn gradient
      vec3 skyTop = vec3(0.08, 0.12, 0.28);
      vec3 skyMid = vec3(0.25, 0.18, 0.35);
      vec3 skyLow = vec3(0.85, 0.45, 0.35);
      vec3 horizon = vec3(1.0, 0.75, 0.45);

      float y = uv.y;
      vec3 sky = mix(horizon, skyLow, smoothstep(0.2, 0.35, y));
      sky = mix(sky, skyMid, smoothstep(0.35, 0.55, y));
      sky = mix(sky, skyTop, smoothstep(0.55, 0.85, y));

      // Stars (fading near horizon)
      float starMask = smoothstep(0.4, 0.7, y);
      float s = stars(uv + 0.5);
      s += stars(uv * 1.5 + 10.0) * 0.6;
      sky += vec3(1.0, 0.98, 0.95) * s * starMask;

      // Wispy clouds using domain warping
      vec2 cloudUv = uv * vec2(2.0, 4.0) + vec2(time * 0.02, 0.0);
      float clouds = warpedFbm(cloudUv, 3.0);
      clouds *= smoothstep(0.3, 0.5, uv.y) * smoothstep(0.8, 0.6, uv.y);

      vec3 cloudCol = mix(vec3(1.0, 0.7, 0.5), vec3(0.9, 0.85, 0.95), uv.y);
      sky = mix(sky, cloudCol, clouds * 0.35);

      return sky;
    }

    // ============================================
    // MAIN
    // ============================================

    void main() {
      vec2 uv = vUv;
      uv.x *= uResolution.x / uResolution.y;
      float time = uTime;

      float parallax = time * 0.02;

      // Sky
      vec3 col = dawnSky(vUv, time);

      // Sun glow on horizon
      vec2 sunPos = vec2(0.75, 0.28);
      float sunDist = length(vUv - sunPos);
      float sunGlow = exp(-sunDist * 3.0) * 0.8;
      float sun = smoothstep(0.045, 0.02, sunDist);
      col += vec3(1.0, 0.6, 0.3) * sunGlow;
      col += vec3(1.0, 0.95, 0.85) * sun;

      // Mountain layer colors (back to front) - darker silhouettes
      vec3 col6 = vec3(0.32, 0.28, 0.38);  // Most distant - purple haze
      vec3 col5 = vec3(0.22, 0.20, 0.30);
      vec3 col4 = vec3(0.14, 0.13, 0.22);
      vec3 col3 = vec3(0.09, 0.08, 0.15);
      vec3 col2 = vec3(0.05, 0.04, 0.10);
      vec3 col1 = vec3(0.02, 0.02, 0.05);  // Foreground - almost black

      vec3 snowCol = vec3(0.95, 0.92, 1.0);

      // Layer 6 - Most distant mountains (taller, more prominent)
      vec2 uv6 = vec2(uv.x + parallax * 0.1, uv.y);
      float m6 = mountainRidge(uv6, 0.25, 0.35, 1.2, 60.0, time);
      col = mix(col, col6, m6);
      float snow6 = snowCap(uv6, 0.25, 0.35, 1.2, 60.0, 0.48);
      col = mix(col, snowCol * 0.7, snow6 * 0.5);

      // Layer 5
      vec2 uv5 = vec2(uv.x + parallax * 0.2, uv.y);
      float m5 = mountainRidge(uv5, 0.22, 0.38, 1.5, 50.0, time);
      col = mix(col, col5, m5);
      float snow5 = snowCap(uv5, 0.22, 0.38, 1.5, 50.0, 0.46);
      col = mix(col, snowCol * 0.75, snow5 * 0.55);

      // Layer 4
      vec2 uv4 = vec2(uv.x + parallax * 0.35, uv.y);
      float m4 = mountainRidge(uv4, 0.18, 0.42, 1.8, 40.0, time);
      col = mix(col, col4, m4);
      float snow4 = snowCap(uv4, 0.18, 0.42, 1.8, 40.0, 0.44);
      col = mix(col, snowCol * 0.8, snow4 * 0.6);

      // Layer 3
      vec2 uv3 = vec2(uv.x + parallax * 0.55, uv.y);
      float m3 = mountainRidge(uv3, 0.12, 0.48, 2.2, 30.0, time);
      col = mix(col, col3, m3);
      float snow3 = snowCap(uv3, 0.12, 0.48, 2.2, 30.0, 0.42);
      col = mix(col, snowCol * 0.85, snow3 * 0.65);

      // Layer 2
      vec2 uv2 = vec2(uv.x + parallax * 0.8, uv.y);
      float m2 = mountainRidge(uv2, 0.05, 0.50, 2.8, 20.0, time);
      col = mix(col, col2, m2);
      float snow2 = snowCap(uv2, 0.05, 0.50, 2.8, 20.0, 0.38);
      col = mix(col, snowCol * 0.9, snow2 * 0.7);

      // Layer 1 - Foreground
      vec2 uv1 = vec2(uv.x + parallax * 1.2, uv.y);
      float m1 = mountainRidge(uv1, 0.0, 0.40, 3.5, 10.0, time);
      col = mix(col, col1, m1);

      // Atmospheric fog between layers
      float fog = warpedFbm(uv * vec2(3.0, 1.5) + time * 0.01, 2.0);
      float fogMask = smoothstep(0.35, 0.15, uv.y) * smoothstep(0.0, 0.1, uv.y);
      col = mix(col, col4 * 1.5, fog * fogMask * 0.25);

      // Tone mapping
      col = pow(col, vec3(0.92));

      // Vignette
      float vig = 1.0 - dot(vUv - 0.5, vUv - 0.5) * 0.5;
      col *= vig;

      // Subtle color grade
      col = mix(col, col * vec3(1.0, 0.95, 1.05), 0.1);

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
