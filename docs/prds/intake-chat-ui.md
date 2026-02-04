# PRD: Intake Chat-Style UI Redesign

## Overview

Redesign the intake experience to use a chat-like interface that improves perceived performance and creates a more conversational feel. The key insight is that showing the next question immediately after submission—before the personalized reflection arrives—dramatically reduces perceived wait time.

## Goals

1. **Improve perceived performance** - Users see progress immediately, not after LLM latency
2. **Create conversational feel** - Chat-style UI mirrors a therapy conversation
3. **Add visual delight** - SVG animation provides engaging loading state
4. **Maintain mobile-first design** - Works well on all screen sizes

## Design Concept

### Chat-Style Layout

The interface uses a familiar chat pattern:
- **Questions** (from system): Left-aligned, like received messages
- **User answers**: Right-aligned, like sent messages
- **Reflections**: Left-aligned below the answer, with typing indicator animation

```
┌─────────────────────────────────────────┐
│           Is Therapy Right for Me?      │
│    What's made you consider therapy?    │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────┐                │
│  │ 1. What's made you  │   ← Question   │
│  │    consider...      │     (left)     │
│  └─────────────────────┘                │
│                                         │
│              ┌─────────────────────┐    │
│              │ I'm working on a    │ ←  │
│              │ startup and...      │    │
│              └─────────────────────┘    │
│                    User answer (right)  │
│                                         │
│  ┌─────────────────────┐                │
│  │ ○ ○ ○  (animating)  │   ← Reflection │
│  │ Noticing balance... │     arriving   │
│  └─────────────────────┘                │
│                                         │
│  ┌─────────────────────┐                │
│  │ 2. Which areas of   │   ← Next Q     │
│  │    your life...     │    (immediate) │
│  │    [ ] Work         │                │
│  │    [ ] Relationships│                │
│  └─────────────────────┘                │
│                                         │
│        [Continue]                       │
└─────────────────────────────────────────┘
```

### Optimistic UI Pattern

**Current flow:**
1. User submits answer
2. Wait for API (1-3 seconds for LLM)
3. Show reflection + next question together

**New flow (optimistic):**
1. User submits answer
2. **Immediately** show:
   - User's answer (right-aligned, confirmed)
   - Reflection placeholder with typing animation
   - Next question (if known via prefetch or static)
3. When API returns:
   - Fade in reflection text
   - User can already be answering next question

### SVG Typing Animation

A subtle, calming animation that suggests "thinking" without anxiety:

```svg
<svg class="typing-indicator" viewBox="0 0 40 10">
  <circle cx="5" cy="5" r="3" class="dot dot-1"/>
  <circle cx="20" cy="5" r="3" class="dot dot-2"/>
  <circle cx="35" cy="5" r="3" class="dot dot-3"/>
</svg>
```

Animation: Dots gently pulse in sequence with soft opacity/scale changes. Color matches the reflection bubble's blue theme.

## Implementation Plan

### Phase 1: Component Restructure

#### Step 1.1: Create ChatMessage Component
**File:** `apps/web/app/intake/chat-message.tsx`

Reusable component for chat bubbles:
- Props: `type: 'question' | 'answer' | 'reflection'`, `children`, `isLoading`
- Handles alignment, styling, and animation states
- Includes typing indicator for loading state

#### Step 1.2: Create TypingIndicator Component
**File:** `apps/web/app/intake/typing-indicator.tsx`

SVG animation component:
- Three dots with staggered pulse animation
- Matches reflection bubble styling
- Pure CSS animation (no JS)

#### Step 1.3: Refactor IntakeForm for Chat Layout
**File:** `apps/web/app/intake/intake-form.tsx`

Changes:
- Replace `historyItem` divs with ChatMessage components
- Implement optimistic UI pattern:
  - On submit: immediately add answer to history
  - Show typing indicator for reflection
  - Show next question immediately (for selection types) or after reflection (for text)
- Track `pendingReflection` state separate from `completedAnswers`

### Phase 2: Styling Updates

#### Step 2.1: New Chat-Style CSS
**File:** `apps/web/app/intake/intake.module.css`

New/updated styles:
- `.chatContainer` - Flex column with gap
- `.messageRow` - Full width container for alignment
- `.messageRowLeft` - Justify-start (questions, reflections)
- `.messageRowRight` - Justify-end (user answers)
- `.messageBubble` - Base bubble styling
- `.questionBubble` - Light gray background, left-aligned
- `.answerBubble` - Blue/teal background, right-aligned
- `.reflectionBubble` - Gradient blue, left-aligned, italic
- `.typingIndicator` - SVG container with animation
- `.fadeIn` - Animation for reflection reveal

