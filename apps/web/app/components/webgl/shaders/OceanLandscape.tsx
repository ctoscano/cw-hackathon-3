"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useReducedMotion } from "../hooks/useReducedMotion";

interface OceanLandscapeProps {
  speed?: number;
  colors?: {
    skyTop?: string;
    skyBottom?: string;
    sun?: string;
    water?: string;
    waterDeep?: string;
  };
}

export function OceanLandscape({ speed = 0.5, colors = {} }: OceanLandscapeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { invalidate, size } = useThree();
  const reducedMotion = useReducedMotion();

  const actualSpeed = reducedMotion ? 0 : speed;

  const defaultColors = {
    skyTop: "#ff6b6b",
    skyBottom: "#4ecdc4",
    sun: "#ffe66d",
    water: "#45b7d1",
    waterDeep: "#2c3e50",
  };

  const mergedColors = { ...defaultColors, ...colors };

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uColorSkyTop: { value: new THREE.Color(mergedColors.skyTop) },
      uColorSkyBottom: { value: new THREE.Color(mergedColors.skyBottom) },
      uColorSun: { value: new THREE.Color(mergedColors.sun) },
      uColorWater: { value: new THREE.Color(mergedColors.water) },
      uColorWaterDeep: { value: new THREE.Color(mergedColors.waterDeep) },
    }),
    [
      mergedColors.skyTop,
      mergedColors.skyBottom,
      mergedColors.sun,
      mergedColors.water,
      mergedColors.waterDeep,
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
    uniform vec3 uColorSkyTop;
    uniform vec3 uColorSkyBottom;
    uniform vec3 uColorSun;
    uniform vec3 uColorWater;
    uniform vec3 uColorWaterDeep;

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

    void main() {
      vec2 uv = vUv;

      // Horizon line
      float horizon = 0.45;

      // Sky gradient
      vec3 skyColor = mix(uColorSkyBottom, uColorSkyTop, pow(uv.y - horizon, 0.5) * 1.5);

      // Sun
      vec2 sunPos = vec2(0.5, horizon + 0.15);
      float sunDist = length((uv - sunPos) * vec2(1.0, 1.5));
      float sun = smoothstep(0.12, 0.08, sunDist);
      float sunGlow = smoothstep(0.4, 0.0, sunDist) * 0.5;
      skyColor = mix(skyColor, uColorSun, sun);
      skyColor += uColorSun * sunGlow * 0.5;

      // Clouds (subtle)
      float clouds = noise(vec2(uv.x * 3.0 + uTime * 0.02, uv.y * 2.0 + 5.0));
      clouds = smoothstep(0.4, 0.6, clouds) * 0.15;
      skyColor += vec3(clouds) * smoothstep(horizon, horizon + 0.3, uv.y);

      // Water base color
      vec3 waterColor = mix(uColorWaterDeep, uColorWater, smoothstep(0.0, horizon, uv.y));

      // Wave effect
      float wave1 = sin(uv.x * 30.0 + uTime * 2.0) * 0.003;
      float wave2 = sin(uv.x * 50.0 - uTime * 1.5) * 0.002;
      float wave3 = noise(vec2(uv.x * 10.0 + uTime, uv.y * 5.0)) * 0.01;
      float waves = wave1 + wave2 + wave3;

      // Wave highlights
      float waveHighlight = smoothstep(0.005, 0.01, waves) * 0.3;
      waterColor += vec3(waveHighlight) * smoothstep(horizon, 0.0, uv.y);

      // Sun reflection on water
      float reflectionX = abs(uv.x - 0.5);
      float reflectionPath = smoothstep(0.15, 0.0, reflectionX);
      float reflectionWave = sin(uv.y * 100.0 + uTime * 3.0 + uv.x * 20.0) * 0.5 + 0.5;
      float reflection = reflectionPath * reflectionWave * smoothstep(horizon, 0.0, uv.y) * 0.4;
      waterColor += uColorSun * reflection;

      // Distant islands/boats (simple silhouettes)
      float island1 = smoothstep(0.02, 0.015, abs(uv.y - horizon + 0.01)) *
                      smoothstep(0.1, 0.05, abs(uv.x - 0.2)) * 0.3;
      float island2 = smoothstep(0.015, 0.01, abs(uv.y - horizon + 0.005)) *
                      smoothstep(0.08, 0.03, abs(uv.x - 0.75)) * 0.2;
      waterColor = mix(waterColor, vec3(0.1, 0.1, 0.15), island1 + island2);

      // Combine sky and water
      vec3 color = uv.y > horizon ? skyColor : waterColor;

      // Horizon line blend
      float horizonBlend = smoothstep(horizon - 0.01, horizon + 0.01, uv.y);
      color = mix(waterColor, skyColor, horizonBlend);

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
