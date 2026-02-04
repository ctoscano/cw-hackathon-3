# Intake Flow Enhancements - Product Requirement Document

<!--
META-INSTRUCTIONS FOR LLMs:
This template provides a structured format for creating Product Requirement Documents (PRDs).
When creating a new PRD, replace all placeholder text in [brackets] with actual content.
Follow the guidance in HTML comments for each section.
Remove or replace example content as appropriate.
Keep the section structure intact - all four main sections are required.
-->

## Purpose

<!--
META-INSTRUCTIONS FOR LLMs:
- Write 2-4 sentences clearly stating what will be built
- Include the "why" - what problem does this solve or what value does it add?
- Be specific about scope - what's included and what's explicitly excluded
- Use active voice and present tense
- Focus on outcomes, not implementation details

EXAMPLE:
"This PRD defines the implementation of a user authentication system that enables
secure login and session management. It addresses the need for protecting user data
and restricting access to authorized users only. The scope includes email/password
authentication and JWT-based sessions, but excludes OAuth providers and 2FA."
-->

This PRD defines enhancements to the therapy readiness intake flow to improve user experience, perceived performance, and output quality. The improvements include: (1) adding value proposition messaging at the start, (2) optimizing the completion flow by starting personalized result generation earlier, (3) adding delightful confetti animation on completion, (4) enabling "Open in ChatGPT" functionality for appropriate interventions, (5) rendering markdown in results, and (6) improving result quality through systematic evaluation and iteration. These changes address user feedback about clarity, perceived wait time, and output usefulness while maintaining the chat-style UI and optimistic rendering patterns.

## Product Context: Intake Purpose & Tone

**Core purpose:**
This intake is a guided, step-by-step experience helping adults explore whether therapy is worth trying right now. It is **educational and exploratory**, not diagnostic or therapeutic. The goal is to help users make an informed, self-directed decision about therapy fit.

**Product goals:**
1. Normalize ambivalence about therapy
2. Increase clarity and readiness
3. Improve first-session effectiveness
4. Increase follow-through without pressure
5. Model what good therapy feels like: collaborative, respectful, non-pathologizing

**Tone requirements (ALL copy must follow these):**
- Human, warm, professional
- Plain language first; clinical terminology may appear in parentheses
- No diagnosis, no labels, no "you should"
- Emphasize agency, choice, and curiosity
- Normalize ambivalence and uncertainty

**What the intake generates at completion:**
1. Brief personalized explanation of how therapy might help (normalizing, no guarantees)
2. Guidance for making the most of the first session (what to ask, how to assess fit)
3. 2-3 safe, personalized pre-therapy experiments (optional, low-intensity, reversible)

**Non-goals (explicit):**
- No diagnosis
- No symptom scoring
- No crisis assessment
- No replacement for therapy
- No behavior change mandate

## Constraints

<!--
META-INSTRUCTIONS FOR LLMs:
- List all constraints that limit or guide the implementation
- Group into categories: Technical, Business/Timeline, Dependencies, Compatibility
- Each constraint should be a bullet point starting with "Must", "Cannot", "Requires", etc.
- Be specific and actionable - avoid vague constraints
- Include rationale in parentheses if it's not obvious

CATEGORIES:
- Technical: Framework requirements, language versions, architecture patterns, performance requirements
- Business/Timeline: Deadlines, budget limits, team size, approval processes
- Dependencies: What must exist first, what this blocks, integration requirements
- Compatibility: Browser support, API versions, backward compatibility needs

EXAMPLE CONSTRAINTS:
- Must use Next.js 15 App Router (project standard)
- Cannot modify existing authentication middleware (in use by other features)
- Requires PostgreSQL database to be set up first
- Must maintain backward compatibility with v1 API endpoints
- Performance requirement: Login must complete within 2 seconds
-->

### Technical Constraints
- Must use existing Next.js 15 App Router and React 19 components
- Must maintain chat-style UI with optimistic rendering pattern
- Must preserve existing reflection bubble styling and spacing improvements
- Must use Magic UI components already installed (confetti)
- Cannot break existing intake API endpoints or response schemas
- Must maintain LLM-generated reflections (no templated responses)

### Business/Timeline Constraints
- Should improve perceived performance without increasing actual API latency
- Must not increase LLM API costs significantly
- Quality improvements should be measurable and verifiable

