---
name: r3f-webgl-background
description: >
  Scaffolds performant React Three Fiber WebGL backgrounds in React/Next.js apps.
  Uses fixed Canvas, frameloop="demand", shader-driven planes, and Three.js/R3F
  performance best practices for ambient UI backdrops. Use when implementing
  WebGL backgrounds, shader effects, or 3D ambient scenes.
user-invocable: true
argument-hint: [setup | shader | optimize | component]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# R3F WebGL Background Skill

You are implementing performant WebGL backgrounds using React Three Fiber in React/Next.js applications.

## Subcommand Dispatcher

Check the `$0` argument to determine which subcommand to execute:
- `setup` - Initial R3F setup with Canvas as background layer
- `shader` - Create or modify shader-based background effects
- `optimize` - Apply performance optimizations to existing 3D code
- `component` - Create a new reusable background component

If `$0` is empty, show usage information.

## Usage Information

When showing usage, display:

```
R3F WebGL Background Skill - Create performant 3D backgrounds

Usage: /r3f-webgl-background <subcommand>

Subcommands:
  setup       Set up R3F Canvas as a background layer in the app
  shader      Create or modify shader-based background effects
  optimize    Apply performance optimizations to 3D code
  component   Create a new reusable background component

Examples:
  /r3f-webgl-background setup          # Initial R3F configuration
  /r3f-webgl-background shader         # Create new shader background
  /r3f-webgl-background optimize       # Optimize existing 3D code
  /r3f-webgl-background component      # Create reusable component
```

## Core Principles

### Performance First
1. **Draw Call Budget**: Keep under 100 draw calls per frame
2. **On-Demand Rendering**: Use `frameloop="demand"` for mostly static backgrounds
3. **Lazy Loading**: Dynamically import R3F/Three.js components
4. **No React State in Animation Loop**: Mutate Three objects in `useFrame`, never setState

### Mobile Optimization
1. Use `mediump` precision in shaders
2. Minimize varyings between vertex and fragment shaders
3. Avoid dynamic loops and branches in shaders
4. Use instancing for repeated elements

### Accessibility
1. Respect `prefers-reduced-motion` by scaling animation factors
2. Provide CSS fallback backgrounds for WebGL-unsupported browsers
3. Keep 3D behind main content in DOM stacking order

---

## Subcommand: `setup`

Set up React Three Fiber as a background layer.

### Workflow:

1. **Check dependencies**
   - Verify package.json for: `@react-three/fiber`, `@react-three/drei`, `three`
   - If missing, suggest installation:
     ```bash
     pnpm --filter @cw-hackathon/web add @react-three/fiber @react-three/drei three
     pnpm --filter @cw-hackathon/web add -D @types/three
     ```

2. **Create WebGL Provider Component**
   - Path: `app/components/webgl/WebGLProvider.tsx`
   - Wrap Canvas with lazy loading and error boundary
   - Set up `frameloop="demand"` by default
   - Include reduced motion detection

3. **Create Base Background Component**
   - Path: `app/components/webgl/BackgroundCanvas.tsx`
   - Fixed positioning behind main content
   - Proper z-index management
   - CSS fallback for non-WebGL browsers

4. **Update Layout if needed**
   - Ensure root layout can accommodate the background layer

### Code Template - WebGL Provider:

```tsx
// app/components/webgl/WebGLProvider.tsx
'use client';

import { Canvas, type CanvasProps } from '@react-three/fiber';
import { Suspense, lazy, useEffect, useState, type ReactNode } from 'react';

interface WebGLProviderProps extends Partial<CanvasProps> {
  children: ReactNode;
  fallback?: ReactNode;
}

export function WebGLProvider({
  children,
  fallback,
  ...canvasProps
}: WebGLProviderProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      }}
      {...canvasProps}
    >
      <Suspense fallback={null}>
        {children}
      </Suspense>
    </Canvas>
  );
}
```

### Code Template - Background Canvas:

