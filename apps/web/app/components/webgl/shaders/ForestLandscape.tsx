"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useReducedMotion } from "../hooks/useReducedMotion";

interface ForestLandscapeProps {
  speed?: number;
}

// Misty forest with volumetric fog and god rays
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

  const fragmentShader = `
    precision mediump float;

    varying vec2 vUv;
    uniform float uTime;
    uniform vec2 uResolution;

    const float PI = 3.141592653589793;
    const mat2 m = mat2(0.80, 0.60, -0.60, 0.80);

    // Hash functions
    float hash(float n) {
      return fract(sin(n) * 43758.5453123);
    }

    float hash2(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    // 2D Noise
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float n = i.x + i.y * 57.0;
      return mix(
        mix(hash(n), hash(n + 1.0), f.x),
        mix(hash(n + 57.0), hash(n + 58.0), f.x),
        f.y
      );
    }

    // FBM
    float fbm(vec2 p) {
      float f = 0.0;
      f += 0.5000 * noise(p); p = m * p * 2.02;
      f += 0.2500 * noise(p); p = m * p * 2.03;
      f += 0.1250 * noise(p); p = m * p * 2.01;
      f += 0.0625 * noise(p);
      return f / 0.9375;
    }

    // Tree silhouette SDF-like function
    float tree(vec2 uv, float x, float height, float width) {
      vec2 p = uv - vec2(x, 0.0);

      // Trunk
      float trunk = smoothstep(width * 0.15, width * 0.1, abs(p.x)) *
                    step(0.0, p.y) * step(p.y, height * 0.4);

      // Canopy - triangular layers
      float canopy = 0.0;
      for(float i = 0.0; i < 4.0; i++) {
        float layerY = height * (0.2 + i * 0.2);
        float layerH = height * 0.35;
        float layerW = width * (1.0 - i * 0.15);

        float y = p.y - layerY;
        if(y > 0.0 && y < layerH) {
          float t = y / layerH;
          float w = layerW * (1.0 - t);
          canopy = max(canopy, smoothstep(w + 0.002, w, abs(p.x)));
        }
      }

      // Pointed top
      float topY = height * 0.85;
      float topH = height * 0.2;
      float topT = (p.y - topY) / topH;
      if(topT > 0.0 && topT < 1.0) {
        float topW = width * 0.25 * (1.0 - topT);
        canopy = max(canopy, smoothstep(topW + 0.002, topW, abs(p.x)));
      }

      return max(trunk, canopy);
    }

    // Forest layer
    float forestLayer(vec2 uv, float baseY, float scale, float seed) {
      float forest = 0.0;

      for(float i = 0.0; i < 12.0; i++) {
        float treeSeed = seed + i * 73.0;
        float x = hash(treeSeed) * 1.3 - 0.15;
        float h = (0.08 + hash(treeSeed + 1.0) * 0.12) * scale;
        float w = (0.015 + hash(treeSeed + 2.0) * 0.01) * scale;

        forest = max(forest, tree(uv, x, baseY + h, w));
      }

      return forest;
    }

    // Volumetric light rays
    float godRays(vec2 uv, vec2 lightPos, float time) {
      vec2 delta = uv - lightPos;
      float dist = length(delta);
      float angle = atan(delta.y, delta.x);

      // Multiple ray frequencies
      float rays = 0.0;
      rays += sin(angle * 6.0 + time * 0.1) * 0.5 + 0.5;
      rays += sin(angle * 10.0 - time * 0.15) * 0.3 + 0.3;
      rays += sin(angle * 15.0 + time * 0.08) * 0.2 + 0.2;

      // Fade with distance
      rays *= exp(-dist * 1.2);

      // Noise variation
      rays *= 0.7 + fbm(vec2(angle * 3.0, time * 0.1)) * 0.6;

      return rays * 0.4;
    }

    // Fog layers
    float fog(vec2 uv, float time, float layer) {
      vec2 fogUv = uv * vec2(2.0, 1.0) + vec2(time * 0.02 * layer, 0.0);
      float f = fbm(fogUv * 3.0 + layer * 10.0);
      f *= fbm(fogUv * 6.0 - layer * 5.0);
      return f;
    }

    void main() {
      vec2 uv = vUv;
      float time = uTime;
      float aspect = uResolution.x / uResolution.y;

      // Light source position (morning sun, upper right)
      vec2 lightPos = vec2(0.8, 0.85);

      // === SKY ===
      // Warm morning gradient
      vec3 skyTop = vec3(0.45, 0.6, 0.8);
      vec3 skyMid = vec3(0.85, 0.75, 0.65);
      vec3 skyLow = vec3(1.0, 0.9, 0.75);

      float skyGrad = pow(uv.y, 0.7);
      vec3 sky = mix(skyLow, skyMid, smoothstep(0.2, 0.5, skyGrad));
      sky = mix(sky, skyTop, smoothstep(0.5, 1.0, skyGrad));

      // Sun glow
      float sunDist = length((uv - lightPos) * vec2(1.0, 1.3));
      float sunCore = smoothstep(0.06, 0.04, sunDist);
      float sunGlow1 = exp(-sunDist * 5.0) * 0.8;
      float sunGlow2 = exp(-sunDist * 2.0) * 0.4;
      float sunGlow3 = exp(-sunDist * 0.8) * 0.2;

      sky = mix(sky, vec3(1.0, 1.0, 0.95), sunCore);
      sky += vec3(1.0, 0.95, 0.8) * sunGlow1;
      sky += vec3(1.0, 0.85, 0.6) * sunGlow2;
      sky += vec3(1.0, 0.7, 0.4) * sunGlow3;

      // God rays in sky
      float rays = godRays(uv, lightPos, time);
      sky += vec3(1.0, 0.95, 0.85) * rays;

      vec3 color = sky;

      // === DISTANT HILLS ===
      float hills = fbm(vec2(uv.x * 2.0 + 5.0, 0.0)) * 0.12 + 0.38;
      float hillMask = smoothstep(hills + 0.02, hills - 0.02, uv.y);
      vec3 hillColor = mix(vec3(0.6, 0.65, 0.7), vec3(0.75, 0.8, 0.85), hillMask * 0.5);
      color = mix(color, hillColor, hillMask * 0.6);

      // === BACK FOREST LAYER (most fog) ===
      float backForest = forestLayer(uv, 0.28, 0.55, 100.0);
      vec3 backTreeColor = vec3(0.4, 0.48, 0.5);
      // Heavy atmospheric fog
      backTreeColor = mix(backTreeColor, vec3(0.75, 0.78, 0.8), 0.6);
      color = mix(color, backTreeColor, backForest * 0.8);

      // Fog layer 1
      float fog1 = fog(uv, time, 1.0);
      float fogMask1 = smoothstep(0.5, 0.2, uv.y) * smoothstep(0.1, 0.25, uv.y);
      color = mix(color, vec3(0.9, 0.92, 0.9), fog1 * fogMask1 * 0.5);

      // God rays through fog
      color += vec3(1.0, 0.95, 0.85) * rays * fogMask1 * 0.3;

      // === MID FOREST LAYER ===
      float midForest = forestLayer(uv, 0.2, 0.75, 200.0);
      vec3 midTreeColor = vec3(0.25, 0.32, 0.3);
      midTreeColor = mix(midTreeColor, vec3(0.55, 0.58, 0.55), 0.35);
      color = mix(color, midTreeColor, midForest * 0.9);

      // Fog layer 2
      float fog2 = fog(uv, time * 1.2, 2.0);
      float fogMask2 = smoothstep(0.35, 0.12, uv.y) * smoothstep(0.05, 0.15, uv.y);
      color = mix(color, vec3(0.85, 0.88, 0.85), fog2 * fogMask2 * 0.45);

      // More god rays
      color += vec3(1.0, 0.95, 0.85) * rays * fogMask2 * 0.25;

      // === NEAR FOREST LAYER ===
      float nearForest = forestLayer(uv, 0.12, 1.0, 300.0);
      vec3 nearTreeColor = vec3(0.12, 0.18, 0.15);
      nearTreeColor = mix(nearTreeColor, vec3(0.35, 0.38, 0.35), 0.15);
      color = mix(color, nearTreeColor, nearForest * 0.95);

      // === FOREGROUND SILHOUETTE TREES ===
      float leftTree = tree(uv, -0.02, 0.75, 0.09);
      float rightTree = tree(uv, 1.0, 0.68, 0.08);
      float edgeTree = tree(uv, 0.88, 0.52, 0.06);

      vec3 silhouetteColor = vec3(0.04, 0.06, 0.05);
      color = mix(color, silhouetteColor, max(max(leftTree, rightTree), edgeTree) * 0.98);

      // === GROUND ===
      float groundY = 0.08 + fbm(vec2(uv.x * 5.0, 0.0)) * 0.015;
      if(uv.y < groundY + 0.02) {
        vec3 groundColor = vec3(0.15, 0.18, 0.12);

        // Grass variation
        float grassNoise = noise(uv * vec2(80.0, 40.0) + time * 0.3);
        groundColor += vec3(0.05, 0.08, 0.03) * grassNoise * 0.4;

        // Ground fog
        float groundFog = smoothstep(0.0, 0.06, uv.y);
        groundColor = mix(vec3(0.8, 0.82, 0.78), groundColor, groundFog);

        color = mix(groundColor, color, smoothstep(groundY - 0.01, groundY + 0.02, uv.y));
      }

      // === POST PROCESSING ===

      // Warm morning tint
      color = mix(color, color * vec3(1.08, 1.02, 0.95), 0.3);

      // Soft contrast
      color = pow(color, vec3(0.95));

      // Vignette
      float vignette = 1.0 - length((uv - 0.5) * vec2(0.8, 1.0)) * 0.35;
      color *= vignette;

      // Very subtle film grain
      float grain = hash2(uv * 500.0 + time) * 0.015;
      color += grain - 0.0075;

      // Final sun influence
      float sunInfluence = exp(-length(uv - lightPos) * 1.5) * 0.08;
      color += vec3(1.0, 0.9, 0.7) * sunInfluence;

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
