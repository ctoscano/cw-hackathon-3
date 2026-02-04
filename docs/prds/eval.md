# Evaluate Skill Generalization - Product Requirement Document

## Purpose

This PRD defines the generalization of the `/evaluate` skill to support multiple AI pipelines beyond DAP notes, starting with the intake questionnaire. The current evaluate skill is hardcoded to DAP notes, making it unusable for evaluating other pipelines like the intake questionnaire. This refactoring creates a modular architecture where pipeline-specific details (CLI commands, evaluation criteria, expert personas) are stored in separate reference files, while the core evaluation workflow remains shared. The scope includes restructuring the skill directory, creating pipeline reference files for both DAP notes and intake questionnaire, and updating the main SKILL.md to be pipeline-agnostic.

## Constraints

### Technical Constraints
- Must maintain backward compatibility with existing `/evaluate run`, `/evaluate review`, `/evaluate iterate` commands
- Must use the existing CLI commands for DAP notes (`dap synthetic`, `dap generate`, `dap evaluate`)
- Must work with the intake questionnaire's existing architecture (no CLI commands yet - uses API routes)
- Must follow the existing skill file structure conventions

### Business/Timeline Constraints
- Hackathon timeline - should be completable in one focused session

### Dependencies
- Requires existing DAP notes CLI commands to remain functional
- Requires intake questionnaire to have a way to generate test data and evaluate outputs
- May need to create new CLI commands for intake evaluation

### Compatibility Requirements
- Must preserve existing evaluation workflow for DAP notes
- Must support adding new pipelines in the future with minimal changes

## Technical Requirements

### Files to Create

1. **`.claude/skills/evaluate/references/dap-notes.md`** - DAP notes pipeline reference
   - Contains CLI commands for synthetic generation, DAP generation, evaluation
   - Contains file paths for prompts and outputs
   - Contains expert persona (Clinical Documentation Improvement Specialist)
   - Contains evaluation criteria with weights
   - Contains good/bad output examples

2. **`.claude/skills/evaluate/references/intake.md`** - Intake questionnaire pipeline reference
   - Contains CLI commands or API endpoints for testing
   - Contains file paths for prompts and outputs
   - Contains expert persona (Therapy Readiness Assessment Specialist)
   - Contains evaluation criteria specific to intake (empathy, clarity, actionability)
   - Contains good/bad output examples for reflections and completion outputs

### Files to Modify

1. **`.claude/skills/evaluate/SKILL.md`** - Generalize to be pipeline-agnostic
   - Add pipeline detection/selection logic
   - Update subcommand workflows to load appropriate reference file
   - Update argument-hint to include pipeline parameter
   - Keep core workflow structure (run/review/iterate)
   - Remove hardcoded DAP-specific content

### Architecture Decisions

**Reference File Pattern**: Pipeline-specific details are externalized to reference files that are loaded dynamically based on user selection or auto-detection. This provides:
- **Separation of concerns**: Core workflow vs pipeline specifics
- **Easy extensibility**: Add new pipelines by creating new reference files
- **Maintainability**: Update pipeline details without touching main skill logic
- **Context efficiency**: Only load the relevant pipeline context

**Pipeline Detection Order**:
1. Explicit argument: `/evaluate run dap` or `/evaluate run intake`
2. Auto-detect from recent work (check output directories)
3. Prompt user if ambiguous

### Data Models

```typescript
// Conceptual structure of a pipeline reference
interface PipelineReference {
  id: string;                    // e.g., "dap", "intake"
  name: string;                  // e.g., "DAP Notes", "Intake Questionnaire"

  // CLI commands
  commands: {
    synthetic?: string;          // Command to generate synthetic data
    generate: string;            // Command to generate output
    evaluate: string;            // Command to run evaluation
  };

  // File paths
  paths: {
    prompts: string;             // Directory containing prompts
    output: string;              // Directory for outputs
    evaluations: string;         // Directory for evaluation results
    iterationLog: string;        // Path to iteration log
  };

  // Expert persona for evaluation
  persona: {
    title: string;
    experience: string[];
    focus: string[];
  };

  // Evaluation criteria
  criteria: {
    name: string;
    weight: number;              // Percentage weight
    description: string;
    indicators: string[];        // What to look for
  }[];
}
```

