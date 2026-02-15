# Turbo Monorepo Setup Plan

## Implementation Log

**Status:** ✅ COMPLETED
**Date:** 2026-01-31
**Implementer:** Claude Code

### Completed Steps

#### Phase 1: Root Configuration ✅
- [x] Created `.gitignore` - Ignores node_modules, build outputs, .turbo, .env files
- [x] Created `package.json` - Root package with turbo ^2.3.3, biome ^1.9.4, typescript ^5.7.2
- [x] Created `pnpm-workspace.yaml` - Defines apps/* and packages/* workspaces
- [x] Created `.npmrc` - Configured shamefully-hoist=true, auto-install-peers=true
- [x] Created `turbo.json` - Pipeline configuration for build, dev, lint, type-check
- [x] Created `biome.json` - Linter/formatter config (updated to v2.1.3 schema)
- [x] Created `tsconfig.json` - Base config with strict mode, moduleResolution: bundler

#### Phase 2: Documentation Structure ✅
- [x] Created `docs/` directory structure
- [x] Created `docs/prds/` directory
- [x] Created `CLAUDE.md` - Comprehensive AI assistant context (9.7KB)
- [x] Created `README.md` - Project overview and quick start guide (3.7KB)
- [x] Created `docs/README.md` - Documentation index
- [x] Created `docs/prds/repo-setup.md` - This implementation plan

#### Phase 3: Next.js Web App (apps/web) ✅
- [x] Created `apps/web/` directory structure
- [x] Created `apps/web/app/` and `apps/web/public/` directories
- [x] Created `apps/web/package.json` - Next.js 15.1.4, React 19.0.0
- [x] Created `apps/web/tsconfig.json` - Extends root, App Router config
- [x] Created `apps/web/next.config.ts` - reactStrictMode enabled
- [x] Created `apps/web/.gitignore` - Next.js specific ignores
- [x] Created `apps/web/app/layout.tsx` - Root layout with metadata
- [x] Created `apps/web/app/page.tsx` - Home page component
- [x] Created `apps/web/app/globals.css` - Global styles

#### Phase 4: CLI Package (packages/data) ✅
- [x] Created `packages/data/` directory structure
- [x] Created `packages/data/src/bin/` and `packages/data/src/commands/` directories
- [x] Created `packages/data/package.json` - Citty 0.1.6, Bun types
- [x] Created `packages/data/tsconfig.json` - Extends root, ESNext module
- [x] Created `packages/data/src/bin/cli.ts` - Bun shebang entry point
- [x] Created `packages/data/src/index.ts` - Main command definition
- [x] Created `packages/data/src/commands/hello.ts` - Example hello command

#### Phase 5: Installation & Build ✅
- [x] Ran `pnpm install` - Installed 77 packages successfully
- [x] Installed Bun runtime v1.3.8 - Required for CLI development
- [x] Ran `pnpm build` - Both packages built successfully in 24.975s

#### Phase 6: Verification ✅
- [x] CLI hello command works - Outputs "Hello, World!"
- [x] CLI with args works - `hello Developer --loud` outputs "HELLO, DEVELOPER!!!"
- [x] Type checking passed - `pnpm type-check` completed successfully
- [x] Biome linting passed - No issues found in 5 files

### Deviations from Plan

1. **Biome Version:** Installed Biome 2.1.3 instead of 1.9.4
   - **Impact:** Required updating biome.json schema from 1.9.4 to 2.1.3
   - **Changes:** Replaced `organizeImports` with VCS config, `ignore` with `experimentalScannerIgnores`
   - **Resolution:** Updated configuration, all checks passing

2. **Bun Installation:** Not pre-installed on system
   - **Impact:** Required installing Bun runtime before CLI verification
   - **Resolution:** Installed Bun v1.3.8 via official installer script

3. **Package Versions:** Some packages auto-upgraded to latest compatible versions
   - Turbo: 2.8.1 (plan specified ^2.3.3)
   - TypeScript: 5.9.3 (plan specified ^5.7.2)
   - **Impact:** None, all backward compatible

### Next Steps

None - implementation complete and verified.

---

## Overview

Set up a Turbo monorepo with pnpm workspaces, TypeScript, Next.js web app, and Citty CLI using Bun runtime. Includes Biome for linting/formatting, comprehensive documentation structure, and AI assistant context.

## Repository Structure

```
/Users/ctoscano/development/hackathon/cw-hackathon-3/
├── .git/
├── .gitignore
├── .npmrc
├── CLAUDE.md                    # AI assistant context documentation
├── README.md                    # Project overview
├── package.json                 # Root package.json with turbo scripts
├── pnpm-workspace.yaml          # pnpm workspace configuration
├── turbo.json                   # Turbo pipeline configuration
├── biome.json                   # Biome linting/formatting config
├── tsconfig.json                # Base TypeScript config
├── docs/
│   ├── prds/
│   │   └── repo-setup.md        # This implementation plan (PRD)
│   └── README.md                # Documentation index
├── apps/
│   └── web/
│       ├── package.json
│       ├── tsconfig.json
│       ├── next.config.ts
│       ├── .gitignore
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   └── globals.css
│       └── public/
└── packages/
    └── data/
        ├── package.json
        ├── tsconfig.json
        ├── src/
        │   ├── index.ts         # CLI definition
        │   ├── bin/
        │   │   └── cli.ts       # Bun executable entry
        │   └── commands/
        │       └── hello.ts     # Hello world command
        └── dist/                # Build output (gitignored)
```

## Critical Files to Create

### Phase 1: Root Configuration

1. **/.gitignore** - Ignore node_modules, build outputs, .turbo, .env files
2. **/package.json** - Root package with turbo, biome, typescript; packageManager: pnpm@9.15.0
3. **/pnpm-workspace.yaml** - Define apps/* and packages/* workspaces
4. **/.npmrc** - Configure shamefully-hoist=true, auto-install-peers=true
5. **/turbo.json** - Pipeline: build (outputs: .next, dist), dev (cache: false), lint, type-check
6. **/biome.json** - Enable linter, formatter, organize imports, ignore node_modules/dist/.next
7. **/tsconfig.json** - Base config: strict mode, moduleResolution: bundler, noEmit: true

