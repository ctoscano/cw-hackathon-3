# DAP Notes Pipeline Reference

This reference file contains all DAP notes-specific details for the evaluate skill.

## Pipeline Information

- **ID**: `dap`
- **Name**: DAP Notes Generation
- **Description**: Generate and evaluate clinical DAP (Data, Assessment, Plan) notes from therapy session narratives

## CLI Commands

### Generate Synthetic Session Data
```bash
cd packages/data && bun run src/bin/cli.ts dap synthetic --count 1
```

**Options**:
- `--count N`: Number of synthetic sessions to generate
- `--scenario TYPE`: Scenario type (depression, anxiety, trauma, relationship, grief, substance, mixed)
- `--modality TYPE`: Therapeutic approach (cbt, dbt, psychodynamic, person-centered, integrative, mixed)

### Generate DAP Notes
```bash
cd packages/data && bun run src/bin/cli.ts dap generate
```

**Options**:
- `--input FILE`: Input file path (uses most recent synthetic if not specified)
- `--model MODEL`: Model to use (defaults to configured)

### Run Evaluation
```bash
cd packages/data && bun run src/bin/cli.ts dap evaluate
```

**Options**:
- `--dapInput FILE`: DAP note to evaluate (uses most recent if not specified)
- `--sessionInput FILE`: Original session (uses most recent if not specified)

## File Paths

| Purpose | Path |
|---------|------|
| System Prompt | `packages/data/src/prompts/dap-notes/system.md` |
| User Prompt | `packages/data/src/prompts/dap-notes/user.md` |
| Evaluation System Prompt | `packages/data/src/prompts/evaluation/system.md` |
| Evaluation User Prompt | `packages/data/src/prompts/evaluation/user.md` |
| Synthetic Output | `packages/data/output/synthetic/` |
| DAP Notes Output | `packages/data/output/dap-notes/` |
| Evaluation Output | `packages/data/output/evaluations/` |
| Iteration Log | `packages/data/output/iteration-log.md` |

## Expert Persona

When evaluating DAP notes, adopt the perspective of a **Clinical Documentation Improvement Specialist** with:

- **Experience**: 20+ years in mental health documentation
- **Certifications**: Healthcare compliance and billing certified
- **Expertise**:
  - Prompt engineering for clinical AI systems
  - Medical necessity documentation
  - CPT codes (90832, 90834, 90837, 90847, 90846)
  - Insurance compliance requirements
- **Focus**: Practical, actionable improvements that maintain clinical accuracy

## Evaluation Criteria

### 1. Completeness (20% weight)

Evaluates structural completeness of the DAP note.

**What to look for**:
- All DAP sections present and filled (Data, Assessment, Plan)
- Risk assessment always included
- Specific named interventions documented
- Session metadata complete (duration, type, billing code)
- Client quotes included in Data section

**Score Guide**:
- 9-10: All sections complete with rich detail
- 7-8: All sections present, minor details missing
- 5-6: One section incomplete or thin
- 3-4: Multiple sections incomplete
- 1-2: Major structural problems

### 2. Accuracy (25% weight)

Evaluates faithfulness to the source session narrative.

**What to look for**:
- Faithful representation of session content
- Client statements properly quoted (not paraphrased as fact)
- No hallucinated information or invented details
- Correct attribution of statements
- Timeline accuracy

**Score Guide**:
- 9-10: Completely faithful, all details traceable to source
- 7-8: Minor paraphrasing issues, no hallucinations
- 5-6: Some inferences not clearly marked
- 3-4: Contains invented details
- 1-2: Major accuracy problems

### 3. Clinical Appropriateness (20% weight)

Evaluates professional quality of clinical language.

**What to look for**:
- Professional clinical language throughout
- Objective observations separated from interpretations
- Evidence-based terminology
- Appropriate diagnostic language (tentative when appropriate)
- Clinical impressions supported by data

**Score Guide**:
- 9-10: Expert-level clinical documentation
- 7-8: Professional with minor language issues
- 5-6: Some unprofessional phrasing
- 3-4: Frequent clinical language problems
- 1-2: Inappropriate for clinical use

### 4. Insurance Compliance (20% weight)

