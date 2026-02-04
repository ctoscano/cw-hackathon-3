# Intake Prompt Version 2 (v2)

## Overview

**Version:** v2
**Created:** 2026-02-01
**Status:** Current version
**Author:** CW Hackathon Team
**Git Commit:** f0d4fcf
**Previous Version:** v1

## Purpose

This version addresses verbosity issues identified in v1 by enforcing stricter brevity requirements for reflections while maintaining warmth and personalization.

## Motivation

User testing and evaluation of v1 revealed that reflections were often too lengthy, disrupting the flow of the intake experience. Users found:

- Reflections exceeded the intended 1-2 sentences
- Responses felt more formal than conversational
- The extra length slowed down the intake flow
- Longer reflections sometimes felt overwrought

v2 implements stricter length constraints to create a more natural, conversational experience.

## Changes from v1

### Reflection Prompts

#### reflection-system.md
**Changed:**
- Line 22: `1-2 sentence response` → `brief 1 sentence response (max ~15 words)`
- Added (lines 28-29): "Keep responses concise and conversational. Aim for the length to feel like a natural, brief acknowledgment rather than an extended reflection."
- Updated all example reflections (lines 41-44) to be shorter and more concise

**Before (v1 examples):**
```
- "Many people come to therapy feeling exactly this kind of tension — wanting change, but unsure how it would actually help."
- "Noticing that you've already tried several approaches is useful information, not a failure."
- "The areas you're describing often connect in ways that aren't obvious at first."
- "That kind of uncertainty about starting is very common, and it's good to name it."
```

**After (v2 examples):**
```
- "That tension between wanting change and uncertainty about therapy is really common."
- "Having tried different approaches shows self-awareness, not failure."
- "The areas you're describing often connect in surprising ways."
- "Uncertainty about starting is normal and worth acknowledging."
```

#### reflection-user.md
**Changed:**
- Line 31: `1-2 sentences` → `1 sentence, max ~15 words`
- Added (line 39): `- Keep it conversational and concise`

### Completion Prompts

No changes - completion prompts remain identical to v1.

## Components

Same as v1:

### 1. Reflection Prompts
- **reflection-system.md**: System prompt with stricter brevity requirements
- **reflection-user.md**: User template with explicit length constraints

### 2. Completion Prompts
- **completion-system.md**: System prompt (unchanged from v1)
- **completion-user.md**: User template (unchanged from v1)

## Key Characteristics

### Tone
- Same warmth and thoughtfulness as v1
- More conversational due to brevity
- Maintains non-clinical, empowering approach

### Reflection Approach
1. Reflects back meaning (not parroting)
2. Normalizes the experience
3. Encourages gentle continuation without pressure

**Length**: 1 sentence, max ~15 words (strict enforcement)

### Completion Outputs
Same as v1 (no changes)

## Usage

### CLI Commands

Run evaluation with v2 (current default):
```bash
bun run src/bin/cli.ts intake evaluate --version v2 --scenario ambivalent
```

Or specify explicitly:
```bash
bun run src/bin/cli.ts intake evaluate --version v2 --scenario ambivalent
```

### Output Location

Outputs are saved to version-specific directories:
- **Reflections & Completions**: `output/intake/v2/generated/`
- **Evaluations**: `output/intake/v2/evaluations/`
- **Synthetic inputs**: `output/intake/synthetic/` (shared across versions)

### File Metadata

All outputs include version tracking:
```json
{
  "metadata": {
    "promptVersion": "v2",
    "scenario": "ambivalent",
    "generatedAt": "2026-02-04T..."
  }
}
```

## Expected Improvements over v1

1. **Faster Flow**: Shorter reflections mean users progress through intake more quickly
2. **More Natural**: Brief acknowledgments feel more conversational
3. **Less Overwrought**: Avoids feeling like over-analysis or therapy itself
4. **Better Pacing**: Maintains momentum without sacrificing warmth

## Known Tradeoffs

1. **Less Detail**: Some nuance may be lost with the 15-word limit
2. **Harder to Personalize**: Less room to reference specific details from answers
3. **Risk of Generic**: With less space, reflections might become formulaic

## Evaluation Focus

When evaluating v2, pay special attention to:

1. **Did we over-correct?** Are reflections now too terse or generic?
2. **Warmth preservation**: Does brevity sacrifice the human touch?
3. **Specificity**: Can reflections still be personalized within 15 words?
4. **User experience**: Do users feel more or less understood?

## Comparison with v1

To compare v2 performance against v1:

```bash
# Run same scenario with both versions
bun run src/bin/cli.ts intake evaluate --version v1 --scenario ambivalent
bun run src/bin/cli.ts intake evaluate --version v2 --scenario ambivalent

# Compare evaluation scores
jq '.overallScore' output/intake/v1/evaluations/intake-eval-*.json
jq '.overallScore' output/intake/v2/evaluations/intake-eval-*.json

# Visual diff of outputs
code --diff output/intake/v1/evaluations/... output/intake/v2/evaluations/...
```

## Future Considerations

Potential areas for v3:

1. **Dynamic Length**: Adjust length based on question complexity or user response length
2. **Tone Variations**: Different warmth levels based on user's expressed comfort
3. **Context Awareness**: Reference prior answers more explicitly when relevant
4. **Progressive Depth**: Start brief, gradually deepen as user engagement increases

## Git Reference

To see exact changes:
```bash
git diff 5255cf6:packages/data/src/prompts/intake/reflection-system.md \
         f0d4fcf:packages/data/src/prompts/intake/reflection-system.md
```
