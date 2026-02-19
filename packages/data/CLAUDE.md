# packages/data - CLI & AI Pipelines

## Overview

CLI tool and AI pipeline logic using Citty framework on Bun runtime. Contains prompt templates with folder-based versioning and evaluation tooling.

## Running the CLI

```bash
cd packages/data
bun run src/bin/cli.ts <command> [options]
```

### Available Commands

| Command | Description |
|---------|-------------|
| `hello [name]` | Test command (`--loud` for emphasis) |
| `dap generate` | Generate DAP notes from session description |
| `dap synthetic` | Generate synthetic session data |
| `intake synthetic --scenario <name>` | Generate synthetic intake data |
| `intake evaluate --version <v> --scenario <name>` | Evaluate intake outputs |
| `setup` | Interactive environment configuration |

### Environment Variables

Create `.env` for local development (see `.env.example`):

```env
WANDB_API_KEY=your-key
WEAVE_PROJECT=your-team/your-project
```

Run with: `bun --env-file=.env run src/bin/cli.ts <command>`

## Prompt Versioning System

Prompts use **folder-based versioning** for iterative improvement. Only the `intake/` pipeline is currently versioned.

### Directory Structure

```
src/prompts/
├── dap-notes/                # Not versioned
│   ├── system.md
│   └── user.md
├── intake/                   # VERSIONED
│   ├── v1/                   # Baseline (9.2/10) — superseded
│   ├── v2/                   # Brevity-focused (8.7/10) — current default
│   └── v3/                   # Best of both worlds (targeting 9.4-9.6) — experimental
│       ├── manifest.md       # Version metadata, changes, tradeoffs
│       ├── reflection-system.md
│       ├── reflection-user.md
│       ├── completion-system.md
│       └── completion-user.md
├── evaluation/               # Evaluation prompts (not versioned)
└── synthetic/                # Test data generation
```

### How Versioning Works

Each version directory contains:
- **Prompt files** with YAML frontmatter (`version: "v3"`)
- **`manifest.md`** documenting: version, status, motivation, changes, tradeoffs, evaluation scores

The **prompt loader** (`src/lib/prompts/loader.ts`) automatically injects version into paths:
```typescript
loadPrompt("intake/reflection-system.md", { version: "v2" })
// Resolves to: intake/v2/reflection-system.md
// Default: v3 if not specified
```

### Output Organization

Outputs are organized by version for easy comparison:
```
output/intake/
├── synthetic/          # Shared test inputs (version-agnostic)
├── v1/generated/       # v1 outputs
├── v1/evaluations/     # v1 evaluation scores
├── v2/generated/
├── v2/evaluations/
└── v3/generated/
```

### Version History

| Version | Score | Status | Strategy |
|---------|-------|--------|----------|
| v1 | 9.2/10 | Superseded | Baseline — excellent warmth but too verbose |
| v2 | 8.7/10 | Current default | Strict brevity (15 words max) — over-corrected, lost warmth |
| v3 | Target 9.4-9.6 | Experimental | Revert to v1 warmth + targeted improvements |

### Creating a New Version

```bash
# 1. Copy previous version
cp -r src/prompts/intake/v3 src/prompts/intake/v4

# 2. Update frontmatter version in each file
# 3. Edit prompts based on evaluation feedback
# 4. Create/update manifest.md with changes and rationale

# 5. Evaluate
bun run src/bin/cli.ts intake evaluate --version v4 --scenario ambivalent

# 6. Compare with previous
bun run src/bin/cli.ts intake evaluate --version v3 --scenario ambivalent
```

### Evaluation Workflow

Use the `/evaluate` skill or run directly:

```bash
# Generate test data
bun run src/bin/cli.ts intake synthetic --scenario ambivalent

# Evaluate a version
bun run src/bin/cli.ts intake evaluate --version v2 --scenario ambivalent

# Compare scores
jq '.overallScore' output/intake/v1/evaluations/intake-eval-*.json
jq '.overallScore' output/intake/v2/evaluations/intake-eval-*.json
```

### Evaluation Criteria

**Reflection Quality (50%)**:
- Empathic Accuracy (15%) — captures meaning and emotional subtext
- Normalization & Validation (15%) — helps user feel less alone
- Appropriate Brevity (10%) — concise yet meaningful
- Tone Consistency (10%) — warm, professional, non-clinical

**Completion Output Quality (50%)**:
- Personalization (15%) — tailored to specific answers
- Actionability (15%) — practical usefulness
- Appropriate Boundaries (10%) — stays within scope
- Empowerment Over Pressure (10%) — supports choice, not pressure

### Supported Test Scenarios

| Scenario | Profile | Tests For |
|----------|---------|-----------|
| `ambivalent` | Uncertain, "just exploring" | Respectful ambivalence handling |
| `ready` | Clear motivation, logistics concerns | Practical guidance |
| `pastNegative` | Past therapy didn't help | Addressing past failures |
| `externalPressure` | Others suggesting therapy | Personal agency emphasis |
| `notRightTime` | Interested but timing wrong | Validation without pressure |

## Key Files

| File | Purpose |
|------|---------|
| `src/bin/cli.ts` | Entry point (`#!/usr/bin/env bun` shebang) |
| `src/index.ts` | Main command definition with subcommands |
| `src/commands/` | CLI command implementations |
| `src/lib/prompts/loader.ts` | Version-aware prompt file loader |
| `src/prompts/intake/vN/manifest.md` | Version documentation |
| `output/` | Generated outputs and evaluations (gitignored) |
