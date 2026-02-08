---
name: evaluate
description: Self-evaluate AI pipeline output quality and suggest iterative improvements (supports DAP notes, intake questionnaire, and future pipelines)
user-invocable: true
argument-hint: "[run|review|iterate] [pipeline]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Multi-Pipeline Evaluation Skill

This skill helps you iteratively improve AI pipelines by evaluating outputs and suggesting prompt improvements. It supports multiple pipelines through modular reference files.

## Supported Pipelines

| Pipeline | ID | Reference File |
|----------|-----|----------------|
| DAP Notes | `dap` | `references/dap-notes.md` |
| Intake Questionnaire | `intake` | `references/intake.md` |

## Subcommand Dispatcher

Check `$0` to determine which subcommand was invoked:

- `run` → Run the full evaluation pipeline
- `review` → Review recent evaluation results
- `iterate` → Apply suggested improvements to prompts

If no subcommand provided, display usage information.

Check `$1` for the pipeline identifier (optional):
- If provided, use that pipeline directly
- If not provided, use pipeline detection logic

---

## Pipeline Detection

Before executing any subcommand, identify the target pipeline:

### 1. Check if specified as argument

```
/evaluate run dap     → DAP notes pipeline
/evaluate run intake  → Intake questionnaire pipeline
/evaluate review dap  → Review DAP evaluations
```

If `$1` matches a known pipeline ID (`dap` or `intake`), use that pipeline.

### 2. Auto-detect from recent work

If no pipeline specified, check which pipeline has recent outputs:

```bash
# Check for recent DAP evaluations
ls -t packages/data/output/evaluations/eval-*.md 2>/dev/null | head -1

# Check for recent intake testing (look for intake-related files or recent web usage)
ls -t packages/data/output/intake/*.json 2>/dev/null | head -1
```

Use the pipeline with more recent activity.

### 3. Prompt if ambiguous

If no clear winner or both have equal recency, ask the user:

> "Which pipeline would you like to evaluate?
> 1. `dap` - DAP Notes Generation
> 2. `intake` - Intake Questionnaire
>
> You can also specify directly: `/evaluate run dap` or `/evaluate run intake`"

### 4. Load pipeline reference

Once the pipeline is identified, **read the appropriate reference file**:

- For `dap`: Read `.claude/skills/evaluate/references/dap-notes.md`
- For `intake`: Read `.claude/skills/evaluate/references/intake.md`

The reference file contains:
- CLI commands or testing instructions
- File paths for prompts and outputs
- Expert persona for evaluation
- Evaluation criteria with weights
- Good/bad output examples
- Iteration log format

---

## Subcommand: `run`

Run the complete evaluation pipeline for the selected pipeline.

### Workflow

1. **Identify pipeline** (see Pipeline Detection above)

2. **Load pipeline reference**
   - Read the appropriate reference file
   - Note the CLI commands, paths, and evaluation criteria

3. **Check prerequisites**
   - Verify prompts exist at the paths specified in the reference
   - Check for required dependencies (API keys, etc.)

4. **Generate test data** (if applicable)
   - For DAP: Run synthetic session generation command
   - For Intake: May use web interface or API testing

5. **Generate output**
   - For DAP: Run DAP generation command
   - For Intake: Run through intake flow (web or API)

6. **Perform evaluation**
   - Adopt the expert persona from the reference file
   - Apply the evaluation criteria with their weights
   - Score each dimension
   - Calculate overall score

7. **Summarize results**
   - Present scores by dimension
   - Highlight strengths and areas for improvement
   - Provide specific prompt improvement suggestions
   - Save evaluation to appropriate output location

### Expert Persona Loading

When evaluating, **adopt the expert persona defined in the reference file**. This ensures evaluations are grounded in domain expertise specific to each pipeline.

---

## Subcommand: `review`

Review recent evaluation results without running new evaluations.

### Workflow

1. **Identify pipeline** (see Pipeline Detection above)

2. **Load pipeline reference**
   - Get the evaluation output path from the reference

3. **Find recent evaluations**
   - For DAP: `packages/data/output/evaluations/eval-*.md`
   - For Intake: Check appropriate output location

