"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useReducedMotion } from "../hooks/useReducedMotion";

interface MountainLandscapeProps {
  speed?: number;
}

export function MountainLandscape({ speed = 0.15 }: MountainLandscapeProps) {
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

    // Hash functions for noise
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

    // Fractal Brownian Motion
    float fbm(vec2 p) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;
      for (int i = 0; i < 6; i++) {
        value += amplitude * noise(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
      }
      return value;
    }

    // Mountain shape with peaks
    float mountainShape(float x, float seed, float peakiness) {
      float base = fbm(vec2(x * 2.0 + seed, seed)) * 0.5;
      // Add sharper peaks
      float peaks = 0.0;
      for (float i = 0.0; i < 5.0; i++) {
        float peakX = hash(seed + i * 100.0);
        float peakHeight = hash(seed + i * 200.0) * 0.3 + 0.1;
        float peakWidth = hash(seed + i * 300.0) * 0.15 + 0.05;
        float dist = abs(x - peakX);
        // Triangular peak shape
        peaks = max(peaks, peakHeight * max(0.0, 1.0 - dist / peakWidth) * peakiness);
      }
      return base + peaks;
    }

    // Star field
    float stars(vec2 uv, float density) {
      vec2 gridUV = floor(uv * density);
      float starRandom = hash2(gridUV);
      vec2 cellUV = fract(uv * density);
      vec2 starPos = vec2(hash2(gridUV + 0.1), hash2(gridUV + 0.2));
      float starDist = length(cellUV - starPos);
      float starSize = hash2(gridUV + 0.3) * 0.015 + 0.005;
      float star = smoothstep(starSize, 0.0, starDist);
      // Only show some stars
      star *= step(0.85, starRandom);
      // Twinkle
      star *= 0.5 + 0.5 * sin(uTime * (hash2(gridUV + 0.4) * 3.0 + 1.0) + hash2(gridUV) * 6.28);
      return star;
    }

    // Milky way / galaxy
    float galaxy(vec2 uv) {
      // Diagonal band across the sky
      vec2 galaxyUV = uv;
      galaxyUV.x += galaxyUV.y * 0.3;

      float band = exp(-pow((galaxyUV.y - 0.7) * 3.0, 2.0));
      float detail = fbm(galaxyUV * 8.0 + uTime * 0.02) * 0.5 + 0.5;
      float clouds = fbm(galaxyUV * 15.0) * 0.3;

      return band * detail * (0.7 + clouds);
    }

    // Grass texture on foreground hill
    float grass(vec2 uv, float groundY) {
      float grassHeight = 0.008;
      float grassDensity = 150.0;

      float grassPattern = 0.0;
      for (float i = 0.0; i < 3.0; i++) {
        float offset = hash(i) * 1000.0;
        vec2 grassUV = uv * vec2(grassDensity * (1.0 + i * 0.3), 1.0);
        float blade = hash2(floor(grassUV) + offset);
        float bladeHeight = blade * grassHeight * (1.0 - i * 0.2);
        float bladeX = fract(grassUV.x);
        float bladeCurve = sin(bladeX * 3.14159) * bladeHeight;
        bladeCurve *= sin(uTime * 0.5 + blade * 6.28) * 0.3 + 0.7; // Wind sway

        if (uv.y < groundY + bladeCurve && uv.y > groundY - 0.01) {
          grassPattern = max(grassPattern, 0.3 + blade * 0.3);
        }
      }
      return grassPattern;
    }

    void main() {
      vec2 uv = vUv;
      float aspect = uResolution.x / uResolution.y;

      // === SKY ===
      // Deep night sky gradient
      vec3 skyDark = vec3(0.02, 0.03, 0.08);
      vec3 skyMid = vec3(0.05, 0.08, 0.15);
      vec3 horizonColor = vec3(0.08, 0.12, 0.18);

      vec3 color = mix(horizonColor, skyMid, smoothstep(0.3, 0.6, uv.y));
      color = mix(color, skyDark, smoothstep(0.6, 1.0, uv.y));

      // === STARS ===
      float starLayer1 = stars(uv, 80.0);
      float starLayer2 = stars(uv + 100.0, 150.0) * 0.6;
      float starLayer3 = stars(uv + 200.0, 300.0) * 0.3;
      float allStars = starLayer1 + starLayer2 + starLayer3;
      color += vec3(0.9, 0.95, 1.0) * allStars * smoothstep(0.35, 0.7, uv.y);

      // === MILKY WAY / GALAXY ===
      float galaxyIntensity = galaxy(uv);
      vec3 galaxyColor = mix(
        vec3(0.4, 0.3, 0.5),  // Purple
        vec3(1.0, 0.6, 0.3),  // Orange/gold
        fbm(uv * 5.0)
      );
      color += galaxyColor * galaxyIntensity * 0.25 * smoothstep(0.4, 0.8, uv.y);

      // Bright galaxy core
      vec2 corePos = vec2(0.65, 0.72);
      float coreDist = length((uv - corePos) * vec2(1.5, 1.0));
      float coreGlow = exp(-coreDist * 4.0) * 0.4;
      color += vec3(1.0, 0.7, 0.4) * coreGlow;

      // === ATMOSPHERIC GLOW AT HORIZON ===
      float horizonGlow = exp(-pow((uv.y - 0.32) * 5.0, 2.0)) * 0.2;
      color += vec3(0.15, 0.12, 0.2) * horizonGlow;

      // Warm light from galaxy reflecting on horizon
      float warmGlow = exp(-pow((uv.y - 0.35) * 4.0, 2.0)) * 0.15;
      warmGlow *= smoothstep(0.4, 0.7, uv.x); // More on the right where galaxy is
      color += vec3(0.3, 0.15, 0.05) * warmGlow;

      // === MOUNTAINS ===
      // Far mountain range (misty, bluish)
      float mountain4 = mountainShape(uv.x, 40.0, 0.3) * 0.18 + 0.28;
      if (uv.y < mountain4) {
        vec3 m4Color = vec3(0.12, 0.14, 0.22);
        float fade = smoothstep(mountain4 - 0.1, mountain4, uv.y);
        color = mix(m4Color, color, fade * 0.3 + 0.2);
      }

      // Mid-far mountains
      float mountain3 = mountainShape(uv.x, 30.0, 0.5) * 0.22 + 0.22;
      if (uv.y < mountain3) {
        vec3 m3Color = vec3(0.08, 0.1, 0.16);
        float fade = smoothstep(mountain3 - 0.08, mountain3, uv.y);
        color = mix(m3Color, color, fade * 0.2);
      }

      // Mid mountains
      float mountain2 = mountainShape(uv.x, 20.0, 0.7) * 0.25 + 0.15;
      if (uv.y < mountain2) {
        vec3 m2Color = vec3(0.05, 0.07, 0.12);
        // Slight highlight on peaks from galaxy light
        float highlight = smoothstep(mountain2 - 0.02, mountain2, uv.y) * 0.1;
        highlight *= smoothstep(0.3, 0.8, uv.x);
        color = mix(m2Color + vec3(0.1, 0.05, 0.02) * highlight, color, 0.0);
      }

      // Near mountains (darkest silhouette)
      float mountain1 = mountainShape(uv.x, 10.0, 0.9) * 0.2 + 0.08;
      if (uv.y < mountain1) {
        vec3 m1Color = vec3(0.02, 0.03, 0.05);
        color = m1Color;
      }

      // === FOREGROUND HILL WITH GRASS ===
      float hillShape = sin(uv.x * 2.5 + 1.0) * 0.03 + fbm(vec2(uv.x * 8.0, 0.0)) * 0.02;
      float groundY = 0.08 + hillShape;

      if (uv.y < groundY + 0.02) {
        // Ground color
        vec3 groundColor = vec3(0.04, 0.05, 0.03);
        vec3 grassColor = vec3(0.15, 0.18, 0.08);

        // Grass effect
        float grassEffect = grass(uv, groundY);
        if (grassEffect > 0.0) {
          // Grass lit by warm galaxy light
          vec3 litGrass = mix(grassColor, vec3(0.25, 0.2, 0.1), smoothstep(0.5, 0.9, uv.x) * 0.5);
          color = mix(groundColor, litGrass, grassEffect);
        } else if (uv.y < groundY) {
          color = groundColor;
        }
      }

      // === SUBTLE VIGNETTE ===
      float vignette = 1.0 - length((uv - 0.5) * vec2(0.8, 1.0)) * 0.4;
      color *= vignette;

      // === FILM GRAIN (very subtle) ===
      float grain = hash2(uv * 1000.0 + uTime) * 0.02;
      color += grain - 0.01;

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
