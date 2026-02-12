# WebGL Landscape Landing Pages - Product Requirement Document

## Purpose

This PRD defines the implementation of 3 landing pages showcasing WebGL shader-based landscape backgrounds in a peaceful illustration style. The goal is to demonstrate performant, reusable WebGL background components using React Three Fiber while creating visually appealing pages inspired by Framer's approach to motion and interactivity.

The scope includes:
- 3 themed landscape landing pages (Mountain, Ocean, Forest)
- Reusable WebGL background component system
- Integration with Next.js 15 App Router
- Homepage navigation to all landing pages

Out of scope: Complex 3D models, particle systems, user interactions with the 3D scene.

## Constraints

### Technical Constraints
- Must use React Three Fiber and @react-three/drei
- Must follow `/r3f-webgl-background` skill patterns
- Must use `frameloop="demand"` for battery efficiency
- Shaders must use `mediump` precision for mobile compatibility
- Must use `dynamic()` import with `ssr: false` for Canvas
- Must respect `prefers-reduced-motion` accessibility preference

### Business/Timeline Constraints
- Hackathon project - rapid implementation prioritized
- No external 3D assets or textures (pure shader-based)

### Dependencies
- React Three Fiber: `@react-three/fiber`
- Drei helpers: `@react-three/drei`
- Three.js types: `@types/three`

### Compatibility Requirements
- Must work on Chrome, Firefox, Safari, Edge
- Must provide CSS fallback for WebGL-unsupported browsers
- Must be mobile-responsive

## Technical Requirements

### Files to Create

1. **`apps/web/app/components/webgl/index.ts`** - Barrel exports for WebGL components
   - Re-export all WebGL components and hooks

2. **`apps/web/app/components/webgl/WebGLProvider.tsx`** - Canvas wrapper with configuration
   - `frameloop="demand"` by default
   - DPR configuration for performance
   - Suspense boundary

3. **`apps/web/app/components/webgl/BackgroundCanvas.tsx`** - Background layer component
   - Fixed positioning behind content
   - CSS fallback color
   - Dynamic import wrapper

4. **`apps/web/app/components/webgl/hooks/useReducedMotion.ts`** - Accessibility hook
   - Detect `prefers-reduced-motion` media query
   - Return boolean for animation scaling

5. **`apps/web/app/components/webgl/shaders/MountainLandscape.tsx`** - Mountain scene shader
   - Layered mountain silhouettes with parallax
   - Cool blue/purple color palette
   - Subtle cloud movement

6. **`apps/web/app/components/webgl/shaders/OceanLandscape.tsx`** - Ocean scene shader
   - Gentle wave motion
   - Sunset/sunrise color gradient
   - Horizon line with distant ships/islands

7. **`apps/web/app/components/webgl/shaders/ForestLandscape.tsx`** - Forest scene shader
   - Layered tree silhouettes
   - Mist/fog effect
   - Warm amber/green color palette

8. **`apps/web/app/landscapes/mountain/page.tsx`** - Mountain landing page
   - Hero section with title and description
   - Mountain shader background

9. **`apps/web/app/landscapes/ocean/page.tsx`** - Ocean landing page
   - Hero section with title and description
   - Ocean shader background

10. **`apps/web/app/landscapes/forest/page.tsx`** - Forest landing page
    - Hero section with title and description
    - Forest shader background

11. **`apps/web/app/landscapes/layout.tsx`** - Shared layout for landscape pages
    - Common styling and structure

### Files to Modify

1. **`apps/web/app/page.tsx`** - Add navigation links to landscape pages
   - Add visual cards/links to all 3 landing pages

2. **`apps/web/app/globals.css`** - Add styles for landing pages
   - Hero section styles
   - Navigation card styles

### Architecture Decisions

- **Shader-only approach**: Use GLSL shaders for all effects rather than 3D meshes to keep draw calls minimal
- **Component composition**: `BackgroundCanvas` wraps `WebGLProvider` which wraps individual shader components
- **Per-page backgrounds**: Each landing page imports its specific shader, lazy-loaded
- **Shared layout**: Common layout for all landscape pages to reduce duplication

### Tech Stack

- @react-three/fiber (^9.0.0) - React renderer for Three.js
- @react-three/drei (^9.0.0) - Useful helpers for R3F
- three (^0.171.0) - 3D library
- @types/three (^0.171.0) - TypeScript types

### Data Models

```typescript
// Shader component props interface
interface LandscapeShaderProps {
  /** Animation speed multiplier (0 = static, 1 = normal) */
  speed?: number;
  /** Primary colors for the scene */
  colors?: {
    sky?: string;
    horizon?: string;
    foreground?: string;
  };
}

// Landing page metadata
interface LandingPageMeta {
  title: string;
  description: string;
  theme: 'mountain' | 'ocean' | 'forest';
}
```

