# Component Library Consolidation - Product Requirement Document

## Purpose

This PRD defines the consolidation of the project's UI component landscape: promoting reusable app-level components to `packages/ui`, writing Storybook stories for key interactions, cleaning up duplicate components, and establishing clear guidelines for future component development (including when to use ai-elements vs custom components).

The problem: components are scattered across `apps/web/components/ui/` (with 10 exact duplicates of `packages/ui`) and 4 genuinely reusable components that should be shared. Custom chat components were built instead of using ai-elements, and there's no documented strategy for when to use which library. The demo pages at `/ops/demo` and `/intake/demo` serve as informal Storybooks but aren't discoverable or maintainable.

The scope includes:
- Promoting 4 app-level components to `packages/ui` (MessageBubble, Markdown, TypingAnimation, BorderBeam)
- Writing Storybook stories for the most valuable interactions
- Eliminating 10 duplicate component files in `apps/web/components/ui/`
- Evaluating ai-elements against existing custom components
- Updating CLAUDE.md with a definitive component strategy for future development

The scope excludes:
- Rewriting or replacing existing custom components with ai-elements (evaluate only)
- Removing or modifying the demo pages (they still serve a purpose for full-flow testing)
- Writing stories for every component (only interactions that merit isolation)

## Constraints

### Technical Constraints
- Must not break existing app functionality — all imports must resolve after changes
- Components promoted to `packages/ui` must remain pure presentational (no app context, no server actions)
- New dependencies added to `packages/ui` must be compatible with both Next.js and Storybook (Vite)
- Framer Motion (`motion/react`) would become a `packages/ui` dependency for TypingAnimation and BorderBeam
- `react-markdown` and `remark-gfm` would become dependencies for Markdown component

### Business/Timeline Constraints
- Incremental delivery — each step must leave the app in a working state
- Guidelines and agent instructions are the highest-priority deliverable

### Dependencies
- Storybook setup must be working (completed in `setup-storybook.md` PRD)
- `packages/ui` build pipeline must handle new dependencies

### Compatibility Requirements
- Components must work with React 19, Next.js 15, Tailwind CSS v4
- Stories must render correctly in Storybook 10 with `@storybook/react-vite`
- Promoted components must maintain the same API (no breaking changes to consumers)

## Technical Requirements

### Component Inventory & Migration Plan

**Current state**: 4 unique components in `apps/web/components/ui/` that belong in `packages/ui`:

| Component | Dependencies | Consumers | Complexity |
|-----------|-------------|-----------|------------|
| `message-bubble.tsx` | cn, lucide-react | 2 files (SessionDetail, ops intake page) | Medium — 4 exports, variant-based |
| `markdown.tsx` | react-markdown, remark-gfm | 3 files (IntakeCompletionSection, intake-demo, backup) | Low — pure wrapper |
| `typing-animation.tsx` | motion/react, cn | 4 files (chat-message, IntakeCompletionSection, intake-demo, backup) | High — state machine, viewport detection, 11 props |
| `border-beam.tsx` | motion/react, cn | 3 files (IntakeCompletionSection, intake-demo, backup) | Medium — animation, 11 props |

**Duplicate components to remove** (10 files in `apps/web/components/ui/` that are exact copies of `packages/ui`):
badge, button, card, dialog, input, select, separator, skeleton, table, tabs

**Total import statements to update**: ~25 across 10 files

### Files to Create

1. **`packages/ui/src/components/message-bubble.tsx`** - Chat message bubble variants
   - Move from `apps/web/components/ui/message-bubble.tsx`
   - Replace `@/lib/utils` import with local `../utils/cn`
   - Exports: `MessageBubble`, `QuestionMessage`, `AnswerMessage`, `ReflectionMessage`

2. **`packages/ui/src/components/markdown.tsx`** - GFM markdown renderer
   - Move from `apps/web/components/ui/markdown.tsx`
   - Add `react-markdown` and `remark-gfm` as dependencies to `packages/ui`
   - Export: `Markdown`

3. **`packages/ui/src/components/typing-animation.tsx`** - Text typing/deleting animation
   - Move from `apps/web/components/ui/typing-animation.tsx`
   - Add `motion` (Framer Motion) as dependency to `packages/ui`
   - Replace `@/lib/utils` import with local `../utils/cn`
   - Export: `TypingAnimation`

4. **`packages/ui/src/components/border-beam.tsx`** - Animated gradient border effect
   - Move from `apps/web/components/ui/border-beam.tsx`
   - Uses `motion` (already added for TypingAnimation)
   - Replace `@/lib/utils` import with local `../utils/cn`
   - Export: `BorderBeam`

