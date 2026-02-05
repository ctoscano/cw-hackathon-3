# Add Bun Runtime - Product Requirement Document

<!--
META-INSTRUCTIONS FOR LLMs:
This template provides a structured format for creating Product Requirement Documents (PRDs).
When creating a new PRD, replace all placeholder text in [brackets] with actual content.
Follow the guidance in HTML comments for each section.
Remove or replace example content as appropriate.
Keep the section structure intact - all four main sections are required.
-->

## Purpose

<!--
META-INSTRUCTIONS FOR LLMs:
- Write 2-4 sentences clearly stating what will be built
- Include the "why" - what problem does this solve or what value does it add?
- Be specific about scope - what's included and what's explicitly excluded
- Use active voice and present tense
- Focus on outcomes, not implementation details
-->

This PRD defines the implementation of Bun runtime support as an alternative to Node.js for running the Next.js web application. The goal is to demonstrate and measure performance improvements that Bun provides for common development workflows including builds, dev server startup, and production server execution.

The scope includes:
- Adding Bun-specific npm scripts for build, dev, and start commands
- Creating a benchmark script to compare Node vs Bun performance
- Documenting performance comparison results
- Ensuring the application works correctly with both runtimes

## Constraints

<!--
META-INSTRUCTIONS FOR LLMs:
- List all constraints that limit or guide the implementation
- Group into categories: Technical, Business/Timeline, Dependencies, Compatibility
-->

### Technical Constraints
- Must work with Next.js 15.5.x which has experimental Bun support
- Must not break existing Node.js workflows
- Must maintain pnpm as the package manager (Bun is only used as a runtime)
- Turbo pipelines must continue to work unchanged

### Business/Timeline Constraints
- This is a hackathon demonstration feature
- Focus on showing measurable performance improvements

### Dependencies
- Bun must be installed on the system (version 1.x recommended)
- Existing Node.js 18+ setup must remain functional

### Compatibility Requirements
- All existing `pnpm build`, `pnpm dev`, and `pnpm start` commands must continue to work
- New Bun commands are additive, not replacing existing workflows

## Technical Requirements

<!--
META-INSTRUCTIONS FOR LLMs:
- Break this section into clear subsections
- Required subsections: Files to Create, Files to Modify
-->

### Files to Create

1. **`scripts/benchmark-runtime.sh`** - Benchmark script to compare Node vs Bun performance
   - Runs build, dev startup, and start commands with both runtimes
   - Measures and reports execution time
   - Outputs results in a clear comparison format
   - Uses `time` command or equivalent for measurement

### Files to Modify

1. **`apps/web/package.json`** - Add Bun-specific npm scripts
   - Add `dev:bun` script for Bun dev server
   - Add `build:bun` script for Bun build
   - Add `start:bun` script for Bun production server

2. **`package.json`** (root) - Add convenience scripts
   - Add `benchmark` script to run the benchmark comparison
   - Optionally add `build:bun` and `dev:bun` at root level

### Architecture Decisions

The approach uses Bun as a **runtime substitute** rather than replacing pnpm:
- pnpm remains the package manager for dependency management
- Bun is used via `bunx` or direct `bun` commands to execute Next.js
- This allows side-by-side comparison without migration risk

### Tech Stack

- Bun 1.x - JavaScript/TypeScript runtime with faster startup and execution
- Next.js 15.5.x - Already has experimental Bun support built-in

## Steps

<!--
META-INSTRUCTIONS FOR LLMs:
- Number each step sequentially (Step 1, Step 2, etc.)
- Each step should be discrete and independently verifiable
-->

### Step 1: Add Bun Scripts to Web App

**Action**: Add Bun-specific npm scripts to the web app's package.json

**Requirements**:
- Add `dev:bun` script that runs `bun --bun next dev` with PORT support
- Add `build:bun` script that runs `bun --bun next build`
- Add `start:bun` script that runs `bun --bun next start`
- The `--bun` flag tells Next.js to use Bun's runtime instead of Node

**Verification**:
```bash
# Verify scripts exist
cd apps/web
grep -E "dev:bun|build:bun|start:bun" package.json

# Test build with Bun
pnpm build:bun

# Test dev server with Bun (should start successfully)
timeout 10 pnpm dev:bun || true

# Expected output:
# Build should complete successfully
# Dev server should start on configured port
```

**Implementation Log**:
- [x] Add dev:bun script (2026-02-05)
- [x] Add build:bun script (2026-02-05)
- [x] Add start:bun script (2026-02-05)
- [x] Test each script works (2026-02-05)

### Step 2: Create Benchmark Script

**Action**: Create a shell script that benchmarks Node vs Bun performance for key operations

**Requirements**:
- Measure build time for both Node and Bun
- Measure dev server startup time for both runtimes
- Output results in a clear, readable format
- Handle errors gracefully
- Support running from repository root

