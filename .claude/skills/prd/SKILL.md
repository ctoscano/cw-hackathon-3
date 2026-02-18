---
name: prd
description: Manage Product Requirement Documents - create from template (plan), start implementation (start), mark complete (end), accept/reject (accept/reject), check status (status)
user-invocable: true
argument-hint: plan | start | end | accept | reject | status
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# PRD Management Skill

You are managing Product Requirement Documents (PRDs) for this project. PRDs live in `docs/prds/` and follow a structured template.

## Subcommand Dispatcher

Check the `$0` argument to determine which subcommand to execute:
- `plan` - Create a new PRD from template
- `start` - Start/continue implementation (add implementation notes)
- `impl` - Legacy alias for `start` (deprecated, show warning)
- `end` - Mark PRD as pending review
- `accept` - Accept PRD after user verification
- `reject` - Reject PRD and return to in progress
- `status` - Show current PRD status and context

If `$0` is empty or invalid, show usage information.

## Usage Information

When showing usage, display:

```
PRD Skill - Manage Product Requirement Documents

Usage: /prd <subcommand>

Subcommands:
  plan      Create a new PRD from template
  start     Start or continue implementation (add notes)
  end       Mark current PRD as pending review
  accept    Accept PRD after verification
  reject    Reject PRD and return to in progress
  status    Show current PRD status

Examples:
  /prd plan          # Create new PRD interactively
  /prd start         # Update implementation log for current PRD
  /prd end           # Mark PRD pending review (runs quality checks)
  /prd accept        # Accept PRD after verifying it works
  /prd reject        # Reject PRD, needs more work
  /prd status        # Check current PRD state
```

## Subcommand: `plan`

Create a new PRD from the template.

### Workflow:

1. **Read the template**
   - Read `docs/templates/prd-template.md`
   - This contains the structure and meta-instructions

2. **Determine wave number prefix**
   - Scan `docs/prds/` for existing PRD files
   - Parse the highest wave number from existing filenames (format: `NN-slug.md`)
   - **Default behavior**: Increment the highest wave number by 1 (new development phase)
   - **Same-wave option**: If the user says this is part of the same batch of work, reuse the current highest wave number
   - Ask user: "Current highest wave is NN. Create as wave NN+1 (new phase) or NN (same batch)?"
   - If no existing PRDs have prefixes, start at `01`
   - Wave numbers are zero-padded to 2 digits: `01`, `02`, ..., `09`, `10`, etc.

3. **Prompt for PRD name**
   - Ask user for a descriptive slug (e.g., "user-authentication", "api-redesign")
   - Suggest converting to kebab-case if needed
   - Validate: no spaces, lowercase, alphanumeric with hyphens

4. **Create PRD file**
   - Path: `docs/prds/<wave>-<slug>.md` (e.g., `docs/prds/06-user-authentication.md`)
   - Check if file already exists (abort if it does)
   - Copy template content to new file
   - Update the title line to reflect the feature name (convert slug to Title Case)
   - Update **Status** to "Draft"
   - Update **Created** date to today (YYYY-MM-DD format)
   - Update **Last Updated** to today

5. **Update context file**
   - Write to `.claude/prd-context.json` with:
     - activePRD: "<wave>-<slug>.md"
     - wave: <wave number>
     - status: "Draft"
     - lastUpdated: (ISO timestamp)
     - nextAction: "Fill in PRD details and run /prd start when ready to implement"

6. **Inform user**
   - Tell user the PRD was created at `docs/prds/<wave>-<slug>.md`
   - Show the wave number assigned
   - Suggest they can now edit it to fill in details
   - Mention they can use `/prd start` to track progress later

## Subcommand: `start`

Start or continue implementation by adding/updating implementation notes in the current PRD, including gotchas, surprises, and demo instructions.

**Note:** This was previously called `impl`. The old name still works but is deprecated.

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

7. **Update context file**
   - Write to `.claude/prd-context.json` with updated lastUpdated timestamp
   - Keep status as "In Progress"

8. **Save changes**
   - Write updates back to the file
   - Confirm what was logged to user
   - Show any gotchas or demo instructions that were added

## Subcommand: `end`

Mark the current PRD as pending review after running quality checks.