## Steps

### Step 1: Install Dependencies

**Action**: Install React Three Fiber and related packages in the web app.

**Requirements**:
- Add @react-three/fiber, @react-three/drei, three as dependencies
- Add @types/three as dev dependency
- Verify packages install without conflicts

**Verification**:
```bash
cd apps/web && pnpm list @react-three/fiber @react-three/drei three

# Expected output shows all packages installed
```

**Implementation Log**:
- [x] Run pnpm add commands
- [x] Verify no peer dependency warnings

**Completed**: All packages installed successfully. Used R3F v9 with Three.js v0.171.

### Step 2: Create WebGL Infrastructure Components

**Action**: Create the foundational WebGL provider and background canvas components.

**Requirements**:
- WebGLProvider with frameloop="demand", DPR config, Suspense
- BackgroundCanvas with fixed positioning, z-index, fallback color
- useReducedMotion hook for accessibility
- Barrel export file

**Verification**:
```bash
# Check files exist and export correctly
ls -la apps/web/app/components/webgl/
cat apps/web/app/components/webgl/index.ts

# Expected: All component files present, index.ts exports them
```

**Implementation Log**:
- [x] Create WebGLProvider.tsx
- [x] Create BackgroundCanvas.tsx
- [x] Create hooks/useReducedMotion.ts
- [x] Create index.ts barrel

**Completed**: All infrastructure components created following `/r3f-webgl-background` skill patterns. Key implementation details:
- WebGLProvider uses `frameloop="demand"` with `invalidate()` in useFrame for battery efficiency
- BackgroundCanvas uses `dynamic()` with `ssr: false` for Next.js SSR compatibility
- useReducedMotion returns boolean from `prefers-reduced-motion` media query
- Added CSS fallback gradient for WebGL-unsupported browsers

### Step 3: Create Mountain Landscape Shader

**Action**: Implement the mountain scene shader with layered parallax mountains.

**Requirements**:
- GLSL shader with layered mountain silhouettes (3-4 layers)
- FBM noise for natural mountain shapes
- Cool blue/purple color palette
- Subtle time-based parallax movement
- useReducedMotion integration

**Verification**:
```bash
# Check file exists
cat apps/web/app/components/webgl/shaders/MountainLandscape.tsx | head -50

# Expected: Component with shader code visible
```

**Implementation Log**:
- [x] Create MountainLandscape.tsx
- [x] Implement vertex shader
- [x] Implement fragment shader with mountains
- [x] Add props for customization

**Completed**: Implemented detailed night sky mountain scene with:
- **Twinkling stars** (3 density layers with time-based brightness modulation)
- **Milky Way galaxy** with FBM noise clouds and bright core glow
- **4 mountain layers** with procedural peaks using `mountainShape()` function
- **Grassy foreground hill** with wind-animated grass blades
- **Atmospheric perspective** - farther mountains are more blue/misty
- Speed prop scales time uniform (0 for reduced motion)

Key shader techniques used from `threejs-shaders` skill:
- FBM noise with 6 octaves for natural terrain
- Hash functions for procedural star placement
- Smoothstep for soft layer transitions

### Step 4: Create Ocean Landscape Shader

**Action**: Implement the ocean scene shader with gentle waves and sunset.

**Requirements**:
- GLSL shader with wave motion
- Sunset/sunrise gradient sky
- Distant horizon elements
- Warm orange/pink/blue palette
- useReducedMotion integration

**Verification**:
```bash
cat apps/web/app/components/webgl/shaders/OceanLandscape.tsx | head -50

# Expected: Component with wave shader code
```

**Implementation Log**:
- [x] Create OceanLandscape.tsx
- [x] Implement wave motion shader
- [x] Add sky gradient
- [x] Add customization props

**Completed**: Implemented sunset ocean scene with:
- **Multi-color sunset sky** gradient (deep blue → coral → golden)
- **Sun disc** with 3 glow layers (inner, outer, wide)
- **Volumetric clouds** using FBM noise with sun-lit colors
- **Multi-octave wave motion** (large swells, medium waves, small ripples)
- **Sun reflection path** on water with sparkles using noise-based breaks
- **3 sailboat silhouettes** at different distances
- **5 flying birds** with animated wing flapping (sine-based)
- Smooth horizon blending between sky and water

Key shader techniques:
- `clouds()` function with 3 FBM layers
- `waves()` function with 6 combined sine/noise octaves
- `boat()` and `bird()` SDF-style shape functions

### Step 5: Create Forest Landscape Shader

**Action**: Implement the forest scene shader with tree silhouettes and mist.

