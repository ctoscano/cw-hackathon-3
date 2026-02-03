"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useReducedMotion } from "../hooks/useReducedMotion";

interface ForestLandscapeProps {
  speed?: number;
}

// Firewatch-style layered forest silhouettes
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

  // Firewatch-inspired layered forest with clean silhouettes
  const fragmentShader = `
    precision highp float;

    varying vec2 vUv;
    uniform float uTime;
    uniform vec2 uResolution;

    // Simple hash
    float hash(float n) {
      return fract(sin(n) * 43758.5453123);
    }

    // Single pine tree - clean triangular shape
    float tree(vec2 uv, float x, float width, float height) {
      vec2 p = uv - vec2(x, 0.0);

      // Triangle tree shape
      float tree = 0.0;
      float y = p.y;

      if (y > 0.0 && y < height) {
        // Main triangle body - gets narrower toward top
        float t = y / height;
        float w = width * (1.0 - t * 0.92);
        tree = step(abs(p.x), w);
      }

      // Trunk
      float trunkW = width * 0.15;
      float trunkH = height * 0.15;
      if (y > -trunkH && y < trunkH) {
        tree = max(tree, step(abs(p.x), trunkW));
      }

      return tree;
    }

    // Forest layer - row of trees
    float forestLayer(vec2 uv, float yBase, float scale, float seed, float density) {
      float forest = 0.0;

      // Generate trees across the layer
      for (float i = -2.0; i < 15.0; i++) {
        float id = seed + i;
        float x = (i + hash(id * 1.3)) * density;
        float h = (0.15 + hash(id * 2.7) * 0.2) * scale;
        float w = (0.03 + hash(id * 3.1) * 0.03) * scale;

        forest = max(forest, tree(uv, x, w, yBase + h));
      }

      return forest;
    }

    // Mountain/hill silhouette
    float hills(vec2 uv, float y, float freq, float amp, float seed) {
      float h = y;
      h += sin(uv.x * freq + seed) * amp;
      h += sin(uv.x * freq * 2.3 + seed * 2.0) * amp * 0.5;
      h += sin(uv.x * freq * 4.1 + seed * 3.0) * amp * 0.25;
      return step(uv.y, h);
    }

    void main() {
      vec2 uv = vUv;
      float time = uTime;

      // Firewatch color palette - warm sunset/sunrise
      vec3 skyTop = vec3(0.15, 0.25, 0.45);      // Deep blue
      vec3 skyMid = vec3(0.6, 0.35, 0.35);       // Dusty rose
      vec3 skyLow = vec3(0.95, 0.6, 0.4);        // Orange
      vec3 horizon = vec3(1.0, 0.85, 0.6);       // Bright yellow-orange

      // Sky gradient
      float skyGrad = uv.y;
      vec3 sky = mix(horizon, skyLow, smoothstep(0.3, 0.5, skyGrad));
      sky = mix(sky, skyMid, smoothstep(0.5, 0.7, skyGrad));
      sky = mix(sky, skyTop, smoothstep(0.7, 1.0, skyGrad));

      // Sun glow
      vec2 sunPos = vec2(0.7, 0.55);
      float sunDist = length(uv - sunPos);
      float sun = smoothstep(0.08, 0.0, sunDist);
      float sunGlow = exp(-sunDist * 3.0) * 0.6;
      sky = mix(sky, vec3(1.0, 0.95, 0.85), sun);
      sky += vec3(1.0, 0.7, 0.4) * sunGlow;

      vec3 color = sky;

      // Layer colors - from back (light) to front (dark)
      vec3 layer6Col = vec3(0.55, 0.45, 0.55);   // Distant mountains - purple haze
      vec3 layer5Col = vec3(0.4, 0.38, 0.45);    // Far forest
      vec3 layer4Col = vec3(0.28, 0.3, 0.35);    // Mid-far forest
      vec3 layer3Col = vec3(0.18, 0.22, 0.25);   // Mid forest
      vec3 layer2Col = vec3(0.1, 0.14, 0.16);    // Near forest
      vec3 layer1Col = vec3(0.03, 0.05, 0.06);   // Foreground - almost black

      // Parallax offset based on time
      float parallax = time * 0.05;

      // Layer 6: Distant mountains
      float mountains = hills(vec2(uv.x + parallax * 0.1, uv.y), 0.65, 2.0, 0.08, 0.0);
      color = mix(color, layer6Col, mountains);

      // Layer 5: Far forest
      vec2 uv5 = vec2(uv.x + parallax * 0.2, uv.y);
      float forest5 = forestLayer(uv5, 0.5, 0.5, 500.0, 0.08);
      forest5 = max(forest5, hills(uv5, 0.52, 5.0, 0.03, 10.0));
      color = mix(color, layer5Col, forest5);

      // Layer 4: Mid-far forest
      vec2 uv4 = vec2(uv.x + parallax * 0.4, uv.y);
      float forest4 = forestLayer(uv4, 0.4, 0.65, 400.0, 0.07);
      forest4 = max(forest4, hills(uv4, 0.42, 6.0, 0.025, 20.0));
      color = mix(color, layer4Col, forest4);

      // Layer 3: Mid forest
      vec2 uv3 = vec2(uv.x + parallax * 0.7, uv.y);
      float forest3 = forestLayer(uv3, 0.28, 0.8, 300.0, 0.065);
      forest3 = max(forest3, hills(uv3, 0.3, 8.0, 0.02, 30.0));
      color = mix(color, layer3Col, forest3);

      // Layer 2: Near forest
      vec2 uv2 = vec2(uv.x + parallax * 1.0, uv.y);
      float forest2 = forestLayer(uv2, 0.15, 1.0, 200.0, 0.06);
      color = mix(color, layer2Col, forest2);

      // Layer 1: Foreground trees - large silhouettes
      vec2 uv1 = vec2(uv.x + parallax * 1.5, uv.y);
      float forest1 = 0.0;
      // Large prominent trees
      forest1 = max(forest1, tree(uv1, -0.1, 0.08, 0.7));
      forest1 = max(forest1, tree(uv1, 0.15, 0.06, 0.55));
      forest1 = max(forest1, tree(uv1, 0.9, 0.07, 0.6));
      forest1 = max(forest1, tree(uv1, 1.1, 0.09, 0.75));
      color = mix(color, layer1Col, forest1);

      // Ground
      float ground = step(uv.y, 0.08);
      color = mix(color, layer1Col, ground);

      // Slight vignette
      float vignette = 1.0 - length((uv - 0.5) * vec2(1.0, 0.7)) * 0.4;
      color *= vignette;

      // Subtle color grading
      color = pow(color, vec3(0.95));

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