### Dependencies
- Requires evaluation skill to be functional for quality iteration
- Requires ChatGPT deep link format documentation or examples
- Depends on existing intake API structure and schemas

### Compatibility Requirements
- Must work with existing therapy_readiness intake type
- Must be compatible with current Zod validation schemas
- Markdown rendering must not break existing text display

## Technical Requirements

<!--
META-INSTRUCTIONS FOR LLMs:
- Break this section into clear subsections
- Required subsections: Files to Create, Files to Modify
- Optional subsections: Architecture Decisions, Tech Stack, Database Schema, API Endpoints
- For each file, provide:
  * Full path from project root
  * Brief description of purpose/responsibility
  * Key requirements or structure notes
  * Important exports or interfaces
- Include code snippets for complex structures
- List all new dependencies with versions
- Describe data models, API contracts, or component interfaces

FORMATTING:
- Use numbered lists for files
- Use **bold** for file paths
- Use `code` for technical terms, function names, types
- Use code blocks for examples
-->

### Files to Create

<!--
List all new files that must be created.
For each file:
1. **`full/path/to/file.ext`** - One-line description
   - Key requirement or structure note
   - Important exports or functionality
   - Dependencies or related files
-->

No new files required for this enhancement.

### Files to Modify

<!--
List all existing files that need changes.
For each file:
1. **`full/path/to/file.ext`** - What changes are needed
   - Specific modifications required
   - Sections to add/remove/update
   - Impact on existing functionality
-->

1. **`apps/web/app/intake/intake-form.tsx`** - Add value proposition header and optimize completion flow
   - Add header section at top explaining what users will receive
   - Modify submission logic to trigger completion generation after Q8 instead of Q9
   - Add confetti animation trigger on successful completion
   - Render markdown in completion outputs