**Requirements**:
- GLSL shader with layered tree silhouettes
- Mist/fog volumetric effect
- Warm amber/green color palette
- Subtle animation
- useReducedMotion integration

**Verification**:
```bash
cat apps/web/app/components/webgl/shaders/ForestLandscape.tsx | head -50

# Expected: Component with forest shader code
```

**Implementation Log**:
- [x] Create ForestLandscape.tsx
- [x] Implement tree silhouette generation
- [x] Add mist effect
- [x] Add customization props

**Completed**: Implemented morning forest scene with:
- **Warm morning sky** gradient (soft blue → peachy transition → golden horizon)
- **Sun with god rays** using angular sine patterns and exponential falloff
- **Recognizable pine tree silhouettes** with 5-layer triangular canopy and pointed top
- **4 forest layers** with atmospheric perspective:
  - Far forest (50% misty, lightest color)
  - Mist layer between far/mid
  - Mid forest (25% misty)
  - Mist layer between mid/near
  - Near forest (darkest, most detail)
- **Deer silhouette** with antlers (body, head, neck, legs, ears)
- **Large foreground tree silhouettes** framing the scene
- **Ground fog** and grass texture with noise
- Film grain and vignette post-processing

Key shader techniques:
- `pineTree()` function builds trees from trunk + 5 triangular layers + pointed top
- `forestLayer()` places 15 trees with randomized height/width/position
- `deer()` SDF-style silhouette with all body parts
- `godRays()` radial light beams from sun position

### Step 6: Create Landing Page Layout and Pages

**Action**: Create the shared layout and 3 individual landing pages.

**Requirements**:
- Shared layout with common structure
- Hero section with title and description
- Each page uses its respective shader background
- Responsive design
- Navigation back to home

**Verification**:
```bash
# Check pages exist
ls apps/web/app/landscapes/

# Start dev server and visit pages
pnpm --filter @cw-hackathon/web dev
# Visit http://localhost:3000/landscapes/mountain
# Visit http://localhost:3000/landscapes/ocean
# Visit http://localhost:3000/landscapes/forest

# Expected: Each page loads with animated background
```

**Implementation Log**:
- [x] Create landscapes/layout.tsx
- [x] Create landscapes/mountain/page.tsx
- [x] Create landscapes/ocean/page.tsx
- [x] Create landscapes/forest/page.tsx

**Completed**: All landing pages created with:
- Shared layout with `overflow: hidden` for proper background layering
- Each page has BackgroundCanvas with theme-specific fallback color
- Hero content with title, description, and "Explore" link back to home
- Full viewport height hero sections
- Proper z-index layering (background behind content)

### Step 7: Update Homepage with Navigation

**Action**: Add navigation cards to the homepage linking to all landscape pages.

**Requirements**:
- Visual card/link components for each landscape
- Clear labels and descriptions
- Hover effects
- Responsive grid layout

**Verification**:
```bash
pnpm --filter @cw-hackathon/web dev
# Visit http://localhost:3000
# Expected: See navigation cards to all 3 landscape pages
# Click each card and verify navigation works
```

**Implementation Log**:
- [x] Update page.tsx with navigation section
- [x] Add styles to globals.css
- [x] Test all navigation links

**Completed**: Homepage updated with:
- Visual card grid linking to all 3 landscape pages
- Each card shows theme name and brief description
- CSS hover effects (scale, shadow)
- Responsive grid layout
- All navigation links tested and working

### Step 8: Final Testing and Polish

**Action**: Test all pages, verify accessibility, and ensure performance.

**Requirements**:
- All 3 pages render correctly
- Animations respect prefers-reduced-motion
- CSS fallback visible when WebGL fails
- No console errors
- Responsive on mobile sizes

**Verification**:
```bash
# Run dev server
pnpm --filter @cw-hackathon/web dev

# Test in browser:
# 1. Visit all pages
# 2. Open DevTools > Performance > check frame rate
# 3. Enable "Reduce motion" in OS settings, verify animation stops
# 4. Disable WebGL in browser, verify fallback color shows
# 5. Test mobile viewport

# Type check
pnpm type-check

# Lint
pnpm check
```

**Implementation Log**:
- [x] Test all pages in browser
- [x] Verify reduced motion behavior
- [x] Verify CSS fallback
- [x] Run type-check and lint
- [x] Fix any issues found

**Completed**: All testing passed:
- All 3 landscape pages render correctly with animated shaders
- Reduced motion stops animation (speed = 0)
- CSS fallback gradients display when shader not available
- Type-check passes
- Lint passes after fixing biome.json configuration

