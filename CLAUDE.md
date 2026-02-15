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

## Claude Code Skills

This project extends Claude Code with custom slash commands (skills). Use these during development:

| Skill | Usage | Purpose |
|-------|-------|---------|
| `/prd` | `/prd plan\|start\|end\|accept\|reject\|status` | Manage PRDs — create requirements, track implementation, run quality gates |
| `/evaluate` | `/evaluate run\|review\|iterate [dap\|intake]` | Score AI pipeline outputs and iterate on prompts |
| `/chrome-devtools` | `/chrome-devtools setup\|debug\|info` | Connect to Chrome for real-time browser debugging |

**Development workflow**: Every significant feature uses `/prd plan` to define requirements, `/prd start` to track progress, `/prd end` to run quality gates, and `/prd accept` after verification. See [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md) for detailed skill documentation and examples.

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

2. **@cw-hackathon/ui** (Shared Design System) - Base primitives + chat + animations
   - Primitives: Button, Card, Badge, Tabs, Dialog, Table, Input, Select, Separator, Skeleton, Textarea
   - Chat: MessageBubble, QuestionMessage, AnswerMessage, ReflectionMessage, Markdown
   - Animation: TypingAnimation, TypingIndicator, BorderBeam
   - Best for: Consistent design across apps, chat/intake flows, loading states
   - Import: `import { Button, MessageBubble, TypingAnimation } from "@cw-hackathon/ui"`

3. **ai-elements** (New AI Features Only) - For features not yet built
   - Use for: Open-ended chat (Conversation, PromptInput), AI reasoning display (ChainOfThought), streaming code/math content (MessageResponse)
   - Do NOT use for: Intake flow, existing chat UI (custom components in @cw-hackathon/ui are a better fit)
   - Install: `npx ai-elements@latest add <component>`
   - Rule: Before installing an ai-elements component, check if @cw-hackathon/ui already handles the use case. Our custom components are simpler, have fewer dependencies, and match the design system.

4. **KiboUI** (Specialized) - Complex specialized components
   - Kanban, Gantt, Calendar, Code Editor, File Tree, Markdown Editor
   - Best for: Rich interactive widgets not in HeroUI
   - Install: Copy from https://www.kibo-ui.com/docs/usage
   - Consider when: Building project management, code editing, file browsing

### When to Use Each Library

| Use Case | Library | Why |
|----------|---------|-----|
| Form elements | HeroUI | Built-in validation, accessibility |
| Chat/intake messages | @cw-hackathon/ui | MessageBubble variants, tailored to our design |
| Loading/typing states | @cw-hackathon/ui | TypingAnimation, TypingIndicator, BorderBeam |
| Markdown rendering | @cw-hackathon/ui | Lightweight react-markdown wrapper |
| Base primitives | @cw-hackathon/ui | Shared across apps, customizable |
| NEW open-ended chat | ai-elements | Conversation, PromptInput, ChainOfThought |
| NEW streaming code/math | ai-elements | MessageResponse with syntax highlighting |
| Kanban/Calendar | KiboUI | Specialized features |

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
├── components/               # Flat structure, alphabetically sorted
│   ├── badge.tsx             # CVA variants
│   ├── border-beam.tsx       # Animated gradient border (motion)
│   ├── button.tsx            # CVA variants + sizes + asChild
│   ├── card.tsx              # Card + CardHeader/Content/Footer
│   ├── dialog.tsx            # Modal/Dialog
│   ├── input.tsx             # Text input
│   ├── markdown.tsx          # GFM markdown renderer
│   ├── message-bubble.tsx    # Chat bubbles (Question/Answer/Reflection)
│   ├── select.tsx            # Select dropdown
│   ├── separator.tsx         # Divider line
│   ├── skeleton.tsx          # Loading placeholder
│   ├── table.tsx             # Data table
│   ├── tabs.tsx              # Tab navigation
│   ├── textarea.tsx          # Multi-line text input
│   ├── typing-animation.tsx  # Text typing/deleting effect (motion)
│   ├── typing-indicator.tsx  # Pulsing dots loading indicator
│   └── index.ts              # Barrel export
├── hooks/                    # Shared hooks
│   └── index.ts
├── utils/
│   ├── cn.ts                 # Class name utility (clsx + tailwind-merge)
│   └── index.ts
├── globals.css               # Design tokens and theme
└── index.ts                  # Main package export
```

### Using packages/ui

```tsx
// Import components
import {
  Button, Card, CardContent, Badge,
  QuestionMessage, AnswerMessage, ReflectionMessage,
  TypingAnimation, TypingIndicator, BorderBeam, Markdown,
} from "@cw-hackathon/ui";

