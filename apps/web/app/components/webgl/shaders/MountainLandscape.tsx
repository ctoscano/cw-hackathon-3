"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useReducedMotion } from "../hooks/useReducedMotion";

interface MountainLandscapeProps {
  speed?: number;
  colors?: {
    sky?: string;
    horizon?: string;
    mountain1?: string;
    mountain2?: string;
    mountain3?: string;
  };
}

export function MountainLandscape({ speed = 0.3, colors = {} }: MountainLandscapeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { invalidate, size } = useThree();
  const reducedMotion = useReducedMotion();

  const actualSpeed = reducedMotion ? 0 : speed;

  const defaultColors = {
    sky: "#1a1a2e",
    horizon: "#16213e",
    mountain1: "#0f3460",
    mountain2: "#533483",
    mountain3: "#e94560",
  };

  const mergedColors = { ...defaultColors, ...colors };

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uColorSky: { value: new THREE.Color(mergedColors.sky) },
      uColorHorizon: { value: new THREE.Color(mergedColors.horizon) },
      uColorMountain1: { value: new THREE.Color(mergedColors.mountain1) },
      uColorMountain2: { value: new THREE.Color(mergedColors.mountain2) },
      uColorMountain3: { value: new THREE.Color(mergedColors.mountain3) },
    }),
    [
      mergedColors.sky,
      mergedColors.horizon,
      mergedColors.mountain1,
      mergedColors.mountain2,
      mergedColors.mountain3,
      size.width,
      size.height,
    ],
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
    uniform vec3 uColorSky;
    uniform vec3 uColorHorizon;
    uniform vec3 uColorMountain1;
    uniform vec3 uColorMountain2;
    uniform vec3 uColorMountain3;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    float fbm(vec2 p) {
      float value = 0.0;
      float amplitude = 0.5;
      for (int i = 0; i < 4; i++) {
        value += amplitude * noise(p);
        p *= 2.0;
        amplitude *= 0.5;
      }
      return value;
    }

    void main() {
      vec2 uv = vUv;

      // Sky gradient - from sky color at top to horizon at middle
      vec3 color = mix(uColorHorizon, uColorSky, pow(uv.y, 0.6));

      // Stars (subtle)
      float stars = step(0.998, hash(floor(uv * 200.0)));
      color += vec3(stars * 0.3) * smoothstep(0.5, 1.0, uv.y);

      // Mountain layer 3 (furthest, lightest)
      float mountain3 = fbm(vec2(uv.x * 1.5 + uTime * 0.02, 0.0)) * 0.25 + 0.15;
      float m3Line = smoothstep(mountain3, mountain3 + 0.01, uv.y);
      color = mix(uColorMountain3 * 0.4, color, m3Line);

      // Mountain layer 2 (middle)
      float mountain2 = fbm(vec2(uv.x * 2.5 + uTime * 0.03 + 10.0, 0.0)) * 0.3 + 0.08;
      float m2Line = smoothstep(mountain2, mountain2 + 0.01, uv.y);
      color = mix(uColorMountain2 * 0.5, color, m2Line);

      // Mountain layer 1 (closest, darkest)
      float mountain1 = fbm(vec2(uv.x * 4.0 + uTime * 0.05 + 20.0, 0.0)) * 0.35 + 0.02;
      float m1Line = smoothstep(mountain1, mountain1 + 0.005, uv.y);
      color = mix(uColorMountain1 * 0.7, color, m1Line);

      // Subtle glow at horizon
      float horizonGlow = exp(-pow((uv.y - 0.3) * 4.0, 2.0)) * 0.15;
      color += uColorHorizon * horizonGlow;

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
