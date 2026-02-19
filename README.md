# CW Hackathon 3 - Turbo Monorepo

A Turbo-powered monorepo for a therapy-tech hackathon project, built with AI-assisted development using Claude Code. Features a guided intake questionnaire, DAP notes generator, and operations dashboard.

## Tech Stack

- **Package Manager**: pnpm 9.15.0
- **Build System**: Turbo 2.3.3
- **Language**: TypeScript 5.7.2 (strict mode)
- **Linter/Formatter**: Biome 1.9.4
- **Web**: Next.js 15.1.4 + React 19
- **UI**: Tailwind CSS v4 + HeroUI v3 + shadcn/ui
- **CLI**: Citty 0.1.6 + Bun runtime
- **AI**: Vercel AI SDK v6 (Claude / W&B Inference)
- **Components**: Storybook 10

## Project Structure

```
cw-hackathon-3/
├── apps/
│   ├── web/                 # Next.js 15 web application
│   └── storybook/           # Storybook 10 component explorer
├── packages/
│   ├── ui/                  # Shared UI component library
│   └── data/                # CLI tool + AI pipeline logic
├── docs/
│   ├── DEVELOPMENT.md       # Development guide (start here)
│   ├── prds/                # Product Requirement Documents
│   └── templates/           # PRD template
└── .claude/
    └── skills/              # Claude Code skills (prd, evaluate)
```

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 9.15.0 (`npm install -g pnpm@9.15.0`)
- Bun (`curl -fsSL https://bun.sh/install | bash`)

### Setup

```bash
pnpm install          # Install dependencies
pnpm env:setup        # Configure environment variables (interactive)
pnpm dev              # Start all dev servers
```

Visit http://localhost:3000 for the web app, or run `pnpm storybook` for the component explorer at http://localhost:6006.

## Features

### Intake Questionnaire (`/intake`)
A guided, chat-style "Is Therapy Right for Me?" assessment with 9 questions, AI-generated reflections, and personalized completion outputs (brief, first session guide, experiments).

### DAP Notes Generator (`/dap`)
AI-powered clinical documentation — therapists describe a session and receive structured Data, Assessment, and Plan notes.

### Operations Dashboard (`/ops`)
Redis-backed dashboard for viewing submitted intake and DAP data.

### CLI Tools
```bash
cd packages/data
bun run src/bin/cli.ts dap generate      # Generate DAP notes
bun run src/bin/cli.ts dap synthetic     # Generate synthetic session data
bun run src/bin/cli.ts intake synthetic  # Generate synthetic intake data
bun run src/bin/cli.ts intake evaluate   # Evaluate intake outputs
```

## AI-Assisted Development

This project uses Claude Code with custom skills for a PRD-driven development workflow:

| Skill | Command | Purpose |
|-------|---------|---------|
| PRD Management | `/prd plan\|start\|end\|accept\|reject\|status` | Create and manage feature requirements |
| Evaluation | `/evaluate run\|review\|iterate [pipeline]` | Score AI outputs and improve prompts |
| Chrome DevTools | `/chrome-devtools setup\|debug\|info` | Real-time browser debugging |

Every feature starts as a PRD (`/prd plan`), progresses through implementation (`/prd start`), passes quality gates (`/prd end`), and gets verified (`/prd accept`).

**See [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md) for the full development guide**, including skill usage, architecture details, and common workflows.

## Available Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run all dev servers |
| `pnpm build` | Build all workspaces |
| `pnpm check` | Lint and auto-fix with Biome |
| `pnpm format` | Format code |
| `pnpm type-check` | Type check all workspaces |
| `pnpm storybook` | Launch Storybook component explorer |
| `pnpm env:setup` | Interactive environment configuration |

## Code Quality

Automated quality gates run on every commit and push:

- **Pre-commit**: Biome formats and lints staged files (~5-10s)
- **Pre-push**: Type check + production build (~30-60s)

See [docs/quality-gates.md](./docs/quality-gates.md) for details.

## Documentation

| Document | What It Covers |
|----------|---------------|
| [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md) | **Development guide — start here** |
| [CLAUDE.md](./CLAUDE.md) | AI assistant context, component library, conventions |
| [docs/prds/](./docs/prds/) | Product Requirement Documents (wave-numbered for chronological order) |
| [docs/react-best-practices.md](./docs/react-best-practices.md) | React/Next.js performance patterns |
| [docs/design-guidelines.md](./docs/design-guidelines.md) | Color palette, typography, icons |
| [docs/quality-gates.md](./docs/quality-gates.md) | Pre-commit and pre-push hooks |

## License

MIT