```tsx
// app/components/webgl/BackgroundCanvas.tsx
'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

const WebGLProvider = dynamic(
  () => import('./WebGLProvider').then(m => ({ default: m.WebGLProvider })),
  { ssr: false }
);

interface BackgroundCanvasProps {
  children: ReactNode;
  className?: string;
  fallbackColor?: string;
}

export function BackgroundCanvas({
  children,
  className = '',
  fallbackColor = '#0a0a0a'
}: BackgroundCanvasProps) {
  return (
    <div
      className={`fixed inset-0 -z-10 ${className}`}
      style={{ backgroundColor: fallbackColor }}
    >
      <WebGLProvider>
        {children}
      </WebGLProvider>
    </div>
  );
}
```

---

## Subcommand: `shader`

Create shader-based background effects.

### Workflow:

1. **Ask user for effect type**
   - Gradient noise (subtle, ambient)
   - Landscape (layered parallax)
   - Particles (floating elements)
   - Custom (provide description)

2. **Create shader component**
   - Path: `app/components/webgl/shaders/<EffectName>Background.tsx`
   - Include uniforms: `uTime`, `uResolution`, `uMouse` (optional)
   - Use `mediump` precision
   - Implement `useFrame` for animation

3. **Performance considerations**
   - Keep shader simple for backgrounds
   - Use noise functions sparingly
   - Prefer math-based effects over texture lookups

### Landscape Shader Template:

```tsx
// app/components/webgl/shaders/LandscapeBackground.tsx
'use client';

import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface LandscapeBackgroundProps {
  colorSky?: string;
  colorHorizon?: string;
  colorGround?: string;
  speed?: number;
}

export function LandscapeBackground({
  colorSky = '#1a1a2e',
  colorHorizon = '#16213e',
  colorGround = '#0f3460',
  speed = 0.02
}: LandscapeBackgroundProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const { size, invalidate } = useThree();

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(size.width, size.height) },
    uColorSky: { value: new THREE.Color(colorSky) },
    uColorHorizon: { value: new THREE.Color(colorHorizon) },
    uColorGround: { value: new THREE.Color(colorGround) },
  }), [colorSky, colorHorizon, colorGround, size]);

  useFrame((state, delta) => {
    uniforms.uTime.value += delta * speed;
    uniforms.uResolution.value.set(state.size.width, state.size.height);
    invalidate(); // Request next frame for continuous animation
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
    uniform vec3 uColorGround;

    // Simple noise function
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

      // Sky gradient
      vec3 color = mix(uColorHorizon, uColorSky, pow(uv.y, 0.8));

      // Layered hills
      for (float i = 0.0; i < 3.0; i++) {
        float layer = i / 3.0;
        float height = 0.15 + layer * 0.15;
        float scale = 2.0 + i * 1.5;
        float timeOffset = uTime * (0.5 - layer * 0.3);

        float hill = fbm(vec2(uv.x * scale + timeOffset, layer)) * height;
        float hillLine = smoothstep(hill, hill + 0.02, uv.y - (0.1 + layer * 0.1));

        vec3 hillColor = mix(uColorGround, uColorHorizon, layer * 0.5);
        color = mix(hillColor * (0.6 + layer * 0.2), color, hillLine);
      }

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
```

---

## Subcommand: `optimize`

Apply performance optimizations to existing 3D code.

### Optimization Checklist:

1. **React-specific**
   - [ ] No `setState` calls inside `useFrame`
   - [ ] Refs used for Three.js objects, not state
   - [ ] Memoized uniforms and materials
   - [ ] Canvas wrapped with `dynamic()` for SSR skip

2. **Three.js specific**
   - [ ] `frameloop="demand"` with `invalidate()` for controlled rendering
   - [ ] Shared materials for similar objects
   - [ ] InstancedMesh for repeated geometry
   - [ ] Proper disposal on unmount

