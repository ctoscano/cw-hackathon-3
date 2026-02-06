# Setup Storybook - Product Requirement Document

## Purpose

This PRD defines the setup of Storybook as a component development and documentation tool within the monorepo. Storybook enables isolated component development, visual testing, and serves as living documentation for the shared UI library. It addresses the need for a dedicated environment to build, test, and showcase components from `packages/ui` without running the full Next.js application.

The scope includes: setting up Storybook as a dedicated app (`apps/storybook`), configuring Tailwind CSS v4 integration, writing example stories for existing `packages/ui` components, integrating with Turborepo pipeline, and documenting component authoring guidelines for Storybook-friendly development. Excluded: Storybook for Next.js-specific features (RSC, routing), visual regression testing, and Chromatic/CI deployment.

## Constraints

### Technical Constraints
- Must use Tailwind CSS v4 (CSS-first configuration, NO `tailwind.config.ts`)
- Must use `@storybook/react-vite` framework (not `@storybook/nextjs-vite`) since `packages/ui` components are pure React
- Must use dynamic `await import("@tailwindcss/vite")` in `viteFinal` to avoid ESM/CJS export issues
- Must use `@source` directives in CSS to scan workspace packages for Tailwind classes
- Must NOT use `npx sb init` (breaks with pnpm `workspace:` protocol) — manual setup required
- Must set `typescript: { reactDocgen: false }` to avoid docgen crashes in monorepo

### Business/Timeline Constraints
- Hackathon project — implementation should be fast and pragmatic
- Focus on demonstrating the pattern, not exhaustive story coverage

### Dependencies
- `packages/ui` must have working components (it does — 12 components exist)
- pnpm workspaces must resolve `@cw-hackathon/ui` correctly

### Compatibility Requirements
- Storybook 10 (latest, ESM-only, React 19 compatible)
- React 19 support required
- Vite builder (not Webpack)
- pnpm 9.x workspace protocol support

## Technical Requirements

### Files to Create

1. **`apps/storybook/package.json`** - Storybook app package definition
   - Private package within monorepo
   - Dependencies: `@cw-hackathon/ui`, React 19, Storybook 10, Tailwind v4
   - Scripts: `dev` (storybook dev), `build:storybook` (storybook build)

2. **`apps/storybook/.storybook/main.ts`** - Storybook configuration
   - Framework: `@storybook/react-vite`
   - Stories glob: `../../../packages/ui/src/**/*.stories.@(ts|tsx)`
   - `viteFinal` with dynamic `@tailwindcss/vite` import
   - Addons: essentials, themes
   - Disable `reactDocgen` to avoid monorepo crashes

3. **`apps/storybook/.storybook/preview.ts`** - Storybook preview config
   - Import `globals.css` for Tailwind + design tokens
   - Configure dark mode toggle via `@storybook/addon-themes`
   - Set default parameters (layout, backgrounds)

4. **`apps/storybook/.storybook/globals.css`** - Tailwind CSS v4 entry for Storybook
   - `@import "tailwindcss"` with proper directive order
   - `@source` directives pointing to `packages/ui/src/`
   - `@theme inline` with all design tokens (mirrors `packages/ui/src/globals.css`)
   - `:root` and `.dark` color variable definitions

5. **`apps/storybook/tsconfig.json`** - TypeScript configuration
   - Extend base tsconfig
   - Include story files and Storybook config

6. **`packages/ui/src/components/button.stories.tsx`** - Button stories
   - All 6 variants: default, destructive, outline, secondary, ghost, link
   - All 3 sizes: default, sm, lg, icon
   - Interactive args controls
   - `asChild` composition example

7. **`packages/ui/src/components/badge.stories.tsx`** - Badge stories
   - All 4 variants: default, secondary, destructive, outline
   - Simple, demonstrates CVA variant pattern

8. **`packages/ui/src/components/card.stories.tsx`** - Card stories
   - Composition pattern: Card + CardHeader + CardTitle + CardDescription + CardContent + CardFooter
   - Show multiple card layouts

9. **`packages/ui/src/components/input.stories.tsx`** - Input stories
   - Default, placeholder, disabled, with label
   - Simplest component — good baseline

10. **`packages/ui/src/components/skeleton.stories.tsx`** - Skeleton stories
    - Basic usage, card skeleton, text skeleton
    - Shows loading state patterns

### Files to Modify

1. **`turbo.json`** - Add Storybook tasks to Turborepo pipeline
   - Add `build:storybook` task with `outputs: ["storybook-static/**"]`
   - Add `!**/*.stories.{tsx,jsx,mdx}` to `build` task inputs (prevent cache busting)

2. **`package.json`** (root) - Add convenience scripts
   - Add `storybook` script to run Storybook dev server

### Architecture Decisions

