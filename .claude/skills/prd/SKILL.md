---
name: prd
description: Manage Product Requirement Documents - create from template (plan), add implementation notes (impl), or mark complete (end)
user-invocable: true
argument-hint: plan | impl | end
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# PRD Management Skill

You are managing Product Requirement Documents (PRDs) for this project. PRDs live in `docs/prds/` and follow a structured template.

## Subcommand Dispatcher

Check the `$0` argument to determine which subcommand to execute:
- `plan` - Create a new PRD from template
- `impl` - Add implementation notes to current PRD
- `end` - Mark PRD as complete

If `$0` is empty or invalid, show usage information.

## Usage Information

When showing usage, display:

```
PRD Skill - Manage Product Requirement Documents

Usage: /prd <subcommand>

Subcommands:
  plan    Create a new PRD from template
  impl    Add implementation notes to current PRD
  end     Mark current PRD as complete

Examples:
  /prd plan          # Create new PRD interactively
  /prd impl          # Update implementation log for current PRD
  /prd end           # Mark current PRD complete
```

## Subcommand: `plan`

Create a new PRD from the template.

### Workflow:

1. **Read the template**
   - Read `docs/templates/prd-template.md`
   - This contains the structure and meta-instructions

2. **Prompt for PRD name**
   - Ask user for a descriptive slug (e.g., "user-authentication", "api-redesign")
   - Suggest converting to kebab-case if needed
   - Validate: no spaces, lowercase, alphanumeric with hyphens

3. **Create PRD file**
   - Path: `docs/prds/<slug>.md`
   - Check if file already exists (abort if it does)
   - Copy template content to new file
   - Update the title line to reflect the feature name (convert slug to Title Case)
   - Update **Status** to "Draft"
   - Update **Created** date to today (YYYY-MM-DD format)
   - Update **Last Updated** to today

4. **Inform user**
   - Tell user the PRD was created at `docs/prds/<slug>.md`
   - Suggest they can now edit it to fill in details
   - Mention they can use `/prd impl` to track progress later

## Subcommand: `impl`

Add or update implementation notes in the current PRD, including gotchas, surprises, and demo instructions.

### Workflow:

1. **Find the current PRD**
   - Look for the most recently modified file in `docs/prds/` (excluding the template)
   - Use `ls -t docs/prds/*.md | head -1` or similar
   - Alternatively, ask user which PRD if multiple exist

2. **Read the PRD**
   - Read the current PRD file completely
   - Identify the current step being worked on (look for steps without all checkboxes marked)

3. **Gather implementation details**
   - Ask user what was accomplished or what should be logged
   - **Specifically ask about:**
     - What was completed in this step
     - Any gotchas or surprises encountered during implementation
     - Any unexpected challenges or edge cases discovered
     - If appropriate for this step, how to demo this feature/functionality

4. **Update Implementation Log**
   - Find the current/next incomplete step
   - Add checkbox items to the Implementation Log section
   - Use format: `- [x] Description (YYYY-MM-DD HH:MM)`
   - Update **Last Updated** timestamp at bottom

5. **Update Notes section**
   - If there are gotchas or surprises, add them to the Notes section under a "Gotchas & Surprises" subsection
   - If demo instructions were provided, add them to the Notes section under a "Demo Instructions" subsection
   - Format gotchas as bullet points with clear descriptions
   - Format demo instructions as step-by-step commands or URLs

6. **Update status**
   - If this is the first implementation entry, update **Implementation Started** date
   - Update **Status** from "Draft" to "In Progress" if needed

7. **Save changes**
   - Write updates back to the file
   - Confirm what was logged to user
   - Show any gotchas or demo instructions that were added

## Subcommand: `end`

Mark the current PRD as complete and ensure demo instructions are documented.

### Workflow:

1. **Find the current PRD**
   - Same as `impl` - find most recently modified PRD
   - Or ask user to specify

2. **Read the PRD**
   - Load current content
   - Verify it's actually in progress (not already complete)

3. **Capture demo instructions**
   - Check if Notes section already has "Demo Instructions"
   - If not, **ask user how to demo this feature**
   - Demo instructions should include:
     - URL to visit (e.g., "Visit http://localhost:3000/dashboard")
     - OR CLI command to run (e.g., "Run: bun run src/bin/cli.ts hello --name=World")
     - Any setup steps needed before demo
     - What to look for or expect to see
   - Add to Notes section under "Demo Instructions" subsection