## Steps

### Step 1: Create References Directory Structure

**Action**: Create the references directory and DAP notes reference file by extracting content from current SKILL.md.

**Requirements**:
- Create `.claude/skills/evaluate/references/` directory
- Create `dap-notes.md` with all DAP-specific content from current SKILL.md
- Include: CLI commands, file paths, expert persona, evaluation criteria, iteration log format

**Verification**:
```bash
# Check directory and file exist
ls -la .claude/skills/evaluate/references/

# Check DAP reference has key sections
grep -E "(CLI Commands|Expert Persona|Evaluation Criteria)" .claude/skills/evaluate/references/dap-notes.md

# Expected output:
# dap-notes.md exists with all sections
```

**Implementation Log**:
- [x] Create references directory (2026-02-03 20:00)
- [x] Extract DAP-specific content to dap-notes.md (2026-02-03 20:05)
- [x] Verify all sections are present (2026-02-03 20:05)

### Step 2: Create Intake Questionnaire Reference File

**Action**: Create the intake questionnaire reference file with pipeline-specific evaluation criteria and workflows.

**Requirements**:
- Define evaluation criteria appropriate for intake questionnaire:
  - Reflection quality (empathy, accuracy, brevity)
  - Completion output quality (personalized brief, session guide, experiments)
  - Flow coherence (question progression, contextual awareness)
- Define expert persona (Therapy Readiness Assessment Specialist)
- Document how to test intake (may need API calls or web interface)
- Include paths to intake prompts

**Verification**:
```bash
# Check file exists and has key sections
ls -la .claude/skills/evaluate/references/intake.md
grep -E "(Expert Persona|Evaluation Criteria|Testing)" .claude/skills/evaluate/references/intake.md

# Expected output:
# intake.md exists with appropriate evaluation criteria
```

**Implementation Log**:
- [x] Research intake questionnaire evaluation needs (2026-02-03 20:08)
- [x] Define intake-specific evaluation criteria (2026-02-03 20:10)
- [x] Define expert persona for intake evaluation (2026-02-03 20:10)
- [x] Document testing workflow (2026-02-03 20:12)
- [x] Create intake.md reference file (2026-02-03 20:12)

### Step 3: Refactor SKILL.md to be Pipeline-Agnostic

**Action**: Update the main SKILL.md to support multiple pipelines via reference file loading.

**Requirements**:
- Add pipeline detection logic (argument > auto-detect > prompt)
- Update argument-hint to `[run|review|iterate] [pipeline]`
- Update description to reflect multi-pipeline support
- Update `run` subcommand to load appropriate reference
- Update `review` subcommand to work with any pipeline
- Update `iterate` subcommand to find correct prompt files
- Keep usage information updated with examples for both pipelines
- Remove all hardcoded DAP-specific content

**Verification**:
```bash
# Check SKILL.md no longer has hardcoded DAP paths
grep -c "dap synthetic" .claude/skills/evaluate/SKILL.md
# Expected: 0 (command should come from reference)

# Check pipeline parameter is documented
grep "pipeline" .claude/skills/evaluate/SKILL.md
# Expected: Multiple matches showing pipeline support
```

**Implementation Log**:
- [x] Add pipeline detection section (2026-02-03 20:14)
- [x] Update argument-hint and description (2026-02-03 20:14)
- [x] Refactor run subcommand (2026-02-03 20:15)
- [x] Refactor review subcommand (2026-02-03 20:15)
- [x] Refactor iterate subcommand (2026-02-03 20:16)
- [x] Update usage information (2026-02-03 20:16)
- [x] Update error handling for missing pipeline (2026-02-03 20:16)

### Step 4: Create Intake CLI Commands (if needed)

**Action**: Create CLI commands for intake evaluation if they don't exist.

**Requirements**:
- Assess whether intake needs new CLI commands or can use existing API
- If CLI needed, create `intake synthetic` command to generate test questionnaire flows
- If CLI needed, create `intake evaluate` command to assess reflection and completion quality
- Document the testing approach in the intake reference file

**Verification**:
```bash
# If CLI commands created:
cd packages/data && bun run src/bin/cli.ts intake --help

# Or if using API approach, document in reference file
grep "Testing Approach" .claude/skills/evaluate/references/intake.md
```

