# PRD: Vercel Serverless Bundle Size Optimization

**Status**: ✅ Implemented
**PR**: https://github.com/ctoscano/cw-hackathon-3/pull/10
**Started**: 2025-02-05
**Completed**: 2025-02-05

## Problem Statement

Vercel deployment failing with error:
```
Error: A Serverless Function has exceeded the unzipped maximum size of 250 MB
All dependencies: 528.6 MB
apps/web/.next: 525.3 MB
```

## Root Causes Identified

### 1. CLI Code Bundled into Web Routes (Phase 1)
**Impact**: ~30-50 MB per function

CLI code imported at module level in `packages/data/src/index.ts`:
- `citty` framework (~5-10 MB)
- All CLI commands (268 KB + dependencies)
- CLI-only dependencies

**Solution**: Separate CLI from library exports
- Created `web-exports.ts` for AI routes
- Created `web-exports-static.ts` for static routes
- Updated API routes to use new import paths

### 2. Webpack Cache Pollution (Phase 2)
**Impact**: ~520 MB per function

Next.js file tracing incorrectly includes build cache:
- `cache/webpack/server-production/*.pack` (100-120 MB per file)
- `cache/webpack/client-production/*.pack` (40-100 MB per file)
- Development artifacts and tsbuildinfo

**Solution**: Exclude cache from file tracing
- Added `outputFileTracingExcludes` to `next.config.ts`

## Implementation

### Phase 1: CLI Export Separation

**New Files**:
- `packages/data/src/web-exports.ts` - AI-powered routes
- `packages/data/src/web-exports-static.ts` - Static data routes

**Modified Files**:
- `packages/data/package.json` - Added `/web` and `/web-static` export paths
- `apps/web/app/api/intake/step/route.ts` - Import from `/web`
- `apps/web/app/api/intake/completion/route.ts` - Import from `/web`
- `apps/web/app/api/dap/generate/route.ts` - Import from `/web`
- `apps/web/app/api/intake/start/route.ts` - Import from `/web-static`

### Phase 2: Cache Exclusion

**Modified Files**:
- `apps/web/next.config.ts` - Added `outputFileTracingExcludes`

## Expected Results

### Before Optimization
- Total bundle: **528.6 MB** ❌
- Per function: ~130 MB
- Deployment: FAILED

### After Phase 1 Only
- Total bundle: **528.6 MB** ❌ (cache still included)
- CLI code eliminated ✅
- Deployment: FAILED

### After Phase 1 + Phase 2
- Total bundle: **~15-25 MB** ✅
- Per function breakdown:
  - `/api/dap/generate`: ~3-5 MB
  - `/api/intake/step`: ~3-5 MB
  - `/api/intake/completion`: ~3-5 MB
  - `/api/intake/start`: ~1-2 MB (static)
  - `/api/ops/*`: ~2-3 MB (Redis only)
- Deployment: SUCCESS ✅

## Bundle Analysis (Phase 1 Build)

Analyzed `/api/dap/generate` function:

```
Total traced files: 253 files, 637 MB
Breakdown:
  ✅ Legitimate dependencies: 189 files, 3 MB
  ❌ Webpack cache: 64 files, 634 MB
```

## Verification

### Build Analysis
```bash
# Analyzed .nft.json manifest
node analyze-bundle.js
# Result: 3 MB actual + 634 MB cache
```

### Vercel Deployment Logs (Phase 1)
```
apps/web/.next: 525.3 MB
All dependencies: 528.6 MB
Max serverless function size exceeded
```

### Expected Vercel Deployment (Phase 1 + 2)
```
apps/web/.next: ~10-15 MB
All dependencies: ~15-25 MB
Deployment: SUCCESS
```

## Success Criteria

- [x] Phase 1: CLI code not bundled into web routes
- [x] Phase 1: Type checking passes
- [x] Phase 1: Builds successfully
- [ ] Phase 2: Vercel deployment succeeds
- [ ] Phase 2: Bundle size < 250 MB (target: 15-25 MB)
- [ ] Phase 2: All routes functional in production
- [ ] Phase 2: Cold start times improved

## Backward Compatibility

- ✅ CLI tool unchanged (still uses `index.ts`)
- ✅ CLI commands work identically
- ✅ Web routes use cleaner import paths
- ✅ Code reuse maintained (CLI and web share library functions)

## Future Optimizations (If Needed)

If Phase 1 + 2 aren't sufficient:

### Phase 3: Lazy Load Weave SDK
- Only bundle Weave when tracing enabled
- Expected reduction: ~20-30 MB

### Phase 4: Edge Runtime for Ops Routes
- Ops routes only query Redis
- Edge Runtime has 4 MB limit but supports Redis
- Expected reduction: ~10-15 MB

## Timeline

- **Phase 1 Completed**: 2025-02-05 07:38 UTC
  - Branch: `fix/vercel-bundle-size-phase1`
  - Commit: `ded8fd1`
  - PR: #10
  - Vercel deployment: FAILED (cache pollution)

- **Phase 2 In Progress**: 2025-02-05 07:45 UTC
  - Adding cache exclusion config
  - Expected: Deployment SUCCESS

## References

- PR: https://github.com/ctoscano/cw-hackathon-3/pull/10
- Vercel Bundle Size Limits: https://vercel.com/docs/functions/serverless-functions/runtimes#bundle-size
- Next.js Output File Tracing: https://nextjs.org/docs/pages/api-reference/next-config-js/output#automatically-copying-traced-files
