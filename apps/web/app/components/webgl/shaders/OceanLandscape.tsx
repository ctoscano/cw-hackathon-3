"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useReducedMotion } from "../hooks/useReducedMotion";

interface OceanLandscapeProps {
  speed?: number;
}

// Based on "Seascape" by TDM (Alexander Alekseev) - https://www.shadertoy.com/view/Ms2SD1
// Adapted for React Three Fiber background use
export function OceanLandscape({ speed = 1.0 }: OceanLandscapeProps) {
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

  // Seascape-inspired fragment shader with proper wave physics and lighting
  const fragmentShader = `
    precision mediump float;

    varying vec2 vUv;
    uniform float uTime;
    uniform vec2 uResolution;

    const float PI = 3.141592653589793;
    const int NUM_STEPS = 8;
    const int ITER_GEOMETRY = 3;
    const int ITER_FRAGMENT = 5;

    // Sea parameters
    const float SEA_HEIGHT = 0.6;
    const float SEA_CHOPPY = 4.0;
    const float SEA_SPEED = 0.8;
    const float SEA_FREQ = 0.16;
    const vec3 SEA_BASE = vec3(0.0, 0.09, 0.18);
    const vec3 SEA_WATER_COLOR = vec3(0.8, 0.9, 0.6) * 0.6;

    // Rotation matrix for wave octaves
    const mat2 octave_m = mat2(1.6, 1.2, -1.2, 1.6);

    // Hash function
    float hash(vec2 p) {
      float h = dot(p, vec2(127.1, 311.7));
      return fract(sin(h) * 43758.5453123);
    }

    // 2D Noise
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return -1.0 + 2.0 * mix(
        mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
        u.y
      );
    }

    // Lighting
    float diffuse(vec3 n, vec3 l, float p) {
      return pow(dot(n, l) * 0.4 + 0.6, p);
    }

    float specular(vec3 n, vec3 l, vec3 e, float s) {
      float nrm = (s + 8.0) / (PI * 8.0);
      return pow(max(dot(reflect(e, n), l), 0.0), s) * nrm;
    }

    // Sky color - warm sunset tones
    vec3 getSkyColor(vec3 e) {
      e.y = (max(e.y, 0.0) * 0.8 + 0.2) * 0.8;
      vec3 skyHigh = vec3(0.3, 0.5, 0.9);
      vec3 skyMid = vec3(1.0, 0.6, 0.4);
      vec3 skyLow = vec3(1.0, 0.8, 0.5);

      vec3 col = mix(skyLow, skyMid, pow(e.y, 0.4));
      col = mix(col, skyHigh, pow(e.y, 2.0));
      return col;
    }

    // Sea octave - creates wave pattern
    float sea_octave(vec2 uv, float choppy) {
      uv += noise(uv);
      vec2 wv = 1.0 - abs(sin(uv));
      vec2 swv = abs(cos(uv));
      wv = mix(wv, swv, wv);
      return pow(1.0 - pow(wv.x * wv.y, 0.65), choppy);
    }

    // Map function for sea height
    float map(vec3 p, float time) {
      float freq = SEA_FREQ;
      float amp = SEA_HEIGHT;
      float choppy = SEA_CHOPPY;
      vec2 uv = p.xz;
      uv.x *= 0.75;

      float seaTime = 1.0 + time * SEA_SPEED;
      float d, h = 0.0;
      for(int i = 0; i < ITER_GEOMETRY; i++) {
        d = sea_octave((uv + seaTime) * freq, choppy);
        d += sea_octave((uv - seaTime) * freq, choppy);
        h += d * amp;
        uv *= octave_m;
        freq *= 1.9;
        amp *= 0.22;
        choppy = mix(choppy, 1.0, 0.2);
      }
      return p.y - h;
    }

    // Detailed map for normals
    float map_detailed(vec3 p, float time) {
      float freq = SEA_FREQ;
      float amp = SEA_HEIGHT;
      float choppy = SEA_CHOPPY;
      vec2 uv = p.xz;
      uv.x *= 0.75;

      float seaTime = 1.0 + time * SEA_SPEED;
      float d, h = 0.0;
      for(int i = 0; i < ITER_FRAGMENT; i++) {
        d = sea_octave((uv + seaTime) * freq, choppy);
        d += sea_octave((uv - seaTime) * freq, choppy);
        h += d * amp;
        uv *= octave_m;
        freq *= 1.9;
        amp *= 0.22;
        choppy = mix(choppy, 1.0, 0.2);
      }
      return p.y - h;
    }

    // Get sea color with Fresnel and lighting
    vec3 getSeaColor(vec3 p, vec3 n, vec3 l, vec3 eye, vec3 dist, float time) {
      float fresnel = clamp(1.0 - dot(n, -eye), 0.0, 1.0);
      fresnel = pow(fresnel, 3.0) * 0.5;

      vec3 reflected = getSkyColor(reflect(eye, n));
      vec3 refracted = SEA_BASE + diffuse(n, l, 80.0) * SEA_WATER_COLOR * 0.12;

      vec3 color = mix(refracted, reflected, fresnel);

      float atten = max(1.0 - dot(dist, dist) * 0.001, 0.0);
      color += SEA_WATER_COLOR * (p.y - SEA_HEIGHT) * 0.18 * atten;

      color += vec3(specular(n, l, eye, 60.0));

      return color;
    }

    // Get normal
    vec3 getNormal(vec3 p, float eps, float time) {
      vec3 n;
      n.y = map_detailed(p, time);
      n.x = map_detailed(vec3(p.x + eps, p.y, p.z), time) - n.y;
      n.z = map_detailed(vec3(p.x, p.y, p.z + eps), time) - n.y;
      n.y = eps;
      return normalize(n);
    }

    // Height map tracing
    float heightMapTracing(vec3 ori, vec3 dir, out vec3 p, float time) {
      float tm = 0.0;
      float tx = 1000.0;
      float hx = map(ori + dir * tx, time);
      if(hx > 0.0) {
        p = ori + dir * tx;
        return tx;
      }
      float hm = map(ori + dir * tm, time);
      float tmid = 0.0;
      for(int i = 0; i < NUM_STEPS; i++) {
        tmid = mix(tm, tx, hm / (hm - hx));
        p = ori + dir * tmid;
        float hmid = map(p, time);
        if(hmid < 0.0) {
          tx = tmid;
          hx = hmid;
        } else {
          tm = tmid;
          hm = hmid;
        }
      }
      return tmid;
    }

    // Rotation matrix from euler angles
    mat3 fromEuler(vec3 ang) {
      vec2 a1 = vec2(sin(ang.x), cos(ang.x));
      vec2 a2 = vec2(sin(ang.y), cos(ang.y));
      vec2 a3 = vec2(sin(ang.z), cos(ang.z));
      mat3 m;
      m[0] = vec3(a1.y*a3.y+a1.x*a2.x*a3.x, a1.y*a2.x*a3.x+a3.y*a1.x, -a2.y*a3.x);
      m[1] = vec3(-a2.y*a1.x, a1.y*a2.y, a2.x);
      m[2] = vec3(a3.y*a1.x*a2.x+a1.y*a3.x, a1.x*a3.x-a1.y*a3.y*a2.x, a2.y*a3.y);
      return m;
    }

    void main() {
      float time = uTime;

      // Normalized coordinates
      vec2 uv = vUv * 2.0 - 1.0;
      uv.x *= uResolution.x / uResolution.y;

      // Camera animation - slow gentle movement
      float camTime = time * 0.1;
      vec3 ang = vec3(
        sin(camTime * 2.0) * 0.1,
        sin(camTime) * 0.2 + 0.3,
        camTime * 0.5
      );

      // Camera position and ray
      vec3 ori = vec3(0.0, 3.5, time * 3.0);
      vec3 dir = normalize(vec3(uv.xy, -2.0));
      dir.z += length(uv) * 0.14;
      dir = normalize(dir) * fromEuler(ang);

      // Sun/light position
      vec3 light = normalize(vec3(0.0, 1.0, 0.8));

      // Trace
      vec3 p;
      heightMapTracing(ori, dir, p, time);
      vec3 dist = p - ori;

      // Normal calculation
      float eps = 0.001;
      vec3 n = getNormal(p, dot(dist, dist) * eps, time);

      // Mix sky and sea
      vec3 color = mix(
        getSkyColor(dir),
        getSeaColor(p, n, light, dir, dist, time),
        pow(smoothstep(0.0, -0.02, dir.y), 0.3)
      );

      // Add sun glow
      float sunDot = max(dot(dir, light), 0.0);
      color += vec3(1.0, 0.8, 0.6) * pow(sunDot, 8.0) * 0.5;
      color += vec3(1.0, 0.9, 0.7) * pow(sunDot, 64.0) * 1.0;

      // Post-processing
      color = pow(color, vec3(0.65)); // Tone mapping

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
