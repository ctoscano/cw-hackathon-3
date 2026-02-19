# DAP Notes CLI - Product Requirement Document

> **Status: Accepted** | Merged via PR #1 on 2026-02-01

## Purpose

This PRD defines the implementation of a CLI tool and shared library for generating DAP (Data, Assessment, Plan) notes for therapists. The system enables therapists to verbally describe a session with a patient, and uses AI to generate structured DAP notes suitable for insurance documentation. The scope includes a CLI for testing and development, shared utilities that can be used in both CLI and Next.js web contexts, synthetic data generation for testing, markdown-based prompt templates, and a self-evaluation workflow for iterative improvement. The design emphasizes observability through file-based output at each stage for review and debugging.

## Constraints

### Technical Constraints
- Must use AI SDK v6 with Anthropic Claude as the provider
- Must use Zod for all schema definitions with descriptive field annotations
- Must support both CLI (Bun) and Next.js web contexts with shared code
- Must use Citty CLI framework (already in use)
- Prompts must be stored in markdown files with frontmatter support
- All intermediate outputs (synthetic input, built prompts, responses) must be saved to files

### Business/Timeline Constraints
- Hackathon timeline - must be efficient and focused
- Self-evaluation capability is a key deliverable to demonstrate iterative improvement

### Dependencies
- AI SDK v6 (@ai-sdk/anthropic)
- Zod for schema validation
- gray-matter for frontmatter parsing
- Existing CLI infrastructure in packages/data

### Compatibility Requirements
- Code must work in both Bun (CLI) and Node.js (Next.js) runtimes
- Must follow existing Biome formatting rules
- Must integrate with existing CLI command structure

## Technical Requirements

### Files to Create

1. **`packages/data/src/lib/ai/client.ts`** - AI client wrapper with telemetry
   - Wraps AI SDK generateObject with timing and error logging
   - Configures Anthropic Claude provider
   - Exports reusable functions for both CLI and web

2. **`packages/data/src/lib/ai/schemas.ts`** - Zod schemas for DAP notes
   - DAPNote schema with Data, Assessment, Plan fields
   - TherapistSessionInput schema for synthetic generation
   - All fields have descriptive annotations for the LLM

3. **`packages/data/src/lib/prompts/loader.ts`** - Markdown prompt loader
   - Parses markdown files with frontmatter
   - Supports simple string substitution {{variable}}
   - Returns structured prompt objects

4. **`packages/data/src/lib/prompts/builder.ts`** - Prompt builder
   - Concatenates multiple prompt parts from markdown files
   - Applies variable substitution
   - Saves built prompt to file for inspection

5. **`packages/data/src/prompts/dap-notes/system.md`** - System prompt for DAP generation
   - Expert therapist persona
   - DAP notes formatting guidelines
   - Insurance documentation requirements

6. **`packages/data/src/prompts/dap-notes/user.md`** - User prompt template
   - Placeholder for therapist session description
   - Instructions for structured output

7. **`packages/data/src/prompts/synthetic/therapist-session.md`** - Synthetic data generation prompt
   - Instructions for generating realistic therapist session descriptions
   - Variety of therapeutic approaches and patient scenarios

8. **`packages/data/src/commands/dap/generate.ts`** - Main DAP generation command
   - Takes session description as input or file path
   - Generates DAP notes and saves to file
   - Shows timing and output location

9. **`packages/data/src/commands/dap/synthetic.ts`** - Synthetic data generation command
   - Generates example therapist session descriptions
   - Saves to markdown files in output directory

10. **`packages/data/src/commands/dap/evaluate.ts`** - Self-evaluation command
    - Reviews generated DAP notes against criteria
    - Suggests improvements to prompts
    - Tracks evaluation history

11. **`packages/data/src/commands/dap/index.ts`** - DAP command group
    - Registers subcommands: generate, synthetic, evaluate
    - Shared options and configuration

12. **`.claude/skills/evaluate/SKILL.md`** - Self-evaluation skill for Claude Code
    - Expert evaluator persona
    - Workflow for reviewing outputs and suggesting improvements
    - Tracking of evaluation iterations

13. **`packages/data/src/lib/utils/file.ts`** - File utilities
    - Helper for saving outputs with timestamps
    - Directory management for output files

### Files to Modify

1. **`packages/data/package.json`** - Add dependencies
   - Add @ai-sdk/anthropic
   - Add ai (AI SDK core)
   - Add zod
   - Add gray-matter for frontmatter