**Storybook as `apps/storybook/` (not inside `packages/ui/`):**
- Keeps `packages/ui` clean of dev-server dependencies
- Follows Turborepo recommended pattern
- Storybook is "just another app" in the monorepo
- Stories are co-located with components in `packages/ui/src/` but Storybook config lives in `apps/storybook/`

**`@storybook/react-vite` over `@storybook/nextjs-vite`:**
- `packages/ui` contains pure React components (no Next.js internals)
- Avoids React 19 version mismatch issues
- Simpler, faster builds

**Stories co-located with components:**
- `button.stories.tsx` next to `button.tsx`
- Easier to maintain — story updates when component changes
- Standard pattern in the Storybook ecosystem

### Tech Stack

- `storybook` (^10.2.0) - Core Storybook framework (essentials bundled in v10)
- `@storybook/react-vite` (^10.2.0) - Vite-based React framework (includes @storybook/react)
- `@storybook/addon-themes` (^10.2.0) - Dark mode toggle (not bundled in core)
- `@tailwindcss/vite` (^4.1.0) - Tailwind CSS v4 Vite plugin
- `tailwindcss` (^4.1.0) - Tailwind CSS v4 core

## Steps

### Step 1: Create Storybook App Scaffold

**Action**: Create the `apps/storybook` directory with package.json, tsconfig, and Storybook configuration files.

**Requirements**:
- Create `apps/storybook/package.json` with all dependencies
- Create `apps/storybook/.storybook/main.ts` with react-vite framework and viteFinal
- Create `apps/storybook/.storybook/preview.ts` with CSS import and theme config
- Create `apps/storybook/.storybook/globals.css` with Tailwind v4 setup
- Create `apps/storybook/tsconfig.json` extending base config
- Run `pnpm install` to resolve dependencies

**Verification**:
```bash
# Verify package exists in workspace
pnpm --filter @cw-hackathon/storybook exec ls .storybook/main.ts

# Verify dependencies installed
ls apps/storybook/node_modules/.package-lock.json 2>/dev/null || echo "Using hoisted deps"

# Expected output:
# .storybook/main.ts exists
# Dependencies resolved via pnpm workspace
```

**Implementation Log**:
- [ ] Create apps/storybook/package.json
- [ ] Create apps/storybook/.storybook/main.ts
- [ ] Create apps/storybook/.storybook/preview.ts
- [ ] Create apps/storybook/.storybook/globals.css
- [ ] Create apps/storybook/tsconfig.json
- [ ] Run pnpm install

### Step 2: Write Example Stories for Existing Components

**Action**: Create story files for 5 existing components that best demonstrate Storybook patterns.

**Requirements**:
- Badge stories (simplest — CVA variants only)
- Button stories (CVA variants + sizes + asChild)
- Input stories (simplest wrapper — no variants)
- Card stories (composition pattern)
- Skeleton stories (loading state pattern)
- Each story uses CSF3 format (Component Story Format 3)
- Stories use `satisfies Meta<typeof Component>` for type safety

**Verification**:
```bash
# Count story files
ls packages/ui/src/components/*.stories.tsx | wc -l

# Expected output: 5

# Verify story files have proper structure
grep -l "satisfies Meta" packages/ui/src/components/*.stories.tsx | wc -l

# Expected output: 5
```

**Implementation Log**:
- [ ] Write badge.stories.tsx
- [ ] Write button.stories.tsx
- [ ] Write input.stories.tsx
- [ ] Write card.stories.tsx
- [ ] Write skeleton.stories.tsx

### Step 3: Integrate with Turborepo Pipeline

**Action**: Update turbo.json and root package.json to include Storybook in the build pipeline.

**Requirements**:
- Add `build:storybook` task to turbo.json
- Exclude `*.stories.*` from production build inputs
- Add `storybook` convenience script to root package.json

**Verification**:
```bash
# Verify turbo.json has storybook task
grep "build:storybook" turbo.json

# Verify root package.json has storybook script
grep "storybook" package.json

# Expected output:
# "build:storybook" task found in turbo.json
# "storybook" script found in root package.json
```

**Implementation Log**:
- [ ] Update turbo.json with build:storybook task
- [ ] Update turbo.json build inputs to exclude stories
- [ ] Add storybook script to root package.json

### Step 4: Verify Storybook Runs and Components Render

**Action**: Start Storybook dev server and verify all stories render correctly with Tailwind styling.

**Requirements**:
- Storybook dev server starts without errors
- All 5 component stories are discoverable in sidebar
- Tailwind CSS classes render correctly (colors, shadows, borders)
- Dark mode toggle works
- Controls addon allows interactive prop editing

**Verification**:
```bash
# Start storybook dev server (will verify it launches)
cd apps/storybook && npx storybook dev -p 6006 --ci

# Expected output:
# Storybook started on http://localhost:6006
```

**Implementation Log**:
- [ ] Storybook dev server starts
- [ ] All stories render
- [ ] Tailwind styling works
- [ ] Dark mode toggle works

### Step 5: Document Component Authoring Guidelines

