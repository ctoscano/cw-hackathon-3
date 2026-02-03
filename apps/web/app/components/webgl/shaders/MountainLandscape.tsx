"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useReducedMotion } from "../hooks/useReducedMotion";

interface MountainLandscapeProps {
  speed?: number;
}

// Raymarched mountain terrain inspired by IQ's "Elevated"
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

    // Noise rotation matrix
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

    // FBM with rotation
    float fbm(vec2 p) {
      float f = 0.0;
      f += 0.5000 * noise(p); p = m * p * 2.02;
      f += 0.2500 * noise(p); p = m * p * 2.03;
      f += 0.1250 * noise(p); p = m * p * 2.01;
      f += 0.0625 * noise(p);
      return f / 0.9375;
    }

    // Terrain height with ridges
    float terrain(vec2 p) {
      float h = 0.0;

      // Large features
      h += fbm(p * 0.15) * 3.0;

      // Medium features
      h += fbm(p * 0.3 + 10.0) * 1.5;

      // Sharp ridges using abs
      float ridge = abs(fbm(p * 0.4) - 0.5) * 2.0;
      h += ridge * 1.2;

      // Fine detail
      h += fbm(p * 1.0 + 20.0) * 0.3;

      return h * 0.35;
    }

    // Terrain normal
    vec3 calcNormal(vec2 p, float eps) {
      return normalize(vec3(
        terrain(p - vec2(eps, 0.0)) - terrain(p + vec2(eps, 0.0)),
        2.0 * eps,
        terrain(p - vec2(0.0, eps)) - terrain(p + vec2(0.0, eps))
      ));
    }

    // Raycast terrain
    float castRay(vec3 ro, vec3 rd, float tmin, float tmax) {
      float t = tmin;
      for (int i = 0; i < 128; i++) {
        vec3 p = ro + rd * t;
        float h = p.y - terrain(p.xz);
        if (h < 0.001 * t || t > tmax) break;
        t += h * 0.4;
      }
      return t;
    }

    // Soft shadows
    float shadow(vec3 ro, vec3 rd, float tmin, float tmax) {
      float res = 1.0;
      float t = tmin;
      for (int i = 0; i < 32; i++) {
        vec3 p = ro + rd * t;
        float h = p.y - terrain(p.xz);
        res = min(res, 8.0 * h / t);
        t += clamp(h, 0.02, 0.5);
        if (res < 0.001 || t > tmax) break;
      }
      return clamp(res, 0.0, 1.0);
    }

    // Stars
    float stars(vec2 uv) {
      vec2 id = floor(uv * 200.0);
      vec2 f = fract(uv * 200.0);
      float h = hash(id);
      if (h > 0.98) {
        float d = length(f - 0.5);
        return smoothstep(0.15, 0.0, d) * (h - 0.98) * 50.0;
      }
      return 0.0;
    }

    void main() {
      vec2 uv = vUv * 2.0 - 1.0;
      uv.x *= uResolution.x / uResolution.y;
      float time = uTime;

      // Camera
      vec3 ro = vec3(time * 0.5, 2.5, -5.0);
      vec3 ta = vec3(time * 0.5 + 3.0, 1.5, 5.0);

      vec3 ww = normalize(ta - ro);
      vec3 uu = normalize(cross(ww, vec3(0.0, 1.0, 0.0)));
      vec3 vv = cross(uu, ww);
      vec3 rd = normalize(uv.x * uu + uv.y * vv + 1.8 * ww);

      // Sky gradient
      vec3 skyHigh = vec3(0.02, 0.03, 0.08);
      vec3 skyLow = vec3(0.1, 0.08, 0.15);
      float skyGrad = pow(max(rd.y, 0.0), 0.5);
      vec3 sky = mix(skyLow, skyHigh, skyGrad);

      // Stars
      if (rd.y > 0.0) {
        vec2 starUv = vec2(atan(rd.x, rd.z), rd.y);
        float s = stars(starUv + 0.5);
        s += stars(starUv * 1.7 + 10.0) * 0.5;
        sky += vec3(1.0, 0.95, 0.8) * s;
      }

      // Moon
      vec3 moonDir = normalize(vec3(0.5, 0.4, 0.3));
      float moonDot = dot(rd, moonDir);
      float moon = smoothstep(0.995, 0.999, moonDot);
      float moonGlow = pow(max(moonDot, 0.0), 64.0) * 0.5;
      sky += vec3(1.0, 0.98, 0.9) * moon;
      sky += vec3(0.3, 0.25, 0.35) * moonGlow;

      vec3 col = sky;

      // Raycast
      float t = castRay(ro, rd, 0.1, 80.0);

      if (t < 80.0) {
        vec3 pos = ro + rd * t;
        vec3 nor = calcNormal(pos.xz, 0.01);

        // Material
        float h = pos.y;
        float slope = 1.0 - nor.y;

        // Rock colors
        vec3 rock = mix(
          vec3(0.15, 0.12, 0.1),
          vec3(0.25, 0.2, 0.18),
          fbm(pos.xz * 2.0)
        );

        // Snow
        float snowMask = smoothstep(0.3, 0.7, h) * smoothstep(0.5, 0.2, slope);
        snowMask = smoothstep(0.0, 0.5, snowMask + fbm(pos.xz * 4.0) * 0.3);
        vec3 snow = vec3(0.9, 0.92, 0.95);
        vec3 mat = mix(rock, snow, snowMask);

        // Lighting
        vec3 sun = normalize(vec3(0.5, 0.3, -0.5));
        float dif = max(dot(nor, sun), 0.0) * 0.6;
        float amb = 0.15 + 0.1 * nor.y;

        // Moon light
        float moonLit = max(dot(nor, moonDir), 0.0) * 0.25;

        // Shadow
        float sha = shadow(pos + nor * 0.01, sun, 0.02, 20.0);

        // Combine lighting
        col = mat * (amb + (dif * sha + moonLit));

        // Rim light
        float rim = pow(1.0 - max(dot(nor, -rd), 0.0), 3.0);
        col += vec3(0.15, 0.15, 0.25) * rim * 0.3;

        // Fog
        float fog = 1.0 - exp(-t * 0.02);
        vec3 fogCol = mix(vec3(0.05, 0.05, 0.12), skyLow, 0.3);
        col = mix(col, fogCol, fog);
      }

      // Tone mapping and gamma
      col = col / (1.0 + col);
      col = pow(col, vec3(0.85));

      // Vignette
      float vig = 1.0 - dot(vUv - 0.5, vUv - 0.5) * 0.5;
      col *= vig;

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
