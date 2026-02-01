"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useReducedMotion } from "../hooks/useReducedMotion";

interface ForestLandscapeProps {
  speed?: number;
  colors?: {
    skyTop?: string;
    skyBottom?: string;
    mist?: string;
    treeFar?: string;
    treeMid?: string;
    treeNear?: string;
  };
}

export function ForestLandscape({ speed = 0.2, colors = {} }: ForestLandscapeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { invalidate, size } = useThree();
  const reducedMotion = useReducedMotion();

  const actualSpeed = reducedMotion ? 0 : speed;

  const defaultColors = {
    skyTop: "#f39c12",
    skyBottom: "#27ae60",
    mist: "#ecf0f1",
    treeFar: "#1a252f",
    treeMid: "#2c3e50",
    treeNear: "#1a1a2e",
  };

  const mergedColors = { ...defaultColors, ...colors };

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uColorSkyTop: { value: new THREE.Color(mergedColors.skyTop) },
      uColorSkyBottom: { value: new THREE.Color(mergedColors.skyBottom) },
      uColorMist: { value: new THREE.Color(mergedColors.mist) },
      uColorTreeFar: { value: new THREE.Color(mergedColors.treeFar) },
      uColorTreeMid: { value: new THREE.Color(mergedColors.treeMid) },
      uColorTreeNear: { value: new THREE.Color(mergedColors.treeNear) },
    }),
    [
      mergedColors.skyTop,
      mergedColors.skyBottom,
      mergedColors.mist,
      mergedColors.treeFar,
      mergedColors.treeMid,
      mergedColors.treeNear,
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
    uniform vec3 uColorMist;
    uniform vec3 uColorTreeFar;
    uniform vec3 uColorTreeMid;
    uniform vec3 uColorTreeNear;

    float hash(float n) {
      return fract(sin(n) * 43758.5453123);
    }

    float hash2(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

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

    // Tree shape function
    float tree(vec2 uv, float x, float height, float width) {
      vec2 p = uv - vec2(x, 0.0);

      // Trunk
      float trunk = step(abs(p.x), width * 0.1) * step(0.0, p.y) * step(p.y, height * 0.3);

      // Triangular tree shape (multiple layers)
      float tree = 0.0;
      for (float i = 0.0; i < 3.0; i++) {
        float layerY = height * (0.2 + i * 0.25);
        float layerWidth = width * (1.0 - i * 0.2);
        float layerHeight = height * 0.4;

        float triY = (p.y - layerY) / layerHeight;
        float triWidth = layerWidth * (1.0 - triY);

        tree += step(abs(p.x), triWidth) * step(layerY, p.y) * step(p.y, layerY + layerHeight);
      }

      return max(trunk, tree);
    }

    // Forest layer with multiple trees
    float forestLayer(vec2 uv, float baseHeight, float scale, float timeOffset, float density) {
      float forest = 0.0;

      for (float i = 0.0; i < 12.0; i++) {
        float x = mod(i / density + timeOffset, 1.0);
        float heightVar = hash(i + 100.0) * 0.3 + 0.7;
        float widthVar = hash(i + 200.0) * 0.3 + 0.7;

        forest = max(forest, tree(
          uv,
          x,
          baseHeight * heightVar * scale,
          0.03 * widthVar * scale
        ));
      }

      return forest;
    }

    void main() {
      vec2 uv = vUv;

      // Sky gradient
      vec3 color = mix(uColorSkyBottom, uColorSkyTop, pow(uv.y, 0.7));

      // Sun glow
      vec2 sunPos = vec2(0.7, 0.75);
      float sunGlow = exp(-length(uv - sunPos) * 3.0) * 0.5;
      color += uColorSkyTop * sunGlow;

      // Birds (tiny dots moving)
      float bird1 = step(0.003, length(uv - vec2(mod(0.3 + uTime * 0.02, 1.0), 0.7 + sin(uTime * 0.5) * 0.02)));
      float bird2 = step(0.002, length(uv - vec2(mod(0.35 + uTime * 0.02, 1.0), 0.72 + sin(uTime * 0.5 + 1.0) * 0.02)));
      color = mix(vec3(0.1), color, min(bird1, bird2));

      // Far forest layer (lightest, most mist)
      float farForest = forestLayer(uv, 0.35, 0.6, uTime * 0.005, 10.0);
      vec3 farColor = mix(uColorTreeFar, uColorMist, 0.5);
      color = mix(farColor, color, 1.0 - farForest);

      // Mist layer 1
      float mist1 = noise(vec2(uv.x * 3.0 + uTime * 0.01, uv.y * 2.0)) * 0.3;
      mist1 *= smoothstep(0.5, 0.25, uv.y) * smoothstep(0.0, 0.15, uv.y);
      color = mix(color, uColorMist, mist1);

      // Mid forest layer
      float midForest = forestLayer(uv, 0.28, 0.8, uTime * 0.008 + 0.3, 8.0);
      vec3 midColor = mix(uColorTreeMid, uColorMist, 0.25);
      color = mix(midColor, color, 1.0 - midForest);

      // Mist layer 2
      float mist2 = noise(vec2(uv.x * 4.0 + uTime * 0.015 + 5.0, uv.y * 3.0)) * 0.2;
      mist2 *= smoothstep(0.35, 0.15, uv.y) * smoothstep(0.0, 0.1, uv.y);
      color = mix(color, uColorMist * 0.9, mist2);

      // Near forest layer (darkest)
      float nearForest = forestLayer(uv, 0.2, 1.0, uTime * 0.012 + 0.6, 6.0);
      color = mix(uColorTreeNear, color, 1.0 - nearForest);

      // Ground mist
      float groundMist = smoothstep(0.0, 0.08, uv.y) * 0.3;
      groundMist += noise(vec2(uv.x * 8.0 + uTime * 0.02, 0.0)) * 0.1 * smoothstep(0.1, 0.0, uv.y);
      color = mix(color, uColorMist * 0.8, groundMist);

      // Vignette
      float vignette = 1.0 - length((uv - 0.5) * vec2(0.8, 1.2)) * 0.5;
      color *= vignette;

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
