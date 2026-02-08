# DAP Notes Web Interface - Product Requirement Document

## Purpose

Create a minimal web interface at `/dap` that allows therapists to enter a session description and receive generated DAP notes. The interface reuses the same prompt construction and schema logic from `packages/data`, ensuring consistency between CLI and web experiences.

## Constraints

### Technical Constraints
- Must use existing functions from `@cw-hackathon/data` package
- Next.js 15 App Router (already configured)
- Plain CSS styling (no Tailwind - keep it minimal)
- API route for server-side DAP generation

### Design Constraints
- Single page, minimal UI
- One input field (textarea for session description)
- Minimal instructions - the input should be self-explanatory
- Display results inline on the same page

### Dependencies
- `@cw-hackathon/data` package (workspace dependency)
- Existing prompt templates and schemas

## Technical Requirements

### Files to Create

1. **`apps/web/app/dap/page.tsx`** - DAP notes page
   - Single textarea input for session description
   - Submit button
   - Results display area
   - Loading state
   - Error handling

2. **`apps/web/app/api/dap/generate/route.ts`** - API endpoint
   - POST endpoint accepting session description
   - Uses `buildDAPPrompt` from data package
   - Returns prompt-only data (no LLM call in this environment)
   - Or returns generated DAP note if LLM is available

3. **`apps/web/app/dap/dap.module.css`** - Minimal styling
   - Simple, readable layout
   - Responsive textarea
   - Clean results display

### Files to Modify

1. **`apps/web/package.json`** - Add data package dependency
   ```json
   "dependencies": {
     "@cw-hackathon/data": "workspace:*"
   }
   ```

### Architecture

```
User enters session description
        ↓
    [Submit]
        ↓
POST /api/dap/generate
        ↓
buildDAPPrompt(description)
        ↓
Return { prompt, schema }
        ↓
Display on page
```

For environments where LLM calls work, the API can optionally call `generateStructuredOutput` to return actual DAP notes.

### Data Flow

**Request:**
```json
{
  "sessionDescription": "I had my sixth session today with Sarah..."
}
```

**Response (prompt-only mode):**
```json
{
  "mode": "prompt-only",
  "prompt": {
    "system": "...",
    "user": "..."
  },
  "schema": "DAPNote { ... }",
  "message": "LLM generation not available. Copy the prompt to use with Claude."
}
```

**Response (with LLM):**
```json
{
  "mode": "generated",
  "dapNote": {
    "data": { "subjective": "...", "objective": "..." },
    "assessment": { ... },
    "plan": { ... },
    "metadata": { ... }
  }
}
```

## Steps

### Step 1: Add Data Package Dependency

**Action**: Add @cw-hackathon/data to web app dependencies

**Verification**:
```bash
cd apps/web && cat package.json | grep "@cw-hackathon/data"
```

### Step 2: Create API Endpoint

**Action**: Create POST /api/dap/generate endpoint

**Requirements**:
- Accept sessionDescription in request body
- Build prompt using data package functions
- Return prompt and schema for client display
- Handle errors gracefully

**Verification**:
```bash
curl -X POST http://localhost:3000/api/dap/generate \
  -H "Content-Type: application/json" \
  -d '{"sessionDescription": "test"}'
```

### Step 3: Create DAP Page

**Action**: Create /dap page with minimal UI

**Requirements**:
- Textarea for session input
- Submit button
- Loading indicator
- Results display (prompt or generated DAP)
- Copy-to-clipboard for prompt

**Verification**:
- Navigate to http://localhost:3000/dap
- Enter text and submit
- Verify results display

### Step 4: Add Minimal Styling

**Action**: Style the page for readability

**Requirements**:
- Clean, minimal design
- Responsive layout
- Readable text
- Clear visual hierarchy

## UI Mockup

```
┌─────────────────────────────────────────────────────────┐
│  DAP Notes                                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Describe the therapy session:                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                 │   │
│  │  (textarea - 6-8 lines)                         │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [Generate DAP Note]                                    │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  (Results appear here after submission)                 │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  System Prompt                      [Copy]       │   │
│  │  ────────────────────────────                   │   │
│  │  You are a clinical documentation...            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  User Prompt                        [Copy]       │   │
│  │  ────────────────────────────                   │   │
│  │  Generate a DAP note for...                     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Completion Criteria

- [ ] /dap page loads without errors
- [ ] Can enter session description
- [ ] Submit triggers API call
- [ ] Results display correctly
- [ ] Prompt can be copied to clipboard
- [ ] Error states handled gracefully

## Notes

### Future Enhancements
- Direct LLM integration when environment supports it
- Save/load session descriptions
- History of generated notes
- Export to various formats

### Why Prompt-Only by Default
The web interface prioritizes the prompt development workflow. Users can:
1. See exactly what prompt would be sent
2. Copy the prompt to use with Claude Code Web
3. Iterate on the input to see how prompts change

This aligns with making prompts first-class artifacts.

---

**Status**: Draft
**Created**: 2026-02-01