2. **`packages/data/src/lib/intake/builder.ts`** - Update intake question flow
   - Make Q9 non-critical (doesn't influence results)
   - Or add a neutral question that doesn't impact scoring if needed

3. **`packages/data/src/prompts/intake/completion-*.md`** - Enhance completion prompts
   - Add instruction to identify one intervention suitable for "Open in ChatGPT"
   - Add guidance for higher quality, more specific recommendations
   - Improve clarity and specificity in output instructions

4. **`packages/data/src/schemas/intake.ts`** - Add chatGPT field to intervention schema
   - Add optional `chatGptPrompt` field to intervention type
   - Document field purpose and usage

5. **`apps/web/app/intake/page.tsx`** - Add confetti component and "Open in ChatGPT" button
   - Import and trigger confetti animation on completion
   - Add button component for interventions with chatGptPrompt
   - Render markdown in text fields using markdown renderer

### Tech Stack

<!--
OPTIONAL SECTION - Include if adding new technologies or dependencies.
- List new dependencies with versions
- Explain why each dependency was chosen
- Note any peer dependencies or setup requirements
- Include installation commands
-->

- **Magic UI Confetti** (already installed) - Delightful completion celebration
- **react-markdown** or **marked** - Render markdown in completion outputs (to be determined based on what's already available or lightest weight)

### Data Models

<!--
OPTIONAL SECTION - Include if creating new data structures.
- Define interfaces, types, or database schemas
- Show relationships between entities
- Include validation rules
- Provide example data
-->

Update to `IntakeIntervention` schema:

```typescript
// In packages/data/src/schemas/intake.ts
export const intakeInterventionSchema = z.object({
  name: z.string(),
  description: z.string(),
  rationale: z.string(),
  chatGptPrompt: z.string().optional(), // NEW: Prompt to open in ChatGPT
});

export type IntakeIntervention = z.infer<typeof intakeInterventionSchema>;
```

Example intervention with ChatGPT prompt:
```json
{
  "name": "Cognitive Restructuring Exercises",
  "description": "Daily practice identifying and challenging negative thought patterns...",
  "rationale": "Based on your tendency toward overthinking...",
  "chatGptPrompt": "I'm working on identifying and challenging negative thought patterns. Can you guide me through a cognitive restructuring exercise for this specific situation: [user will fill in their situation]?"
}
```

## Steps

<!--
META-INSTRUCTIONS FOR LLMs:
- Number each step sequentially (Step 1, Step 2, etc.)
- Each step should be discrete and independently verifiable
- Steps should be in logical order (dependencies first)
- Each step MUST include all four subsections: Action, Requirements, Verification, Implementation Log

STEP STRUCTURE:
### Step N: [Clear Action Title]
**Action**: One sentence describing what to do
**Requirements**: Bulleted list of specific requirements
**Verification**: Bash commands or tests to verify completion, with expected output
**Implementation Log**: Checkbox list to track actual implementation work

VERIFICATION GUIDELINES:
- Include actual commands that can be run
- Show expected output or success criteria
- Use vitest for unit tests: pnpm test path/to/test.spec.ts
- Use CLI commands for integration tests: bun run src/bin/cli.ts [command]
- Use bash commands for file verification: cat, ls, grep
- Be specific about what "success" looks like

IMPLEMENTATION LOG:
- Start with empty checkboxes [ ]
- Add specific sub-tasks for this step
- Update with [x] as work completes
- Add timestamps or notes as needed
- This section gets updated during implementation, not planning
-->

### Step 1: Add Value Proposition Header

**Action**: Add a header section at the top of the intake form explaining what users will receive from completing the questionnaire.

**Requirements**:
- Display before the first question
- Explain what personalized feedback will include (strengths, growth areas, recommended interventions, therapy approach fit)
- Use welcoming, clear language
- Style consistently with existing chat UI
- Should not add significant vertical space or push questions down

**Verification**:
```bash
# Visit the intake page
# URL: http://localhost:3003/intake

# Expected output:
# - Header visible above first question
# - Contains text about personalized feedback
# - Mentions: strengths, areas for growth, recommended interventions
# - Visually distinct from questions but harmonious with chat UI
```

**Implementation Log**:
- [x] Draft value proposition copy (2026-02-03 14:34)
- [x] Add header component to intake-form.tsx (2026-02-03 14:34)
- [x] Style header to match chat UI (2026-02-03 14:34)
- [x] Review copy against intake purpose and tone requirements (2026-02-03 15:12)
- [x] Revise copy to be exploratory, agency-focused, non-clinical (2026-02-03 15:12)
- [x] Document intake purpose in PRD Product Context section (2026-02-03 15:12)
- [ ] Verify layout and spacing
- [ ] Test on mobile viewport

### Step 2: Optimize Completion Flow Timing

**Action**: Trigger personalized result generation after Q8 submission instead of waiting for Q9, making the flow feel snappier.

**Requirements**:
- Determine if Q9 is truly non-critical for results
- If Q9 is critical, add a neutral question that doesn't influence scoring
- Modify submission flow to start completion generation early
- Ensure Q9 answer is still collected if it exists
- Handle edge cases where user might skip or go back

**Verification**:
```bash
# Complete intake through Q8
# Observe that "generating results" state begins
# Answer Q9
# Verify results appear quickly (within 1-2s after Q9)

# Expected: Perceived wait time after final question is minimal
```

**Implementation Log**:
- [x] Analyze Q9 impact on completion results (2026-02-03 15:45)
- [x] Decision: Q9 (readiness check) is non-critical for therapeutic analysis (2026-02-03 15:45)
- [x] Create /api/intake/completion endpoint for early generation (2026-02-03 15:48)
- [x] Modify intake-form.tsx to trigger completion after Q8 submission (2026-02-03 15:50)
- [x] Implement promise-based early completion handling (2026-02-03 15:50)
- [ ] Test completion flow end-to-end
- [ ] Verify perceived wait time reduction
- [ ] Verify Q9 answer still collected

### Step 3: Add Confetti Animation on Completion

**Action**: Trigger delightful confetti animation when personalized results are successfully displayed.

**Requirements**:
- Use Magic UI confetti component (already installed)
- Trigger once when completion state is reached
- Should not block or delay results display
- Animation should be celebratory but not overwhelming
- Respect prefers-reduced-motion user preference

**Verification**:
```bash
# Complete full intake flow
# Answer all questions including final question
# Observe completion results appear with confetti animation

# Expected:
# - Confetti appears when results display
# - Animation does not block content
# - Works on both desktop and mobile
```

**Implementation Log**:
- [x] Install canvas-confetti package (2026-02-03 16:05)
- [x] Create confetti utility with reduced-motion support (2026-02-03 16:06)
- [x] Add trigger logic to intake-form.tsx completion state (2026-02-03 16:08)
- [x] Implement 300ms delay for smooth appearance (2026-02-03 16:08)
- [ ] Test animation timing and appearance
- [ ] Verify reduced-motion handling
- [ ] Test on multiple viewports

### Step 4: Add "Open in ChatGPT" Functionality

**Action**: Enable at least one recommended intervention to open in ChatGPT with a pre-filled prompt.

**Requirements**:
- Update completion prompts to identify one intervention suitable for ChatGPT
- Add `chatGptPrompt` field to intervention schema
- Add "Open in ChatGPT" button to intervention card when prompt exists
- Use ChatGPT deep link format: `https://chat.openai.com/?q=[encoded prompt]`
- Button should be visually distinct and clearly labeled
- Handle URL encoding properly

**Verification**:
```bash
# Complete intake flow
# View results
# Find intervention with "Open in ChatGPT" button
# Click button - should open ChatGPT in new tab with prompt pre-filled

# Expected:
# - At least one intervention has button
# - Button opens ChatGPT with relevant prompt
# - Prompt is contextual and useful
```

**Implementation Log**:
- [x] Research ChatGPT deep link URL format (2026-02-03 16:25)
- [x] Create chatgpt.ts utility with URL generation (2026-02-03 16:26)
- [x] Create prompt wrapper for experiments (2026-02-03 16:26)
- [x] Add button component to first experiment (2026-02-03 16:28)
- [x] Implement URL encoding and link generation (2026-02-03 16:28)
- [x] Add CSS styling for ChatGPT button (2026-02-03 16:30)
- [ ] Test link opening in ChatGPT
- [ ] Verify UX and button styling

### Step 5: Render Markdown in Results

**Action**: Render markdown formatting in completion output fields that currently show raw markdown.

**Requirements**:
- Identify which fields use markdown (likely description, rationale fields)
- Choose lightweight markdown renderer (react-markdown or similar)
- Add markdown rendering to completion output display
- Preserve existing styling and layout
- Handle edge cases (no markdown, malformed markdown)
- Ensure security (no XSS vulnerabilities)

**Verification**:
```bash
# Complete intake flow
# View results
# Verify markdown is rendered (bold, italics, lists, etc.)
# Check that no raw markdown syntax is visible

# Expected:
# - Bold text renders as <strong>
# - Lists render as <ul>/<ol>
# - Links render as clickable <a> tags
# - No raw ** or * visible
```

**Implementation Log**:
- [x] Audit completion outputs (all text fields may contain markdown) (2026-02-03 16:32)
- [x] Install react-markdown with remark-gfm (2026-02-03 16:33)
- [x] Create Markdown component wrapper (2026-02-03 16:34)
- [x] Update personalizedBrief to use Markdown (2026-02-03 16:36)
- [x] Update firstSessionGuide to use Markdown (2026-02-03 16:36)
- [x] Update experiments to use Markdown (2026-02-03 16:37)
- [ ] Test with various markdown syntax
- [ ] Verify styling matches existing design

### Step 6: Improve Result Quality with Evaluation

**Action**: Use the evaluation skill and CLI to systematically improve completion result quality through iteration.

**Requirements**:
- Generate sample completions using CLI: `bun run src/bin/cli.ts dap generate`
- Use evaluation skill to assess quality
- Document specific weaknesses (generic advice, lack of specificity, etc.)
- Iterate on completion prompts to address weaknesses
- Re-evaluate to measure improvement
- Aim for specific, actionable, personalized recommendations

**Verification**:
```bash
# Generate multiple sample completions
cd packages/data
bun run src/bin/cli.ts dap generate --count 5

# Use evaluation skill to review
# /evaluate or manually review outputs

# Expected improvements:
# - Recommendations are specific and actionable
# - Outputs feel personalized to user input
# - Advice goes beyond generic therapy suggestions
# - Rationales clearly connect to user's situation
```

**Implementation Log**:
- [ ] Generate baseline sample completions
- [ ] Run evaluation skill on samples
- [ ] Document specific quality issues
- [ ] Update completion system prompt
- [ ] Update completion user prompt
- [ ] Generate new samples
- [ ] Re-evaluate for improvement
- [ ] Iterate until quality criteria met

## Completion Criteria

<!--
META-INSTRUCTIONS FOR LLMs:
OPTIONAL SECTION - Include for complex projects.
- List the overall criteria for considering this PRD complete
- Should be high-level outcomes, not individual step verifications
- Must be objectively verifiable
- Typically 3-5 criteria

EXAMPLES:
- All unit tests passing (pnpm test)
- Feature deployed to staging environment
- Documentation updated and reviewed
- Performance benchmarks met (< 2s response time)
- Security audit passed
-->

- [ ] Value proposition header displays and clearly explains what users will receive
- [ ] Completion results appear within 1-2 seconds after final question submission
- [ ] Confetti animation triggers on completion (respecting reduced-motion preference)
- [ ] At least one intervention includes "Open in ChatGPT" button that works correctly
- [ ] Markdown renders properly in all completion output fields
- [ ] Completion results quality improved measurably (specific, actionable, personalized)
- [ ] All intake flow tests passing
- [ ] No regression in existing functionality (reflections, optimistic UI, spacing)

## Notes

<!--
META-INSTRUCTIONS FOR LLMs:
OPTIONAL SECTION - Use for additional context.
- Add any information that doesn't fit other sections
- Include links to related documents, RFCs, or discussions
- Note future enhancements or out-of-scope items
- Add stakeholder names or review requirements
- This section can be updated throughout implementation
- Add subsections during implementation via /prd impl:
  * Gotchas & Surprises - unexpected challenges, edge cases, things to watch out for
  * Demo Instructions - how to demo the feature (URL or CLI command)
-->

**Context:**
This PRD builds on the previous intake chat UI redesign (docs/prds/intake-chat-ui.md), which implemented:
- Chat-style message bubbles (questions left, answers right, reflections left)
- Optimistic UI (next question appears immediately)
- Rotating word animation for reflection loading
- Reduced spacing and improved visual density

**Out of Scope:**
- OAuth integration with ChatGPT
- Saving/persistence of intake results
- Sharing or exporting results
- Multi-language support
- Additional intake types beyond therapy_readiness

**Future Enhancements:**
- A/B test value proposition messaging
- Add progress indicator showing completion percentage
- Allow users to go back and edit previous answers
- Save partial progress for resume later
- Email results to user

### Gotchas & Surprises

<!--
Added during implementation via /prd impl.
Document unexpected challenges, edge cases, and surprises encountered.
-->

**Bugs Discovered During Testing (2026-02-03):**

1. **Last Question Shows Both Reflection and Completion Waiting** ✅ FIXED
   - Issue: Q9 submission shows both "Thinking..." reflection bubble AND border-beam completion waiting state
   - Expected: Only show border-beam completion waiting state for last question
   - Root cause: Optimistic UI adds loading reflection for all questions, including last one
   - Fix applied: Skip adding loading reflection when `isLastQuestion` is true
   - Files modified: [intake-form.tsx](apps/web/app/intake/intake-form.tsx#L241-L267)

2. **Double Confetti Trigger** ✅ FIXED
   - Issue: Confetti animation triggers twice when Q9 response completes
   - Expected: Confetti should only trigger when personalized results appear
   - Root cause: Confetti triggered on state="complete", then again when early completion promise resolved and set outputs
   - Fix applied: Moved confetti trigger to only fire when `setCompletionOutputs` is called
   - Files modified: [intake-form.tsx](apps/web/app/intake/intake-form.tsx#L308-L328)

3. **BorderBeam Not Visible** ✅ FIXED
   - Issue: Border-beam animation wasn't showing on completion waiting card
   - Root cause: BorderBeam requires a sized container (needs explicit height)
   - Fix applied: Added `min-height: 200px` to `.completionWaitingCard`
   - Files modified: [intake.module.css](apps/web/app/intake/intake.module.css#L515-L529)

4. **Typing Animation Jitter** ✅ FIXED
   - Issue: Completion waiting state typing animation jitters when displaying empty string between word transitions
   - Root cause: No min-height on typing animation element, causes layout shift
   - Fix applied: Added `min-height: 1.6875rem` to `.completionWaitingText` (calculated from font-size × line-height)
   - Files modified: [intake.module.css](apps/web/app/intake/intake.module.css#L531-L539)

**Missing Features Identified:**

3. **No "Other" Option Support** ✅ IMPLEMENTED
   - Issue: Multiple choice questions don't support free-text "Other" responses
   - Current: User can only select from predefined options
   - Implementation: Added conditional text input that appears when "Other" is selected
   - Pattern: Common UX pattern for surveys/intakes
   - Changes:
     - Added `otherText` state to track custom "Other" text
     - Modified `getCurrentAnswer()` to replace "Other" with "Other: [custom text]"
     - Updated `isAnswerValid()` to require text when "Other" is selected
     - Added conditional rendering of text input field for both multiselect and singleselect
     - Added CSS styling for `.otherInput` and `.otherInputWrapper`
     - Updated demo page with "Other" option example
   - Files modified:
     - [intake-form.tsx](apps/web/app/intake/intake-form.tsx#L102-L589)
     - [intake.module.css](apps/web/app/intake/intake.module.css#L310-L343)
     - [intake-demo.tsx](apps/web/app/intake/demo/intake-demo.tsx#L350-L390)

4. **No Wait-State Engagement** ✅ IMPLEMENTED
   - Issue: User has nothing to do while completion generates (even with Q9 optimization)
   - Implementation: Added optional contact form during completion waiting state
   - Purpose: Enable therapist connection, result delivery via email/SMS
   - Features:
     - Two-step flow: initial prompt with Yes/No buttons, then form if user chooses Yes
     - Collects email OR phone number (both fields optional)
     - Warm, inviting copy: "While you wait, would you like us to help connect you with a therapist?"
     - Clear skippability: "You can skip this - your results will show below either way"
     - No backend integration (placeholder only, data not persisted)
     - Visually integrated with border-beam waiting card
   - Tone: Warm invitation, emphasizes agency and choice
   - Files modified:
     - [intake-form.tsx](apps/web/app/intake/intake-form.tsx#L108-L551)
     - [intake.module.css](apps/web/app/intake/intake.module.css#L543-L640)
     - [intake-demo.tsx](apps/web/app/intake/demo/intake-demo.tsx#L213-L251)

5. **Completion Waiting State Needs Polish**
   - Issue: Current spinner feels generic and uninspiring
   - Better: Use border-beam animation from Magic UI for more delight
   - Command: `pnpm dlx shadcn@latest add @magicui/border-beam`
   - Impact: More engaging wait experience, matches brand quality

### Demo Instructions

<!--
Added during implementation via /prd impl or /prd end.
Provide clear instructions on how to demo this feature.
Include URLs to visit or CLI commands to run.
-->

**How to Demo:**

### Quick Demo: Component Showcase

**Visit the demo page to see all new features isolated:**
```bash
# Start dev server
cd apps/web
pnpm dev

# Visit: http://localhost:3003/intake/demo
```

**Demo page includes:**
- Value proposition header with exploratory language
- Confetti animation trigger button
- ChatGPT button styling and behavior
- Markdown rendering examples
- All existing chat UI components

### Full Integration: Complete Intake Flow

**To test the complete user experience:**

**1. Start the web server:**
```bash
cd apps/web
pnpm dev
# Visit http://localhost:3003/intake
```

**2. Observe enhancements throughout the flow:**
- **Value Proposition**: Displays before Q1 with non-clinical language
- **Optimized Flow**: Watch Network tab when submitting Q8 for parallel completion call
- **Confetti**: Triggers when results appear after Q9
- **ChatGPT Button**: First experiment has "Explore this with ChatGPT →"
- **Markdown**: All completion text renders bold, lists, links, etc.

### Testing the Optimized Completion Flow (Step 2) in Detail

1. **Start the web server:**
   ```bash
   cd apps/web
   pnpm dev
   # Visit http://localhost:3003/intake
   ```

2. **Go through the intake flow:**
   - Answer questions 1-7 normally
   - When you submit Q8, watch the Network tab in DevTools
   - You should see TWO API calls:
     - `/api/intake/step` (gets Q8 reflection + Q9 question)
     - `/api/intake/completion` (starts generating completion outputs)

3. **Answer Q9:**
   - Take your time answering Q9 (~10-30 seconds)
   - The completion should be generating in the background

4. **Submit Q9:**
   - Results should appear almost immediately (< 1-2 seconds)
   - Previously: Would take 5-10 seconds after Q9 submission
   - Now: Completion was already generating while you answered Q9

5. **Verify the optimization:**
   - Perceived wait after final question should be minimal
   - Completion outputs should include insights from Q1-Q8
   - No errors in console

---

**Status**: In Progress
**Created**: 2026-02-03
**Last Updated**: 2026-02-03
**Implementation Started**: 2026-02-03
**Completed**: N/A