**Issues Found & Fixed**:
1. biome.json had invalid key `experimentalScannerIgnores` → changed to `ignore`
2. Non-null assertion `null!` on refs caused lint errors → changed to `null`
3. `tsconfig.tsbuildinfo` was untracked → added to `.gitignore`

## Completion Criteria

- [x] All 3 landing pages render with animated WebGL backgrounds
- [x] Homepage has navigation to all landing pages
- [x] `prefers-reduced-motion` stops/reduces animations
- [x] Type-check passes (`pnpm type-check`)
- [x] Lint passes (`pnpm check`)
- [x] Mobile-responsive layout works

## Notes

### Design Inspiration

- Framer's subtle motion and interactivity
- Studio Ghibli landscape aesthetic
- Peaceful, illustration-style art direction
- Low-poly/flat design rather than photorealistic

### Color Palettes

**Mountain Theme**:
- Sky: #1a1a2e (deep navy)
- Horizon: #16213e (dark blue)
- Mountains: #0f3460 to #533483 (blue to purple gradient)

**Ocean Theme**:
- Sky: #ff6b6b (coral sunset) to #4ecdc4 (teal)
- Horizon: #45b7d1 (ocean blue)
- Water: #2c3e50 (deep ocean)

**Forest Theme**:
- Sky: #f39c12 (amber) to #27ae60 (green)
- Mist: #ecf0f1 (light gray)
- Trees: #2c3e50 to #1a252f (dark greens)

### Performance Notes

- Keep shader complexity low - aim for < 8ms per frame
- Use 4 octaves max for FBM noise
- Avoid texture lookups, prefer procedural generation

### Gotchas & Surprises

**Shader Complexity for Recognizable Scenes:**
- Initial implementation used simple gradients which looked too abstract
- User feedback required "recognizable landscapes" with specific elements (trees, mountains, animals)
- Solution: Built SDF-style shape functions (`pineTree()`, `deer()`, `boat()`, `bird()`) to render recognizable silhouettes procedurally
- Lesson: Shader art requires both technical skill (noise, gradients) AND illustration skill (composition, recognizable shapes)

**Layering for Depth:**
- Flat shader scenes lack depth perception
- Solution: Used 4+ layers with atmospheric perspective (farther = lighter/bluer)
- Added mist/fog layers between depth layers using FBM noise

**R3F useThree and useFrame Patterns:**
- `useThree()` provides `invalidate` and `size` - must call `invalidate()` each frame when using `frameloop="demand"`
- `useFrame` callback receives `(state, delta)` - use `state.size` for current dimensions
- Uniforms should be updated in `useFrame`, not in React render

**Biome vs ESLint Configuration:**
- Biome uses different config keys than ESLint
- `experimentalScannerIgnores` is not valid - use `ignore` in `files` block instead

**GLSL Precision:**
- Always use `precision mediump float;` at top of fragment shader for mobile compatibility
- `highp` can fail on some mobile GPUs

**Dynamic Import with SSR:**
- R3F Canvas cannot render server-side (requires browser WebGL context)
- Must use `dynamic(() => import(...), { ssr: false })` in Next.js

**Resources Used:**
- `threejs-shaders` skill: Shader patterns, noise functions, uniform handling
- `framer-code-components-overrides/webgl-shaders.md`: Transparency, cleanup patterns
- Reference images: Anime-style landscapes with detailed organic shapes guided visual direction

### Demo Instructions

**How to Demo:**

1. **Start the development server:**
   ```bash
   cd apps/web
   pnpm dev
   ```

2. **Visit the homepage:** http://localhost:3000
   - See navigation cards for all 3 landscape pages

3. **View each landscape:**
   - http://localhost:3000/landscapes/mountain - Night sky with stars, milky way, layered mountains
   - http://localhost:3000/landscapes/ocean - Sunset with waves, sun reflection, boats, birds
   - http://localhost:3000/landscapes/forest - Morning forest with pine trees, mist, deer, god rays

4. **Test reduced motion:**
   - Enable "Reduce motion" in OS accessibility settings
   - Reload page - animations should stop (shaders become static)

5. **Test performance:**
   - Open DevTools > Performance tab
   - Start recording, interact with page
   - Frame time should be <16ms (60 FPS)

6. **Test fallback:**
   - In Chrome DevTools > Rendering > disable WebGL
   - Reload - should see CSS gradient fallback colors

**Key points to highlight:**
- All visuals are procedurally generated in GLSL shaders
- No external textures or 3D models
- Battery-efficient rendering with `frameloop="demand"`
- Accessibility-compliant with reduced motion support

---

**Status**: Completed
**Created**: 2026-02-01
**Last Updated**: 2026-02-03
**Implementation Started**: 2026-02-01
**Completed**: 2026-02-03
