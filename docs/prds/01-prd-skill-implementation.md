# PRD Skill and Template Implementation - Product Requirement Document

## Purpose

This PRD defines the implementation of a custom `/prd` skill for Claude Code that enables structured PRD creation, progress tracking, and completion marking throughout the development lifecycle. It addresses the need for consistent, well-documented product requirements and provides a systematic way to track implementation progress. The scope includes creating a comprehensive PRD template with meta-language instructions for LLMs, implementing a skill with three subcommands (plan, impl, end), and updating project documentation to reference the new workflow.

## Constraints

### Technical Constraints
- Must work within Claude Code's skill system (YAML frontmatter + markdown format)
- Template must be version-controlled in the repository
- Each step in PRDs must have discrete, verifiable criteria
- Must support vitest for unit testing and direct CLI tool execution
- Skill must use only allowed tools: Read, Write, Edit, Glob, Grep, Bash

### Business/Timeline Constraints
- Hackathon timeline - implementation must be completed efficiently
- Must be immediately usable by the development team

### Dependencies
- Claude Code skill system must be functional
- Git repository structure already established
- Documentation directory (`docs/`) already exists

### Compatibility Requirements
- Must follow existing project conventions (markdown, Biome formatting)
- Must integrate with existing git workflow
- Template must work with any LLM that can read markdown and HTML comments

## Technical Requirements

### Files to Create

1. **`docs/templates/prd-template.md`** - Comprehensive PRD template with meta-language instructions
   - Four main sections: Purpose, Constraints, Technical Requirements, Steps
   - HTML comments providing guidance for LLMs on how to fill each section
   - Example content demonstrating proper usage
   - Placeholder text in [brackets] for easy replacement
   - Optional sections for complex projects (Architecture, Data Models, etc.)

2. **`.claude/skills/prd/SKILL.md`** - PRD management skill definition
   - YAML frontmatter declaring skill name, description, user-invocability
   - Subcommand dispatcher logic for `plan`, `impl`, `end`
   - Detailed workflow instructions for each subcommand
   - Error handling guidelines
   - Example interactions

3. **`docs/prds/prd-skill-implementation.md`** - This file, demonstrating template usage
   - Real-world example of the template in use
   - Documents the actual implementation plan for this feature
   - Shows how to properly fill in each section

### Files to Modify

1. **`docs/README.md`** - Documentation index
   - Add Templates section to Structure
   - Link to prd-template.md
   - Update PRD guidelines to reference template
   - Add instructions for using `/prd plan` skill

### Tech Stack

- Claude Code skill system (YAML + markdown)
- Markdown with HTML comments for meta-instructions
- Bash for date/time operations
- File system tools (Read, Write, Edit, Glob, Grep)

## Steps

### Step 1: Create Template Directory Structure

**Action**: Create the `docs/templates/` directory to house reusable document templates

**Requirements**:
- Directory must exist at `docs/templates/`
- Should be at same level as `docs/prds/`
- Permissions should allow file creation

**Verification**:
```bash
# Verify directory exists
ls -la docs/templates/

# Expected output:
# drwxr-xr-x  ... docs/templates/
```

**Implementation Log**:
- [x] Created docs/templates/ directory (2026-01-31)

### Step 2: Create PRD Template

**Action**: Create comprehensive PRD template with meta-language instructions for LLMs

**Requirements**:
- File path: `docs/templates/prd-template.md`
- Must include all four required sections with HTML comment instructions
- Meta-instructions should guide LLMs on proper content for each section
- Include example content showing formatting and style
- Use placeholders in [brackets] for easy replacement
- Include optional sections for complex projects
- Add status tracking fields at bottom

**Verification**:
```bash
# Template file exists and is readable
cat docs/templates/prd-template.md > /dev/null && echo "✓ Template exists"

# Template contains all required sections
grep -E "^## (Purpose|Constraints|Technical Requirements|Steps)" docs/templates/prd-template.md

# Expected output:
## Purpose
## Constraints
## Technical Requirements
## Steps
```

**Implementation Log**:
- [x] Created prd-template.md with full structure (2026-01-31)
- [x] Added meta-instructions as HTML comments (2026-01-31)
- [x] Included example content for each section (2026-01-31)
- [x] Added optional sections (Architecture, Data Models, etc.) (2026-01-31)
- [x] Added status tracking footer (2026-01-31)

### Step 3: Create PRD Skill Directory

**Action**: Create `.claude/skills/prd/` directory for the skill definition

**Requirements**:
- Directory must exist at project root: `.claude/skills/prd/`
- Should follow Claude Code skill system conventions
- Permissions should allow file creation

**Verification**:
```bash
# Directory exists
ls -la .claude/skills/prd/

# Expected output:
# drwxr-xr-x  ... .claude/skills/prd/
```

**Implementation Log**:
- [x] Created .claude/skills/prd/ directory (2026-01-31)

### Step 4: Implement PRD Skill Definition

**Action**: Create the skill definition file with subcommand logic and workflows

**Requirements**:
- File path: `.claude/skills/prd/SKILL.md`
- YAML frontmatter with name, description, user-invocable: true, argument-hint, allowed-tools
- Subcommand dispatcher that checks `$0` for: plan, impl, end
- Complete workflow documentation for each subcommand
- Error handling guidelines
- Usage information display
- Example interactions for each subcommand

