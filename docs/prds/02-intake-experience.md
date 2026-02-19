# PRD: "Is Therapy Right for Me?" Guided Intake Experience

> **Status: Accepted** | Merged via PR #4 on 2026-02-01

## Overview

A guided, step-by-step intake experience for adults considering therapy. The goal is to help users make an informed, self-directed decision about whether therapy is worth trying, what kinds of therapy might fit them, and how therapy could help their specific situation.

**Key Principles:**
- Not therapy - educational and exploratory
- Normalizes ambivalence
- Models collaborative, respectful interaction
- No diagnosis, no labels, no pressure

## Implementation Plan

### Phase 1: Data Layer (packages/data)

#### Step 1.1: Create Zod Schemas
**File:** `packages/data/src/lib/ai/intake-schemas.ts`

Create schemas for:
- `IntakeQuestionSchema` - defines question structure (id, prompt, type, options, intention)
- `IntakeAnswerSchema` - user's answer to a question
- `IntakeStepRequestSchema` - API request (intakeType, stepIndex, priorAnswers, currentAnswer)
- `IntakeStepResponseSchema` - API response (reflection, nextQuestion, isComplete, completionOutputs)
- `IntakeCompletionOutputsSchema` - final outputs (personalizedBrief, firstSessionGuide, experiments)

**Testable:** Import schemas, validate sample data

#### Step 1.2: Create Intake Definitions
**File:** `packages/data/src/lib/intake/definitions.ts`

Create data-driven intake definitions:
- `IntakeDefinition` type with questions array
- `therapyReadiness` intake with all 9 questions from PRD
- Each question includes: id, prompt, type (text/multiselect/singleselect), options, clinicalIntention

**Testable:** Import definition, verify 9 questions exist

#### Step 1.3: Create Prompt Templates
**Files:**
- `packages/data/src/prompts/intake/reflection-system.md` - system prompt for generating reflections
- `packages/data/src/prompts/intake/reflection-user.md` - user prompt with variables
- `packages/data/src/prompts/intake/completion-system.md` - system prompt for completion outputs
- `packages/data/src/prompts/intake/completion-user.md` - user prompt for final generation

**Testable:** Load prompts, verify frontmatter and content

#### Step 1.4: Create Intake Builder Functions
**File:** `packages/data/src/lib/intake/builder.ts`

Functions:
- `buildReflectionPrompt(question, answer, priorContext)` - builds prompt for reflection generation
- `buildCompletionPrompt(allAnswers)` - builds prompt for final outputs
- `getNextQuestion(intakeType, currentIndex)` - retrieves next question
- `processIntakeStep(request)` - main orchestration function

**Testable:** Call functions with mock data, verify output structure

#### Step 1.5: Export from Package
**File:** Update `packages/data/src/index.ts`

Export all intake-related functions and schemas.

**Testable:** Import from @cw-hackathon/data in web app

---

### Phase 2: API Layer (apps/web)

#### Step 2.1: Create Intake API Route
**File:** `apps/web/app/api/intake/step/route.ts`

POST endpoint that:
- Accepts: intakeType, stepIndex, priorAnswers, currentAnswer
- Validates input using Zod schemas
- Calls `processIntakeStep()` from data package
- Returns: reflection, nextQuestion (if any), isComplete, completionOutputs (if complete)

**Testable:** curl/fetch to endpoint with valid payload, verify response structure

---

### Phase 3: Frontend (apps/web)

#### Step 3.1: Create Page Component
**File:** `apps/web/app/intake/page.tsx`

Server Component with:
- Page metadata (title, description)
- Main layout wrapper
- IntakeForm client component

**Testable:** Navigate to /intake, see page title

#### Step 3.2: Create IntakeForm Client Component
**File:** `apps/web/app/intake/intake-form.tsx`

Client Component managing:
- State: currentStep, answers[], visibleHistory[], loading, error
- Progressive disclosure: show completed Q&A pairs with reflections
- Current question input (textarea for text, checkboxes for multiselect, radio for singleselect)
- Submit handler that calls API and updates state
- Completion view with final outputs

UI Flow:
1. Show first question
2. User answers, clicks Continue
3. Show loading state
4. Receive reflection, show it with previous Q&A
5. Show next question below
6. Repeat until complete
7. Show completion outputs

**Testable:** Complete full intake flow in browser

#### Step 3.3: Create Styling
**File:** `apps/web/app/intake/intake.module.css`

Styles for:
- Main container
- Question cards (completed vs active)
- Answer display (read-only)
- Reflection text styling
- Input controls (textarea, checkboxes, radio)
- Progress indicator
- Completion outputs
- Responsive design

**Testable:** Visual inspection of all states

---

### Phase 4: Polish & Testing

#### Step 4.1: End-to-End Testing
- Complete intake flow manually
- Verify all 9 questions appear correctly
- Verify reflections are contextual
- Verify completion outputs are personalized

#### Step 4.2: Error Handling
- Handle API errors gracefully
- Show loading states
- Validate input before submission

---

## Technical Specifications

### API Contract

**POST /api/intake/step**

Request:
```typescript
{
  intakeType: "therapy_readiness";
  stepIndex: number; // 0-8
  priorAnswers: Array<{
    questionId: string;
    answer: string | string[];
    reflection: string;
  }>;
  currentAnswer: string | string[];
}
```

Response (in progress):
```typescript
{
  reflection: string;
  nextQuestion: {
    id: string;
    prompt: string;
    type: "text" | "multiselect" | "singleselect";
    options?: string[];
  } | null;
  isComplete: false;
}
```

Response (complete):
```typescript
{
  reflection: string;
  nextQuestion: null;
  isComplete: true;
  completionOutputs: {
    personalizedBrief: string;
    firstSessionGuide: string;
    experiments: string[];
  };
}
```

### Question Types

1. **text** - Free-form textarea input
2. **multiselect** - Checkboxes, multiple selections allowed
3. **singleselect** - Radio buttons, single selection

### Intake Questions Summary

| # | Type | Topic |
|---|------|-------|
| 1 | text | What's made you consider therapy? |
| 2 | multiselect | Areas of life affected |
| 3 | text | Patterns when issue shows up |
| 4 | multiselect | What you've tried |
| 5 | text | Worry if nothing changes |
| 6 | text | Hopes for therapy |
| 7 | multiselect | Hesitations/concerns |
| 8 | singleselect | Preferred therapy style |
| 9 | singleselect | Readiness level |

---

## Success Metrics

- Users complete intake (not abandoning mid-flow)
- Reflections feel personalized, not generic
- Completion outputs provide actionable value
- Page is responsive and accessible