### Workflow:

1. **Find the current PRD**
   - Same as `start` - find most recently modified PRD
   - Or ask user to specify

2. **Read the PRD**
   - Load current content
   - Verify it's actually in progress (not already complete or pending review)

3. **Capture demo instructions**
   - Check if Notes section already has "Demo Instructions"
   - If not, **ask user how to demo this feature**
   - Demo instructions should include:
     - URL to visit (e.g., "Visit http://localhost:3000/dashboard")
     - OR CLI command to run (e.g., "Run: bun run src/bin/cli.ts hello --name=World")
     - Any setup steps needed before demo
     - What to look for or expect to see
   - Add to Notes section under "Demo Instructions" subsection

4. **Run quality gate checks**
   - Execute `pnpm type-check` and capture output
   - Execute `pnpm build` and capture output
   - If either fails:
     - Abort status change
     - Display error message with command output
     - Keep status as "In Progress"
     - Suggest fixing issues first
   - If both pass, continue to next step

5. **Add Quality Checks section to PRD**
   - Add new section before Notes (if not already present):
     ```markdown
     ## Quality Checks

     - [x] Type check passed (`pnpm type-check`)
     - [x] Build passed (`pnpm build`)
     - [x] Demo instructions provided
     - [x] All completion criteria met

     **Last Verified**: YYYY-MM-DD HH:MM
     ```

6. **Mark as pending review**
   - Update **Status** to "Pending Review"
   - Update **Completed** date to today (YYYY-MM-DD format)
   - Update **Last Updated** to today
   - Add a completion note at the bottom of the Notes section

