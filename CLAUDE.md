# CW Hackathon Monorepo - AI Assistant Context

## Monorepo Overview

This is a Turbo-powered monorepo using pnpm workspaces for a hackathon project.

### Technology Stack

- **Package Manager**: pnpm 9.15.0 with workspaces
- **Build System**: Turbo 2.3.3 for task orchestration and caching
- **Language**: TypeScript 5.7.2 with strict mode enabled
- **Linter/Formatter**: Biome 1.9.4 (replaces ESLint + Prettier)
- **Web Framework**: Next.js 15.1.4 with React 19
- **CLI Framework**: Citty 0.1.6 (lightweight, TypeScript-first)
- **CLI Runtime**: Bun (fast startup, native TypeScript support)

### Workspace Structure

```
cw-hackathon-3/
├── apps/
│   └── web/              # Next.js 15 web application
└── packages/
    └── data/             # CLI tool using Citty, runs with Bun
```

## Project Structure

```
/
├── .gitignore            # Ignores node_modules, dist, .next, .turbo, .env
├── .npmrc                # pnpm configuration (shamefully-hoist, auto-install-peers)
├── package.json          # Root package with turbo scripts
├── pnpm-workspace.yaml   # Workspace configuration (apps/*, packages/*)
├── turbo.json            # Turbo pipeline configuration
├── biome.json            # Biome linting and formatting rules
├── tsconfig.json         # Base TypeScript configuration
├── CLAUDE.md             # This file - AI assistant context
├── README.md             # Project overview and quick start
├── docs/
│   ├── README.md         # Documentation index
│   └── prds/
│       └── repo-setup.md # Initial setup implementation plan
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
        │   ├── index.ts          # Main CLI definition
        │   ├── bin/
        │   │   └── cli.ts        # Bun executable entry point
        │   └── commands/
        │       └── hello.ts      # Example hello command
        └── dist/                 # Build output (gitignored)
```

## Development Workflows

### Installing Dependencies

```bash
pnpm install
```

This installs all dependencies across all workspaces and creates workspace links.

### Running Development Servers

```bash
# Run all dev servers (uses Turbo)
pnpm dev

# Run specific workspace
pnpm --filter @cw-hackathon/web dev
pnpm --filter @cw-hackathon/data dev
```

### Building

```bash
# Build all workspaces
pnpm build

# Build specific workspace
pnpm --filter @cw-hackathon/web build
pnpm --filter @cw-hackathon/data build
```

### Linting and Formatting

```bash
# Format code (write mode)
pnpm format

# Lint and auto-fix (write mode)
pnpm check

# Type checking
pnpm type-check
```

### Running Individual Commands

```bash
# Run lint in specific workspace
pnpm --filter @cw-hackathon/web lint

# Run type-check in specific workspace
pnpm --filter @cw-hackathon/data type-check
```

## Workspace Details

### apps/web

Next.js 15 web application with React 19.

**Tech Stack:**
- Next.js 15.1.4 (App Router)
- React 19.0.0
- TypeScript
- CSS

**Key Files:**
- `next.config.ts`: Next.js configuration with `reactStrictMode: true`
- `app/layout.tsx`: Root layout with metadata
- `app/page.tsx`: Home page
- `app/globals.css`: Global styles

**Development:**
```bash
cd apps/web
pnpm dev
# Visit http://localhost:3000
```

### packages/data

CLI tool using Citty framework, runs with Bun runtime.

**Tech Stack:**
- Citty 0.1.6 (CLI framework)
- Bun (runtime)
- TypeScript

**Key Files:**
- `src/bin/cli.ts`: Entry point with `#!/usr/bin/env bun` shebang
- `src/index.ts`: Main command definition with subcommands
- `src/commands/hello.ts`: Example hello command

**Development:**
```bash
cd packages/data

# Run directly from source (no build needed)
bun run src/bin/cli.ts hello
bun run src/bin/cli.ts hello --name="Developer" --loud

# After building
bun dist/bin/cli.js hello
```

## CLI Usage

### Running the CLI

```bash
# From packages/data directory
cd packages/data
bun run src/bin/cli.ts <command> [options]

# Or via npm script
pnpm --filter @cw-hackathon/data cli <command> [options]
```

### Available Commands

**hello** - Say hello to the world

```bash
# Basic usage
bun run src/bin/cli.ts hello
# Output: Hello, World!

# With custom name
bun run src/bin/cli.ts hello Developer
# Output: Hello, Developer!

# Loud mode
bun run src/bin/cli.ts hello --name="Developer" --loud
# Output: HELLO, DEVELOPER!!!
```

**Arguments:**
- `name` (positional, optional): Name to greet (default: "World")

**Flags:**
- `--loud, -l`: Make it loud with exclamation marks

## Code Conventions