**Verification**:
```bash
# Skill file exists
cat .claude/skills/prd/SKILL.md > /dev/null && echo "✓ Skill exists"

# Contains YAML frontmatter
head -n 10 .claude/skills/prd/SKILL.md | grep "name: prd"

# Contains all subcommand sections
grep -E "(Subcommand: \`(plan|impl|end)\`)" .claude/skills/prd/SKILL.md

# Expected output:
## Subcommand: `plan`
## Subcommand: `impl`
## Subcommand: `end`
```

**Implementation Log**:
- [x] Created SKILL.md with YAML frontmatter (2026-01-31)
- [x] Implemented subcommand dispatcher logic (2026-01-31)
- [x] Documented `plan` workflow (2026-01-31)
- [x] Documented `impl` workflow (2026-01-31)
- [x] Documented `end` workflow (2026-01-31)
- [x] Added usage information section (2026-01-31)
- [x] Added example interactions (2026-01-31)
- [x] Added error handling guidelines (2026-01-31)

### Step 5: Update Documentation Index

**Action**: Update `docs/README.md` to reference the new template and workflow

**Requirements**:
- Add templates/ to Structure section
- Link to prd-template.md
- Update PRD guidelines section to mention template
- Add instructions for using `/prd plan` skill
- Maintain existing documentation structure

**Verification**:
```bash
# Documentation mentions template
grep -i "template" docs/README.md

# Link to template exists
grep "prd-template.md" docs/README.md

# Expected output includes:
# - **templates/** - Document templates
#   - [prd-template.md](./templates/prd-template.md) - Template for creating new PRDs
```

**Implementation Log**:
- [x] Added templates/ to Structure section (2026-01-31)
- [x] Added link to prd-template.md (2026-01-31)
- [x] Updated PRD guidelines to reference template (2026-01-31)
- [x] Added instructions for `/prd plan` usage (2026-01-31)

### Step 6: Create Example PRD Using Template

**Action**: Create this PRD (`prd-skill-implementation.md`) as a working example of the template

**Requirements**:
- File path: `docs/prds/prd-skill-implementation.md`
- Use template structure exactly
- Fill in all required sections with real content
- Include actual verification commands
- Demonstrate proper use of implementation logs
- Show how meta-language should be applied

**Verification**:
```bash
# Example PRD exists
cat docs/prds/prd-skill-implementation.md > /dev/null && echo "✓ Example exists"

# Contains all required sections
grep -E "^## (Purpose|Constraints|Technical Requirements|Steps)" docs/prds/prd-skill-implementation.md

# Check implementation log has entries
grep -E "\[x\]" docs/prds/prd-skill-implementation.md

# Expected output:
# Multiple lines with [x] checked items showing progress
```

**Implementation Log**:
- [x] Created prd-skill-implementation.md (2026-01-31)
- [x] Filled in Purpose section (2026-01-31)
- [x] Filled in Constraints section (2026-01-31)
- [x] Filled in Technical Requirements section (2026-01-31)
- [x] Filled in Steps section with verification (2026-01-31)
- [x] Populated implementation logs as work progresses (2026-01-31)

## Completion Criteria

- [x] Template file exists with all required sections and meta-instructions
- [x] Skill file exists with working subcommand logic
- [x] Documentation updated to reference template
- [x] Example PRD created demonstrating proper template usage
- [ ] Manual testing of `/prd plan` creates valid PRD
- [ ] Manual testing of `/prd impl` updates implementation log
- [ ] Manual testing of `/prd end` marks PRD complete

## Notes

### Future Enhancements
- Add `/prd status` to show all active PRDs and their progress
- Add validation for required sections in PRDs
- Auto-link PRDs to git commits
- Generate PRD index/table of contents
- Create template variants for different project types (feature, refactor, bug fix)
- Add `/prd list` to show all PRDs with status

### Design Decisions
- **Subcommands via arguments** - Simpler than separate skills, easier to maintain
- **Template as markdown file** - Version-controlled, easy to update without code changes
- **Implementation log in PRD** - Keeps all context in one place, easier to review
- **Meta-instructions as HTML comments** - Invisible when rendered, guides LLMs effectively
- **Status tracking at bottom** - Clear visibility of PRD lifecycle

### Integration Points
- PRDs live in `docs/prds/` (already established convention)
- Uses existing Biome formatting rules
- Follows project markdown conventions
- Compatible with existing git workflow
- Skill system integrates with Claude Code's existing tool permissions

### Gotchas & Surprises

- HTML comments in template must be preserved when creating new PRDs - they guide LLMs on proper usage
- The skill uses `$0` for subcommand detection, which is a special variable in skill context
- Demo instructions are critical for handoff and should be captured during implementation, not after
- Implementation logs should include timestamps to track velocity and identify blockers

### Demo Instructions

**How to Demo:**

This is a skill for Claude Code, so the demo involves using the skill commands:

1. **Test `/prd plan`:**
   ```bash
   # In Claude Code CLI, run:
   /prd plan
   # Enter a test name like: test-feature
   # Verify: docs/prds/test-feature.md is created with template structure
   ```

2. **Test `/prd impl`:**
   ```bash
   # With a PRD in progress, run:
   /prd impl
   # Provide implementation notes and respond to prompts about gotchas/demo
   # Verify: Implementation log updated, Notes section populated
   ```

3. **Test `/prd end`:**
   ```bash
   # With a PRD ready to complete, run:
   /prd end
   # Provide demo instructions if not already present
   # Verify: Status changed to "Completed", demo instructions added
   ```

---

**Status**: In Progress
**Created**: 2026-01-31
**Last Updated**: 2026-01-31
**Implementation Started**: 2026-01-31
**Completed**: N/A