7. **Update context file**
   - Write to `.claude/prd-context.json`:
     - status: "Pending Review"
     - completionDate: (today's date)
     - nextAction: "User should verify build passes and run /prd accept"

8. **Inform user**
   - Show quality check results (type-check and build output)
   - Confirm PRD marked as "Pending Review"
   - Show summary: name, completion date
   - **Display the demo instructions** so user knows how to test
   - **Remind user to verify and run `/prd accept` when satisfied**
   - Or run `/prd reject [reason]` if issues are found

## Subcommand: `accept`

Accept the PRD after user has verified the implementation works correctly.

### Workflow:

1. **Find the current PRD**
   - Same as other commands - find most recently modified PRD
   - Or use PRD from context file

2. **Read the PRD**
   - Load current content
   - Verify status is "Pending Review"
   - If not, show error: "PRD must be in 'Pending Review' state to accept. Current status: [status]"

3. **Update PRD status**
   - Update **Status** to "Accepted"
   - Add **Accepted** date to footer: today (YYYY-MM-DD format)
   - Update **Last Updated** to today
   - Optionally ask user for any final notes or feedback
   - If user provides notes, add to Notes section under "Acceptance Notes"

4. **Update context file**
   - Write to `.claude/prd-context.json`:
     - status: "Accepted"
     - acceptedDate: (today's date)
     - nextAction: null (no further action needed)

5. **Inform user**
   - Confirm PRD accepted
   - Show summary: name, accepted date
   - Suggest committing changes to git
   - Optional: mention this PRD is now archived/final

## Subcommand: `reject`

Reject the PRD and return it to "In Progress" for further work.

### Workflow:

1. **Find the current PRD**
   - Same as other commands - find most recently modified PRD
   - Or use PRD from context file

2. **Read the PRD**
   - Load current content
   - Verify status is "Pending Review"
   - If not, show error: "PRD must be in 'Pending Review' state to reject. Current status: [status]"

3. **Capture rejection reason**
   - Check if user provided reason as argument (`$1`, `$2`, etc.)
   - If not provided, ask: "What issues were found? (This will be logged in the PRD)"
   - Reason should be specific about what needs to be fixed

4. **Update PRD status**
   - Update **Status** to "In Progress"
   - Clear **Completed** date (set to N/A)
   - Add **Rejected** date to footer: today (YYYY-MM-DD format)
   - Update **Last Updated** to today
   - Add rejection note to Notes section:
     ```markdown
     ### Rejection Log

     **Rejected on**: YYYY-MM-DD
     **Reason**: [user's reason]
     **Next Steps**: [what needs to be fixed]
     ```

5. **Update context file**
   - Write to `.claude/prd-context.json`:
     - status: "In Progress"
     - completionDate: null
     - nextAction: "Fix issues and run /prd end when ready"

6. **Inform user**
   - Confirm PRD rejected and returned to "In Progress"
   - Show rejection reason
   - Suggest next steps based on the reason
   - Remind user to run `/prd start` to continue work

## Subcommand: `status`

Show the current PRD context and status.

### Workflow:

1. **Read context file**
   - Read `.claude/prd-context.json`
   - If file doesn't exist or is empty, show: "No active PRD. Run /prd plan to create one."

2. **Read the current PRD**
   - Get PRD name from context file
   - Read `docs/prds/[activePRD]` completely
   - Parse status, dates, and metadata from footer

3. **Parse PRD sections for detailed information**
   - Extract Purpose summary (see "Helper Functions" section below)
   - Extract file lists from Technical Requirements
   - Extract demo instructions from Notes
   - Extract completion criteria checkboxes
   - Parse verification steps if status is "Pending Review"

4. **Display based on status**

   **IF status == "Pending Review":**
   - Show brief header with file, status, dates
   - Show separator line: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
   - Show 🎯 FEATURES IMPLEMENTED section (from Purpose)
   - Show separator line
   - Show 📁 KEY FILES IMPLEMENTED section (from Technical Requirements)
     - List created files with paths and descriptions
     - List modified files with paths and descriptions
   - Show separator line
   - Show ✅ VERIFICATION CHECKLIST section
     - Parse demo instructions into numbered steps
     - Include specific commands to run
     - Show expected success criteria for each step
     - Include quality gate checkboxes
   - Show separator line
   - Show 🎬 NEXT STEPS section
     - "If all verification steps pass: → Run: /prd accept"
     - "If you encounter issues: → Run: /prd reject \"[describe the issue]\""

   **ELSE IF status == "Draft" OR "In Progress":**
   - Show header with file, status, dates
   - Show separator line
   - Show 🎯 FEATURES TO IMPLEMENT (from Purpose)
   - Show separator line
   - Show 📁 FILES TO CREATE/MODIFY (from Technical Requirements)
   - Show separator line
   - Show 📝 CURRENT STEP (find first incomplete step)
   - Show separator line
   - Show NEXT ACTION:
     - Draft: "Fill in PRD details and run /prd start when ready"
     - In Progress: "Continue with /prd start, run /prd end when complete"

   **ELSE IF status == "Accepted":**
   - Show brief header
   - Show "✅ PRD is complete and accepted"
   - Show accepted date
   - Show feature summary (one-line from Purpose)

5. **Format output with visual structure**
   - Use separator lines (━━━ characters) between major sections
   - Use emoji section headers for visual clarity
   - Use bullet points (•) for file lists
   - Use checkboxes (✓) for success criteria
   - Keep output scannable and actionable

## Subcommand: `impl` (deprecated)

Legacy alias for `start` command. Maintained for backward compatibility.

### Workflow:

1. **Show deprecation warning**
   - Display: "⚠️  Note: '/prd impl' is deprecated. Use '/prd start' instead."

2. **Execute `start` workflow**
   - Run all steps from the `start` subcommand
   - Everything else is identical

## Helper Functions for PRD Parsing

When executing `/prd status`, use these parsing strategies to extract actionable information from the PRD:

### Extract Purpose Summary

**Goal:** Get a high-level overview and list of features implemented.

**Strategy:**
1. Read from `## Purpose` heading to the next `##` heading
2. Extract the first paragraph for a one-sentence summary
3. Look for "The scope includes:" or "scope includes:"
4. Extract all bullet points following that line
5. Return as structured feature list

**Example Output:**
```
Features:
1. Redis Cloud Integration
   - Environment-based configuration
   - Connection handling with graceful error handling
2. DAP Output Archival
   - Archive DAP outputs with metadata
   - Retrieve archived outputs by session ID
```

### Extract File Lists

**Goal:** Show which files were created and modified, with their purpose.

**Strategy:**
1. Find the `## Technical Requirements` section
2. Look for `### Files to Create` subsection
3. Parse numbered list items matching pattern: `N. **\`path/to/file\`** - description`
4. Extract file path and description for each
5. Look for `### Files to Modify` subsection
6. Parse same format for modified files
7. Return as `{created: [{path, desc}, ...], modified: [{path, desc}, ...]}`

**Example Output:**
```
Created:
  • apps/web/lib/redis/client.ts - Redis connection client
  • apps/web/lib/redis/archive.ts - DAP archival functions

Modified:
  • apps/web/app/intake/hooks/useIntakeForm.ts - Added Redis persistence
```

### Extract Demo Instructions

**Goal:** Get step-by-step instructions for how to test the implementation.

**Strategy:**
1. Find the `## Notes` section
2. Look for `### Demo Instructions` subsection
3. Find the `**How to Demo:**` line
4. Extract everything after that line until next `###` or `##` heading
5. Parse for URLs (http://..., https://...)
6. Parse for commands (lines starting with "Run:", "cd", or inside code blocks)
7. Parse for steps (numbered or bulleted lists)
8. Return as structured verification steps

**Example Output:**
```
1. Visit http://localhost:3000/intake/demo
2. Complete the intake questionnaire
3. Check browser console for success messages
```

### Extract Verification Steps from Steps Section

**Goal:** Get specific commands and expected outputs for verification.

**Strategy:**
1. Iterate through each `### Step N:` in the Steps section
2. For each step, find the `**Verification**:` subsection
3. Extract bash commands from code blocks (```bash ... ```)
4. Extract expected output (lines starting with `#` inside code blocks)
5. Combine verification commands across all steps
6. Deduplicate similar commands
7. Return as numbered checklist with commands and expected results

**Example Output:**
```
Verification Commands:
1. Run type-check: pnpm type-check
   Expected: All checks pass with no errors
2. Run build: pnpm build
   Expected: Build completes successfully
```

### Parse Completion Criteria

**Goal:** Show high-level success criteria with checkboxes.

**Strategy:**
1. Find the `## Completion Criteria` section
2. Extract all lines matching pattern: `- [x]` or `- [ ]`
3. Preserve checkbox state (checked/unchecked)
4. Return as list with checkbox status

### Format Verification Checklist for "Pending Review"

**Goal:** Create an actionable, step-by-step verification guide.

**Strategy:**
1. **Group by feature area:** Match verification steps to features from Purpose
2. **Number sequentially:** 1, 2, 3... for each major verification task
3. **Include specific commands:** Show exact bash commands or URLs to visit
4. **Show success criteria:** Use ✓ checkmarks for what "passing" looks like
5. **Add context:** Explain what to look for (console output, UI behavior, etc.)
6. **Visual structure:** Use indentation and separators for readability

**Format Template:**
```
✅ VERIFICATION CHECKLIST

Follow these steps to verify the implementation:

1. [Feature Area] - [What to test]

   Command: [exact command to run or URL to visit]

   Steps:
   a. [Detailed step 1]
   b. [Detailed step 2]
   c. [Detailed step 3]

   Success Criteria:
   ✓ [Expected outcome 1]
   ✓ [Expected outcome 2]
   ✓ [Expected outcome 3]

2. [Next feature area]...
```

### Parsing Edge Cases

**Missing Demo Instructions:**
- Show warning: "⚠️  Demo instructions missing. Run /prd start to add them."
- Fall back to verification steps from Steps section only

**No Steps Section:**
- Use completion criteria only
- Show warning: "Limited verification info available"

**Complex Multi-Step Workflows:**
- Group related steps together
- Number main steps, use letters (a, b, c) for sub-steps
- Keep each main step focused on one feature/component

**Very Long PRDs:**
- Summarize features (max 5 bullet points)
- Show only most important files (max 10 created, 10 modified)
- Condense verification steps to essentials
- User can read full PRD if they need more detail

## Important Guidelines

### File Paths
- Template is always at: `docs/templates/prd-template.md`
- PRDs are always in: `docs/prds/<wave>-<slug>.md` (e.g., `06-user-authentication.md`)
- Wave prefix is required — never create PRDs without a wave number prefix
- Never create PRDs outside the `docs/prds/` directory

### Wave Number Convention
- PRDs are prefixed with a two-digit wave number: `01-`, `02-`, etc.
- Wave numbers group PRDs by development phase (PRDs created around the same time share a wave)
- Within a wave, PRDs sort alphabetically by slug
- Across waves, PRDs sort chronologically by development phase
- When scanning for the current wave: `ls docs/prds/*.md | sort -r | head -1` and parse the prefix

### Date Format
- Always use ISO format: YYYY-MM-DD
- For timestamps in implementation logs: YYYY-MM-DD HH:MM
- Use current system date/time

### Status Values
- "Draft" - Just created, not started
- "In Progress" - Implementation has begun
- "Pending Review" - Implementation complete, awaiting user verification
- "Accepted" - User has verified and approved the implementation
- "Rejected" - User found issues, returned to In Progress (deprecated status, transitions back to In Progress)
- Never use other status values

### Status Workflow
```
Draft → In Progress → Pending Review → Accepted
                            ↓
                    (rejected) → In Progress
```

### Context Tracking
- All subcommands update `.claude/prd-context.json` to track active PRD
- Context file format:
  ```json
  {
    "activePRD": "06-feature-name.md",
    "wave": 6,
    "status": "current status",
    "lastUpdated": "ISO timestamp",
    "completionDate": "YYYY-MM-DD or null",
    "acceptedDate": "YYYY-MM-DD or null",
    "nextAction": "description of what to do next"
  }
  ```
- Context file is gitignored (project-specific state)
- Use context to remember active PRD across sessions

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
You: I'll create a new PRD from the template.

     Current highest wave: 05 (e.g., 05-setup-storybook.md)
     → Wave 06 (new phase) or 05 (same batch)?
User: 06
You: What would you like to name this PRD?
     (Use kebab-case, e.g., "user-authentication" or "dashboard-redesign")
User: api-rate-limiting
You: Creating PRD at docs/prds/06-api-rate-limiting.md...
     ✓ PRD created (wave 06)

     Next steps:
     - Edit docs/prds/06-api-rate-limiting.md to fill in details
     - Use /prd start to track progress during implementation
```

### Adding implementation notes:
```
User: /prd start
You: Found current PRD: docs/prds/06-api-rate-limiting.md (Step 2 in progress)

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

     ✓ Updated context: PRD is "In Progress"
```

### Marking complete (pending review):
```
User: /prd end
You: Found PRD: docs/prds/06-api-rate-limiting.md

     Running quality checks...

     ✓ Type check passed (pnpm type-check)
     ✓ Build passed (pnpm build)

     How should someone demo this feature?
User: Test the rate limiting by running: curl -i http://localhost:3000/api/test -H "X-API-Key: test"
     You should see X-RateLimit-Limit and X-RateLimit-Remaining headers in the response.
You: ✓ Added demo instructions to Notes section
     ✓ Added Quality Checks section
     ✓ PRD marked as "Pending Review" (2026-01-31)

     Summary:
     - Name: API Rate Limiting
     - Started: 2026-01-28
     - Completed: 2026-01-31
     - Status: Pending Review

     Demo Instructions:
     Run: curl -i http://localhost:3000/api/test -H "X-API-Key: test"
     Look for: X-RateLimit-Limit and X-RateLimit-Remaining headers

     ⚠️ Next step: Verify the implementation works, then run:
     - /prd accept  (if everything works)
     - /prd reject  (if issues found)
```

### Accepting PRD:
```
User: /prd accept
You: Found PRD: docs/prds/06-api-rate-limiting.md (Pending Review)

     ✓ PRD accepted (2026-01-31)

     Summary:
     - Name: API Rate Limiting
     - Status: Accepted
     - Accepted: 2026-01-31

     This PRD is now complete and verified. Don't forget to commit!
```

### Rejecting PRD:
```
User: /prd reject Build is broken on production
You: Found PRD: docs/prds/06-api-rate-limiting.md (Pending Review)

     What issues were found? (This will be logged in the PRD)
     [User input captured: "Build is broken on production"]

     ✓ PRD rejected and returned to "In Progress"
     ✓ Rejection logged in Notes section
     ✓ Completed date cleared

     Rejection reason: Build is broken on production

     Next steps:
     - Fix the build issue
     - Run /prd start to update progress
     - Run /prd end when ready for review again
```

### Checking status (Pending Review):
```
User: /prd status
You: 📋 Active PRD: API Rate Limiting
     File: docs/prds/06-api-rate-limiting.md
     Status: Pending Review
     Completed: 2026-01-31

     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     🎯 FEATURES IMPLEMENTED
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

     1. Rate Limiting Middleware
        - Request tracking per API key
        - Configurable rate limits (requests per time window)
        - Custom response headers (X-RateLimit-*)

     2. Redis-Based Storage
        - Distributed rate limit tracking
        - Automatic key expiration
        - Support for multiple API endpoints

     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     📁 KEY FILES IMPLEMENTED
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

     Created:
       • app/middleware/rateLimit.ts - Rate limiting middleware
       • lib/redis/rateLimiter.ts - Redis-based rate limit tracking
       • types/rateLimit.ts - Rate limit types and interfaces

     Modified:
       • next.config.ts - Added middleware configuration
       • app/api/test/route.ts - Added rate limiting to test endpoint

     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     ✅ VERIFICATION CHECKLIST
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

     Follow these steps to verify the implementation:

     1. Test Rate Limiting with API Key

        Command:
        curl -i http://localhost:3000/api/test -H "X-API-Key: test"

        Steps:
        a. Run the command 5 times quickly
        b. Check response headers for X-RateLimit-Limit and X-RateLimit-Remaining
        c. On 6th request, should receive 429 Too Many Requests

        Success Criteria:
        ✓ First 5 requests return 200 OK
        ✓ Headers show limit and remaining count
        ✓ 6th request returns 429 with Retry-After header
        ✓ After waiting, requests work again

     2. Test Without API Key

        Command:
        curl -i http://localhost:3000/api/test

        Success Criteria:
        ✓ Returns 401 Unauthorized
        ✓ Error message: "API key required"

     3. Verify Redis Data

        Command:
        redis-cli -h $REDIS_HOST KEYS "ratelimit:*"

        Success Criteria:
        ✓ See keys for each API key used
        ✓ Keys have TTL set (check with TTL command)

     4. Check Quality Gates

        ✓ Type checks passing (already verified)
        ✓ Production build succeeds (already verified)

     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     🎬 NEXT STEPS
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

     If all verification steps pass:
       → Run: /prd accept

     If you encounter issues:
       → Run: /prd reject "[describe the issue]"
```

### Checking status (In Progress):
```
User: /prd status
You: 📋 Active PRD: API Rate Limiting
     File: docs/prds/06-api-rate-limiting.md
     Status: In Progress
     Started: 2026-01-28

     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     🎯 FEATURES TO IMPLEMENT
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

     1. Rate Limiting Middleware
     2. Redis-Based Storage
     3. Error Handling

     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     📁 FILES TO CREATE/MODIFY
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

     To Create:
       • app/middleware/rateLimit.ts
       • lib/redis/rateLimiter.ts
       • types/rateLimit.ts

     To Modify:
       • next.config.ts
       • app/api/test/route.ts

     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     📝 CURRENT STEP
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

     Step 2: Implement Redis-Based Rate Limit Tracking

     Progress:
     [x] Create lib/redis/rateLimiter.ts
     [x] Implement increment function
     [ ] Add TTL management
     [ ] Add tests

     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     NEXT ACTION
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

     Continue implementation with /prd start
     Run /prd end when all steps complete
```

### Checking status (Accepted):
```
User: /prd status
You: 📋 Active PRD: API Rate Limiting
     File: docs/prds/06-api-rate-limiting.md

     ✅ PRD is complete and accepted
     Accepted: 2026-01-31

     Summary: Rate limiting middleware with Redis-based tracking
```

## Implementation Notes

- Always use the Read tool before Edit/Write operations
- Use Glob to find PRD files: `docs/prds/*.md`
- Use Grep to search within PRDs if needed
- Use Bash for date commands: `date +%Y-%m-%d`
- Preserve all template meta-instructions (HTML comments) when creating new PRDs
- When editing, use the Edit tool for surgical changes, Write for complete rewrites