### General

- Use **Biome** for all linting and formatting (NOT Prettier or ESLint)
- TypeScript **strict mode** is enabled
- All packages use **ESM modules** (`type: module` in package.json)
- Use **workspace protocol** for internal dependencies: `workspace:*`

### File Naming

- React components: PascalCase (`HomePage.tsx`)
- Utilities: camelCase (`formatDate.ts`)
- Configuration: kebab-case or standard names (`next.config.ts`, `biome.json`)

### Import Organization

Biome automatically organizes imports:
1. Built-in modules
2. External dependencies
3. Internal workspace packages
4. Relative imports

### TypeScript

- Prefer `interface` over `type` for object shapes
- Use explicit return types for exported functions
- Enable all strict mode checks
- Use `unknown` instead of `any` when type is uncertain

### Naming Conventions

- Workspace packages: `@cw-hackathon/<name>`
- Components: PascalCase
- Functions/variables: camelCase
- Constants: UPPER_SNAKE_CASE
- Types/Interfaces: PascalCase

## Adding New Workspaces

### New App

```bash
mkdir apps/new-app
cd apps/new-app

# Create package.json
cat > package.json <<EOF
{
  "name": "@cw-hackathon/new-app",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "...",
    "build": "...",
    "lint": "biome check .",
    "type-check": "tsc --noEmit"
  }
}
EOF

# Install from root
cd ../..
pnpm install
```

### New Package

```bash
mkdir packages/new-package
cd packages/new-package

# Create package.json
cat > package.json <<EOF
{
  "name": "@cw-hackathon/new-package",
  "version": "0.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "lint": "biome check .",
    "type-check": "tsc --noEmit"
  }
}
EOF

# Install from root
cd ../..
pnpm install
```

### Using Internal Packages

Reference workspace packages in `package.json`:

```json
{
  "dependencies": {
    "@cw-hackathon/data": "workspace:*",
    "@cw-hackathon/utils": "workspace:*"
  }
}
```

## Turborepo Pipeline

Defined in `turbo.json`:

- **build**: Has outputs (`.next/**`, `dist/**`), depends on dependencies being built first
- **dev**: No caching, persistent (keeps running)
- **lint**: Depends on build
- **type-check**: Depends on build

## Common Tasks

### Add a New Dependency

```bash
# To root
pnpm add -D <package> -w

# To specific workspace
pnpm --filter @cw-hackathon/web add <package>
pnpm --filter @cw-hackathon/data add -D <package>
```

### Update Dependencies

```bash
# Update all
pnpm update

# Update specific package
pnpm update <package>

# Interactive update
pnpm update -i
```

### Clean Build Artifacts

```bash
# Clean all
pnpm exec turbo clean

# Or manually
rm -rf apps/*/dist apps/*/.next packages/*/dist .turbo
```

### Reset Node Modules

```bash
# Remove all node_modules
rm -rf node_modules apps/*/node_modules packages/*/node_modules

# Reinstall
pnpm install
```

## Troubleshooting

### pnpm install fails

- Ensure you have pnpm 9.15.0: `pnpm --version`
- Install correct version: `npm install -g pnpm@9.15.0`
- Clear pnpm cache: `pnpm store prune`

### Turbo cache issues

```bash
# Clear turbo cache
rm -rf .turbo
pnpm exec turbo clean
```

### Type errors in workspace packages

- Ensure packages are built: `pnpm build`
- Check tsconfig.json extends base config
- Verify workspace links: `pnpm list --depth 0`

### Biome not formatting

- Check file is not in `files.ignore` in biome.json
- Run with write flag: `pnpm check`
- Manual format: `pnpm format`

## Environment Variables

### apps/web

Create `.env.local` for local development:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

Never commit `.env.local` - it's gitignored.

### packages/data

CLI can read environment variables via `process.env` or Bun's `Bun.env`.

## Why These Tools?

**Turbo**: Fast builds with intelligent caching, parallel execution

**pnpm**: Efficient disk usage, fast installs, strict dependency resolution

**Biome**: Single tool for linting + formatting, faster than ESLint + Prettier

**Bun**: Fast CLI startup, native TypeScript support, Node.js compatible

**Citty**: Lightweight CLI framework, TypeScript-first, easy to use

**Next.js 15**: Latest React features, App Router, server components

## Quick Reference

```bash
# Install dependencies
pnpm install

# Run dev servers
pnpm dev

# Build all
pnpm build

# Lint and format
pnpm check

# Run CLI
cd packages/data && bun run src/bin/cli.ts hello

# Run Next.js app
pnpm --filter @cw-hackathon/web dev
```

## Documentation

See `docs/` directory for:
- PRDs (Product Requirement Documents) in `docs/prds/`
- Additional documentation in `docs/README.md`
