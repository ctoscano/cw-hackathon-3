"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useReducedMotion } from "../hooks/useReducedMotion";

interface OceanLandscapeProps {
  speed?: number;
}

export function OceanLandscape({ speed = 0.3 }: OceanLandscapeProps) {
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

    // Hash functions
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

    // FBM for clouds
    float fbm(vec2 p) {
      float value = 0.0;
      float amplitude = 0.5;
      for (int i = 0; i < 5; i++) {
        value += amplitude * noise(p);
        p *= 2.0;
        amplitude *= 0.5;
      }
      return value;
    }

    // Cloud function
    float clouds(vec2 uv, float time) {
      vec2 cloudUV = uv * vec2(2.0, 4.0);
      cloudUV.x += time * 0.02;

      float cloud = 0.0;

      // Multiple cloud layers
      float layer1 = fbm(cloudUV * 1.0);
      float layer2 = fbm(cloudUV * 2.0 + 10.0);
      float layer3 = fbm(cloudUV * 4.0 + 20.0);

      cloud = layer1 * 0.5 + layer2 * 0.3 + layer3 * 0.2;

      // Shape clouds
      cloud = smoothstep(0.35, 0.65, cloud);

      return cloud;
    }

    // Wave function with multiple octaves
    float waves(vec2 uv, float time) {
      float wave = 0.0;

      // Large swells
      wave += sin(uv.x * 8.0 + time * 0.8) * 0.04;
      wave += sin(uv.x * 12.0 - time * 0.6 + 2.0) * 0.025;

      // Medium waves
      wave += sin(uv.x * 25.0 + time * 1.5) * 0.012;
      wave += sin(uv.x * 35.0 - time * 1.2 + uv.y * 10.0) * 0.008;

      // Small ripples
      wave += noise(uv * 50.0 + time * 0.5) * 0.015;
      wave += noise(uv * 80.0 - time * 0.3) * 0.008;

      return wave;
    }

    // Boat silhouette
    float boat(vec2 uv, vec2 pos, float size) {
      vec2 p = (uv - pos) / size;

      // Hull
      float hull = smoothstep(0.0, 0.02, 0.03 - abs(p.y + 0.02));
      hull *= smoothstep(0.15, 0.1, abs(p.x));
      hull *= step(-0.05, p.y);

      // Sail
      float sail = 0.0;
      if (p.x > -0.02 && p.x < 0.08 && p.y > 0.0 && p.y < 0.15) {
        float sailShape = 1.0 - (p.y / 0.15);
        sailShape *= 0.1;
        sail = step(abs(p.x - 0.03), sailShape) * step(0.0, p.y) * step(p.y, 0.15);
      }

      // Mast
      float mast = step(abs(p.x - 0.0), 0.003) * step(0.0, p.y) * step(p.y, 0.12);

      return max(hull, max(sail, mast));
    }

    // Bird silhouette
    float bird(vec2 uv, vec2 pos, float size, float wingPhase) {
      vec2 p = (uv - pos) / size;

      // Wing shape using sine
      float wing = sin(abs(p.x) * 8.0 + wingPhase) * 0.3;
      float body = smoothstep(0.02, 0.0, abs(p.y - wing)) * smoothstep(0.15, 0.0, abs(p.x));

      return body;
    }

    void main() {
      vec2 uv = vUv;
      float time = uTime;

      // Horizon position
      float horizon = 0.42;

      // === SKY ===
      // Multi-color sunset gradient
      vec3 skyTop = vec3(0.15, 0.25, 0.45);      // Deep blue
      vec3 skyMid = vec3(0.85, 0.45, 0.35);      // Orange-pink
      vec3 skyLow = vec3(1.0, 0.7, 0.4);         // Golden yellow
      vec3 skyHorizon = vec3(1.0, 0.85, 0.6);    // Bright horizon

      float skyY = (uv.y - horizon) / (1.0 - horizon);
      vec3 skyColor = mix(skyHorizon, skyLow, smoothstep(0.0, 0.15, skyY));
      skyColor = mix(skyColor, skyMid, smoothstep(0.15, 0.4, skyY));
      skyColor = mix(skyColor, skyTop, smoothstep(0.4, 1.0, skyY));

      // === SUN ===
      vec2 sunPos = vec2(0.5, horizon + 0.12);
      float sunDist = length((uv - sunPos) * vec2(1.0, 1.3));

      // Sun disc
      float sun = smoothstep(0.09, 0.085, sunDist);

      // Sun glow layers
      float innerGlow = exp(-sunDist * 8.0) * 0.8;
      float outerGlow = exp(-sunDist * 3.0) * 0.4;
      float wideGlow = exp(-sunDist * 1.5) * 0.2;

      vec3 sunColor = vec3(1.0, 0.95, 0.8);
      vec3 glowColor = vec3(1.0, 0.6, 0.3);

      skyColor = mix(skyColor, sunColor, sun);
      skyColor += sunColor * innerGlow;
      skyColor += glowColor * outerGlow;
      skyColor += vec3(1.0, 0.4, 0.2) * wideGlow;

      // === CLOUDS ===
      float cloudLayer = clouds(uv, time);
      float cloudY = smoothstep(horizon, horizon + 0.35, uv.y) * smoothstep(1.0, 0.6, uv.y);

      // Cloud color - lit by sun
      vec3 cloudColorBright = vec3(1.0, 0.9, 0.85);
      vec3 cloudColorDark = vec3(0.7, 0.4, 0.5);
      vec3 cloudColor = mix(cloudColorDark, cloudColorBright, smoothstep(0.3, 0.7, cloudLayer));

      // Apply clouds with sun influence
      float sunInfluence = exp(-length(uv - sunPos) * 2.0);
      cloudColor = mix(cloudColor, vec3(1.0, 0.8, 0.6), sunInfluence * 0.5);

      skyColor = mix(skyColor, cloudColor, cloudLayer * cloudY * 0.7);

      // === BIRDS ===
      float birds = 0.0;
      for (float i = 0.0; i < 5.0; i++) {
        vec2 birdPos = vec2(
          mod(0.1 + i * 0.18 + time * 0.015 * (0.8 + hash(i) * 0.4), 1.2) - 0.1,
          0.65 + hash(i + 10.0) * 0.2 + sin(time * 0.5 + i) * 0.02
        );
        float wingPhase = time * 8.0 + i * 2.0;
        birds = max(birds, bird(uv, birdPos, 0.015 + hash(i + 5.0) * 0.01, wingPhase));
      }
      skyColor = mix(skyColor, vec3(0.1, 0.1, 0.15), birds * 0.8);

      // === WATER ===
      float waterY = (horizon - uv.y) / horizon;

      // Base water color
      vec3 waterDeep = vec3(0.05, 0.15, 0.25);
      vec3 waterMid = vec3(0.1, 0.25, 0.35);
      vec3 waterSurface = vec3(0.15, 0.35, 0.45);

      vec3 waterColor = mix(waterSurface, waterMid, smoothstep(0.0, 0.3, waterY));
      waterColor = mix(waterColor, waterDeep, smoothstep(0.3, 1.0, waterY));

      // Reflect sky color into water
      vec3 skyReflection = mix(skyHorizon, skyLow, waterY * 0.5);
      waterColor = mix(waterColor, skyReflection, 0.3);

      // Wave displacement and foam
      float waveHeight = waves(uv, time);
      float foam = smoothstep(0.02, 0.035, waveHeight);

      // Wave shading
      float waveShade = waveHeight * 15.0;
      waterColor += vec3(0.1, 0.15, 0.2) * waveShade;
      waterColor = mix(waterColor, vec3(0.9, 0.95, 1.0), foam * 0.3 * (1.0 - waterY));

      // === SUN REFLECTION PATH ===
      float reflectX = abs(uv.x - 0.5);
      float reflectPath = exp(-reflectX * reflectX * 30.0);

      // Broken reflection due to waves
      float reflectWave = noise(vec2(uv.x * 30.0 + time, uv.y * 50.0)) * 0.5 + 0.5;
      reflectWave *= noise(vec2(uv.x * 50.0 - time * 0.5, uv.y * 80.0)) * 0.5 + 0.5;

      float reflection = reflectPath * reflectWave;
      reflection *= smoothstep(horizon, 0.0, uv.y); // Fade with distance
      reflection *= 1.0 - waterY * 0.7; // Stronger near horizon

      // Golden sun reflection
      vec3 reflectionColor = mix(vec3(1.0, 0.7, 0.4), vec3(1.0, 0.9, 0.7), reflectWave);
      waterColor += reflectionColor * reflection * 0.6;

      // Sparkles on water
      float sparkle = noise(uv * 200.0 + time * 2.0);
      sparkle = pow(sparkle, 8.0) * reflectPath * 2.0;
      waterColor += vec3(1.0, 0.95, 0.9) * sparkle * (1.0 - waterY);

      // === BOATS ===
      float boatSilhouette = 0.0;
      boatSilhouette = max(boatSilhouette, boat(uv, vec2(0.15, horizon - 0.02), 0.08));
      boatSilhouette = max(boatSilhouette, boat(uv, vec2(0.78, horizon - 0.015), 0.05));
      boatSilhouette = max(boatSilhouette, boat(uv, vec2(0.55, horizon - 0.025), 0.04));

      waterColor = mix(waterColor, vec3(0.05, 0.08, 0.12), boatSilhouette * 0.9);

      // === COMBINE ===
      vec3 color = uv.y > horizon ? skyColor : waterColor;

      // Smooth horizon transition
      float horizonBlend = smoothstep(horizon - 0.008, horizon + 0.008, uv.y);
      color = mix(waterColor, skyColor, horizonBlend);

      // === POST PROCESSING ===
      // Subtle vignette
      float vignette = 1.0 - length((uv - 0.5) * vec2(0.7, 1.0)) * 0.3;
      color *= vignette;

      // Warm color grade
      color = pow(color, vec3(0.95, 1.0, 1.05));

      // Film grain
      float grain = hash2(uv * 500.0 + time) * 0.015;
      color += grain - 0.0075;

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
