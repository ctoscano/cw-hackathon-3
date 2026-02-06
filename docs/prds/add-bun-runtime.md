# Runtime & Build Performance Optimization - Product Requirement Document

## Purpose

This PRD defines the implementation of performance optimizations for the development and build workflow. The goal was to evaluate alternative runtimes (Bun) and build tools (Turbopack, tsgo) to improve developer experience through faster builds, type checking, and dev server performance.

The scope includes:
- Evaluating Bun runtime vs Node.js for Next.js workflows
- Enabling Turbopack for faster builds and dev server
- Adding tsgo (TypeScript 7 Go compiler) for faster type checking
- Refactoring monorepo imports for bundler-first workflow
- Setting the fastest tools as defaults

## Final Results

### Performance Benchmarks

| Task | Before | After | Improvement |
|------|--------|-------|-------------|
| Type checking | 11.3s (tsc) | 4.3s (tsgo) | **2.6x faster** |
| Production build | 1m16s (webpack) | 46s (Turbopack) | **2x faster** |
| Dev server startup | 4s (webpack) | 3.2s (Turbopack) | Faster HMR |
| Pre-build step | Required | Not needed | **Eliminated** |

### Key Finding: Bun Runtime Doesn't Help Builds

Bun's performance advantages are in HTTP server throughput and startup time, not in webpack/SWC-based builds. The `--bun` flag only affects the Node.js runtime layer, not the build tooling. In testing, Bun builds were actually slightly slower (1m39s vs 1m16s).

The real performance gains came from:
1. **Turbopack** - Rust-based bundler, 2x faster builds
2. **tsgo** - Go-based TypeScript compiler, 2.6x faster type checking
3. **Source imports** - Eliminated pre-build step for monorepo packages

## Technical Requirements

### Files Created

1. **`scripts/benchmark-runtime.sh`** - Benchmark script comparing Node vs Bun
2. **`@typescript/native-preview`** - Installed for tsgo binary

### Files Modified

1. **`apps/web/package.json`** - Updated scripts with fastest defaults
2. **`apps/web/next.config.ts`** - Added Turbopack configuration
3. **`packages/data/package.json`** - Source exports for bundler workflow
4. **`packages/data/src/**/*.ts`** - Removed .js extensions (21 files)
5. **`package.json`** (root) - Added benchmark script

### Architecture Changes

**Bundler-First Module Resolution**: Changed from ESM-style imports with `.js` extensions to extensionless imports that bundlers (webpack, Turbopack) resolve directly.

```typescript
// Before (ESM-style)
import { foo } from "./lib/utils.js";

// After (bundler-style)
import { foo } from "./lib/utils";
```

This enables:
- Turbopack compatibility (doesn't support extensionAlias)
- Source imports without pre-building packages/data
- Faster development iteration

## New Default Commands

| Command | Tool | Description |
|---------|------|-------------|
| `pnpm dev` | Turbopack | Dev server with fast HMR |
| `pnpm build` | Turbopack | Production build (~46s) |
| `pnpm type-check` | tsgo | Type checking (~4s) |

### Fallback Commands

| Command | Tool | Use Case |
|---------|------|----------|
| `pnpm dev:webpack` | Webpack | If Turbopack has issues |
| `pnpm dev:bun` | Bun + Webpack | Alternative runtime |
| `pnpm build:webpack` | Webpack | Maximum stability |
| `pnpm build:bun` | Bun + Webpack | Alternative runtime |
| `pnpm type-check:tsc` | tsc | If tsgo has edge cases |

## Implementation Log

### Step 1: Add Bun Runtime Scripts
- [x] Add dev:bun, build:bun, start:bun scripts (2026-02-05)
- [x] Test Bun runtime works with Next.js (2026-02-05)

### Step 2: Benchmark and Research
- [x] Create benchmark-runtime.sh script (2026-02-05)
- [x] Research Bun's actual performance claims (2026-02-05)
- [x] Discover Bun doesn't help webpack builds (2026-02-05)

### Step 3: Enable Source Imports
- [x] Update packages/data exports to point to source (2026-02-05)
- [x] Configure webpack extensionAlias for .js→.ts resolution (2026-02-05)
- [x] Eliminate pre-build step requirement (2026-02-05)

### Step 4: Add Turbopack Support
- [x] Add Turbopack configuration to next.config.ts (2026-02-05)
- [x] Remove .js extensions from all imports (21 files) (2026-02-05)
- [x] Test Turbopack build and dev server (2026-02-05)

### Step 5: Add tsgo Support
- [x] Install @typescript/native-preview (2026-02-05)
- [x] Add type-check:tsgo script (2026-02-05)
- [x] Verify 2.6x speedup (2026-02-05)

### Step 6: Set Fastest Tools as Defaults
- [x] Make Turbopack the default for dev and build (2026-02-05)
- [x] Make tsgo the default for type-check (2026-02-05)
- [x] Rename old commands as fallbacks (2026-02-05)

## Completion Criteria

- [x] All TypeScript type checks passing (`pnpm type-check`)
- [x] Production build succeeds (`pnpm build`)
- [x] Turbopack build works with workspace packages
- [x] tsgo type checking works
- [x] No pre-build step needed for development
- [x] Fastest tools set as defaults

## Notes

### Gotchas & Surprises

- **Bun doesn't speed up builds**: The `--bun` flag only affects Node.js runtime, not webpack/SWC. Builds were actually slower with Bun.

- **Turbopack requires extensionless imports**: Turbopack doesn't support webpack's `extensionAlias` feature. Had to remove all `.js` extensions from imports.

- **tsgo is production-ready**: The TypeScript 7 Go compiler preview works well and provides significant speedup with no issues found.

- **Source imports eliminate build step**: By pointing package exports to source and using bundler module resolution, the pre-build requirement is eliminated.

### Demo Instructions

**How to Demo:**
```bash
# Default commands now use fastest tools
pnpm dev          # Turbopack dev server
pnpm build        # Turbopack build (~46s)
pnpm type-check   # tsgo (~4s)

# Compare with fallbacks
pnpm build:webpack   # Webpack build (~1m16s)
pnpm type-check:tsc  # tsc (~11s)

# Run benchmark script
pnpm benchmark
```

## Quality Checks

- [x] Type check passed (`pnpm type-check`)
- [x] Build passed (`pnpm build`)
- [x] Demo instructions provided
- [x] All completion criteria met

**Last Verified**: 2026-02-05

---

**Status**: Completed
**Created**: 2026-02-05
**Last Updated**: 2026-02-05
**Implementation Started**: 2026-02-05
**Completed**: 2026-02-05
**Accepted**: N/A
**Rejected**: N/A
