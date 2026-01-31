# CW Hackathon 3 - Turbo Monorepo

A Turbo-powered monorepo for hackathon projects using pnpm workspaces, TypeScript, Next.js, and Bun.

## Tech Stack

- **Package Manager**: pnpm 9.15.0
- **Build System**: Turbo 2.3.3
- **Language**: TypeScript 5.7.2
- **Linter/Formatter**: Biome 1.9.4
- **Web**: Next.js 15.1.4 + React 19
- **CLI**: Citty 0.1.6 + Bun runtime

## Project Structure

```
cw-hackathon-3/
├── apps/
│   └── web/              # Next.js web application
└── packages/
    └── data/             # CLI tool with Citty
```

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 9.0.0
- Bun (for CLI development)

### Installation

Install pnpm if you haven't already:

```bash
npm install -g pnpm@9.15.0
```

Install Bun:

```bash
curl -fsSL https://bun.sh/install | bash
```

### Install Dependencies

```bash
pnpm install
```

### Development

Run all dev servers:

```bash
pnpm dev
```

Or run specific workspaces:

```bash
# Next.js web app (http://localhost:3000)
pnpm --filter @cw-hackathon/web dev

# CLI in watch mode
pnpm --filter @cw-hackathon/data dev
```

### Build

Build all workspaces:

```bash
pnpm build
```

### CLI Usage

```bash
cd packages/data

# Run from source
bun run src/bin/cli.ts hello
bun run src/bin/cli.ts hello --name="Developer" --loud
```

## Available Commands

### Root Commands

- `pnpm install` - Install all dependencies
- `pnpm dev` - Run all dev servers
- `pnpm build` - Build all workspaces
- `pnpm lint` - Run linting
- `pnpm format` - Format code with Biome
- `pnpm check` - Lint and auto-fix with Biome
- `pnpm type-check` - Type check all workspaces

### Workspace-Specific Commands

```bash
# Run command in specific workspace
pnpm --filter <workspace-name> <command>

# Examples
pnpm --filter @cw-hackathon/web dev
pnpm --filter @cw-hackathon/data build
```

## Workspaces

### apps/web

Next.js 15 web application with React 19 and TypeScript.

**Development:**
```bash
pnpm --filter @cw-hackathon/web dev
```

Visit http://localhost:3000

### packages/data

CLI tool using Citty framework, runs with Bun.

**Development:**
```bash
cd packages/data
bun run src/bin/cli.ts <command>
```

**Commands:**
- `hello [name]` - Say hello (use `--loud` flag for emphasis)

## Code Quality

This project uses Biome for both linting and formatting.

```bash
# Auto-fix issues and format
pnpm check

# Format only
pnpm format
```

## Documentation

- [CLAUDE.md](./CLAUDE.md) - Detailed AI assistant context and development guide
- [docs/](./docs/) - Additional documentation
- [docs/prds/](./docs/prds/) - Product requirement documents

## Project Conventions

- **Workspace naming**: `@cw-hackathon/<name>`
- **TypeScript**: Strict mode enabled
- **Module system**: ESM (type: module)
- **Internal dependencies**: Use `workspace:*` protocol
- **Formatting**: Biome (not Prettier/ESLint)

## Adding New Workspaces

### New App

```bash
mkdir apps/new-app
cd apps/new-app
# Create package.json with @cw-hackathon/new-app
cd ../..
pnpm install
```

### New Package

```bash
mkdir packages/new-package
cd packages/new-package
# Create package.json with @cw-hackathon/new-package
cd ../..
pnpm install
```

Workspaces are automatically discovered via `pnpm-workspace.yaml` globs.

## Troubleshooting

### pnpm install fails

Ensure you have the correct pnpm version:

```bash
pnpm --version  # Should be 9.15.0 or higher
npm install -g pnpm@9.15.0
```

### Type errors in workspace packages

Build packages first:

```bash
pnpm build
```

### Clean everything

```bash
rm -rf node_modules apps/*/node_modules packages/*/node_modules
rm -rf .turbo apps/*/.next packages/*/dist
pnpm install
pnpm build
```

## License

MIT
