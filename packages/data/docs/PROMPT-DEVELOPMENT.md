# Prompt Development Workflow

This document explains how to develop, inspect, and iterate on prompts without requiring LLM calls.

## Why This Exists

In Claude Code Web and other environments, you cannot spawn `claude -p` as a subprocess. More importantly, treating prompts as first-class artifacts enables:

- **Prompt inspection**: See exactly what gets sent to the LLM
- **Independent verification**: Validate prompt quality without model calls
- **Reflexive optimization**: Review → adjust prompt → regenerate → compare
- **External testing**: Copy prompts to any LLM interface for testing
- **Collaboration**: Share and discuss prompt artifacts with team

## Quick Start

```bash
cd packages/data

# Build synthetic session prompt (no LLM call)
bun run src/bin/cli.ts dap synthetic -p

# Build DAP generation prompt (no LLM call)
bun run src/bin/cli.ts dap generate -p

# Build evaluation prompt (no LLM call)
bun run src/bin/cli.ts dap evaluate -p
```

All commands support the `-p` / `--promptOnly` flag to skip the LLM call and only produce prompt artifacts.

## Output Artifacts

When using `-p`, three artifact formats are created in `output/prompts/`:

### 1. Markdown (`.md`)
Human-readable format for review and version control:
```markdown
# Built Prompt
Built at: 2026-02-01T18:27:10.024Z

## Parts Used
- dap-notes/system.md
- dap-notes/user.md

## Variables
{"sessionDescription": "..."}

## Expected Output Schema
DAPNote { ... }

---
## System Prompt
[Full system prompt text]

---
## User Prompt
[Full user prompt text]
```

### 2. JSON (`.json`)
Programmatic format for tools and automation:
```json
{
  "system": "...",
  "user": "...",
  "metadata": {
    "parts": ["dap-notes/system.md", "dap-notes/user.md"],
    "variables": {...},
    "builtAt": "2026-02-01T18:27:10.024Z"
  },
  "schemaDescription": "DAPNote { ... }"
}
```

### 3. Copyable (`.txt`)
Ready to paste directly into Claude Code Web or other LLM interfaces:
```
================================================================================
COPYABLE PROMPT - Ready for direct use with Claude or other LLMs
================================================================================

Built: 2026-02-01T18:27:10.024Z
Parts: dap-notes/system.md, dap-notes/user.md

----------------------------------------
EXPECTED OUTPUT FORMAT:
----------------------------------------
DAPNote {
  data: { subjective: string, objective: string }
  assessment: { clinicalImpression: string, ... }
  plan: { interventions: string[], ... }
  ...
}

================================================================================
SYSTEM PROMPT (copy this as system message or instructions)
================================================================================

[System prompt content]

================================================================================
USER PROMPT (copy this as the user message)
================================================================================

[User prompt content]

================================================================================
END OF PROMPT
================================================================================
```

## CLI Options

All DAP commands support these prompt-related flags:

| Flag | Short | Description |
|------|-------|-------------|
| `--promptOnly` | `-p` | Build prompt artifacts without calling LLM |
| `--outputFormat` | | Format: `markdown`, `json`, `copyable`, or `all` (default: `all`) |

Examples:
```bash
# Only markdown output
bun run src/bin/cli.ts dap generate -p --outputFormat markdown

# Only JSON output (for programmatic use)
bun run src/bin/cli.ts dap synthetic -p --outputFormat json

# All formats (default)
bun run src/bin/cli.ts dap evaluate -p --outputFormat all
```

## Development Workflow

### 1. Generate Prompt Artifacts

```bash
# Build the prompt you want to work on
bun run src/bin/cli.ts dap generate -p
```

### 2. Review the Prompt

Open the markdown file to understand prompt structure:
```bash
cat output/prompts/dap-prompt-*.md
```

### 3. Test with External LLM

Copy the contents of the copyable file and paste into:
- Claude Code Web interface
- Anthropic Console
- Any LLM playground

### 4. Iterate on Prompt Templates

Edit the source prompt files in `src/prompts/`:
- `src/prompts/dap-notes/system.md` - System instructions
- `src/prompts/dap-notes/user.md` - User message template

### 5. Regenerate and Compare

```bash
# Regenerate after changes
bun run src/bin/cli.ts dap generate -p

# Compare with previous version
diff output/prompts/dap-prompt-OLD.md output/prompts/dap-prompt-NEW.md
```

## Prompt Template Structure

Prompts are stored as markdown files with YAML frontmatter:

```markdown
---
name: dap-notes-system
description: System prompt for DAP note generation
version: "1.0.0"
variables:
  - sessionDescription
---

# Clinical Documentation Assistant

You are an expert clinical documentation specialist...

## Instructions

Generate a DAP note based on the following session:

{{sessionDescription}}
```

### Variable Substitution

Use `{{variableName}}` for runtime substitution. Variables are declared in frontmatter and substituted at build time.

## Output Directory Structure

```
packages/data/output/
├── prompts/               # Built prompt artifacts
│   ├── dap-prompt-*.md
│   ├── dap-prompt-*.json
│   ├── dap-prompt-copyable-*.txt
│   ├── synthetic-prompt-*.md
│   └── eval-prompt-*.md
├── synthetic/             # Generated synthetic sessions
├── dap-notes/             # Generated DAP notes
└── evaluations/           # Quality evaluations
```

## Schema Descriptions

When using `-p`, prompt artifacts include the expected output schema. This helps when testing prompts externally - you can see exactly what structure the LLM should produce.

The schema descriptions are automatically generated from Zod schemas in `src/lib/ai/schemas.ts`.

## Integration with Production

The prompt-only mode uses the exact same code paths as production:
- Same prompt loading (`src/lib/prompts/loader.ts`)
- Same prompt building (`src/lib/prompts/builder.ts`)
- Same variable substitution

The only difference is that LLM calls are skipped when `-p` is used.

## Tips for Prompt Development

1. **Start with `-p`**: Always build prompts first to verify structure
2. **Use copyable format**: Fastest way to test in external LLMs
3. **Check variable substitution**: Verify `{{variables}}` are replaced correctly
4. **Review schema**: Ensure expected output format is clear to the LLM
5. **Version your prompts**: Increment version in frontmatter for significant changes
6. **Compare iterations**: Keep old artifacts to compare improvements

## Troubleshooting

### "No input provided"
Run synthetic generation first, or provide explicit input:
```bash
bun run src/bin/cli.ts dap synthetic -p
bun run src/bin/cli.ts dap generate -p --input "path/to/session.md"
```

### Variable not substituted
Check that the variable is declared in frontmatter and matches exactly (case-sensitive).

### Schema not included
Use `--outputFormat all` or `--outputFormat copyable` to include schema descriptions.