2. **`packages/data/src/index.ts`** - Register DAP command group
   - Import and register dap subcommand

### Architecture Decisions

**Shared Library Pattern**: All AI interaction, schema, and prompt logic lives in `src/lib/` so it can be imported by both the CLI commands and potentially by the Next.js web app. The CLI commands are thin wrappers around library functions.

**File-Based Observability**: Every stage of the pipeline saves output to files:
- `output/synthetic/` - Generated synthetic inputs
- `output/prompts/` - Built prompts before sending to AI
- `output/dap-notes/` - Generated DAP notes
- `output/evaluations/` - Self-evaluation results

**Prompt as Markdown**: Prompts are stored as markdown files with YAML frontmatter for metadata. This makes them easy to read, version control, and edit. The frontmatter can include version, description, and variable declarations.

**Telemetry Wrapper**: The AI client wrapper captures timing, token usage, and errors, making it easy to monitor and debug AI interactions.

### Tech Stack

- `ai` (^4.0.0) - Vercel AI SDK v4 (latest major version for SDK v6 naming)
- `@ai-sdk/anthropic` (^1.0.0) - Anthropic provider for AI SDK
- `zod` (^3.23.0) - Schema validation with TypeScript inference
- `gray-matter` (^4.0.3) - YAML frontmatter parsing for markdown

### Data Models

```typescript
// DAP Note schema
const DAPNoteSchema = z.object({
  data: z.object({
    subjective: z.string().describe("Client's self-reported information, feelings, and experiences"),
    objective: z.string().describe("Therapist's observations, measurable data, and clinical observations"),
  }),
  assessment: z.object({
    clinicalImpression: z.string().describe("Professional interpretation of the session data"),
    progress: z.string().describe("Client's progress toward treatment goals"),
    riskAssessment: z.string().describe("Any safety concerns or risk factors identified"),
  }),
  plan: z.object({
    interventions: z.array(z.string()).describe("Therapeutic interventions used or planned"),
    homework: z.string().optional().describe("Assignments or exercises for the client"),
    nextSession: z.string().describe("Focus areas and goals for next session"),
    referrals: z.array(z.string()).optional().describe("Any referrals made or recommended"),
  }),
  metadata: z.object({
    sessionDate: z.string().describe("Date of the therapy session"),
    sessionDuration: z.string().describe("Duration of the session"),
    sessionType: z.string().describe("Type of session (individual, group, family, etc.)"),
    billingCode: z.string().optional().describe("Suggested CPT billing code"),
  }),
});

// Therapist session input for synthetic generation
const TherapistSessionInputSchema = z.object({
  scenario: z.string().describe("Brief description of the clinical scenario"),
  therapeuticApproach: z.string().describe("Primary therapeutic modality used"),
  patientPresentation: z.string().describe("How the patient presented in session"),
  keyThemes: z.array(z.string()).describe("Main themes discussed in session"),
  interventions: z.array(z.string()).describe("Interventions employed"),
  sessionNarrative: z.string().describe("Detailed narrative of what the therapist would say about the session"),
});
```

## Steps

### Step 1: Install Dependencies

**Action**: Add required npm packages to packages/data

**Requirements**:
- Add ai, @ai-sdk/anthropic, zod, gray-matter as dependencies
- Ensure TypeScript types are available

**Verification**:
```bash
cd packages/data && cat package.json | grep -E '"(ai|@ai-sdk|zod|gray-matter)"'

# Expected output:
# "@ai-sdk/anthropic": "..."
# "ai": "..."
# "zod": "..."
# "gray-matter": "..."
```

**Implementation Log**:
- [ ] Add dependencies to package.json
- [ ] Run pnpm install

### Step 2: Create AI Client with Telemetry

**Action**: Create the AI client wrapper with timing and error handling

**Requirements**:
- Export createAIClient function that configures Anthropic provider
- Export generateStructuredOutput function that wraps generateObject
- Include telemetry: start time, end time, duration, token usage
- Log errors with context
- Return result with telemetry metadata

**Verification**:
```bash
cd packages/data && bun run src/bin/cli.ts dap generate --help

# Expected: Help text for generate command
```

**Implementation Log**:
- [ ] Create client.ts with Anthropic configuration
- [ ] Implement telemetry wrapper
- [ ] Add error handling and logging

### Step 3: Create Zod Schemas

**Action**: Define comprehensive Zod schemas for DAP notes and inputs

**Requirements**:
- DAPNote schema with all fields documented
- TherapistSessionInput schema for synthetic generation
- SyntheticGenerationConfig schema
- EvaluationResult schema
- All fields must have .describe() annotations

