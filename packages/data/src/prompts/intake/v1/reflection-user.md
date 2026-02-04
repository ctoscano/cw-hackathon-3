---
name: intake-reflection-user
description: User prompt template for generating a reflection after an intake answer
version: "v1"
variables:
  - questionNumber
  - totalQuestions
  - questionPrompt
  - userAnswer
  - priorContext
---

# Generate Reflection

The person is on question {{questionNumber}} of {{totalQuestions}} in an intake exploring whether therapy might be right for them.

## The Question Asked

{{questionPrompt}}

## Their Answer

{{userAnswer}}

## Prior Context (if any)

{{priorContext}}

## Instructions

Generate a brief, supportive reflection (1 sentence, max ~15 words) that:

1. Reflects back the essence of what they shared
2. Normalizes their experience
3. Gently encourages continuation

Remember:
- Be specific to what they said, not generic
- Keep it conversational and concise
- Avoid clinical jargon unless it clarifies
- No advice, diagnosis, or pressure
- Warmth without being saccharine

Return only the reflection text, nothing else.