Evaluates documentation for billing and compliance requirements.

**What to look for**:
- Supports medical necessity clearly
- Appropriate CPT billing code selected
- Required elements present (duration, type, risk level)
- Progress toward treatment goals documented
- Interventions linked to diagnosis/goals

**Score Guide**:
- 9-10: Would pass any insurance audit
- 7-8: Compliant with minor gaps
- 5-6: Some compliance concerns
- 3-4: Likely to face audit questions
- 1-2: Non-compliant documentation

### 5. Actionability (15% weight)

Evaluates clarity and usefulness of the treatment plan.

**What to look for**:
- Clear treatment plan for next steps
- Measurable goals specified
- Specific interventions planned
- Homework assignments documented
- Follow-up schedule clear

**Score Guide**:
- 9-10: Excellent roadmap for continued treatment
- 7-8: Clear plan with minor gaps
- 5-6: Plan present but vague
- 3-4: Minimal actionable content
- 1-2: No clear next steps

## Iteration Log Format

When logging iterations for DAP notes evaluation, use this format:

```markdown
## Iteration N - YYYY-MM-DD

### Evaluation Scores (Before → After)
- Overall: X/10 → Y/10
- Completeness: X/10 → Y/10
- Accuracy: X/10 → Y/10
- Clinical Appropriateness: X/10 → Y/10
- Insurance Compliance: X/10 → Y/10
- Actionability: X/10 → Y/10

### Changes Made
1. [Prompt file]: [Specific change]
2. [Prompt file]: [Specific change]

### Reasoning
[Why these changes were made based on evaluation feedback]

### Expected Impact
[Which dimensions should improve and why]

### Actual Impact
[To be filled after re-evaluation]
```

## Good Output Example

A high-quality DAP note includes:

```markdown
## Data (Subjective & Objective)

**Subjective**: Client reported feeling "overwhelmed by work deadlines" and experiencing
difficulty sleeping (4-5 hours/night vs. usual 7-8). Client stated, "I can't turn my
brain off at night." Denied suicidal ideation. Reports appetite unchanged.

**Objective**: Client appeared fatigued (dark circles under eyes), maintained good eye
contact, speech rate slightly elevated. Affect anxious but reactive. Engaged actively
in session exercises.

## Assessment

Client presents with acute stress response secondary to work pressures. Sleep disruption
maintaining anxiety cycle. Good insight into stress-anxiety connection. Risk level low -
no SI/HI, strong social support, engaged in treatment.

Progress toward goals: Moderate - client implementing breathing techniques (Goal 1) but
struggling with boundary-setting at work (Goal 2).

## Plan

1. Continue weekly CBT sessions focusing on cognitive restructuring
2. Introduce sleep hygiene protocol (handout provided)
3. Homework: Complete thought record x3 this week, implement "worry time" technique
4. Next session: Review thought records, role-play boundary conversation with supervisor
5. If sleep does not improve in 2 weeks, consider psychiatric consultation for sleep aid

Session: 53 minutes individual psychotherapy | CPT: 90834 | Risk: Low
```

## Poor Output Example

Issues to avoid:

```markdown
## Data
Client was anxious about work.

## Assessment
Client has anxiety disorder and needs help.

## Plan
Continue therapy.
```

**Problems**:
- No client quotes
- No objective observations
- No risk assessment
- Vague diagnostic language
- No specific interventions
- No homework
- No billing information
- No measurable goals

## Error Handling

| Error | Solution |
|-------|----------|
| Missing dependencies | Run `pnpm install` from root |
| No API key | Set `ANTHROPIC_API_KEY` environment variable |
| No synthetic data | Run `dap synthetic` first |
| File not found | Check paths relative to `packages/data` |
| Evaluation fails | Ensure both session and DAP note files exist |

## Tips for Effective DAP Evaluation

1. **Focus on one dimension at a time** - Don't try to fix all issues at once
2. **Make small, targeted prompt changes** - Large rewrites are hard to evaluate
3. **Test with diverse scenarios** - Use different `--scenario` types for synthetic data
4. **Review built prompts** - Check `output/prompts/` to see what's actually sent to the AI
5. **Track iterations carefully** - The iteration log shows what works
