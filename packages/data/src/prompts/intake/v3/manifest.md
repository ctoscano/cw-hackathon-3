# Intake Prompt Version 3 (v3)

## Overview

**Version:** v3  
**Created:** 2026-02-04  
**Status:** Experimental (testing in progress)  
**Previous Version:** v2 (reverted to v1 base, then improved)

## Motivation

Comparative evaluation (same scenario, same synthetic input):
- **v1: 9.2/10** - Excellent warmth, empathy, personalization
- **v2: 8.7/10** - Better brevity, but lost warmth and tone quality

**Finding**: v2's strict brevity (1 sentence, ~15 words) over-corrected and sacrificed emotional resonance.

## v3 Strategy: Best of Both Worlds

Revert to v1's 1-2 sentence format + targeted improvements:

1. **Emotional Naming**: Describe patterns WITH feelings (e.g., "how exhausting it feels when...")
2. **Bookend Warmth**: Q1 acknowledges courage, Q9 extra encouraging  
3. **Better Fit Guidance**: Examples of good/poor fit, permission to try multiple therapists
4. **Hyper-Specific Experiments**: Use actual user details (their partner, their patterns)

## Changes from v1

### Reflections
- Added: "aim for 25-40 words" (clarity on range)
- Added: Emotional naming requirement
- Added: Special bookend instructions (Q1 & Q9)
- Updated: All examples now show emotional naming

### Completion Outputs
- Added: Good fit vs poor fit examples in session guide
- Added: Permission to try multiple therapists
- Added: Requirement for hyper-specific experiments with user details
- Added: Vulnerability flagging for experiments involving others

## Target Scores

| Metric | v1 | v2 | v3 Target |
|--------|-----|-----|-----------|
| Overall | 9.2 | 8.7 | **9.4-9.6** |
| Empathic Accuracy | 9.1 | 8.9 | **9.3-9.5** |
| Tone Consistency | 9.4 | 8.5 | **9.3-9.5** |
| Personalization | 9.5 | 9.1 | **9.6-9.8** |
| Actionability | 9.2 | 9.3 | **9.4-9.6** |

## Usage

```bash
# Evaluate v3
bun run src/bin/cli.ts intake evaluate --version v3 --scenario ambivalent

# Compare all three
jq '.overallScore' output/intake/v{1,2,3}/evaluations/intake-eval-*.json
```

## Design Philosophy

- **Data-driven**: Every change based on evaluation scores
- **Conservative**: Build on what works (v1's warmth)
- **Avoid over-correction**: v2 taught us fixing one thing can break others
- **Specificity > Generics**: Always push toward user details