3. **Shader specific**
   - [ ] `mediump` precision
   - [ ] No dynamic loops (unroll if needed)
   - [ ] Minimize texture lookups
   - [ ] Optimize noise calculations

### Code Review Patterns:

```tsx
// ❌ Bad: React state in animation loop
useFrame(() => {
  setRotation(r => r + 0.01); // Causes re-render!
});

// ✅ Good: Direct mutation via ref
useFrame((state, delta) => {
  meshRef.current.rotation.y += delta;
});

// ❌ Bad: Creating objects in useFrame
useFrame(() => {
  const color = new THREE.Color('red'); // Memory leak!
});

// ✅ Good: Create once, reuse
const color = useMemo(() => new THREE.Color('red'), []);
useFrame(() => {
  meshRef.current.material.color = color;
});
```

---

## Subcommand: `component`

Create a new reusable background component.

### Workflow:

1. **Ask user for component requirements**
   - Effect type (shader, particles, geometry)
   - Customization props needed
   - Animation speed/behavior
   - Color palette

2. **Create component file**
   - Path: `app/components/webgl/backgrounds/<ComponentName>.tsx`
   - Include TypeScript interface for props
   - Add JSDoc documentation
   - Include usage example in comments

3. **Add to barrel export**
   - Update `app/components/webgl/index.ts`

### Component Template:

```tsx
// app/components/webgl/backgrounds/<ComponentName>.tsx
'use client';

import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * <ComponentName> - Description of the background effect
 *
 * @example
 * ```tsx
 * <BackgroundCanvas>
 *   <ComponentName colorPrimary="#1a1a2e" speed={0.5} />
 * </BackgroundCanvas>
 * ```
 */
export interface ComponentNameProps {
  /** Primary color for the effect */
  colorPrimary?: string;
  /** Animation speed multiplier (0 = static, 1 = normal) */
  speed?: number;
}

export function ComponentName({
  colorPrimary = '#1a1a2e',
  speed = 1.0
}: ComponentNameProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const { invalidate } = useThree();

  // Memoize uniforms to prevent recreation
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(colorPrimary) },
  }), [colorPrimary]);

  useFrame((_, delta) => {
    if (speed > 0) {
      uniforms.uTime.value += delta * speed;
      invalidate();
    }
  });

  return (
    <mesh ref={meshRef} scale={[20, 20, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial uniforms={uniforms} /* ... */ />
    </mesh>
  );
}
```

---

## Best Practices Reference

### File Structure for WebGL Components

```
app/components/webgl/
├── index.ts                    # Barrel exports
├── WebGLProvider.tsx           # Canvas wrapper with config
├── BackgroundCanvas.tsx        # Background layer component
├── hooks/
│   ├── useReducedMotion.ts     # Accessibility hook
│   └── useWebGLSupport.ts      # Feature detection
├── shaders/
│   ├── LandscapeBackground.tsx
│   ├── GradientBackground.tsx
│   └── ParticleField.tsx
└── backgrounds/
    ├── MountainScene.tsx
    ├── OceanWaves.tsx
    └── ForestMist.tsx
```

### Performance Budget

| Metric | Target | Warning |
|--------|--------|---------|
| Draw calls | < 100 | > 50 |
| Triangle count | < 100k | > 50k |
| Texture memory | < 50MB | > 25MB |
| Frame time | < 16ms | > 10ms |

### Integration with Next.js

1. Always use `'use client'` directive for WebGL components
2. Use `dynamic()` import with `ssr: false` for Canvas
3. Place backgrounds in layout, not individual pages (for performance)
4. Use CSS fallback color that matches background theme

---

## External Resources

- [React Three Fiber Docs](https://r3f.docs.pmnd.rs/)
- [Three.js Docs](https://threejs.org/docs/)
- [Drei Helpers](https://github.com/pmndrs/drei)
- [100 Three.js Tips](https://www.utsubo.com/blog/threejs-best-practices-100-tips)
- [Codrops WebGL Tutorials](https://tympanus.net/codrops/tag/webgl/)