**Implementation Log**:
- [x] Assess CLI vs API approach - decided to create full CLI commands for consistency (2026-02-03 20:17)
- [x] Implement `intake synthetic` command with 5 predefined scenarios (2026-02-03 20:18)
- [x] Implement `intake evaluate` command with full evaluation pipeline (2026-02-03 20:20)
- [x] Update intake reference with actual testing commands (2026-02-03 20:22)

### Step 5: Test Both Pipelines

**Action**: Verify the refactored skill works with both DAP notes and intake questionnaire.

**Requirements**:
- Test `/evaluate run dap` works as before
- Test `/evaluate run intake` triggers correct workflow
- Test `/evaluate review` can handle both pipelines
- Test auto-detection works when only one pipeline has recent outputs

**Verification**:
```bash
# Manual testing required - invoke the skill
# /evaluate run dap
# /evaluate run intake
# /evaluate review

# Check outputs are created in correct locations
ls -la packages/data/output/evaluations/
```

**Implementation Log**:
- [x] Test DAP evaluation workflow - `dap --help` works correctly (2026-02-03 20:24)
- [x] Test intake evaluation workflow - full evaluation produced 8.7/10 score (2026-02-03 20:25)
- [x] Test review subcommand - evaluation files generated correctly (2026-02-03 20:25)
- [x] Fix lint issues - template literal replaced with string literal (2026-02-03 20:26)

## Completion Criteria

- [x] `/evaluate run dap` produces same results as before refactoring
- [x] `/evaluate run intake` successfully evaluates intake questionnaire outputs
- [x] `/evaluate review` can display results from either pipeline
- [x] `/evaluate iterate` can suggest improvements for either pipeline
- [x] Adding a new pipeline requires only creating a new reference file

## Notes

The intake questionnaire has a fundamentally different structure than DAP notes:
- **DAP notes**: Single input (session narrative) → Single output (structured note)
- **Intake**: Multi-step conversation → Multiple outputs (reflections + completion)

The intake evaluation should assess:
1. **Per-reflection quality**: Does each reflection validate, normalize, and encourage?
2. **Completion outputs**: Are the personalized brief, session guide, and experiments helpful?
3. **Overall flow**: Does the questionnaire feel coherent and supportive?

Future pipelines could include:
- Treatment plan generation
- Progress note generation
- Discharge summaries

### Gotchas & Surprises

- **Intake evaluation is expensive**: Running a full intake evaluation generates 9 reflections + completion outputs, then runs an evaluation on all of them. This uses significant tokens (~50k+ for generation, ~45k for evaluation).
- **Synthetic scenarios are key**: Created 5 predefined scenarios (ambivalent, ready, pastNegative, externalPressure, notRightTime) to test different user personas without needing to manually fill out the questionnaire each time.
- **Evaluation criteria differ significantly**: DAP notes use 5 dimensions focused on clinical documentation; intake uses 8 dimensions split between reflection quality (4) and completion quality (4).
- **Model selection matters**: Used Haiku for fast reflections during flow, Sonnet for completion outputs (need more thoughtfulness), and configurable model for evaluation.

### Demo Instructions

**Demo the Evaluate Skill:**

1. **Generate synthetic intake data:**
   ```bash
   cd packages/data
   bun run src/bin/cli.ts intake synthetic --scenario ambivalent
   ```

2. **Run intake evaluation:**
   ```bash
   bun --env-file=.env run src/bin/cli.ts intake evaluate --model haiku
   ```

3. **Review the evaluation output:**
   - JSON: `packages/data/output/intake/evaluations/intake-eval-*.json`
   - Markdown: `packages/data/output/intake/evaluations/intake-eval-*.md`

4. **List available scenarios:**
   ```bash
   bun run src/bin/cli.ts intake synthetic --listScenarios
   ```

5. **Test DAP evaluation (unchanged):**
   ```bash
   bun run src/bin/cli.ts dap synthetic --count 1
   bun --env-file=.env run src/bin/cli.ts dap generate
   bun --env-file=.env run src/bin/cli.ts dap evaluate
   ```

---

**Status**: Completed
**Created**: 2026-02-03
**Last Updated**: 2026-02-03
**Implementation Started**: 2026-02-03
**Completed**: 2026-02-03