4. **Mark as complete**
   - Update **Status** to "Completed"
   - Update **Completed** date to today (YYYY-MM-DD format)
   - Update **Last Updated** to today
   - Add a completion note at the bottom of the Notes section

5. **Verify completion**
   - Check if all steps have their verification criteria met (optional)
   - Warn user if any steps appear incomplete
   - Ensure demo instructions are present

6. **Inform user**
   - Confirm PRD marked complete
   - Show summary: name, completion date
   - **Display the demo instructions** so user knows how to demo
   - Suggest committing changes to git

## Important Guidelines

### File Paths
- Template is always at: `docs/templates/prd-template.md`
- PRDs are always in: `docs/prds/<name>.md`
- Never create PRDs outside the `docs/prds/` directory

### Date Format
- Always use ISO format: YYYY-MM-DD
- For timestamps in implementation logs: YYYY-MM-DD HH:MM
- Use current system date/time

### Status Values
- "Draft" - Just created, not started
- "In Progress" - Implementation has begun
- "Completed" - All work finished
- Never use other status values

### Error Handling
- If template doesn't exist, inform user and abort
- If PRD already exists (in `plan`), ask to overwrite or choose new name
- If no PRDs found (in `impl` or `end`), inform user to create one first
- If file operations fail, show clear error message

### User Interaction
- Always confirm actions before writing files
- Show file paths clearly when creating/modifying files
- Ask for input when needed (PRD name, implementation notes)
- Provide helpful next-step suggestions

## Example Interactions

### Creating a new PRD:
```
User: /prd plan
You: I'll create a new PRD from the template. What would you like to name this PRD?
     (Use kebab-case, e.g., "user-authentication" or "dashboard-redesign")
User: api-rate-limiting
You: Creating PRD at docs/prds/api-rate-limiting.md...
     ✓ PRD created successfully

     Next steps:
     - Edit docs/prds/api-rate-limiting.md to fill in details
     - Use /prd impl to track progress during implementation
```

### Adding implementation notes:
```
User: /prd impl
You: Found current PRD: docs/prds/api-rate-limiting.md (Step 2 in progress)

     What was accomplished in this step?
User: Completed middleware implementation and added tests
You: Great! Were there any gotchas or surprises during implementation?
User: Yes, had to handle edge case where rate limit headers weren't set for cached responses
You: Good to document. How should someone demo this feature?
User: Run: curl -i http://localhost:3000/api/test -H "X-API-Key: test" and check the X-RateLimit headers
You: ✓ Updated implementation log for Step 2
     - [x] Completed middleware implementation (2026-01-31 14:23)
     - [x] Added tests (2026-01-31 14:23)

     ✓ Added to Notes section:
     - Gotcha: Rate limit headers need manual setting for cached responses
     - Demo: curl -i http://localhost:3000/api/test -H "X-API-Key: test"
```

### Marking complete:
```
User: /prd end
You: Found PRD: docs/prds/api-rate-limiting.md

     How should someone demo this feature?
User: Test the rate limiting by running: curl -i http://localhost:3000/api/test -H "X-API-Key: test"
     You should see X-RateLimit-Limit and X-RateLimit-Remaining headers in the response.
You: ✓ Added demo instructions to Notes section
     ✓ PRD marked complete (2026-01-31)

     Summary:
     - Name: API Rate Limiting
     - Started: 2026-01-28
     - Completed: 2026-01-31

     Demo Instructions:
     Run: curl -i http://localhost:3000/api/test -H "X-API-Key: test"
     Look for: X-RateLimit-Limit and X-RateLimit-Remaining headers

     Don't forget to commit these changes!
```

## Implementation Notes

- Always use the Read tool before Edit/Write operations
- Use Glob to find PRD files: `docs/prds/*.md`
- Use Grep to search within PRDs if needed
- Use Bash for date commands: `date +%Y-%m-%d`
- Preserve all template meta-instructions (HTML comments) when creating new PRDs
- When editing, use the Edit tool for surgical changes, Write for complete rewrites