4. **Read the latest evaluation**
   - Present a summary of scores and findings
   - Show prompt improvement suggestions

5. **Track improvement trends**
   - If multiple evaluations exist, compare scores over time
   - Note which dimensions are improving or declining
   - Reference the iteration log if it exists

---

## Subcommand: `iterate`

Apply suggested improvements to the prompt files.

### Workflow

1. **Identify pipeline** (see Pipeline Detection above)

2. **Load pipeline reference**
   - Get prompt file paths from the reference
   - Get iteration log format from the reference

3. **Read latest evaluation**
   - Find the most recent evaluation file
   - Extract the improvement suggestions section

4. **Review current prompts**
   - Read all prompt files listed in the reference
   - Understand current structure and content

5. **Apply improvements**
   - For each suggestion, determine which prompt file to modify
   - Use Edit tool to make targeted changes
   - Increment the version number in frontmatter

6. **Log the iteration**
   - Create/update the iteration log at the path specified in reference
   - Use the format specified in the reference
   - Record: date, changes made, reasoning, expected impact

7. **Suggest re-evaluation**
   - Recommend running `/evaluate run [pipeline]` to test improvements

---

## Usage Information

Display this when no subcommand provided:

```
Evaluation Skill - Iterative AI Pipeline Improvement

Usage: /evaluate [subcommand] [pipeline]

Subcommands:
  run      Run full evaluation pipeline (generate → evaluate → summarize)
  review   Review recent evaluation results
  iterate  Apply suggested improvements to prompts

Pipelines:
  dap      DAP Notes Generation
  intake   Intake Questionnaire (Therapy Readiness)

Examples:
  /evaluate run              # Auto-detect pipeline and run evaluation
  /evaluate run dap          # Evaluate DAP notes pipeline
  /evaluate run intake       # Evaluate intake questionnaire pipeline
  /evaluate review           # Review most recent evaluation
  /evaluate review dap       # Review DAP evaluations specifically
  /evaluate iterate intake   # Improve intake prompts based on feedback

The evaluation system helps you iteratively improve AI outputs by:
1. Generating or running test data through the pipeline
2. Evaluating quality against domain-specific criteria
3. Suggesting specific prompt improvements
4. Tracking improvement over iterations

Each pipeline has its own evaluation criteria, expert persona, and improvement workflow.
See reference files in .claude/skills/evaluate/references/ for details.
```

---

## Adding New Pipelines

To add support for a new pipeline:

1. **Create a reference file**: `.claude/skills/evaluate/references/<pipeline-id>.md`

2. **Include these sections**:
   - Pipeline Information (ID, name, description)
   - CLI Commands or Testing Instructions
   - File Paths (prompts, outputs, iteration log)
   - Expert Persona
   - Evaluation Criteria with weights
   - Iteration Log Format
   - Good/Bad Output Examples
   - Error Handling
   - Tips

3. **Update this file**: Add the new pipeline to the "Supported Pipelines" table above

---

## Error Handling

### Common errors across all pipelines:

| Error | Solution |
|-------|----------|
| Unknown pipeline | Check supported pipelines, use `dap` or `intake` |
| Reference file not found | Ensure `.claude/skills/evaluate/references/[pipeline].md` exists |
| No recent evaluations | Run `/evaluate run [pipeline]` first |
| Missing API key | Set `ANTHROPIC_API_KEY` environment variable |
| Missing dependencies | Run `pnpm install` from root |

### Pipeline-specific errors:

See the individual reference files for pipeline-specific troubleshooting.

---

## Tips for Effective Evaluation

1. **Choose the right pipeline** - Make sure you're evaluating the correct pipeline
2. **Use the expert persona** - The reference file defines who you should "be" when evaluating
3. **Focus on weighted criteria** - Higher-weighted criteria deserve more attention
4. **Make small changes** - Don't rewrite prompts wholesale; iterate gradually
5. **Track your iterations** - The iteration log shows what works over time
6. **Test diverse scenarios** - Each pipeline has recommended test scenarios in its reference
