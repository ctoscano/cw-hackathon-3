---
name: evaluate
description: Self-evaluate DAP note generation quality and suggest iterative improvements
user-invocable: true
argument-hint: "[run|review|iterate]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# DAP Notes Self-Evaluation Skill

This skill helps you iteratively improve the DAP note generation system by evaluating outputs and suggesting prompt improvements.

## Subcommand Dispatcher

Check `$0` to determine which subcommand was invoked:

- `run` → Run the full evaluation pipeline
- `review` → Review recent evaluation results
- `iterate` → Apply suggested improvements to prompts

If no subcommand provided, display usage information.

---

## Subcommand: `run`

Run the complete evaluation pipeline: generate synthetic data, create DAP notes, and evaluate quality.

### Workflow

1. **Check prerequisites**:
   ```bash
   cd packages/data
   ls src/prompts/dap-notes/system.md
   ```

2. **Generate synthetic session** (if none recent):
   ```bash
   cd packages/data && bun run src/bin/cli.ts dap synthetic --count 1
   ```

3. **Generate DAP notes**:
   ```bash
   cd packages/data && bun run src/bin/cli.ts dap generate
   ```

4. **Run evaluation**:
   ```bash
   cd packages/data && bun run src/bin/cli.ts dap evaluate
   ```

5. **Summarize results**:
   - Read the evaluation markdown from `output/evaluations/`
   - Highlight the overall score and key findings
   - Present improvement suggestions

### Expert Persona

When evaluating, adopt the perspective of a **Clinical Documentation Improvement Specialist** with:
- 20+ years experience in mental health documentation
- Certified in healthcare compliance and billing
- Expert in prompt engineering for clinical AI systems
- Focus on practical, actionable improvements

---

## Subcommand: `review`

Review recent evaluation results without running new evaluations.

### Workflow

1. **Find recent evaluations**:
   ```bash
   ls -la packages/data/output/evaluations/*.md | tail -5
   ```

2. **Read the latest evaluation**:
   - Use Glob to find: `packages/data/output/evaluations/eval-*.md`
   - Read the most recent file
   - Present a summary

3. **Track improvement trends**:
   - Compare scores across evaluations if multiple exist
   - Note which dimensions are improving or declining

---

## Subcommand: `iterate`

Apply suggested improvements to the prompt files.

### Workflow

1. **Read latest evaluation**:
   - Find `packages/data/output/evaluations/eval-*.md`
   - Extract the "Prompt Engineering Suggestions" section

2. **Review current prompts**:
   - Read `packages/data/src/prompts/dap-notes/system.md`
   - Read `packages/data/src/prompts/dap-notes/user.md`

3. **Apply improvements**:
   - For each suggestion, determine if it should modify:
     - System prompt (persona, guidelines, structure)
     - User prompt (instructions, formatting)
   - Use Edit tool to make targeted changes
   - Increment the version number in frontmatter

4. **Log the iteration**:
   - Create/update `packages/data/output/iteration-log.md`
   - Record: date, changes made, reasoning, expected impact

5. **Re-run evaluation**:
   - Suggest running `/evaluate run` to test improvements

---

## Usage Information

Display this when no subcommand provided:

```
🔍 DAP Notes Self-Evaluation Skill

Usage: /evaluate [subcommand]

Subcommands:
  run      Run full evaluation pipeline (synthetic → generate → evaluate)
  review   Review recent evaluation results
  iterate  Apply suggested improvements to prompts

Examples:
  /evaluate run        # Run complete evaluation
  /evaluate review     # See latest evaluation results
  /evaluate iterate    # Improve prompts based on feedback

The evaluation system helps you iteratively improve DAP note generation by:
1. Generating synthetic therapy session descriptions
2. Creating DAP notes from those descriptions
3. Evaluating the quality against clinical documentation standards
4. Suggesting specific prompt improvements

Each iteration builds on the previous one, creating a continuous improvement loop.
```

---

## Evaluation Criteria Reference

When reviewing evaluations, consider these key criteria:

### Completeness (20% weight)
- All DAP sections present and filled
- Risk assessment always included
- Specific named interventions

### Accuracy (25% weight)
- Faithful to session input
- Client statements properly quoted
- No hallucinated information

### Clinical Appropriateness (20% weight)
- Professional clinical language
- Objective observations separated from interpretations
- Evidence-based terminology

### Insurance Compliance (20% weight)
- Supports medical necessity
- Appropriate billing code
- Required elements present (duration, type, risk)

### Actionability (15% weight)
- Clear treatment plan
- Measurable goals
- Specific next steps

---

## Iteration Log Format

When logging iterations, use this format:

```markdown
## Iteration N - YYYY-MM-DD

### Evaluation Scores (Before → After)
- Overall: X/10 → Y/10
- Completeness: X/10 → Y/10
- ...

### Changes Made
1. [Prompt file]: [Specific change]
2. [Prompt file]: [Specific change]

### Reasoning
[Why these changes were made]

### Expected Impact
[What improvement is expected]

### Actual Impact
[To be filled after re-evaluation]
```

---

## Error Handling

If commands fail:

1. **Missing dependencies**: Run `pnpm install` from root
2. **No API key**: Check `ANTHROPIC_API_KEY` is set
3. **No synthetic data**: Run `dap synthetic` first
4. **File not found**: Check paths relative to `packages/data`

---

## Tips for Effective Iteration

1. **Focus on one dimension at a time** - Don't try to fix everything at once
2. **Make small, targeted changes** - Large rewrites are hard to evaluate
3. **Keep notes on what worked** - The iteration log is valuable documentation
4. **Test with diverse scenarios** - Use different `--scenario` types for synthetic data
5. **Review the built prompts** - Check `output/prompts/` to see what's actually sent to the AI
