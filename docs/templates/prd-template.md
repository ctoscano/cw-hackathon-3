# [Feature Name] - Product Requirement Document

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

[Describe what will be built and why. State the problem being solved and the value delivered. Define scope clearly.]

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
- [List technical limitations, required technologies, architecture requirements]

### Business/Timeline Constraints
- [List deadlines, approval requirements, resource limitations]

### Dependencies
- [List what must be completed first, what this depends on]

### Compatibility Requirements
- [List compatibility needs, version requirements, integration requirements]

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

1. **`path/to/new-file.ts`** - [Description of purpose]
   - [Key requirement 1]
   - [Key requirement 2]
   - [Important exports or functionality]

### Files to Modify

<!--
List all existing files that need changes.
For each file:
1. **`full/path/to/file.ext`** - What changes are needed
   - Specific modifications required
   - Sections to add/remove/update
   - Impact on existing functionality
-->

1. **`path/to/existing-file.ts`** - [Description of changes]
   - [Specific modification 1]
   - [Specific modification 2]

### Architecture Decisions

<!--
OPTIONAL SECTION - Include if architectural choices need documentation.
- Describe design patterns being used
- Explain why certain approaches were chosen
- Document trade-offs and alternatives considered
- Include diagrams or ASCII art if helpful
-->

[Describe key architectural decisions, patterns, and rationale]

### Tech Stack

<!--
OPTIONAL SECTION - Include if adding new technologies or dependencies.
- List new dependencies with versions
- Explain why each dependency was chosen
- Note any peer dependencies or setup requirements
- Include installation commands
-->

- [Library/Framework Name] (version) - [Purpose and rationale]

### Data Models

<!--
OPTIONAL SECTION - Include if creating new data structures.
- Define interfaces, types, or database schemas
- Show relationships between entities
- Include validation rules
- Provide example data
-->

```typescript
// Example data model
interface Example {
  id: string;
  name: string;
  // ...
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

### Step 1: [Action Name]

**Action**: [One sentence describing what to do in this step]

**Requirements**:
- [Specific requirement 1]
- [Specific requirement 2]
- [Specific requirement 3]

**Verification**:
```bash
# Command to verify this step is complete
pnpm test path/to/test.spec.ts

# Or CLI command
bun run src/bin/cli.ts [command] [args]

# Or file check
cat path/to/file.ts | grep "expected content"

# Expected output:
# [Show what success looks like]
# ✓ Test case 1 passes
# ✓ Test case 2 passes
```

**Implementation Log**:
- [ ] [Specific sub-task 1]
- [ ] [Specific sub-task 2]
- [ ] [Verification passing]

### Step 2: [Next Action Name]

**Action**: [What to do in this step]

**Requirements**:
- [Requirement 1]
- [Requirement 2]

**Verification**:
```bash
# Verification commands
[command to run]

# Expected output:
# [success criteria]
```

**Implementation Log**:
- [ ] [Sub-task 1]
- [ ] [Sub-task 2]

<!--
Continue adding steps as needed. Typical PRDs have 4-8 steps.
Each step should be completable in one focused work session.
If a step seems too large, break it into multiple steps.
-->

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

- [ ] [Overall completion criterion 1]
- [ ] [Overall completion criterion 2]
- [ ] [Overall completion criterion 3]

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

[Any additional notes, links, future enhancements, or context]

### Gotchas & Surprises

<!--
Added during implementation via /prd impl.
Document unexpected challenges, edge cases, and surprises encountered.
-->

[To be added during implementation]

### Demo Instructions

<!--
Added during implementation via /prd impl or /prd end.
Provide clear instructions on how to demo this feature.
Include URLs to visit or CLI commands to run.
-->

**How to Demo:**
[To be added during implementation]

---

**Status**: Draft
**Created**: [YYYY-MM-DD]
**Last Updated**: [YYYY-MM-DD]
**Implementation Started**: [YYYY-MM-DD or N/A]
**Completed**: [YYYY-MM-DD or N/A]
