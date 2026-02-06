# CW Hackathon Monorepo - AI Assistant Context

## Monorepo Overview

This is a Turbo-powered monorepo using pnpm workspaces for a hackathon project.

### Technology Stack

- **Package Manager**: pnpm 9.15.0 with workspaces
- **Build System**: Turbo 2.3.3 for task orchestration and caching
- **Language**: TypeScript 5.7.2 with strict mode enabled
- **Linter/Formatter**: Biome 1.9.4 (replaces ESLint + Prettier)
- **Web Framework**: Next.js 15.1.4 with React 19
- **UI Frameworks**:
  - **Tailwind CSS v4.1.18** - CSS-first configuration (v4 ONLY, no v3!)
  - **HeroUI v3.0.0-beta.5** - React Aria-based component library
  - **shadcn/ui** - Accessible components built with Radix UI
- **CLI Framework**: Citty 0.1.6 (lightweight, TypeScript-first)
- **CLI Runtime**: Bun (fast startup, native TypeScript support)

## Tailwind CSS v4 - Critical Rules

**⚠️ IMPORTANT:** This project uses **Tailwind CSS v4 ONLY**. Do NOT use v3 patterns or create `tailwind.config.ts` files.

### Core Principles

1. **CSS-First Configuration** - All configuration in `globals.css`, NO JavaScript config files
2. **@source Directives** - Required to scan files for classes (replaces v3's `content` array)
3. **@theme inline** - Define custom properties and theme mappings
4. **No tailwind.config.ts** - Delete any v3 config files immediately

### ✅ RIGHT (Tailwind v4)

```css
/* apps/web/app/globals.css */
@custom-variant dark (&:is(.dark *));

@import "tailwindcss";

/* Scan source files */
@source "./app/**/*.{ts,tsx}";
@source "./components/**/*.{ts,tsx}";
@source "./lib/**/*.{ts,tsx}";

/* Theme configuration */
@theme inline {
  --color-primary: var(--primary);
  --color-border: var(--border);
  --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
}

:root {
  --primary: oklch(0.648 0.2 131.684);
  --border: oklch(0.88 0 0);
}
```

### ❌ WRONG (Tailwind v3 - DO NOT USE)

```js
// tailwind.config.ts - DELETE THIS FILE!
export default {
  content: ['./app/**/*.{ts,tsx}'],  // v3 pattern
  theme: {
    extend: {
      colors: {
        primary: '#00ff00',  // v3 pattern
      },
    },
  },
};
```

### Key Differences: v3 vs v4

| Feature | v3 (WRONG) | v4 (CORRECT) |
|---------|------------|--------------|
| **Config file** | `tailwind.config.ts` | None - delete it! |
| **Content scanning** | `content: [...]` array | `@source` directives in CSS |
| **Theme** | JavaScript `theme.extend` | `@theme inline` in CSS |
| **Imports** | Often in PostCSS | `@import "tailwindcss"` in CSS |
| **Colors** | Hex/RGB strings | `oklch()` color space recommended |

### Common Mistakes to Avoid

#### ❌ WRONG: Creating a config file
```bash
# DO NOT RUN THIS
npx tailwindcss init
```
**Why:** Creates `tailwind.config.ts` which v4 doesn't use.

#### ❌ WRONG: Forgetting @source directives
```css
@import "tailwindcss";
/* Missing @source - NO CLASSES WILL GENERATE! */
```
**Why:** Tailwind v4 won't scan any files without `@source` directives.

#### ❌ WRONG: Wrong import order
```css
@import "tailwindcss";
@custom-variant dark (&:is(.dark *));  /* Too late! */
```
**Why:** Custom variants must come BEFORE the Tailwind import.

#### ❌ WRONG: Using v3 color syntax
```css
@theme inline {
  --color-primary: #00ff00;  /* Wrong! */
}
```
**Why:** Use CSS variables that reference `:root` values: `--color-primary: var(--primary)`.

### ✅ RIGHT: Complete Setup Checklist

1. **No config file** - Delete `tailwind.config.ts` if it exists
2. **PostCSS setup** - `@tailwindcss/postcss` in `postcss.config.mjs`
3. **CSS imports** - `@import "tailwindcss"` at top of `globals.css`
4. **@source directives** - Scan all component directories
5. **@theme inline** - Map CSS variables to Tailwind utilities
6. **Color variables** - Define in `:root` and `.dark` using `oklch()`

### shadcn/ui + Tailwind v4 Requirements

When using shadcn/ui components, you MUST define these in `@theme inline`:

```css
@theme inline {
  /* Shadow variables - REQUIRED for shadcn components */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);

  /* Color mappings - REQUIRED for utility classes */
  --color-border: var(--border);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  /* ... etc */
}
```

**Why:** shadcn components use `shadow` class (not `shadow-sm`), which Tailwind v4 doesn't provide by default.

### Reference Documentation

- **Tailwind v4 Setup**: [docs/tailwind-setup.md](./docs/tailwind-setup.md)
- **Official Docs**: [tailwindcss.com/docs](https://tailwindcss.com/docs)
- **Demo Page**: [/ops/demo](http://localhost:3001/ops/demo) - Verify setup works

### Workspace Structure

```
cw-hackathon-3/
├── apps/
│   └── web/              # Next.js 15 web application
└── packages/
    ├── ui/               # Shared UI components (@cw-hackathon/ui)
    └── data/             # CLI tool using Citty, runs with Bun
```

## Component Library Strategy

This project uses a hierarchical approach to UI components. Follow this decision tree when building UI.

### Component Library Priority

When implementing UI features, use components in this order of preference:

1. **HeroUI** (Primary) - Interactive components with built-in accessibility
   - Buttons, Inputs, Modals, Cards, Tables, Navigation
   - Best for: Standard UI patterns, forms, navigation
   - Import: `import { Button, Card } from "@heroui/react"`

2. **ai-elements** (AI Features) - Chat/conversation interfaces
   - Message, Conversation, ChainOfThought, CodeBlock, PromptInput
   - Best for: Chat UI, AI responses, streaming content
   - Install: `npx ai-elements@latest add <component>`
   - See: `.agents/skills/ai-elements/` for component docs

3. **@cw-hackathon/ui** (Shared Primitives) - Base shadcn/ui components
   - Button, Card, Badge, Tabs, Dialog, Table, Input, Select
   - Best for: Consistent primitives across apps, customization needs
   - Import: `import { Button, Card } from "@cw-hackathon/ui"`

4. **KiboUI** (Specialized) - Complex specialized components
   - Kanban, Gantt, Calendar, Code Editor, File Tree, Markdown Editor
   - Best for: Rich interactive widgets not in HeroUI
   - Install: Copy from https://www.kibo-ui.com/docs/usage
   - Consider when: Building project management, code editing, file browsing

### When to Use Each Library

| Use Case | Library | Why |
|----------|---------|-----|
| Form elements | HeroUI | Built-in validation, accessibility |
| Chat/AI interface | ai-elements | Optimized for streaming, AI patterns |
| Base primitives | @cw-hackathon/ui | Shared across apps, customizable |
| Kanban/Calendar | KiboUI | Specialized features |
| Custom component | packages/ui | Reusable, type-safe |

### Where to Put New Components

**Put in `packages/ui`** (PREFERRED):
- Reusable across multiple apps
- Design system primitives
- Components you might demo or document
- Anything that could go in a Storybook later
- Examples: Button variants, Cards, Form controls, Layout components

**Put in `apps/web/components`** (ONLY when app-specific):
- Tightly coupled to app routes/data
- Uses app-specific hooks or context
- Not reusable outside this app
- Examples: PageHeader with app navigation, FeatureSpecificWidget

**Rule of thumb:** When in doubt, put it in `packages/ui`. It's easier to use an existing package component than to migrate one later.

### packages/ui Organization

```
packages/ui/src/
├── components/           # Flat structure, alphabetically sorted
│   ├── button.tsx        # CVA-based with variants
│   ├── card.tsx          # Card + CardHeader/Content/Footer
│   ├── dialog.tsx        # Modal/Dialog
│   ├── input.tsx         # Text input
│   ├── tabs.tsx          # Tab navigation
│   ├── typing-indicator.tsx  # Loading dots animation
│   └── index.ts          # Barrel export
├── hooks/                # Shared hooks
│   └── index.ts
├── utils/
│   ├── cn.ts             # Class name utility (clsx + tailwind-merge)
│   └── index.ts
├── globals.css           # Design tokens and theme
└── index.ts              # Main package export
```

### Using packages/ui

```tsx
// Import components
import { Button, Card, CardContent, TypingIndicator } from "@cw-hackathon/ui";

// Import utilities
import { cn } from "@cw-hackathon/ui";

// Use in components
<Card>
  <CardContent>
    <Button variant="default">Click me</Button>
  </CardContent>
</Card>
```

### Component Patterns

All components in packages/ui follow these patterns:

1. **CVA for variants** - Use class-variance-authority
   ```tsx
   const buttonVariants = cva("base-classes", {
     variants: { variant: { default: "...", secondary: "..." } }
   });
   ```

2. **forwardRef** - Support DOM refs
   ```tsx
   const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(...)
   ```

3. **Export variants too** - Allow styling without wrapping
   ```tsx
   export { Button, buttonVariants };
   ```

4. **Tailwind-first** - Use utility classes, avoid CSS modules
5. **CSS variables** - Reference design tokens from globals.css

### Optimistic UI Patterns (Critical for Chat)

When building conversational interfaces, follow these patterns from `docs/prds/intake-chat-ui.md`:

1. **Show next question immediately** - Don't wait for LLM reflection
2. **Protect user input** - Never overwrite current input when async content resolves
3. **Typing indicators** - Show TypingIndicator while waiting
4. **fadeInUp animation** - Smooth transitions for new content

```tsx
// Optimistic pattern example
async function handleSubmit() {
  // 1. Immediately update UI
  addMessage({ type: 'answer', content: currentAnswer });
  addMessage({ type: 'reflection', content: null }); // Loading

  // 2. Show next question immediately (if known)
  if (nextQuestionKnown) {
    addMessage({ type: 'question', content: nextQuestion.prompt });
  }

  // 3. Fetch reflection in background
  const response = await submitAnswer();

  // 4. Update reflection when ready (don't touch user's current input!)
  updateMessage(pendingReflectionIndex, { content: response.reflection });
}
```

### Installing ai-elements Components

```bash
# Install a specific component
npx ai-elements@latest add message
npx ai-elements@latest add conversation
npx ai-elements@latest add chain-of-thought

# Components are copied to components/ai-elements/
```

### Design System Colors

The design system uses Anthropic-inspired colors:

```css
/* Primary palette */
--anthropic-orange: #d97757   /* Primary actions */
--anthropic-blue: #6a9bcc     /* Secondary, info */
--anthropic-green: #788c5d    /* Success, accent */
--anthropic-dark: #141413     /* Text, headings */
--anthropic-light: #faf9f5    /* Backgrounds */

/* Use via Tailwind */
.bg-primary        /* Orange */
.bg-secondary      /* Blue */
.bg-accent         /* Green */
.text-foreground   /* Dark */
.bg-background     /* Light */
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
    ├── ui/                       # Shared UI components
    │   ├── package.json
    │   ├── tsconfig.json
    │   └── src/
    │       ├── index.ts          # Main package export
    │       ├── components/       # UI components (button, card, etc.)
    │       ├── hooks/            # Shared React hooks
    │       ├── utils/            # Utilities (cn function)
    │       └── globals.css       # Design system tokens
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

### Initial Setup

After cloning the repository, run the interactive setup wizard:

```bash
pnpm env:setup
```

This will configure environment variables for LLM provider and development settings. The wizard will:
- Prompt for LLM provider selection (Claude Code or W&B Inference)
- Configure API keys and project settings
- Set the development server port (default: 3010)
- Create `.env.local` and `.env` files for both workspaces

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

### Quality Gates (Automated Checks)

The project uses automated quality gates to prevent broken code from being committed or pushed.

**Pre-Commit (Tier 1)** - Runs automatically before every commit:
- Formats and lints staged files with Biome
- Fast checks (~5-10 seconds)
- Auto-fixes most issues

**Pre-Push (Tier 2)** - Runs automatically before every push:
- Type checks all workspaces
- Builds all workspaces for production
- Catches build failures and type errors (~30-60 seconds)

**Bypass hooks (emergency only):**
```bash
git commit --no-verify  # Skip pre-commit
git push --no-verify    # Skip pre-push
```

⚠️ **Important:** Only bypass hooks in emergencies. They prevent broken builds from reaching the repository.

**See:** [docs/quality-gates.md](./docs/quality-gates.md) for detailed documentation.

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

### React and Next.js Best Practices

For detailed React development patterns, performance optimization, and component design guidelines, see:
- **[docs/react-best-practices.md](./docs/react-best-practices.md)** - Comprehensive guide covering:
  - Performance optimization (async waterfalls, bundle size, re-renders)
  - When NOT to use `useEffect`
  - Server vs Client Components
  - Data fetching patterns
  - State management
  - Component design patterns

**Key highlights for this project:**
- Default to Server Components for initial data loading
- Avoid `useEffect` for data transformation or event handling
- Use Server Actions for mutations
- Parallelize independent async operations with `Promise.all()`
- Calculate derived state during rendering, not in effects

### UI Icons - NEVER Use Emojis

**CRITICAL RULE:** Never use emoji characters in the UI. Always use Lucide React icons instead.

**Why:**
- Emojis render inconsistently across platforms and browsers
- Emojis don't match the professional design aesthetic
- SVG icons are more accessible and customizable
- Icons can be styled with Tailwind classes (size, color, etc.)

**Correct pattern:**
```tsx
import { ClipboardList, FileText, Check, FlaskConical } from "lucide-react";

// Header icons
<ClipboardList className="h-6 w-6 text-primary" />

// Checkmarks
<Check className="h-4 w-4 text-accent" />

// Demo/test pages
<FlaskConical className="h-6 w-6 text-muted-foreground" />
```

**Icon mappings (emoji -> Lucide):**
| Instead of | Use |
|------------|-----|
| 📋 | `<ClipboardList />` |
| 📝 | `<FileText />` or `<StickyNote />` |
| ✓ ✔ | `<Check />` or `<CheckCircle />` |
| 🧪 | `<FlaskConical />` or `<TestTube2 />` |
| ✨ | `<Sparkles />` |
| 🎯 | `<Target />` |
| 🚀 | `<Rocket />` |
| 🎉 | Use confetti animation, not emoji |

**See:** [docs/design-guidelines.md](./docs/design-guidelines.md) for complete icon usage guide.

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

# Weights & Biases Weave Tracing (optional)
WANDB_API_KEY=your-wandb-api-key
WEAVE_PROJECT=your-team/your-project
```

Never commit `.env.local` - it's gitignored.

See `apps/web/.env.example` for all available options.

### packages/data

Create `.env` for local CLI development:

```env
# Weights & Biases Weave Tracing
WANDB_API_KEY=your-wandb-api-key
WEAVE_PROJECT=your-team/your-project
```

Run CLI with env file:
```bash
cd packages/data
bun --env-file=.env run src/bin/cli.ts dap generate ...
```

See `packages/data/.env.example` for all available options.

**Weave Tracing**: Set `WEAVE_PROJECT` (or `WANDB_PROJECT` or `CORE_WEAVE`) to enable W&B Weave tracing for LLM calls. Also requires `WANDB_API_KEY` for authentication.

## Why These Tools?

**Turbo**: Fast builds with intelligent caching, parallel execution

**pnpm**: Efficient disk usage, fast installs, strict dependency resolution

**Biome**: Single tool for linting + formatting, faster than ESLint + Prettier

**Bun**: Fast CLI startup, native TypeScript support, Node.js compatible

**Citty**: Lightweight CLI framework, TypeScript-first, easy to use

**Next.js 15**: Latest React features, App Router, server components

## Quick Reference

```bash
# Initial setup (configure env vars)
pnpm env:setup

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

## Chrome DevTools Debugging

### Overview

The `/chrome-devtools` skill enables real-time browser debugging with Claude Code through the Chrome DevTools Protocol. This allows you to inspect actual Chrome browser tabs, capture console errors, inspect DOM, monitor network requests, and debug issues without screenshots or copy-pasting.

### What This Enables

- ✅ Connect to actual Chrome browser tabs
- ✅ Capture console errors automatically
- ✅ Inspect DOM elements and network requests
- ✅ Take screenshots of current state
- ✅ Execute JavaScript in page context
- ✅ Real-time debugging with Claude Code

### When to Use

Use the `/chrome-devtools` skill when:
- You see errors in the browser console that need investigation
- You need to debug rendering issues or hydration errors
- You want to inspect network requests and responses
- You're testing the web app and need Claude to see what's happening
- You want to avoid taking screenshots and copying error messages manually

### Quick Start

```bash
# 1. Set up Chrome debugging (run once, or after closing debug Chrome)
/chrome-devtools setup

# 2. Navigate to your app in the debug Chrome window
# Example: http://localhost:3000/intake/demo

# 3. Restart Claude Code to load the MCP server

# 4. Debug the current tab
/chrome-devtools debug
```

### Available Commands

- `/chrome-devtools setup` - Configure and launch debug Chrome automatically
- `/chrome-devtools debug` - Inspect current Chrome tab and debug errors
- `/chrome-devtools info` - Display status and usage information

### Example Usage

**Debugging a page:**
```
/chrome-devtools setup
[Navigate to http://localhost:3000/intake/demo]
[Restart Claude Code]
/chrome-devtools debug
```

Claude will automatically:
- List available Chrome tabs
- Find your localhost tab
- Inspect console errors
- Analyze the DOM
- Suggest fixes

**Investigating an error:**
```
User: "There's an error on the intake demo page"
Assistant: /chrome-devtools debug
[Claude inspects the tab and reports exact errors with line numbers]
[Claude suggests specific fixes based on the error]
```

### How It Works

1. **Debug Chrome runs on port 9222** with DevTools Protocol enabled
2. **MCP Server connects** to the debug endpoint at http://localhost:9222
3. **Claude Code uses MCP tools** to inspect tabs, read console, execute JS, etc.
4. **Separate profile** (`~/.chrome-debug-profile`) keeps your debugging isolated

### Requirements

- Chrome browser installed
- Node.js 22+ (for MCP server)
- Port 9222 available (close regular Chrome before launching debug Chrome)

### Troubleshooting

**Port already in use:**
- Debug Chrome is already running - use the existing instance
- Or close it and run setup again

**MCP not loading:**
- Ensure debug Chrome is running: visit http://localhost:9222/json
- Restart Claude Code after running setup
- Check Claude Code logs for MCP connection errors

**Can't find tabs:**
- Make sure you navigated to your app in the debug Chrome window (not regular Chrome)
- The MCP server only sees tabs in the debug Chrome instance

### Documentation

For comprehensive details, see [docs/chrome-devtools-mcp.md](./docs/chrome-devtools-mcp.md):
- Detailed setup instructions
- MCP tool reference
- Security considerations
- Comparison with other browser tools
- Best practices
