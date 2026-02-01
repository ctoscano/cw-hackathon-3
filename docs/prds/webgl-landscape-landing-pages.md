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
- [ ] Run pnpm add commands
- [ ] Verify no peer dependency warnings

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
- [ ] Create WebGLProvider.tsx
- [ ] Create BackgroundCanvas.tsx
- [ ] Create hooks/useReducedMotion.ts
- [ ] Create index.ts barrel

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
- [ ] Create MountainLandscape.tsx
- [ ] Implement vertex shader
- [ ] Implement fragment shader with mountains
- [ ] Add props for customization

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
- [ ] Create OceanLandscape.tsx
- [ ] Implement wave motion shader
- [ ] Add sky gradient
- [ ] Add customization props

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
- [ ] Create ForestLandscape.tsx
- [ ] Implement tree silhouette generation
- [ ] Add mist effect
- [ ] Add customization props

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
- [ ] Create landscapes/layout.tsx
- [ ] Create landscapes/mountain/page.tsx
- [ ] Create landscapes/ocean/page.tsx
- [ ] Create landscapes/forest/page.tsx

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
- [ ] Update page.tsx with navigation section
- [ ] Add styles to globals.css
- [ ] Test all navigation links

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
- [ ] Test all pages in browser
- [ ] Verify reduced motion behavior
- [ ] Verify CSS fallback
- [ ] Run type-check and lint
- [ ] Fix any issues found

## Completion Criteria

- [ ] All 3 landing pages render with animated WebGL backgrounds
- [ ] Homepage has navigation to all landing pages
- [ ] `prefers-reduced-motion` stops/reduces animations
- [ ] Type-check passes (`pnpm type-check`)
- [ ] Lint passes (`pnpm check`)
- [ ] Mobile-responsive layout works

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

[To be added during implementation]

### Demo Instructions

**How to Demo:**
[To be added during implementation]

---

**Status**: Draft
**Created**: 2026-02-01
**Last Updated**: 2026-02-01
**Implementation Started**: N/A
**Completed**: N/A