**Action**: Add documentation on how to write Storybook-friendly components and best practices for the team.

**Requirements**:
- Update CLAUDE.md with Storybook section
- Document story file conventions
- Document component patterns that make stories easier to write
- Include guidance on when and how to add stories

**Verification**:
```bash
# Verify CLAUDE.md has Storybook section
grep -c "Storybook" CLAUDE.md

# Expected output: multiple matches
```

**Implementation Log**:
- [ ] Update CLAUDE.md with Storybook section
- [ ] Document story conventions and patterns

## Completion Criteria

- [ ] All TypeScript type checks passing (`pnpm type-check`)
- [ ] Production build succeeds (`pnpm build`)
- [ ] Storybook dev server starts without errors
- [ ] 5 example stories render with proper Tailwind styling
- [ ] Dark mode toggle works in Storybook
- [ ] Turborepo pipeline includes Storybook build task
- [ ] Component authoring guidelines documented

## Notes

### Component Selection Rationale

The 5 components chosen for initial stories represent distinct patterns:

| Component | Pattern | Why |
|-----------|---------|-----|
| **Badge** | CVA variants, no Radix | Simplest — just CSS variants |
| **Button** | CVA + forwardRef + Slot | Core interactive element |
| **Input** | Pure wrapper, no CVA | Simplest possible component |
| **Card** | Composition (5 subcomponents) | Shows compound component pattern |
| **Skeleton** | Animation, no interactivity | Loading state utility |

### Guidelines for Storybook-Friendly Components

Components are easier to storybook when they:

1. **Accept explicit props over context** — Props are directly controllable in Storybook's Controls panel; context-dependent components require decorators
2. **Use CVA for variants** — CVA variants map directly to Storybook `argTypes` with dropdown selectors
3. **Export variant types** — Allows typed `args` in stories
4. **Keep side effects minimal** — Components that fetch data or trigger navigation need mocking; pure presentational components "just work"
5. **Use composition over configuration** — Compound components (like Card) let stories show different compositions without complex prop wiring
6. **Accept className** — Enables Storybook decorators to add wrapper styles
7. **Use forwardRef** — Enables Storybook's "measure" addon and interaction testing
8. **Define sensible defaults** — Components should render meaningfully with zero props

### Gotchas & Surprises

- **`@source` path must be relative to the CSS file, not the project root.** This was the single most painful bug. The `@source` directive in `apps/storybook/.storybook/globals.css` needs to resolve relative to where that CSS file lives on disk. We had `../../../../packages/ui/src/**/*.{ts,tsx}` (4 levels up) when we needed `../../../packages/ui/src/**/*.{ts,tsx}` (3 levels up). The extra `../` caused Tailwind to scan a non-existent directory, producing zero utility classes — components rendered completely unstyled. **This fails silently** — no build errors, no warnings, just invisible CSS. Always verify with `realpath --relative-to=<css-dir> <target-dir>`.

- **Storybook 10 bundles addon-essentials into core.** Do NOT install `@storybook/addon-essentials` — it doesn't exist at v10. This is easy to miss since most tutorials and examples still reference v8 patterns.

- **`@storybook/react` is pulled automatically by `@storybook/react-vite`.** Installing it separately is redundant (but harmless).

- **Storybook package MUST have a `build` script** (not just `build:storybook`), otherwise Turbo's `build` task fails across the workspace since it tries to run `build` in every package.

- **`@tailwindcss/vite` must use dynamic import** in `viteFinal`. Static `import tailwindcss from "@tailwindcss/vite"` at the top of `main.ts` fails with `ERR_PACKAGE_PATH_NOT_EXPORTED`. Must use `const { default: tailwindcss } = await import("@tailwindcss/vite")`.

- **`"use client"` directives produce warnings** during Storybook build (`Module level directives cause errors when bundled, "use client" was ignored`) — these are cosmetic and don't break anything.

- **`reactDocgen: false` is required** in monorepo setups to avoid `ReferenceError: c is not defined` crashes from the react-docgen plugin.

### Demo Instructions

**How to Demo:**
1. Run `pnpm storybook` from root (or `pnpm --filter @cw-hackathon/storybook dev`)
2. Visit http://localhost:6006
3. Click through components in the sidebar: Badge, Button, Card, Input, Skeleton
4. Use the Controls panel to change variants/sizes interactively
5. Use the theme toggle in the toolbar to switch between light and dark mode
6. Verify components have proper colors, shadows, borders, and spacing

## Quality Checks

- [ ] Type check passed (`pnpm type-check`)
- [ ] Build passed (`pnpm build`)
- [ ] Demo instructions provided
- [ ] All completion criteria met

**Last Verified**: N/A

---

**Status**: Draft
**Created**: 2026-02-06
**Last Updated**: 2026-02-06
**Implementation Started**: N/A
**Completed**: N/A
**Accepted**: N/A
**Rejected**: N/A