5. **`packages/ui/src/components/message-bubble.stories.tsx`** - Chat message flow story
   - Show all 3 message types side-by-side
   - Demonstrate a complete Q -> A -> Reflection conversation
   - Show loading/empty states

6. **`packages/ui/src/components/typing-animation.stories.tsx`** - Typing animation story
   - Show single-word and multi-word modes
   - Demonstrate cursor styles
   - Show loop vs one-shot behavior

7. **`packages/ui/src/components/typing-indicator.stories.tsx`** - Loading dots story
   - Show all 3 sizes
   - Show custom dot colors

### Files to Modify

1. **`packages/ui/src/components/index.ts`** - Add exports for new components
   - Export MessageBubble, QuestionMessage, AnswerMessage, ReflectionMessage
   - Export Markdown
   - Export TypingAnimation
   - Export BorderBeam

2. **`packages/ui/package.json`** - Add new dependencies
   - Add `react-markdown`, `remark-gfm`
   - Add `motion` (Framer Motion)
   - Add `lucide-react` (for MessageBubble's Lightbulb icon)

3. **`apps/web/app/ops/components/SessionDetail.tsx`** - Update imports
   - Change `@/components/ui/message-bubble` to `@cw-hackathon/ui`

4. **`apps/web/app/ops/intake/[sessionId]/page.tsx`** - Update imports
   - Change `@/components/ui/message-bubble` to `@cw-hackathon/ui`

5. **`apps/web/app/intake/chat-message.tsx`** - Update imports
   - Change `@/components/ui/typing-animation` to `@cw-hackathon/ui`

6. **`apps/web/app/intake/components/IntakeCompletionSection.tsx`** - Update imports
   - Change `@/components/ui/border-beam`, `typing-animation`, `markdown` to `@cw-hackathon/ui`

7. **`apps/web/app/intake/demo/intake-demo.tsx`** - Update imports
   - Change all `@/components/ui/*` imports to `@cw-hackathon/ui`

8. **`apps/web/app/ops/demo/page.tsx`** - Update imports
   - Change `@/components/ui/*` imports to `@cw-hackathon/ui`

9. **Multiple files importing duplicates** - Update all `@/components/ui/<duplicate>` to `@cw-hackathon/ui`
   - `apps/web/app/ops/page.tsx` (tabs)
   - `apps/web/app/ops/components/DAPList.tsx` (skeleton)
   - `apps/web/app/ops/components/IntakeList.tsx` (skeleton)
   - `apps/web/app/ops/dap/[sessionId]/page.tsx` (separator)

10. **`CLAUDE.md`** - Update component strategy documentation
    - Add ai-elements evaluation results
    - Clarify component library hierarchy with concrete guidance
    - Update "Where to Put New Components" section

### Architecture Decisions

**Why promote to packages/ui instead of keeping in app?**
These 4 components are pure presentational, have no app coupling, and are already used across multiple features (ops + intake). They belong in the shared library.

**Why not replace custom components with ai-elements?**
This needs to be evaluated in Step 1. The custom components work well and are tailored to the product's design. ai-elements may be better for future features where we haven't built anything yet.

**Why not write stories for everything?**
Stories are a development tool, not a coverage metric. We write stories for interactions worth iterating on in isolation — chat message flows, animation tuning, complex compound components. Thin wrappers (Textarea, Separator) don't benefit.

### New Dependencies for packages/ui

- `react-markdown` (^9.0.0) - Markdown rendering for the Markdown component
- `remark-gfm` (^4.0.0) - GitHub Flavored Markdown support
- `motion` (^12.0.0) - Framer Motion for TypingAnimation and BorderBeam
- `lucide-react` (^0.470.0) - Icons (Lightbulb in MessageBubble) — likely already a peer dep

## Steps

### Step 1: Evaluate ai-elements vs Custom Components

**Action**: Research ai-elements capabilities and document a recommendation for when to use ai-elements vs custom components vs packages/ui.

**Requirements**:
- Install ai-elements docs/examples locally: `npx ai-elements@latest add --help`
- Compare ai-elements Message component with custom MessageBubble
- Compare ai-elements Conversation component with custom ChatMessage/IntakeChatSection
- Document pros/cons in a decision matrix
- Write the recommendation into CLAUDE.md's component hierarchy section

**Verification**:
```bash
# No code changes in this step — output is documentation only
# Verify CLAUDE.md was updated
grep -c "ai-elements" CLAUDE.md

# Expected output:
# Section in Component Library Priority updated with evaluation results
```

**Implementation Log**:
- [ ] Research ai-elements component capabilities
- [ ] Compare with existing custom components
- [ ] Draft recommendation (adopt for new features / keep custom for existing)
- [ ] Update CLAUDE.md component strategy

### Step 2: Promote Components to packages/ui

**Action**: Move MessageBubble, Markdown, TypingAnimation, and BorderBeam from `apps/web/components/ui/` to `packages/ui/src/components/`, add dependencies, and update the barrel export.

**Requirements**:
- Copy each component to `packages/ui/src/components/`
- Replace `@/lib/utils` imports with `../utils/cn`
- Add `react-markdown`, `remark-gfm`, `motion`, `lucide-react` to `packages/ui/package.json`
- Add all new exports to `packages/ui/src/components/index.ts`
- Verify `packages/ui` builds cleanly with new components
- Do NOT delete originals yet (Step 4 handles that)

**Verification**:
```bash
# Verify new components exist
ls packages/ui/src/components/message-bubble.tsx
ls packages/ui/src/components/markdown.tsx
ls packages/ui/src/components/typing-animation.tsx
ls packages/ui/src/components/border-beam.tsx

# Verify exports
grep "message-bubble" packages/ui/src/components/index.ts
grep "markdown" packages/ui/src/components/index.ts
grep "typing-animation" packages/ui/src/components/index.ts
grep "border-beam" packages/ui/src/components/index.ts

# Verify builds
pnpm type-check
pnpm build

# Expected: All checks pass, no errors
```

**Implementation Log**:
- [ ] Copy MessageBubble to packages/ui, fix imports
- [ ] Copy Markdown to packages/ui, fix imports
- [ ] Copy TypingAnimation to packages/ui, fix imports
- [ ] Copy BorderBeam to packages/ui, fix imports
- [ ] Add new dependencies to packages/ui/package.json
- [ ] Update barrel export (index.ts)
- [ ] Verify type-check and build pass

### Step 3: Write Stories for Key Interactions

**Action**: Create Storybook stories for the interactions that benefit most from isolated development: chat message flow, typing/loading states, and the TypingIndicator.

**Requirements**:
- `message-bubble.stories.tsx` — Show all message types, a complete conversation, and edge cases (long text, arrays, empty)
- `typing-animation.stories.tsx` — Show single word, word rotation, cursor styles, loop behavior
- `typing-indicator.stories.tsx` — Show sizes and custom colors (already in packages/ui, just needs a story)
- Stories must render correctly in Storybook with Tailwind styling
- Follow CSF3 format with proper argTypes

**Verification**:
```bash
# Verify story files exist
ls packages/ui/src/components/message-bubble.stories.tsx
ls packages/ui/src/components/typing-animation.stories.tsx
ls packages/ui/src/components/typing-indicator.stories.tsx

# Verify Storybook builds
pnpm build:storybook

# Manual: Run pnpm storybook, verify stories render with correct styling
# Expected: All stories visible in sidebar, components styled correctly
```

**Implementation Log**:
- [ ] Write message-bubble.stories.tsx (variants, conversation flow, edge cases)
- [ ] Write typing-animation.stories.tsx (modes, cursor styles, loop)
- [ ] Write typing-indicator.stories.tsx (sizes, colors)
- [ ] Verify all stories render in Storybook
- [ ] Verify Tailwind styling applies correctly

### Step 4: Update Imports and Remove Duplicates

**Action**: Update all consumer files to import from `@cw-hackathon/ui` instead of `@/components/ui/*`, then delete the duplicate and now-moved files from `apps/web/components/ui/`.

**Requirements**:
- Update imports in all 10+ consumer files (see Files to Modify list above)
- Delete the 10 duplicate files (badge, button, card, dialog, input, select, separator, skeleton, table, tabs)
- Delete the 4 now-promoted files (message-bubble, markdown, typing-animation, border-beam)
- Keep any app-specific files that aren't duplicates or promoted
- Verify the app still builds and runs correctly after all changes

**Verification**:
```bash
# Verify no remaining imports from @/components/ui for promoted/duplicate components
grep -r "@/components/ui/badge" apps/web/ --include="*.tsx" --include="*.ts" | grep -v node_modules
grep -r "@/components/ui/button" apps/web/ --include="*.tsx" --include="*.ts" | grep -v node_modules
grep -r "@/components/ui/message-bubble" apps/web/ --include="*.tsx" --include="*.ts" | grep -v node_modules
# (repeat for all moved components)

# All should return empty

# Verify build
pnpm type-check
pnpm build

# Expected: Clean build, no import errors
```

**Implementation Log**:
- [ ] Update imports in ops components (SessionDetail, intake page, demo, DAPList, IntakeList, etc.)
- [ ] Update imports in intake components (chat-message, IntakeCompletionSection, intake-demo)
- [ ] Delete 10 duplicate files from apps/web/components/ui/
- [ ] Delete 4 promoted files from apps/web/components/ui/
- [ ] Verify type-check passes
- [ ] Verify build passes
- [ ] Smoke test: verify app runs without errors

### Step 5: Update CLAUDE.md Component Guidelines

**Action**: Consolidate all component development guidance into clear, actionable rules in CLAUDE.md based on everything learned during this effort.

**Requirements**:
- Update "Component Library Priority" section with ai-elements evaluation results
- Ensure "Where to Put New Components" clearly directs to packages/ui by default
- Verify "Component Patterns (Storybook-Ready by Default)" is comprehensive
- Verify "When to Write a Story" captures the right philosophy
- Add note about the demo pages: what they're for vs what Storybook is for
- Remove any stale references to components that were moved/deleted

**Verification**:
```bash
# Verify CLAUDE.md has all key sections
grep "Component Library Priority" CLAUDE.md
grep "Component Patterns" CLAUDE.md
grep "When to Write a Story" CLAUDE.md
grep "Where to Put New Components" CLAUDE.md

# Verify build (CLAUDE.md changes shouldn't break anything, but verify anyway)
pnpm build

# Expected: All sections present, guidelines are clear and non-contradictory
```

**Implementation Log**:
- [ ] Update component library hierarchy with ai-elements guidance
- [ ] Review and finalize "Where to Put New Components"
- [ ] Review "Component Patterns" list for completeness
- [ ] Review "When to Write a Story" for accuracy after hands-on experience
- [ ] Add demo pages vs Storybook note
- [ ] Final review for stale references

## Completion Criteria

- [ ] All TypeScript type checks passing (`pnpm type-check`)
- [ ] Production build succeeds (`pnpm build`)
- [ ] Storybook builds successfully (`pnpm build:storybook`)
- [ ] 4 components promoted to packages/ui with working exports
- [ ] 3 new stories render correctly in Storybook
- [ ] 14 duplicate/moved files removed from apps/web/components/ui/
- [ ] Zero imports from `@/components/ui/` for components that exist in `@cw-hackathon/ui`
- [ ] CLAUDE.md contains clear, non-contradictory component development guidelines

## Notes

### ai-elements Context

The CLAUDE.md documents ai-elements as the #2 option in the component library hierarchy for AI/chat features. However, **zero ai-elements components are currently installed or used**. All chat UI was built with custom components:
- `MessageBubble` (QuestionMessage/AnswerMessage/ReflectionMessage) — chat bubbles
- `ChatMessage` — orchestrator that combines bubbles with animations
- `TypingAnimation` — text typing effect with word rotation
- `TypingIndicator` — pulsing dots loading indicator
- `Markdown` — GFM markdown renderer

Step 1 will evaluate whether ai-elements should be adopted for future chat/AI features or whether the custom components are sufficient.

### Risk Mitigation

The highest-risk step is Step 4 (updating imports and deleting files). Mitigation:
- Steps are ordered so that packages/ui has the components (Step 2) and stories verify they work (Step 3) before any consumer code is changed
- The backup file (`intake-form-original-backup.tsx`) may have stale imports — consider whether to update or remove it
- `pnpm type-check` will catch any broken imports immediately

### Gotchas & Surprises

- **ai-elements is heavyweight**: The Message component alone pulls in 11+ sub-components and streamdown with 5 plugins. Our custom MessageBubble has 4 focused exports with minimal dependencies. ai-elements is best reserved for genuinely new AI features, not retrofitting existing chat UI.
- **lucide-react was already in packages/ui**: No need to add it as a new dependency — it was already at ^0.563.0.
- **`apps/web/components/ui/` directory is now empty**: All 14 files were either duplicates of packages/ui or promoted to packages/ui. The directory can be removed entirely.
- **The backup file (`intake-form-original-backup.tsx`) had stale imports**: Updated along with other consumer files.

### Demo Instructions

**How to Demo:**
1. Verify type-check and build pass: `pnpm type-check && pnpm build`
2. Verify Storybook builds: `pnpm build:storybook`
3. Run Storybook: `pnpm storybook` → visit http://localhost:6006
4. Check new stories in sidebar: MessageBubble, TypingAnimation, TypingIndicator
5. Use Controls panel to interact with variants and props
6. Run the web app: `pnpm dev` → visit http://localhost:3000
7. Verify intake flow still works: http://localhost:3000/intake
8. Verify ops pages still work: http://localhost:3000/ops

## Quality Checks

- [x] Type check passed (`pnpm type-check`)
- [x] Build passed (`pnpm build`)
- [x] Demo instructions provided
- [x] All completion criteria met

**Last Verified**: 2026-02-05

---

**Status**: Accepted
**Created**: 2026-02-06
**Last Updated**: 2026-02-05
**Implementation Started**: 2026-02-05
**Completed**: 2026-02-05
**Accepted**: 2026-02-05
**Rejected**: N/A