**Verification**:
```bash
# Make script executable and run it
chmod +x scripts/benchmark-runtime.sh
./scripts/benchmark-runtime.sh

# Expected output:
# ========================================
# Runtime Performance Comparison
# ========================================
#
# BUILD COMPARISON:
# Node.js build: X.XXs
# Bun build:     X.XXs
# Speedup:       X.Xx faster
#
# DEV SERVER STARTUP:
# Node.js startup: X.XXs
# Bun startup:     X.XXs
# Speedup:         X.Xx faster
```

**Implementation Log**:
- [x] Create benchmark-runtime.sh script (2026-02-05)
- [x] Implement build comparison (2026-02-05)
- [x] Implement dev server startup comparison (2026-02-05)
- [x] Add formatted output with speedup calculation (2026-02-05)
- [x] Test script runs successfully (2026-02-05)

### Step 3: Add Root-Level Convenience Scripts

**Action**: Add benchmark script reference to root package.json

**Requirements**:
- Add `benchmark` script that runs the benchmark comparison
- Keep it simple - just reference the shell script

**Verification**:
```bash
# Run benchmark from root
pnpm benchmark

# Expected: Same output as running scripts/benchmark-runtime.sh directly
```

**Implementation Log**:
- [x] Add benchmark script to root package.json (2026-02-05)
- [x] Verify it runs correctly (2026-02-05)

### Step 4: Run Full Benchmark and Document Results

**Action**: Execute the full benchmark and capture results

**Requirements**:
- Run the benchmark script to capture real performance data
- Document the results for demonstration purposes
- Verify both runtimes produce working builds

**Verification**:
```bash
# Run full benchmark
pnpm benchmark

# Verify Node build works
cd apps/web && pnpm build && cd ../..

# Verify Bun build works
cd apps/web && pnpm build:bun && cd ../..

# Both should complete without errors
```

**Implementation Log**:
- [x] Run benchmark and capture results (2026-02-05)
- [x] Verify both builds produce working output (2026-02-05)
- [x] Document any gotchas or differences (2026-02-05)

## Completion Criteria

<!--
META-INSTRUCTIONS FOR LLMs:
- List the overall criteria for considering this PRD complete
-->

- [x] All TypeScript type checks passing (`pnpm type-check`)
- [x] Production build succeeds (`pnpm build`)
- [x] Bun build succeeds (`cd apps/web && pnpm build:bun`)
- [x] Bun dev server starts successfully
- [x] Benchmark script runs and produces comparison output
- [x] Performance comparison is documented (results vary by environment)

## Notes

<!--
META-INSTRUCTIONS FOR LLMs:
- Add any information that doesn't fit other sections
-->

### Background

Bun is a modern JavaScript runtime that aims to be a drop-in replacement for Node.js with significant performance improvements, particularly in:
- Startup time (uses JavaScriptCore instead of V8)
- Package installation (not relevant here since we keep pnpm)
- Build tooling (Bun has native bundler, but we use Next.js's)

Next.js 15 has experimental support for Bun via the `--bun` flag or `bun --bun next` syntax.

### Future Enhancements

- Consider full migration to Bun as package manager (replacing pnpm)
- Add CI/CD benchmarks
- Compare memory usage between runtimes

### Gotchas & Surprises

<!--
Added during implementation via /prd start.
Document unexpected challenges, edge cases, and surprises encountered.
-->

- **Build performance varies**: In initial testing, Node.js build (~1m21s) was slightly faster than Bun build (~1m39s). This is because Next.js uses webpack/SWC for bundling which are already highly optimized, and the Bun `--bun` flag primarily affects the Node.js runtime layer, not the build tooling.

- **Dev server startup**: The dev server startup time comparison requires careful measurement. Both runtimes start quickly, and the difference may be more noticeable in larger codebases or with more dependencies.

- **The `--bun` flag**: The syntax `bun --bun next build` is required. Just `bun next build` doesn't use Bun's optimized runtime for Next.js - the `--bun` flag tells Next.js to use Bun's runtime instead of Node.js.

- **Environment-dependent results**: Performance differences between Node and Bun depend heavily on the system environment, CPU architecture, and workload characteristics. Run benchmarks on your target environment for accurate comparisons.

### Demo Instructions

<!--
Added during implementation via /prd start or /prd end.
Provide clear instructions on how to demo this feature.
-->

**How to Demo:**
```bash
# Run the benchmark comparison
pnpm benchmark

# Or manually compare:
# Build with Node
cd apps/web && time pnpm build

# Build with Bun
cd apps/web && time pnpm build:bun

# Dev server with Node
pnpm dev  # Uses Node.js

# Dev server with Bun
cd apps/web && pnpm dev:bun
```

## Quality Checks

<!--
AUTO-POPULATED BY /prd end - do not edit manually.
-->

- [ ] Type check passed (`pnpm type-check`)
- [ ] Build passed (`pnpm build`)
- [ ] Demo instructions provided
- [ ] All completion criteria met

**Last Verified**: N/A

---

**Status**: In Progress
**Created**: 2026-02-05
**Last Updated**: 2026-02-05
**Implementation Started**: 2026-02-05
**Completed**: N/A
**Accepted**: N/A
**Rejected**: N/A