// Import utilities
import { cn } from "@cw-hackathon/ui";

// Primitives
<Card>
  <CardContent>
    <Button variant="default">Click me</Button>
  </CardContent>
</Card>

// Chat messages
<QuestionMessage questionNumber={1}>What is your name?</QuestionMessage>
<AnswerMessage>My name is Alice</AnswerMessage>
<ReflectionMessage>Great, thanks for sharing!</ReflectionMessage>

// Loading states
<TypingIndicator size="md" />
<TypingAnimation words={["Reflecting...", "Processing...", "Thinking..."]} />
```

### Component Patterns (Storybook-Ready by Default)

All components in `packages/ui` are written Storybook-ready. Good component design and Storybook-friendliness are the same thing — explicit props, sensible defaults, minimal side effects. Following these patterns costs nothing extra and means any component can get a story later without refactoring.

1. **CVA for variants** - Variants map directly to Storybook `argTypes` dropdowns
   ```tsx
   const buttonVariants = cva("base-classes", {
     variants: { variant: { default: "...", secondary: "..." } }
   });
   ```

2. **forwardRef** - Supports DOM refs, Storybook's measure addon, and interaction testing
   ```tsx
   const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(...)
   ```

3. **Export variants too** - Enables typed `args` in stories and styling without wrapping
   ```tsx
   export { Button, buttonVariants };
   ```

4. **Accept explicit props over context** - Props are directly controllable via Storybook Controls; context-dependent components require decorators
5. **Accept className** - Enables wrapper styling and Storybook decorators
6. **Define sensible defaults** - Components should render meaningfully with zero props
7. **Keep side effects minimal** - Pure presentational components work everywhere; data-fetching components need mocking
8. **Use composition over configuration** - Compound components (like Card) let consumers and stories show different layouts
9. **Tailwind-first** - Use utility classes, avoid CSS modules
10. **CSS variables** - Reference design tokens from globals.css

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

**Important:** ai-elements is for genuinely new AI interaction patterns only. Check @cw-hackathon/ui first — our custom MessageBubble, TypingAnimation, TypingIndicator, and Markdown cover the intake/chat use cases with fewer dependencies and better design system integration.

ai-elements components worth considering for **new features**:
- **PromptInput** — Open-ended chat input with file attachments, drag-drop
- **ChainOfThought / Reasoning** — Collapsible AI reasoning display
- **Conversation** — ChatGPT-style free-form chat container
- **MessageResponse** — Streaming markdown with code highlighting, math, mermaid

```bash
# Install a specific component (only when building new AI features)
npx ai-elements@latest add prompt-input
npx ai-elements@latest add chain-of-thought
npx ai-elements@latest add conversation