#### Step 2.2: Animation Keyframes

```css
@keyframes dotPulse {
  0%, 100% { opacity: 0.4; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1); }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### Phase 3: Optimistic UI Logic

#### Step 3.1: State Management Updates

New state structure:
```typescript
interface ChatState {
  messages: ChatMessage[];  // Unified message list
  pendingReflectionIndex: number | null;  // Which message is awaiting reflection
  currentQuestion: IntakeQuestion | null;
  isSubmitting: boolean;
}

interface ChatMessage {
  id: string;
  type: 'question' | 'answer' | 'reflection';
  content: string | string[] | null;  // null = loading
  questionId?: string;
}
```

#### Step 3.2: Submit Flow

```typescript
async function handleSubmit() {
  // 1. Immediately update UI
  addMessage({ type: 'answer', content: currentAnswer });
  addMessage({ type: 'reflection', content: null });  // Loading state

  // 2. For selection questions: show next question immediately
  if (currentQuestion.type !== 'text' && nextQuestionKnown) {
    addMessage({ type: 'question', content: nextQuestion.prompt });
    setCurrentQuestion(nextQuestion);
  }

  // 3. Fetch reflection in background
  const response = await submitAnswer();

  // 4. Update reflection when ready
  updateMessage(pendingReflectionIndex, { content: response.reflection });

  // 5. For text questions: show next question after reflection
  if (currentQuestion.type === 'text' && response.nextQuestion) {
    addMessage({ type: 'question', content: response.nextQuestion.prompt });
    setCurrentQuestion(response.nextQuestion);
  }
}
```

### Phase 4: Question Prefetching (Optional Enhancement)

Since questions are static and known, we can prefetch the sequence:

```typescript
// On initial load, fetch all questions
const questions = await fetch('/api/intake/questions?type=therapy_readiness');

// Store in state, use to show next question immediately
```

This eliminates the need to wait for the API to know the next question.

## UI States

### Message States

1. **Question (static)**
   - Left-aligned gray bubble
   - Shows question number and prompt
   - For selection types: includes options

2. **Answer (confirmed)**
   - Right-aligned blue bubble
   - Shows formatted answer
   - Appears immediately on submit

3. **Reflection (loading)**
   - Left-aligned blue gradient bubble
   - Shows typing indicator animation
   - 3 pulsing dots

4. **Reflection (loaded)**
   - Same bubble, typing indicator fades out
   - Reflection text fades in
   - Italic styling

### Transitions

- Answer appears: Instant (no animation needed)
- Typing indicator: Continuous pulse until content arrives
- Reflection text: `fadeInUp` animation (200ms)
- Next question: `fadeInUp` animation (200ms)

## Responsive Design

### Desktop (> 768px)
- Max message width: 70% of container
- Comfortable padding in bubbles
- Questions and reflections align left with margin
- Answers align right with margin

### Tablet (600-768px)
- Max message width: 80%
- Slightly reduced padding

### Mobile (< 600px)
- Max message width: 90%
- Full-width form inputs within question bubbles
- Floating submit button at bottom of viewport (optional)

## Accessibility

- Typing indicator has `aria-label="Processing your response"`
- Messages have appropriate semantic structure
- Focus moves to new question input after submission
- Animation respects `prefers-reduced-motion`

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Perceived wait time | 1-3s (full LLM wait) | <0.5s (immediate feedback) |
| Completion rate | Baseline | +10% improvement |
| Mobile usability | Good | Excellent (chat is native mobile pattern) |

## Technical Considerations

### Performance
- Keep message history efficient (virtualization for very long chats not needed for 9 questions)
- SVG animation is GPU-accelerated
- No additional API calls needed

### State Consistency
- Handle edge case: user rapidly clicks before reflection arrives
- Ensure reflection content matches correct answer even with race conditions

---

## Files to Modify/Create

| File | Action | Description |
|------|--------|-------------|
| `apps/web/app/intake/typing-indicator.tsx` | Create | SVG animation component |
| `apps/web/app/intake/chat-message.tsx` | Create | Reusable chat bubble component |
| `apps/web/app/intake/intake-form.tsx` | Modify | Refactor for chat layout + optimistic UI |
| `apps/web/app/intake/intake.module.css` | Modify | Add chat-style CSS |

## Open Questions

1. Should the header (title, description, progress) remain fixed at top or scroll with content?
2. Should there be a "scroll to bottom" button if user scrolls up?
3. For text questions, should next question appear before or after reflection? (Current plan: after)

---

## Implementation Notes

### Demo Page

**Created:** `apps/web/app/intake/demo/` (February 2026)

A comprehensive component demo page has been created to showcase all UI components and patterns used in the intake flow:

- **Location:** `http://localhost:3000/intake/demo`
- **Main files:**
  - `apps/web/app/intake/demo/page.tsx` - Next.js page wrapper
  - `apps/web/app/intake/demo/intake-demo.tsx` - Main demo component
  - `apps/web/app/intake/demo/demo.module.css` - Demo-specific styles