### Phase 2: Documentation Structure

8. **/CLAUDE.md** - AI assistant context: monorepo structure, tech stack, conventions, how to run commands
9. **/README.md** - Project overview, getting started, available commands
10. **/docs/README.md** - Documentation index with links to PRDs
11. **/docs/prds/repo-setup.md** - Copy of this implementation plan for reference

### Phase 3: Next.js Web App (apps/web)

12. **/apps/web/package.json** - Dependencies: next ^15.1.4, react ^19.0.0, react-dom ^19.0.0
13. **/apps/web/tsconfig.json** - Extends root, target: ES2020, jsx: preserve, plugins: next
14. **/apps/web/next.config.ts** - reactStrictMode: true, transpilePackages: ['@cw-hackathon/data']
15. **/apps/web/.gitignore** - .next/, out/, .env*.local
16. **/apps/web/app/layout.tsx** - Root layout with metadata, html/body structure
17. **/apps/web/app/page.tsx** - Home page with basic heading
18. **/apps/web/app/globals.css** - Basic CSS reset

### Phase 4: CLI Package (packages/data)

19. **/packages/data/package.json** - type: module, bin: data-cli, dependencies: citty ^0.1.6, devDependencies: @types/bun
20. **/packages/data/tsconfig.json** - Extends root, target: ES2022, module: ESNext, outDir: dist, types: bun-types
21. **/packages/data/src/bin/cli.ts** - Bun shebang, import runMain from citty, run main command
22. **/packages/data/src/index.ts** - defineCommand with meta (name, version, description), subCommands: { hello }
23. **/packages/data/src/commands/hello.ts** - defineCommand for hello with name arg, loud flag, console.log greeting

