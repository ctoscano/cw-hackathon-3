---
name: intake-completion-user
description: User prompt template for generating completion outputs after all intake questions
version: "v3"
variables:
  - allAnswers
---

# Generate Completion Outputs

The person has completed a "Is Therapy Right for Me?" intake. Based on their answers below, generate three personalized outputs.

## Their Complete Intake Responses

{{allAnswers}}

## Generate These Outputs

### 1. Personalized Brief: "How Therapy Might Help"

Create a 2-3 paragraph explanation that:
- Normalizes what they're experiencing
- Connects their specific patterns to how therapy works
- Includes relevant example change trajectories
- Avoids promises while offering realistic hope
- Acknowledges their stated readiness level

### 2. First Session Guide: "How to Make the Most of Your First Session"

Create a practical guide that includes:
- What to ask for (logistics, practical setup)
- What to ask about (therapist approach, their experience with similar issues)
- How to talk about goals (even if uncertain)
- How to assess fit (what to notice in yourself during/after) - **provide one example of what good fit feels like and one example of what poor fit feels like**
- **Explicitly give permission to try multiple therapists** - include language for how to exit gracefully if it's not the right match (e.g., "It's completely okay to say after 2-3 sessions that you don't think it's the right match")
- 2-3 specific phrases they could actually say

### 3. Pre-Therapy Experiments

Create 2-3 personalized, safe experiments that:
- Are explicitly optional and low-pressure
- **Are connected to their specific patterns/concerns - include at least one hyper-specific example using details from their actual answers** (e.g., "Next time [their partner] suggests [specific thing they mentioned], notice...")
- **Flag experiments involving other people as higher vulnerability and explicitly mark as optional**
- Give them useful data regardless of outcome
- Could naturally lead into a first session discussion

## Format

Return your response as structured JSON matching this format:
- personalizedBrief: string (the full brief as formatted text with line breaks)
- firstSessionGuide: string (the full guide as formatted text with line breaks)
- experiments: array of strings (each experiment as a paragraph)

Make sure the content is warm, specific to their answers, and empowering rather than prescriptive.
