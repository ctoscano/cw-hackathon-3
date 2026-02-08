# Intake Prompt Version 1 (v1)

## Overview

**Version:** v1
**Created:** 2026-02-01
**Status:** Superseded by v2
**Author:** CW Hackathon Team
**Git Commit:** 5255cf6

## Purpose

This is the initial/baseline version of the intake questionnaire prompts. It establishes the foundational approach for generating supportive reflections and personalized completion outputs.

## Motivation

Created as the first implementation of a warm, supportive intake experience that helps people explore whether therapy might be right for them. Focuses on:

- Human, warm, professional tone
- Plain language over clinical jargon
- No diagnosis or prescriptive advice
- Emphasizing agency and choice
- Normalizing ambivalence and uncertainty

## Components

### 1. Reflection Prompts
- **reflection-system.md**: System prompt for generating brief reflections after each intake question
- **reflection-user.md**: User template for reflection generation with question context

### 2. Completion Prompts
- **completion-system.md**: System prompt for generating final outputs (brief, session guide, experiments)
- **completion-user.md**: User template for completion generation with all answers

## Key Characteristics

### Tone
- Warm and thoughtful, like a knowledgeable friend
- Avoids clinical labels and diagnostic language
- Treats hesitation as wisdom, not resistance

### Reflection Approach (1-2 sentences after each question)
1. Reflects back meaning (not parroting)
2. Normalizes the experience
3. Encourages gentle continuation without pressure

**Length**: 1-2 sentences (no specific word limit)

### Completion Outputs
1. **Personalized Brief**: How therapy might help based on their specific patterns
2. **First Session Guide**: Practical advice for getting the most from a first session
3. **Pre-Therapy Experiments**: 2-3 safe, optional experiments to try

## Usage

### CLI Commands

Run evaluation with v1 (explicit):
```bash
bun run src/bin/cli.ts intake evaluate --version v1 --scenario ambivalent
```

### Output Location

Outputs are saved to version-specific directories:
- **Reflections & Completions**: `output/intake/v1/generated/`
- **Evaluations**: `output/intake/v1/evaluations/`
- **Synthetic inputs**: `output/intake/synthetic/` (shared across versions)

### File Metadata

All outputs include version tracking:
```json
{
  "metadata": {
    "promptVersion": "v1",
    "scenario": "ambivalent",
    "generatedAt": "2026-02-04T..."
  }
}
```

## Changes from Previous

N/A - This is the baseline version.

## Issues Identified

Based on user feedback and initial testing:

1. **Verbosity**: Reflections often exceeded 1-2 sentences and felt too lengthy
2. **Conversational flow**: Responses sometimes felt more like formal acknowledgments than natural conversation
3. **Example length**: Example reflections in the prompt were longer than ideal, potentially encouraging verbose outputs

## Superseded By

**Version v2** (commit f0d4fcf) addressed the verbosity issues by:
- Enforcing stricter length limits (1 sentence, max ~15 words)
- Adding explicit guidance about conversational brevity
- Shortening example reflections to model desired length

## Evaluation Metrics

When comparing this version to future iterations, consider:

1. **Reflection Quality**
   - Specificity to user's answer
   - Naturalness and warmth
   - Avoidance of generic encouragement

2. **Completion Relevance**
   - Personalization to intake responses
   - Practical usefulness of session guide
   - Safety and relevance of experiments

3. **Overall Tone**
   - Warmth without being saccharine
   - Professional without being clinical
   - Empowering without being prescriptive

## Comparison Workflow

To compare v1 with newer versions:

```bash
# Run both versions
bun run src/bin/cli.ts intake evaluate --version v1 --scenario ambivalent
bun run src/bin/cli.ts intake evaluate --version v2 --scenario ambivalent

# Compare outputs
diff output/intake/v1/evaluations/... output/intake/v2/evaluations/...

# Or use visual diff
code --diff output/intake/v1/evaluations/... output/intake/v2/evaluations/...
```
