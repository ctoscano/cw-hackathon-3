"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useReducedMotion } from "../hooks/useReducedMotion";

interface MountainLandscapeProps {
  speed?: number;
}

// Raymarched mountain terrain with starry night sky
// Inspired by Inigo Quilez terrain techniques
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
    precision mediump float;

    varying vec2 vUv;
    uniform float uTime;
    uniform vec2 uResolution;

    const float PI = 3.141592653589793;

    // Rotation matrix for noise
    const mat2 m = mat2(0.80, 0.60, -0.60, 0.80);

    // Hash functions
    float hash(float n) {
      return fract(sin(n) * 43758.5453123);
    }

    float hash2(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    vec3 hash3(vec2 p) {
      vec3 q = vec3(
        dot(p, vec2(127.1, 311.7)),
        dot(p, vec2(269.5, 183.3)),
        dot(p, vec2(419.2, 371.9))
      );
      return fract(sin(q) * 43758.5453);
    }

    // 2D Noise
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float n = i.x + i.y * 57.0;
      return mix(
        mix(hash(n + 0.0), hash(n + 1.0), f.x),
        mix(hash(n + 57.0), hash(n + 58.0), f.x),
        f.y
      );
    }

    // FBM for terrain
    float fbm(vec2 p) {
      float f = 0.0;
      f += 0.5000 * noise(p); p = m * p * 2.02;
      f += 0.2500 * noise(p); p = m * p * 2.03;
      f += 0.1250 * noise(p); p = m * p * 2.01;
      f += 0.0625 * noise(p); p = m * p * 2.04;
      f += 0.03125 * noise(p);
      return f / 0.9375;
    }

    // Terrain height function
    float terrain(vec2 p) {
      float h = fbm(p * 0.3) * 2.0;
      h += fbm(p * 0.6 + 10.0) * 1.0;
      h += fbm(p * 1.2 + 20.0) * 0.5;
      // Add sharp ridges
      h += pow(abs(fbm(p * 0.8)), 0.5) * 1.5;
      return h * 0.4;
    }

    // Mountain color based on height and slope
    vec3 terrainColor(vec3 p, vec3 n) {
      float h = p.y;
      float slope = 1.0 - n.y;

      // Richer rock colors with more variation
      vec3 rock1 = vec3(0.12, 0.1, 0.08);     // Dark rock
      vec3 rock2 = vec3(0.22, 0.18, 0.15);    // Medium rock
      vec3 rock3 = vec3(0.35, 0.3, 0.25);     // Light rock
      vec3 snow = vec3(0.85, 0.9, 0.95);      // Snow - slightly blue tint
      vec3 ice = vec3(0.7, 0.8, 0.9);         // Ice/glacier
      vec3 grass = vec3(0.08, 0.12, 0.06);    // Dark vegetation

      // Multi-layer noise for rock variation
      float rockNoise = fbm(p.xz * 2.0);
      float rockNoise2 = fbm(p.xz * 5.0 + 100.0);
      vec3 rockColor = mix(rock1, rock2, rockNoise);
      rockColor = mix(rockColor, rock3, rockNoise2 * 0.5);

      // Add grass at lower elevations, flatter areas
      float grassMask = smoothstep(0.9, 0.4, h) * smoothstep(0.45, 0.15, slope);
      vec3 col = mix(rockColor, grass, grassMask * 0.6);

      // Add ice on steep slopes at mid elevations
      float iceMask = smoothstep(0.4, 0.8, slope) * smoothstep(0.4, 0.8, h) * smoothstep(1.2, 0.6, h);
      col = mix(col, ice, iceMask * 0.4);

      // Add snow at high elevations and flat areas
      float snowMask = smoothstep(0.5, 1.0, h) * smoothstep(0.5, 0.15, slope);
      snowMask += smoothstep(0.9, 1.4, h) * 0.6;
      // Wind-blown snow pattern
      snowMask *= 0.7 + fbm(p.xz * 8.0) * 0.5;
      col = mix(col, snow, clamp(snowMask, 0.0, 1.0));

      return col;
    }

    // Raymarching terrain
    float raymarchTerrain(vec3 ro, vec3 rd, out vec3 hitPos) {
      float t = 0.0;
      float tmax = 50.0;

      for(int i = 0; i < 80; i++) {
        vec3 p = ro + rd * t;
        float h = terrain(p.xz);
        float d = p.y - h;

        if(d < 0.001 * t || t > tmax) break;

        t += d * 0.5;
      }

      hitPos = ro + rd * t;
      return t;
    }

    // Get terrain normal
    vec3 getTerrainNormal(vec3 p) {
      vec2 e = vec2(0.01, 0.0);
      return normalize(vec3(
        terrain(p.xz - e.xy) - terrain(p.xz + e.xy),
        2.0 * e.x,
        terrain(p.xz - e.yx) - terrain(p.xz + e.yx)
      ));
    }

    // Stars
    float stars(vec2 uv, float time) {
      vec2 id = floor(uv * 100.0);
      vec2 f = fract(uv * 100.0);

      float star = 0.0;
      vec3 h = hash3(id);

      // Only some cells have stars
      if(h.x > 0.97) {
        vec2 center = vec2(h.y, h.z);
        float d = length(f - center);

        // Twinkling
        float twinkle = sin(time * (h.x * 5.0 + 1.0) + h.y * 10.0) * 0.5 + 0.5;
        twinkle = mix(0.5, 1.0, twinkle);

        star = smoothstep(0.1, 0.0, d) * twinkle * h.x * 3.0;
      }

      return star;
    }

    // Milky way
    float milkyWay(vec2 uv, float time) {
      // Diagonal band across sky
      float band = 1.0 - abs(uv.x + uv.y * 0.5 - 0.3) * 2.0;
      band = smoothstep(0.0, 1.0, band);

      // Noise for cloud structure
      float n = fbm(uv * 3.0 + time * 0.02);
      n *= fbm(uv * 6.0 - time * 0.01);

      return band * n * 0.5;
    }

    // Night sky
    vec3 nightSky(vec3 rd, float time) {
      vec2 uv = vec2(atan(rd.x, rd.z), rd.y);

      // Deep blue gradient
      vec3 skyTop = vec3(0.02, 0.02, 0.08);
      vec3 skyHorizon = vec3(0.08, 0.06, 0.15);

      float gradient = pow(max(rd.y, 0.0), 0.5);
      vec3 sky = mix(skyHorizon, skyTop, gradient);

      // Add milky way
      float mw = milkyWay(uv, time);
      sky += vec3(0.15, 0.12, 0.2) * mw;

      // Add stars
      float s = stars(uv, time);
      s += stars(uv * 2.1 + 10.0, time * 1.1) * 0.5;
      s += stars(uv * 3.7 + 20.0, time * 0.9) * 0.3;
      sky += vec3(1.0, 0.95, 0.8) * s;

      // Subtle purple nebula
      float nebula = fbm(uv * 2.0 + time * 0.01) * 0.3;
      nebula *= smoothstep(0.0, 0.5, rd.y);
      sky += vec3(0.1, 0.05, 0.15) * nebula;

      return sky;
    }

    // Fog/atmosphere
    vec3 applyFog(vec3 col, vec3 fogCol, float dist) {
      float fog = 1.0 - exp(-dist * 0.04);
      return mix(col, fogCol, fog);
    }

    void main() {
      float time = uTime;

      // Normalized coordinates with aspect ratio
      vec2 uv = vUv * 2.0 - 1.0;
      uv.x *= uResolution.x / uResolution.y;

      // Camera setup - looking at mountains
      vec3 ro = vec3(0.0, 1.5, -5.0 + time * 0.2);
      vec3 target = vec3(0.0, 1.0, 0.0);

      // Camera matrix
      vec3 forward = normalize(target - ro);
      vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), forward));
      vec3 up = cross(forward, right);

      vec3 rd = normalize(forward + uv.x * right + uv.y * up);

      // Night sky as background
      vec3 skyCol = nightSky(rd, time);

      // Atmosphere color for fog
      vec3 fogCol = vec3(0.05, 0.05, 0.1);

      // Raymarch terrain
      vec3 hitPos;
      float t = raymarchTerrain(ro, rd, hitPos);

      vec3 color;

      if(t < 50.0 && rd.y < 0.35) {
        // Hit terrain
        vec3 n = getTerrainNormal(hitPos);

        // Enhanced moonlight - brighter and more directional
        vec3 lightDir = normalize(vec3(0.4, 0.5, -0.4));
        float moonLight = max(dot(n, lightDir), 0.0);
        moonLight = moonLight * 0.5 + pow(moonLight, 3.0) * 0.3; // Brighter highlights

        // Ambient from sky - stronger
        float skyLight = max(n.y, 0.0) * 0.25;

        // Back light for depth
        vec3 backLight = normalize(vec3(-0.3, 0.2, 0.5));
        float backLit = max(dot(n, backLight), 0.0) * 0.15;

        // Terrain color
        vec3 terrCol = terrainColor(hitPos, n);

        // Apply lighting with better ambient
        float totalLight = moonLight + skyLight + backLit + 0.08;
        color = terrCol * totalLight;

        // Specular highlight for snow/ice
        float spec = pow(max(dot(reflect(-lightDir, n), -rd), 0.0), 32.0);
        float snowAmount = smoothstep(0.5, 1.0, hitPos.y);
        color += vec3(0.3, 0.35, 0.4) * spec * snowAmount * 0.5;

        // Rim lighting - more visible
        float rim = pow(1.0 - max(dot(n, -rd), 0.0), 2.5);
        color += vec3(0.12, 0.12, 0.2) * rim * 0.4;

        // Apply fog - less dense
        color = applyFog(color, fogCol, t * 0.8);
      } else {
        // Sky
        color = skyCol;
      }

      // Moon
      vec3 moonDir = normalize(vec3(-0.3, 0.4, 0.5));
      float moonDot = max(dot(rd, moonDir), 0.0);
      float moon = smoothstep(0.997, 0.999, moonDot);
      float moonGlow = pow(moonDot, 32.0) * 0.3;
      color += vec3(0.9, 0.9, 1.0) * moon;
      color += vec3(0.2, 0.2, 0.3) * moonGlow;

      // Tone mapping
      color = color / (1.0 + color);
      color = pow(color, vec3(0.9));

      // Subtle vignette
      float vignette = 1.0 - length(vUv - 0.5) * 0.5;
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
