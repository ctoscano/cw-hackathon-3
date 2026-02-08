---
name: evaluation-user
description: User prompt for DAP note evaluation
version: "1.0.0"
variables:
  - sessionInput
  - dapOutput
---

# Evaluate DAP Note Quality

Please evaluate the following DAP note against the original session description. Provide detailed scoring and actionable feedback.

## Original Session Description (Input)

```
{{sessionInput}}
```

## Generated DAP Note (Output)

```json
{{dapOutput}}
```

## Evaluation Tasks

1. **Score each dimension** (1-10):
   - Completeness: Are all sections properly filled?
   - Accuracy: Does it reflect the input faithfully?
   - Clinical Appropriateness: Is the language professional?
   - Insurance Compliance: Would it pass an audit?
   - Actionability: Is the plan clear and useful?

2. **Calculate overall score** as weighted average:
   - Completeness: 20%
   - Accuracy: 25%
   - Clinical Appropriateness: 20%
   - Insurance Compliance: 20%
   - Actionability: 15%

3. **Identify strengths**: What did the system do well?

4. **Identify improvements**: What specific changes would improve the note?

5. **Prompt suggestions**: Based on any shortcomings, what modifications to the system prompt would help generate better notes in the future? Be specific about:
   - Missing instructions that should be added
   - Existing instructions that should be clarified
   - Examples that might help
   - Structural changes to try

Provide your evaluation in a structured format with clear reasoning for each score.
