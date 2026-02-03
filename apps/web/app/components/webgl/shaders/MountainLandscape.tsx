"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useReducedMotion } from "../hooks/useReducedMotion";

interface MountainLandscapeProps {
  speed?: number;
}

// Raymarched mountain with IQ domain warping for organic detail
export function MountainLandscape({ speed = 0.5 }: MountainLandscapeProps) {
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
    // NOISE & DOMAIN WARPING
    // ============================================

    mat2 m = mat2(0.8, 0.6, -0.6, 0.8);

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

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

    // Domain warping for organic patterns
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
    // TERRAIN with domain warping
    // ============================================

    float terrain(vec2 p) {
      float h = 0.0;

      // Large scale features with domain warping
      h += warpedFbm(p * 0.12, 3.0) * 3.5;

      // Medium features
      h += fbm(p * 0.25 + 10.0) * 1.8;

      // Sharp ridges using warped abs
      float ridge = abs(warpedFbm(p * 0.3, 2.0) - 0.5) * 2.0;
      h += ridge * 1.5;

      // Fine erosion detail
      h += fbm(p * 0.8 + 20.0) * 0.4;
      h += fbm(p * 1.6 + 30.0) * 0.15;

      return h * 0.32;
    }

    vec3 calcNormal(vec2 p, float eps) {
      return normalize(vec3(
        terrain(p - vec2(eps, 0.0)) - terrain(p + vec2(eps, 0.0)),
        2.0 * eps,
        terrain(p - vec2(0.0, eps)) - terrain(p + vec2(0.0, eps))
      ));
    }

    float castRay(vec3 ro, vec3 rd, float tmin, float tmax) {
      float t = tmin;
      for (int i = 0; i < 100; i++) {
        vec3 p = ro + rd * t;
        float h = p.y - terrain(p.xz);
        if (h < 0.002 * t || t > tmax) break;
        t += h * 0.45;
      }
      return t;
    }

    float shadow(vec3 ro, vec3 rd, float tmin, float tmax) {
      float res = 1.0;
      float t = tmin;
      for (int i = 0; i < 24; i++) {
        vec3 p = ro + rd * t;
        float h = p.y - terrain(p.xz);
        res = min(res, 10.0 * h / t);
        t += clamp(h, 0.05, 0.8);
        if (res < 0.001 || t > tmax) break;
      }
      return clamp(res, 0.0, 1.0);
    }

    // ============================================
    // ORGANIC MATERIAL with domain warping
    // ============================================

    vec3 terrainMaterial(vec3 pos, vec3 nor) {
      float h = pos.y;
      float slope = 1.0 - nor.y;

      // Warped rock color variation
      float rockVar = warpedFbm(pos.xz * 1.5, 2.0);
      vec3 rock1 = vec3(0.12, 0.10, 0.08);
      vec3 rock2 = vec3(0.22, 0.18, 0.14);
      vec3 rock3 = vec3(0.30, 0.25, 0.20);
      vec3 rock = mix(rock1, rock2, rockVar);
      rock = mix(rock, rock3, fbm(pos.xz * 4.0) * 0.5);

      // Organic moss/lichen in crevices
      float mossVar = warpedFbm(pos.xz * 3.0, 3.0);
      float mossMask = smoothstep(0.6, 0.3, slope) * smoothstep(0.2, 0.5, h) * mossVar;
      vec3 moss = vec3(0.08, 0.12, 0.06);
      rock = mix(rock, moss, mossMask * 0.4);

      // Snow with organic wind patterns
      float snowNoise = warpedFbm(pos.xz * 2.0, 4.0);
      float snowMask = smoothstep(0.25, 0.6, h) * smoothstep(0.55, 0.2, slope);
      snowMask *= 0.5 + snowNoise * 0.7;
      snowMask = smoothstep(0.0, 0.6, snowMask);

      // Wind-blown snow streaks
      float windStreak = fbm(pos.xz * vec2(0.5, 8.0) + 50.0);
      snowMask *= 0.7 + windStreak * 0.5;

      vec3 snow = vec3(0.88, 0.90, 0.95);
      snow = mix(snow, vec3(0.75, 0.82, 0.92), (1.0 - nor.y) * 0.3);

      return mix(rock, snow, clamp(snowMask, 0.0, 1.0));
    }

    // ============================================
    // SKY with organic clouds
    // ============================================

    float stars(vec2 uv) {
      vec2 id = floor(uv * 150.0);
      vec2 f = fract(uv * 150.0);
      float h = hash(id);
      if (h > 0.985) {
        float d = length(f - 0.5);
        return smoothstep(0.12, 0.0, d) * (h - 0.985) * 70.0;
      }
      return 0.0;
    }

    vec3 nightSky(vec3 rd, float time) {
      vec3 skyHigh = vec3(0.015, 0.02, 0.06);
      vec3 skyLow = vec3(0.08, 0.06, 0.12);
      float skyGrad = pow(max(rd.y, 0.0), 0.5);
      vec3 sky = mix(skyLow, skyHigh, skyGrad);

      // Milky way using domain warping
      vec2 skyUv = vec2(atan(rd.x, rd.z), rd.y);
      float milky = warpedFbm(skyUv * 2.0 + 5.0, 3.0);
      float milkyBand = smoothstep(0.3, 0.0, abs(skyUv.x + skyUv.y * 0.3 - 0.2));
      sky += vec3(0.12, 0.1, 0.18) * milky * milkyBand * 0.5;

      // Stars
      float s = stars(skyUv + 0.5);
      s += stars(skyUv * 1.7 + 10.0) * 0.6;
      s += stars(skyUv * 2.3 + 20.0) * 0.3;
      sky += vec3(1.0, 0.95, 0.85) * s;

      // Aurora-like nebula
      float nebula = warpedFbm(skyUv * vec2(1.0, 3.0) + time * 0.02, 4.0);
      nebula *= smoothstep(0.0, 0.4, rd.y) * smoothstep(0.8, 0.3, rd.y);
      sky += vec3(0.05, 0.1, 0.15) * nebula * 0.3;

      return sky;
    }

    // ============================================
    // MAIN
    // ============================================

    void main() {
      vec2 uv = vUv * 2.0 - 1.0;
      uv.x *= uResolution.x / uResolution.y;
      float time = uTime;

      // Camera
      vec3 ro = vec3(time * 0.4, 2.8, -6.0);
      vec3 ta = vec3(time * 0.4 + 4.0, 1.2, 6.0);

      vec3 ww = normalize(ta - ro);
      vec3 uu = normalize(cross(ww, vec3(0.0, 1.0, 0.0)));
      vec3 vv = cross(uu, ww);
      vec3 rd = normalize(uv.x * uu + uv.y * vv + 1.7 * ww);

      // Sky
      vec3 sky = nightSky(rd, time);

      // Moon
      vec3 moonDir = normalize(vec3(0.5, 0.45, 0.3));
      float moonDot = dot(rd, moonDir);
      float moon = smoothstep(0.994, 0.998, moonDot);
      float moonGlow = pow(max(moonDot, 0.0), 48.0) * 0.6;
      sky += vec3(1.0, 0.98, 0.92) * moon;
      sky += vec3(0.25, 0.22, 0.32) * moonGlow;

      vec3 col = sky;

      // Raycast terrain
      float t = castRay(ro, rd, 0.1, 100.0);

      if (t < 100.0) {
        vec3 pos = ro + rd * t;
        vec3 nor = calcNormal(pos.xz, 0.02);

        // Material
        vec3 mat = terrainMaterial(pos, nor);

        // Lighting
        vec3 sunDir = normalize(vec3(0.4, 0.35, -0.5));
        float dif = max(dot(nor, sunDir), 0.0);
        dif = dif * 0.5 + pow(dif, 4.0) * 0.4;

        float moonLit = max(dot(nor, moonDir), 0.0) * 0.3;
        float amb = 0.12 + 0.08 * nor.y;
        float sha = shadow(pos + nor * 0.02, sunDir, 0.05, 25.0);

        col = mat * (amb + dif * sha * 0.8 + moonLit);

        // Specular on snow
        float spec = pow(max(dot(reflect(-sunDir, nor), -rd), 0.0), 24.0);
        float snowAmt = smoothstep(0.3, 0.7, pos.y);
        col += vec3(0.25, 0.28, 0.35) * spec * snowAmt * sha * 0.4;

        // Rim light
        float rim = pow(1.0 - max(dot(nor, -rd), 0.0), 2.5);
        col += vec3(0.1, 0.1, 0.18) * rim * 0.35;

        // Fog
        float fog = 1.0 - exp(-t * 0.018);
        vec3 fogCol = mix(vec3(0.04, 0.04, 0.1), sky * 0.5, 0.3);
        col = mix(col, fogCol, fog);
      }

      // Tone mapping
      col = col / (1.0 + col);
      col = pow(col, vec3(0.88));

      // Vignette
      float vig = 1.0 - dot(vUv - 0.5, vUv - 0.5) * 0.6;
      col *= vig;

      // Subtle blue night tint
      col = mix(col, col * vec3(0.9, 0.95, 1.1), 0.1);

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