**Verification**:
```bash
cd packages/data && bun -e "import { DAPNoteSchema } from './src/lib/ai/schemas'; console.log(DAPNoteSchema.shape)"

# Expected: Object with data, assessment, plan, metadata keys
```

**Implementation Log**:
- [ ] Create schemas.ts
- [ ] Define DAPNoteSchema
- [ ] Define TherapistSessionInputSchema
- [ ] Define supporting schemas
- [ ] Add descriptions to all fields

### Step 4: Create Markdown Prompt Loader

**Action**: Build the markdown file loader with frontmatter support

**Requirements**:
- Parse YAML frontmatter using gray-matter
- Extract content and metadata
- Support {{variable}} string substitution
- Return typed prompt objects

**Verification**:
```bash
cd packages/data && bun -e "
import { loadPrompt } from './src/lib/prompts/loader';
const p = loadPrompt('./src/prompts/dap-notes/system.md');
console.log(p.meta.name);
"

# Expected: "dap-notes-system" or similar
```

**Implementation Log**:
- [ ] Create loader.ts
- [ ] Implement frontmatter parsing
- [ ] Implement variable substitution
- [ ] Add TypeScript types

### Step 5: Create Prompt Builder

**Action**: Build the prompt builder that concatenates and processes prompt files

**Requirements**:
- Load multiple prompt files and concatenate
- Apply variable substitution across all parts
- Save built prompt to output file for inspection
- Return complete prompt string

**Verification**:
```bash
# After running a command, check output exists
ls packages/data/output/prompts/*.md

# Expected: Timestamped prompt files
```

**Implementation Log**:
- [ ] Create builder.ts
- [ ] Implement multi-file concatenation
- [ ] Add output file saving
- [ ] Support variable context

### Step 6: Create DAP Notes Prompts

**Action**: Write the markdown prompt files for DAP note generation

**Requirements**:
- system.md: Expert therapist persona, DAP format guidelines
- user.md: Template for session description input
- Include insurance documentation requirements
- Use proper frontmatter with version and description

**Verification**:
```bash
head -20 packages/data/src/prompts/dap-notes/system.md

# Expected: Frontmatter with name, description, version
```

**Implementation Log**:
- [ ] Create prompts/dap-notes directory
- [ ] Write system.md
- [ ] Write user.md
- [ ] Add frontmatter to all files

### Step 7: Create Synthetic Generation Prompts

**Action**: Write prompts for generating synthetic therapist session descriptions

**Requirements**:
- Prompt for generating diverse therapy scenarios
- Include variety of therapeutic modalities
- Cover different patient presentations
- Generate realistic session narratives

**Verification**:
```bash
cat packages/data/src/prompts/synthetic/therapist-session.md | head -30

# Expected: Frontmatter and instructions
```

**Implementation Log**:
- [ ] Create prompts/synthetic directory
- [ ] Write therapist-session.md prompt

### Step 8: Create File Utilities

**Action**: Build helper utilities for file operations

**Requirements**:
- saveOutput function with timestamps
- ensureDirectory function
- generateFilename with date prefix

**Verification**:
```bash
ls packages/data/src/lib/utils/

# Expected: file.ts
```

**Implementation Log**:
- [ ] Create utils/file.ts
- [ ] Implement saveOutput
- [ ] Implement ensureDirectory

### Step 9: Implement DAP Generate Command

**Action**: Create the main DAP notes generation CLI command

**Requirements**:
- Accept session description as positional arg or --input file
- Build prompt from markdown templates
- Call AI with structured output
- Save all artifacts (prompt, response) to output directory
- Display timing and result summary

**Verification**:
```bash
cd packages/data && bun run src/bin/cli.ts dap generate --help

# Expected: Help with options for input, output-dir, etc.
```

**Implementation Log**:
- [ ] Create commands/dap/generate.ts
- [ ] Implement input handling
- [ ] Wire up prompt builder and AI client
- [ ] Save outputs to files

### Step 10: Implement Synthetic Generation Command

**Action**: Create CLI command to generate synthetic therapist session data

**Requirements**:
- Generate N synthetic session descriptions
- Save each to individual markdown file
- Include metadata in output
- Support different scenario types

**Verification**:
```bash
cd packages/data && bun run src/bin/cli.ts dap synthetic --count 2

# Expected: Created 2 synthetic files in output/synthetic/
```

**Implementation Log**:
- [ ] Create commands/dap/synthetic.ts
- [ ] Implement generation loop
- [ ] Save outputs with metadata

