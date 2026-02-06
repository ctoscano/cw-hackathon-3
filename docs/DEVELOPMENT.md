# Development Guide

This guide covers how to develop in this monorepo, with a focus on the AI-assisted workflow using Claude Code. If you're new to the project, start here.

## Table of Contents

- [Quick Start](#quick-start)
- [How We Build Features](#how-we-build-features)
- [Claude Code Skills](#claude-code-skills)
- [Project Architecture](#project-architecture)
- [Key Patterns and Conventions](#key-patterns-and-conventions)
- [Working with the CLI](#working-with-the-cli)
- [Testing and Quality](#testing-and-quality)
- [Debugging](#debugging)
- [Common Workflows](#common-workflows)

---

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 9.15.0 (`npm install -g pnpm@9.15.0`)
- Bun (`curl -fsSL https://bun.sh/install | bash`)
- Claude Code CLI (for AI-assisted development)

### First-Time Setup

```bash
# 1. Clone the repo
git clone <repo-url> && cd cw-hackathon-3

# 2. Install dependencies
pnpm install

# 3. Configure environment variables (interactive wizard)
pnpm env:setup

# 4. Start all dev servers
pnpm dev
```

The setup wizard (`pnpm env:setup`) will prompt you to configure:
- **LLM provider**: Claude Code or W&B Inference
- **API keys**: For whichever provider you choose
- **Dev server port**: Defaults to 3010

### What's Running After `pnpm dev`

| Service | URL | Description |
|---------|-----|-------------|
| Web app | http://localhost:3000 | Next.js 15 application |
| Storybook | http://localhost:6006 | Component explorer (run `pnpm storybook` separately) |

---

## How We Build Features

This project uses a **PRD-driven development workflow** where every significant feature starts as a Product Requirement Document and progresses through defined states. Claude Code assists at every stage.

### The Workflow

```
1. Plan    ──→  2. Implement  ──→  3. Review  ──→  4. Accept/Reject
(/prd plan)    (/prd start)      (/prd end)      (/prd accept)
```

**Step 1 — Plan**: Describe what you want to build. Claude Code creates a structured PRD from the template at `docs/templates/prd-template.md`, covering purpose, constraints, technical requirements, and implementation steps.

**Step 2 — Implement**: Work through the PRD steps. Claude Code tracks progress with implementation notes and timestamps. Use `/prd start` to log progress.

**Step 3 — Review**: When implementation is complete, `/prd end` runs quality gates (type check + build) and marks the PRD as pending review. You verify the feature works.

**Step 4 — Accept or Reject**: After testing, run `/prd accept` to finalize or `/prd reject` to send it back for more work.

### PRD States

| State | Meaning |
|-------|---------|
| **Draft** | PRD created, not started |
| **In Progress** | Implementation underway |
| **Pending Review** | Code complete, quality gates passed, awaiting verification |
| **Accepted** | Verified and approved |

### Example: Building a New Feature

```
You: I want to add a user profile page with avatar upload

Claude: /prd plan
→ Creates docs/prds/user-profile-page.md with structured requirements
→ Discusses scope, constraints, and implementation steps

You: Looks good, let's start

Claude: /prd start
→ Begins implementation, logging progress
→ Creates components, routes, API endpoints

You: I think it's done

Claude: /prd end
→ Runs pnpm type-check and pnpm build
→ Marks PRD as pending review
→ Provides demo instructions

You: (tests it) — works great

Claude: /prd accept
→ Marks PRD as accepted with timestamp
```

### Where PRDs Live

- **PRDs**: `docs/prds/<feature-name>.md`
- **Template**: `docs/templates/prd-template.md`
- **Context tracking**: `.claude/prd-context.json` (gitignored, tracks active PRD)

---

## Claude Code Skills

Skills are slash commands that extend Claude Code with project-specific capabilities. This project has three skills.

### `/prd` — PRD Management

Manages the full lifecycle of Product Requirement Documents.

| Command | What It Does |
|---------|--------------|
| `/prd plan` | Create a new PRD from the template |
| `/prd start` | Log implementation progress on the active PRD |
| `/prd end` | Run quality gates and mark PRD as pending review |
| `/prd accept` | Accept the PRD after you've verified it works |
| `/prd reject` | Reject and return to in-progress state |
| `/prd status` | Show current PRD state and context |

**When to use**: Any feature that involves more than a quick fix. The PRD creates a shared understanding of requirements before code is written.

**Quality gates on `/prd end`**:
- `pnpm type-check` must pass
- `pnpm build` must pass
- Demo instructions must be included

### `/evaluate` — AI Pipeline Evaluation

Self-evaluates AI pipeline outputs and suggests improvements. Supports two pipelines.

| Command | What It Does |
|---------|--------------|
| `/evaluate run [pipeline]` | Run a full evaluation of the pipeline's outputs |
| `/evaluate review [pipeline]` | Review the most recent evaluation results |
| `/evaluate iterate [pipeline]` | Apply suggested improvements to prompts |

**Supported pipelines**:

| Pipeline | ID | What It Evaluates |
|----------|----|-------------------|
| DAP Notes | `dap` | Clinical documentation generated from session descriptions |
| Intake Questionnaire | `intake` | Reflections and completion outputs from the intake flow |

**How pipeline detection works**: If you don't specify a pipeline, the skill looks at recently modified files and recent conversation context to infer which pipeline you're working on. You can always be explicit: `/evaluate run dap`.

**Example workflow**:
```
# Generate test data
cd packages/data
bun run src/bin/cli.ts intake synthetic

# Evaluate the outputs
/evaluate run intake
→ Scores outputs across 8 dimensions (empathic accuracy, normalization, etc.)
→ Suggests specific prompt improvements

# Apply improvements
/evaluate iterate intake
→ Modifies prompt files based on evaluation feedback

# Re-evaluate to measure improvement
/evaluate run intake
```

**Evaluation criteria**:
- **DAP Notes**: Completeness (20%), Accuracy (25%), Clinical Appropriateness (20%), Insurance Compliance (20%), Actionability (15%)
- **Intake**: Reflection Quality (50%) + Completion Output Quality (50%), broken into 8 sub-dimensions

### `/chrome-devtools` — Browser Debugging

Connects Claude Code to a Chrome browser for real-time debugging.

| Command | What It Does |
|---------|--------------|
| `/chrome-devtools setup` | Launch a debug Chrome instance on port 9222 |
| `/chrome-devtools debug` | Inspect the current tab — console errors, DOM, network |
| `/chrome-devtools info` | Show status and connection info |

**When to use**: When you need to debug rendering issues, console errors, or network requests without manually copying error messages.

**Setup flow**:
1. Run `/chrome-devtools setup` (launches Chrome with debugging protocol)
2. Navigate to your app in the debug Chrome window
3. Restart Claude Code (so the MCP server connects)
4. Run `/chrome-devtools debug` to start inspecting

**Note**: This uses a separate Chrome profile at `~/.chrome-debug-profile` and requires port 9222 to be available.

---

## Project Architecture

### Monorepo Structure

```
cw-hackathon-3/
├── apps/
│   ├── web/                 # Next.js 15 web application
│   └── storybook/           # Storybook 10 component explorer
├── packages/
│   ├── ui/                  # Shared UI component library (@cw-hackathon/ui)
│   └── data/                # CLI tool + AI pipeline logic (@cw-hackathon/data)
├── docs/
│   ├── prds/                # Product Requirement Documents
│   └── templates/           # PRD template
└── .claude/
    └── skills/              # Claude Code skills (prd, evaluate)
```

### Key Applications

**`apps/web`** — The main Next.js 15 application. Contains:
- `/intake` — Guided therapy intake questionnaire (chat-style UI)
- `/dap` — DAP notes generation interface
- `/ops` — Operations dashboard (Redis data viewer)
- `/ops/demo` — Component demo page

**`apps/storybook`** — Storybook 10 for developing and browsing UI components in isolation.

**`packages/ui`** — Shared React component library. All reusable components live here (not in `apps/web/components`). See [CLAUDE.md](../CLAUDE.md) for the full component inventory.

**`packages/data`** — CLI tool and AI pipeline logic. Contains:
- CLI commands (hello, dap, intake, setup)
- Prompt templates with versioning (v1, v2, v3)
- Synthetic data generation
- Evaluation logic

### Component Library Priority

When building UI, use libraries in this order:

1. **HeroUI** — Standard interactive components (buttons, inputs, modals)
2. **@cw-hackathon/ui** — Shared design system primitives, chat components, animations
3. **ai-elements** — New AI interaction patterns only (check `@cw-hackathon/ui` first)
4. **KiboUI** — Specialized widgets (kanban, calendar, code editor)

**Rule of thumb**: If it's reusable, put it in `packages/ui`. If it's tightly coupled to a specific route, put it in `apps/web/components`.

---

## Key Patterns and Conventions

### Tailwind CSS v4 (Not v3)

This project uses **Tailwind CSS v4**, which is CSS-first. There are no JavaScript config files.

**The rules**:
- No `tailwind.config.ts` — delete it if you see one
- All configuration lives in CSS files using `@theme inline`, `@source`, and `@custom-variant`
- Colors use `oklch()` color space
- `@source` directives are required or classes won't generate

See [CLAUDE.md](../CLAUDE.md#tailwind-css-v4---critical-rules) for detailed v3 vs v4 comparison and common mistakes.

### No Emojis in UI

Use Lucide React icons instead of emoji characters. Emojis render inconsistently and don't match the design aesthetic.

```tsx
// Wrong
<span>📋 Tasks</span>

// Right
import { ClipboardList } from "lucide-react";
<ClipboardList className="h-5 w-5" />
```

### LLM Provider Switching

The project supports two LLM providers, configured via the `LLM_PROVIDER` environment variable:

| Provider | Value | Models |
|----------|-------|--------|
| Claude Code | `claude-code` | Sonnet (large), Haiku (small) |
| W&B Inference | `wandb-inference` | GPT-120B (large), GPT-20B (small) |

Use `pnpm env:setup` to switch providers. Code references model tiers (`large`/`small`) rather than specific model names.

### Optimistic UI in Chat

The intake flow uses optimistic UI patterns to minimize perceived latency:
- Show the next question immediately (don't wait for reflection)
- Never overwrite the user's current input when async content resolves
- Use typing indicators while waiting for LLM responses
- Animate new content with `fadeInUp`

### State Management for Multi-Step Flows

Use key-based state (`Map<questionId, answer>`) rather than array-based state. This prevents race conditions and data loss when async operations complete out of order. See `docs/prds/intake-data-integrity.md` for the full story.

---

## Working with the CLI

The CLI lives in `packages/data` and runs on Bun.

### Running Commands

```bash
cd packages/data

# Run from source (no build needed)
bun run src/bin/cli.ts <command> [options]

# Available commands
bun run src/bin/cli.ts hello              # Test command
bun run src/bin/cli.ts hello --loud       # With flags
bun run src/bin/cli.ts dap generate       # Generate DAP notes
bun run src/bin/cli.ts dap synthetic      # Generate synthetic session data
bun run src/bin/cli.ts intake synthetic   # Generate synthetic intake data
bun run src/bin/cli.ts intake evaluate    # Evaluate intake outputs
bun run src/bin/cli.ts setup              # Interactive env setup
```

### Prompt Versioning

Prompts are organized by version in `packages/data/src/prompts/`:

```
prompts/
├── dap-notes/           # DAP note generation prompts
│   ├── system.md
│   └── user.md
├── intake/
│   ├── v1/              # Initial prompts
│   ├── v2/              # Improved based on evaluation
│   └── v3/              # Further refinements
│       ├── manifest.md  # Version metadata
│       ├── reflection-system.md
│       ├── reflection-user.md
│       ├── completion-system.md
│       └── completion-user.md
└── evaluation/          # Evaluation prompts
```

Each version has a `manifest.md` documenting what changed and why. Use `/evaluate` to compare versions.

---

## Testing and Quality

### Automated Quality Gates

The project enforces quality at two levels:

**Pre-Commit (Tier 1)** — Runs on every `git commit`:
- Biome formats and lints staged files
- Auto-fixes most issues
- Takes ~5-10 seconds

**Pre-Push (Tier 2)** — Runs on every `git push`:
- Type checks all workspaces (`pnpm type-check`)
- Builds all workspaces for production (`pnpm build`)
- Takes ~30-60 seconds

### Manual Quality Checks

```bash
# Format all code
pnpm format

# Lint and auto-fix
pnpm check

# Type check
pnpm type-check

# Full build
pnpm build
```

### Bypass Hooks (Emergency Only)

```bash
git commit --no-verify -m "emergency fix"
git push --no-verify
```

Only use this when you have a clear reason. The hooks exist to prevent broken builds from reaching the repository.

### Evaluation as Testing

For AI pipelines, the `/evaluate` skill serves as the testing mechanism. It scores outputs against weighted criteria and identifies specific areas for improvement. The typical loop:

1. Generate synthetic test data
2. Run the pipeline on test data
3. `/evaluate run` to score outputs
4. `/evaluate iterate` to apply improvements
5. Repeat until scores are satisfactory

---

## Debugging

### Browser Debugging with Chrome DevTools

For frontend issues, use the `/chrome-devtools` skill (see [Skills section](#chrome-devtools--browser-debugging) above). This is faster than copying console errors or taking screenshots.

### Storybook for Component Development

```bash
pnpm storybook
# Visit http://localhost:6006
```

Develop and test components in isolation. Stories live next to their components in `packages/ui/src/components/`. See [CLAUDE.md](../CLAUDE.md#storybook) for story format and guidelines.

### Demo Pages

| Page | URL | Purpose |
|------|-----|---------|
| Component demo | `/ops/demo` | Verify Tailwind/component setup |
| Intake demo | `/intake/demo` | Test intake flow components |

---

## Common Workflows

### Adding a New UI Component

1. Create the component in `packages/ui/src/components/<name>.tsx`
2. Export it from `packages/ui/src/components/index.ts`
3. Use CVA for variants, forwardRef for refs, accept `className`
4. Optionally add a story file: `<name>.stories.tsx` next to the component
5. Import in your app: `import { MyComponent } from "@cw-hackathon/ui"`

### Adding a New Page Route

1. Create `apps/web/app/<route>/page.tsx`
2. Use Server Components by default for data loading
3. Add `"use client"` only for interactive components
4. Import shared components from `@cw-hackathon/ui`

### Adding a New CLI Command

1. Create `packages/data/src/commands/<name>.ts`
2. Define the command using Citty's `defineCommand`
3. Register it as a subcommand in `packages/data/src/index.ts`
4. Run with: `bun run src/bin/cli.ts <name>`

### Adding a New AI Pipeline

1. Create prompt files in `packages/data/src/prompts/<pipeline>/`
2. Add a reference file at `.claude/skills/evaluate/references/<pipeline>.md`
3. Register the pipeline in `.claude/skills/evaluate/SKILL.md`
4. Add CLI commands for generation and evaluation

### Deploying to Vercel

The web app deploys to Vercel. Key considerations:
- Bundle size must stay under 250 MB (see `docs/prds/vercel-bundle-optimization.md`)
- CLI code is separated from web exports to avoid bundling Bun dependencies
- Webpack cache is excluded from file tracing via `next.config.ts`

---

## Further Reading

| Document | What It Covers |
|----------|---------------|
| [CLAUDE.md](../CLAUDE.md) | Full AI assistant context, component library details, code conventions |
| [docs/react-best-practices.md](./react-best-practices.md) | Performance patterns, Server Components, avoiding useEffect |
| [docs/design-guidelines.md](./design-guidelines.md) | Color palette, typography, icon usage |
| [docs/tailwind-setup.md](./tailwind-setup.md) | Tailwind CSS v4 configuration reference |
| [docs/quality-gates.md](./quality-gates.md) | Pre-commit and pre-push hook details |
| [docs/chrome-devtools-mcp.md](./chrome-devtools-mcp.md) | Browser debugging setup and tool reference |
| [docs/prds/](./prds/) | All Product Requirement Documents |