**Sections included:**
1. Border Beam Animation - Magic UI component examples
2. Typing Indicator - SVG animation component
3. Question Bubbles - Left-aligned system messages
4. Answer Bubbles - Right-aligned user responses
5. Reflection Bubbles - Personalized acknowledgments
6. Loading State - Reflection pending with typing animation
7. Complete Conversation Flow - Full Q&A cycle
8. Optimistic UI Pattern - Next question appears immediately
9. Completion Waiting State - Border beam animation during final processing
10. Contact Info Collection - Optional form during wait time
11. Before/After Comparison - Perceived performance improvement
12. Value Proposition Header - Pre-question expectations
13. Confetti Celebration - Completion animation
14. ChatGPT Button - First experiment continuation
15. Markdown Rendering - Formatted completion outputs
16. "Other" Option Support - Custom multiselect responses

### BorderBeam Component

**Source:** Magic UI (Magic UI community components)
**Location:** `apps/web/components/ui/border-beam.tsx`

- Animated gradient that travels around element borders
- Used in completion waiting state for visual delight
- Requires parent to have `position: relative` and `overflow: hidden`
- Component must be placed as **last child** of parent container
- Customizable properties:
  - `size` - Size of the beam (default: 50)
  - `duration` - Animation speed in seconds (default: 6)
  - `delay` - Initial delay before animation starts
  - `colorFrom` - Starting gradient color (default: `#ffaa40`)
  - `colorTo` - Ending gradient color (default: `#9c40ff`)
  - `reverse` - Reverse animation direction
  - `borderWidth` - Width of the beam (default: 1.5px)

**Usage pattern:**
```tsx
<Card className="relative w-[350px] overflow-hidden">
  <CardHeader>
    <CardTitle>Login</CardTitle>
  </CardHeader>
  <CardContent>
    {/* content */}
  </CardContent>
  <BorderBeam duration={8} size={100} />
</Card>
```

### shadcn/ui Integration

**Configuration:** `apps/web/components.json`
- Style: `new-york`
- RSC enabled: `true`
- Base color: `neutral`
- CSS variables: `true`

**Installed components:**
- Card (`components/ui/card.tsx`) - Used in demo page for BorderBeam examples

The shadcn Card component provides:
- `Card` - Container with border, rounded corners, and shadow
- `CardHeader` - Header section with padding
- `CardTitle` - Styled title text
- `CardDescription` - Muted description text
- `CardContent` - Main content area
- `CardFooter` - Footer section for actions

### Component Architecture Decisions

1. **BorderBeam positioning:** Following Magic UI guidelines, BorderBeam is always placed as the last child to ensure proper z-index layering and visual appearance.

2. **Demo structure:** Separated demo logic into its own module to keep the actual intake form clean and production-ready while providing comprehensive examples for development.

3. **Animation controls:** Added animation toggle in demo page to allow testing both animated and static states, useful for accessibility testing and performance evaluation.

4. **Card usage:** Standardized on shadcn Card components for consistent styling and reduced custom CSS, making the codebase more maintainable.

### Dependencies Added

```json
{
  "@shadcn/ui": "latest",
  "motion/react": "^11.x" // For BorderBeam animations
}
```

### Future Enhancements

1. **Virtualization:** If chat history exceeds 20+ messages, consider adding virtual scrolling for performance
2. **Animation presets:** Create predefined BorderBeam color schemes matching brand colors
3. **A11y improvements:** Add more comprehensive ARIA labels and keyboard navigation
4. **Mobile optimization:** Test and optimize touch interactions for mobile chat experience