# Components are copied to components/ai-elements/
```

### Demo Pages vs Storybook

This project has both demo pages and Storybook. They serve different purposes:

| | Demo Pages (`/ops/demo`, `/intake/demo`) | Storybook (`localhost:6006`) |
|---|---|---|
| **Purpose** | Full-flow integration testing | Isolated component development |
| **Shows** | Complete features with real data flow | Individual components with controls |
| **When to use** | Testing end-to-end behavior, showcasing features | Iterating on component design, testing variants/states |
| **Requires** | Next.js dev server (`pnpm dev`) | Storybook dev server (`pnpm storybook`) |

Both are valuable — don't remove demo pages in favor of Storybook or vice versa.

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
├── CLAUDE.md              # This file - AI rules and context
├── README.md              # Project overview
├── docs/
│   ├── DEVELOPMENT.md     # Development guide (start here for onboarding)
│   ├── prds/              # PRDs with wave-number prefixes (01-, 02-, etc.)
│   └── templates/         # PRD template
├── .claude/
│   └── skills/            # Claude Code skills (prd, evaluate)
├── apps/
│   ├── web/               # Next.js 15 app (routes: /intake, /dap, /ops)
│   └── storybook/         # Storybook 10 component explorer
└── packages/
    ├── ui/                # Shared UI components (@cw-hackathon/ui)
    │   └── src/components/  # Flat structure, alphabetically sorted
    └── data/              # CLI + AI pipelines (@cw-hackathon/data)
        └── src/
            ├── commands/    # CLI commands (hello, dap, intake, setup)
            └── prompts/     # Versioned prompt templates (v1, v2, v3)
```

## Storybook

Run `pnpm storybook` to launch at http://localhost:6006. Stories are co-located with components in `packages/ui/src/components/*.stories.tsx`.

**Key rules:**
- Storybook 10 (ESM-only, essentials bundled into core) — do NOT install `@storybook/addon-essentials`
- Framework: `@storybook/react-vite` (not `nextjs-vite`)
- Story format: CSF3
- Tailwind v4 via `@tailwindcss/vite` dynamic import in `viteFinal`

**When to write a story:** When you're designing how something looks or feels. Skip for thin wrappers or data-wiring components.

See `apps/storybook/CLAUDE.md` for architecture details, story templates, and guidelines.

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

## Workspaces

| Workspace | Type | Dev Command | Notes |
|-----------|------|-------------|-------|
| `apps/web` | Next.js 15 + React 19 | `pnpm --filter @cw-hackathon/web dev` → http://localhost:3000 | App Router, Server Components |
| `apps/storybook` | Storybook 10 | `pnpm storybook` → http://localhost:6006 | Component explorer |
| `packages/ui` | Shared components | Consumed by apps | Design system, chat components |
| `packages/data` | CLI + AI pipelines | `cd packages/data && bun run src/bin/cli.ts <cmd>` | Runs on Bun |

See `packages/data/CLAUDE.md` for CLI commands, prompt versioning, and AI pipeline details.

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

## Turborepo Pipeline

Defined in `turbo.json`:

- **build**: Has outputs (`.next/**`, `dist/**`), depends on dependencies being built first
- **dev**: No caching, persistent (keeps running)
- **lint**: Depends on build
- **type-check**: Depends on build

## Adding Dependencies and Workspaces

```bash
# Add dependency to specific workspace
pnpm --filter @cw-hackathon/web add <package>

# Add root dev dependency
pnpm add -D <package> -w

# Use workspace protocol for internal packages
# In package.json: "@cw-hackathon/ui": "workspace:*"

# New workspaces: create in apps/ or packages/, name as @cw-hackathon/<name>
```

See [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md) for detailed workflows, environment variables, troubleshooting, and common tasks.

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

- **[docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md)** - Development guide, skills, workflows (start here for onboarding)
- **[docs/prds/](./docs/prds/)** - PRDs with wave-number prefixes for chronological ordering
- **[docs/react-best-practices.md](./docs/react-best-practices.md)** - React/Next.js patterns
- **[docs/design-guidelines.md](./docs/design-guidelines.md)** - Colors, typography, icons
- **[docs/chrome-devtools-mcp.md](./docs/chrome-devtools-mcp.md)** - Browser debugging
- **`packages/data/CLAUDE.md`** - CLI, prompt versioning, AI pipelines
- **`apps/storybook/CLAUDE.md`** - Storybook architecture and story guidelines

## Chrome DevTools Debugging

Use `/chrome-devtools setup` to launch a debug Chrome, then `/chrome-devtools debug` to inspect console errors, DOM, and network requests in real time. Requires Chrome + port 9222.

See [docs/chrome-devtools-mcp.md](./docs/chrome-devtools-mcp.md) for full setup and troubleshooting.