### Step 11: Implement Evaluation Command

**Action**: Create the self-evaluation CLI command

**Requirements**:
- Load a generated DAP note and its source input
- Evaluate against quality criteria
- Suggest prompt improvements
- Save evaluation results

**Verification**:
```bash
cd packages/data && bun run src/bin/cli.ts dap evaluate --help

# Expected: Help with options for input file, criteria
```

**Implementation Log**:
- [ ] Create commands/dap/evaluate.ts
- [ ] Define evaluation criteria
- [ ] Implement evaluation logic
- [ ] Save evaluation results

### Step 12: Register DAP Command Group

**Action**: Create index for DAP commands and register in main CLI

**Requirements**:
- Create commands/dap/index.ts with subcommand group
- Register in src/index.ts
- Ensure help displays all DAP subcommands

**Verification**:
```bash
cd packages/data && bun run src/bin/cli.ts dap --help

# Expected: List of subcommands: generate, synthetic, evaluate
```

**Implementation Log**:
- [ ] Create commands/dap/index.ts
- [ ] Update src/index.ts
- [ ] Verify command registration

### Step 13: Create Self-Evaluation Skill

**Action**: Create Claude Code skill for self-evaluation workflow

**Requirements**:
- Define expert evaluator persona (clinical documentation specialist)
- Workflow for reviewing synthetic input, prompt, and output
- Structured improvement suggestions
- Track evaluation iterations

**Verification**:
```bash
cat .claude/skills/evaluate/SKILL.md | head -20

# Expected: YAML frontmatter with skill definition
```

**Implementation Log**:
- [ ] Create .claude/skills/evaluate directory
- [ ] Write SKILL.md with full workflow
- [ ] Include expert persona definition
- [ ] Add iteration tracking

### Step 14: End-to-End Testing

**Action**: Test the complete workflow from synthetic generation to evaluation

**Requirements**:
- Generate synthetic input
- Build and save prompt
- Generate DAP notes
- Run evaluation
- Verify all output files exist

**Verification**:
```bash
# Run full workflow
cd packages/data
bun run src/bin/cli.ts dap synthetic --count 1
bun run src/bin/cli.ts dap generate --input output/synthetic/latest.md
bun run src/bin/cli.ts dap evaluate --input output/dap-notes/latest.json

# Verify outputs
ls output/synthetic/*.md
ls output/prompts/*.md
ls output/dap-notes/*.json
ls output/evaluations/*.md
```

**Implementation Log**:
- [ ] Run synthetic generation
- [ ] Run DAP generation
- [ ] Run evaluation
- [ ] Verify all outputs
- [ ] Document any issues

## Completion Criteria

- [ ] AI SDK v6 with Claude provider working
- [ ] Zod schemas with descriptions for all data structures
- [ ] Markdown prompt loader with frontmatter support
- [ ] Prompt builder with variable substitution
- [ ] All outputs saved to files for review
- [ ] CLI commands: dap generate, dap synthetic, dap evaluate
- [ ] Self-evaluation skill created
- [ ] End-to-end workflow tested

## Notes

### Future Enhancements
- Web UI integration in apps/web
- Streaming support for real-time generation
- Multiple evaluation criteria profiles
- Prompt versioning and A/B testing
- Integration with therapy practice management systems

### Design Decisions
- **File-based outputs**: Enables human review and debugging at each stage
- **Markdown prompts**: Readable, version-controllable, easy to iterate
- **Telemetry wrapper**: Centralized observability without cluttering business logic
- **Zod descriptions**: LLM can use these as guidance for structured output

### Gotchas & Surprises

[To be added during implementation]

### Demo Instructions

**How to Demo:**

```bash
# 1. Generate synthetic therapist session description
cd packages/data
bun run src/bin/cli.ts dap synthetic --count 1

# 2. Generate DAP notes from the synthetic input
bun run src/bin/cli.ts dap generate --input output/synthetic/session-001.md

# 3. Review the outputs
cat output/prompts/dap-prompt-*.md      # See the built prompt
cat output/dap-notes/dap-*.json         # See the generated DAP notes

# 4. Run self-evaluation
bun run src/bin/cli.ts dap evaluate --input output/dap-notes/dap-*.json

# 5. Review evaluation results
cat output/evaluations/eval-*.md
```

---

**Status**: Draft
**Created**: 2026-02-01
**Last Updated**: 2026-02-01
**Implementation Started**: 2026-02-01
**Completed**: N/A