## Implementation Steps

### Step 1: Create Root Configuration Files

Create files in this order (dependencies matter):
- `.gitignore`
- `package.json` (must define packageManager before pnpm install)
- `pnpm-workspace.yaml` (must exist before pnpm install)
- `.npmrc`
- `turbo.json`
- `biome.json`
- `tsconfig.json`

### Step 2: Create Documentation Structure

Create directories and files:
- `docs/` directory
- `docs/prds/` directory
- `CLAUDE.md` - Include monorepo overview, tech stack, workspace structure, common commands
- `README.md` - Project intro, quick start guide
- `docs/README.md` - Documentation index
- `docs/prds/repo-setup.md` - Copy this plan

### Step 3: Set Up apps/web (Next.js)

Create directories:
- `apps/web/`
- `apps/web/app/`
- `apps/web/public/`

Create files:
- `apps/web/package.json` (name: @cw-hackathon/web)
- `apps/web/tsconfig.json`
- `apps/web/next.config.ts`
- `apps/web/.gitignore`
- `apps/web/app/layout.tsx`
- `apps/web/app/page.tsx`
- `apps/web/app/globals.css`

### Step 4: Set Up packages/data (CLI with Citty)

Create directories:
- `packages/data/`
- `packages/data/src/`
- `packages/data/src/bin/`
- `packages/data/src/commands/`

Create files:
- `packages/data/package.json` (name: @cw-hackathon/data)
- `packages/data/tsconfig.json`
- `packages/data/src/bin/cli.ts` (with #!/usr/bin/env bun shebang)
- `packages/data/src/index.ts`
- `packages/data/src/commands/hello.ts`

### Step 5: Install Dependencies

```bash
pnpm install
```

This will:
- Install all workspace dependencies
- Create pnpm-lock.yaml
- Set up node_modules with workspace links

### Step 6: Build Packages

```bash
pnpm build
```

Builds packages/data TypeScript → dist/

### Step 7: Verify CLI Works

```bash
cd packages/data
bun run src/bin/cli.ts hello
bun run src/bin/cli.ts hello --name="Test" --loud
```

Expected outputs:
- `Hello, World!`
- `HELLO, TEST!!!`

### Step 8: Verify Next.js App

```bash
pnpm --filter @cw-hackathon/web dev
```

Open http://localhost:3000 - should see "CW Hackathon - Web App"

## Key Configuration Details

### Root package.json

```json
{
  "name": "cw-hackathon-monorepo",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "format": "biome format --write .",
    "check": "biome check --write .",
    "type-check": "turbo run type-check"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.4",
    "turbo": "^2.3.3",
    "typescript": "^5.7.2"
  },
  "packageManager": "pnpm@9.15.0",
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=9.0.0"
  }
}
```

### pnpm-workspace.yaml

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### Citty CLI Hello Command (packages/data/src/commands/hello.ts)

```typescript
import { defineCommand } from 'citty';

export const helloCommand = defineCommand({
  meta: {
    name: 'hello',
    description: 'Say hello to the world',
  },
  args: {
    name: {
      type: 'positional',
      description: 'Name to greet',
      required: false,
      default: 'World',
    },
    loud: {
      type: 'boolean',
      description: 'Make it loud with exclamation marks',
      alias: 'l',
      default: false,
    },
  },
  run({ args }) {
    const greeting = `Hello, ${args.name}!`;
    const output = args.loud ? greeting.toUpperCase() + '!!!' : greeting;

    console.log(output);
    console.log(`\nRunning with Bun v${Bun.version}`);

    return {
      success: true,
      message: output,
    };
  },
});
```

### CLI Entry Point (packages/data/src/bin/cli.ts)

```typescript
#!/usr/bin/env bun

import { runMain } from 'citty';
import { main } from '../index.js';

runMain(main);
```

### Bun Runtime for CLI

The CLI uses Bun because:
- Fast startup time (critical for CLI responsiveness)
- Native TypeScript support (no build step needed in dev)
- Can run TypeScript directly: `bun run src/bin/cli.ts`
- Compatible with Node.js ecosystem

Development workflow:
```bash
# Run directly from source (no build)
bun run src/bin/cli.ts hello

# After building
bun dist/bin/cli.js hello

# Via npm script
pnpm --filter @cw-hackathon/data cli hello
```

## CLAUDE.md Content Structure

The CLAUDE.md file should include:

1. **Monorepo Overview**
   - Technology stack (Turbo, pnpm, TypeScript, Bun, Biome, Next.js, Citty)
   - Workspace structure (apps/web, packages/data)

2. **Project Structure**
   - Directory tree with descriptions
   - Key configuration files and their purposes

3. **Development Workflows**
   - Installing dependencies: `pnpm install`
   - Running dev servers: `pnpm dev` or `pnpm --filter <workspace> dev`
   - Building: `pnpm build`
   - Linting/formatting: `pnpm check`
   - Type checking: `pnpm type-check`

4. **Workspace Details**
   - apps/web: Next.js 15, React 19, TypeScript
   - packages/data: CLI using Citty, runs with Bun

5. **CLI Usage**
   - How to run: `cd packages/data && bun run src/bin/cli.ts`
   - Available commands
   - Example usage

6. **Code Conventions**
   - Use Biome for formatting (not Prettier/ESLint)
   - TypeScript strict mode enabled
   - ESM modules (type: module)
   - Workspace protocol for internal dependencies: `workspace:*`

7. **Adding New Workspaces**
   - Create in apps/ or packages/
   - Add package.json with @cw-hackathon scope
   - Reference from pnpm-workspace.yaml (already uses wildcards)

## Verification Steps

After implementation, verify:

1. **Dependencies installed**: `node_modules/` exists, `pnpm-lock.yaml` created
2. **Build succeeds**: `pnpm build` completes without errors
3. **CLI works**:
   ```bash
   cd packages/data
   bun run src/bin/cli.ts hello
   # Output: Hello, World!
   bun run src/bin/cli.ts hello --name="Developer" --loud
   # Output: HELLO, DEVELOPER!!!
   ```
4. **Next.js works**:
   ```bash
   pnpm --filter @cw-hackathon/web dev
   # Visit http://localhost:3000
   # Should see: "CW Hackathon - Web App"
   ```
5. **Type checking passes**: `pnpm type-check`
6. **Linting passes**: `pnpm check`
7. **Documentation exists**: CLAUDE.md, README.md, docs/prds/repo-setup.md all created

## Tech Stack Summary

- **Package Manager**: pnpm 9.15.0 (workspaces)
- **Build System**: Turbo 2.3.3 (caching, orchestration)
- **Language**: TypeScript 5.7.2 (strict mode)
- **Linter/Formatter**: Biome 1.9.4 (replaces ESLint + Prettier)
- **Web Framework**: Next.js 15.1.4 with React 19
- **CLI Framework**: Citty 0.1.6 (lightweight, TypeScript-first)
- **CLI Runtime**: Bun (fast startup, native TS support)

## Dependencies

### Root
- `turbo`: ^2.3.3
- `@biomejs/biome`: ^1.9.4
- `typescript`: ^5.7.2

### apps/web
- `next`: ^15.1.4
- `react`: ^19.0.0
- `react-dom`: ^19.0.0
- `@types/node`: ^22.10.5
- `@types/react`: ^19.0.6
- `@types/react-dom`: ^19.0.2

### packages/data
- `citty`: ^0.1.6
- `@types/bun`: ^1.1.14
- `@types/node`: ^22.10.5

## Future Extensibility

This structure supports:

**New CLI commands**: Add to packages/data/src/commands/, register in src/index.ts subCommands

**New packages**: Create in packages/, reference via `@cw-hackathon/<name>` and `workspace:*`

**New apps**: Create in apps/, automatically picked up by pnpm workspace wildcards

**Shared utilities**: Create packages/utils, packages/ui, packages/config as needed
