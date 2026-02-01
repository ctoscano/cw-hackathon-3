# Redis Archive for DAP Notes - Product Requirement Document

## Purpose

Add Redis-based persistence to save DAP note inputs and results, enabling users to review their history at `/archive/dap`. This includes anonymous user identification via localStorage and session tracking to tie inputs with their generated results.

## Background

Currently, the `/dap` page is stateless - each request is independent with no persistence. Users cannot review previously generated DAP notes. This PRD adds:
1. Anonymous user identification (stored in localStorage)
2. Session tracking to correlate inputs with outputs
3. Redis storage for persistence
4. Archive page to review historical DAP notes

## Constraints

### Technical Constraints
- POC - no authentication required
- Redis for storage (simple key-value, good for POC)
- Anonymous user ID via localStorage (client-side)
- Session ID generated server-side per DAP generation request
- Next.js 15 App Router patterns
- Plain CSS styling (consistent with existing pages)

### Design Constraints
- Minimal UI changes to existing `/dap` page
- Simple archive listing with ability to view details
- No editing/deleting of archived records (read-only)

### Dependencies
- Redis server (local or cloud)
- `ioredis` package for Redis client
- Existing `/dap` infrastructure

## Data Model

### Anonymous User ID
```typescript
// Generated client-side, stored in localStorage
type AnonymousUserId = string; // UUID v4
// localStorage key: "dap_anonymous_user_id"
```

### Session Record
```typescript
interface DAPSession {
  id: string;                    // UUID v4 - session ID
  userId: string;                // Anonymous user ID
  createdAt: string;             // ISO timestamp
  input: {
    sessionDescription: string;  // Original input
  };
  output: {
    mode: "generated" | "prompt-only";
    dapNote?: DAPNote;           // Generated DAP note (if mode === "generated")
    prompt?: {                   // Prompt data (if mode === "prompt-only")
      system: string;
      user: string;
    };
  };
  metadata: {
    tokensUsed?: number;
    executionTime?: number;
    model?: string;
  };
}
```

### Redis Key Structure
```
# User's session list (sorted set, score = timestamp)
dap:user:{userId}:sessions -> ZSET of sessionIds

# Individual session data
dap:session:{sessionId} -> JSON string of DAPSession

# Optional: Global recent sessions for admin view
dap:recent:sessions -> ZSET of sessionIds (limited to last 100)
```

## Technical Requirements

### Files to Create

1. **`apps/web/lib/redis.ts`** - Redis client singleton
   ```typescript
   import Redis from "ioredis";

   const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
   export default redis;
   ```

2. **`apps/web/lib/archive.ts`** - Archive service functions
   - `saveSession(session: DAPSession): Promise<void>`
   - `getUserSessions(userId: string, limit?: number): Promise<DAPSession[]>`
   - `getSession(sessionId: string): Promise<DAPSession | null>`

3. **`apps/web/app/archive/dap/page.tsx`** - Archive listing page
   - Server component that fetches sessions for user
   - Lists sessions with date, truncated input, and link to detail

4. **`apps/web/app/archive/dap/[id]/page.tsx`** - Session detail page
   - Server component that fetches single session
   - Displays full input and output

5. **`apps/web/app/archive/dap/archive.module.css`** - Archive styling

6. **`apps/web/hooks/useAnonymousUser.ts`** - Client hook for user ID
   - Generates UUID if not exists in localStorage
   - Returns stable user ID

7. **`apps/web/app/api/archive/sessions/route.ts`** - API for fetching sessions
   - GET: Returns sessions for anonymous user ID (via header)

### Files to Modify

1. **`apps/web/package.json`** - Add Redis dependency
   ```json
   "dependencies": {
     "ioredis": "^5.4.1",
     "uuid": "^10.0.0"
   }
   ```

2. **`apps/web/app/api/dap/generate/route.ts`** - Save to Redis after generation
   - Accept `userId` from request header
   - Generate `sessionId`
   - Save complete session to Redis after successful generation
   - Return `sessionId` in response

3. **`apps/web/app/dap/dap-form.tsx`** - Add user ID handling
   - Use `useAnonymousUser` hook
   - Send `userId` header with requests
   - Optionally show link to archive

4. **`apps/web/.env.example`** - Add Redis URL variable
   ```env
   REDIS_URL=redis://localhost:6379
   ```

## Architecture

### Data Flow - Generation

```
User enters session description
        ↓
dap-form.tsx gets userId from localStorage (or creates new)
        ↓
POST /api/dap/generate
  Header: X-Anonymous-User-Id: {userId}
        ↓
API generates DAP note (existing flow)
        ↓
API creates DAPSession record
        ↓
saveSession() to Redis
        ↓
Return response with sessionId
        ↓
Display results (existing flow)
```

### Data Flow - Archive View

```
User visits /archive/dap
        ↓
Page reads userId from cookie/header
        ↓
getUserSessions(userId)
        ↓
Display session list
        ↓
User clicks session
        ↓
/archive/dap/[id]
        ↓
getSession(sessionId)
        ↓
Display full session details
```

## Steps

### Step 1: Add Dependencies

**Action**: Add ioredis and uuid packages to web app

**Verification**:
```bash
cd apps/web && pnpm add ioredis uuid && pnpm add -D @types/uuid
```

### Step 2: Create Redis Client

**Action**: Create Redis client singleton at `apps/web/lib/redis.ts`

**Requirements**:
- Lazy connection (connect on first use)
- Handle connection errors gracefully
- Support REDIS_URL environment variable

**Verification**:
```bash
# Start Redis locally
docker run -d -p 6379:6379 redis:alpine

# Test connection via API
curl http://localhost:3000/api/health
```

### Step 3: Create Archive Service

**Action**: Create archive helper functions at `apps/web/lib/archive.ts`

**Requirements**:
- Type-safe session operations
- Efficient pagination support
- Error handling

**Verification**:
```typescript
// Unit test or manual verification via API
```

### Step 4: Create Anonymous User Hook

**Action**: Create client hook at `apps/web/hooks/useAnonymousUser.ts`

**Requirements**:
- Generate UUID v4 on first visit
- Store in localStorage
- Return consistent ID across sessions
- Handle SSR (return null during SSR, ID after hydration)

**Verification**:
- Open browser, check localStorage for `dap_anonymous_user_id`
- Refresh page, verify same ID
- Different browser/incognito gets different ID

### Step 5: Modify DAP Generation API

**Action**: Update `/api/dap/generate/route.ts` to save sessions

**Requirements**:
- Read `X-Anonymous-User-Id` header
- Generate session ID (UUID v4)
- Save complete session after successful generation
- Return sessionId in response
- Handle Redis errors gracefully (don't fail generation if save fails)

**Verification**:
```bash
curl -X POST http://localhost:3000/api/dap/generate \
  -H "Content-Type: application/json" \
  -H "X-Anonymous-User-Id: test-user-123" \
  -d '{"sessionDescription": "Patient presented with anxiety symptoms..."}'

# Check Redis for saved session
redis-cli KEYS "dap:*"
```

### Step 6: Update DAP Form

**Action**: Modify `dap-form.tsx` to send user ID

**Requirements**:
- Use `useAnonymousUser` hook
- Add `X-Anonymous-User-Id` header to fetch request
- Optionally display link to archive after generation
- Handle case where user ID not yet available (loading state)

**Verification**:
- Submit form on /dap page
- Check network request has user ID header
- Verify session saved to Redis

### Step 7: Create Archive List Page

**Action**: Create `/archive/dap/page.tsx`

**Requirements**:
- Read user ID from cookie or query param
- Fetch user's sessions from Redis
- Display as list with:
  - Date/time
  - Truncated input (first 100 chars)
  - Link to detail page
- Empty state for no sessions
- Pagination (show last 20, "Load more" button)

**UI Mockup**:
```
┌─────────────────────────────────────────────────────────┐
│  DAP Notes Archive                                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Your Generated Notes                                   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Jan 31, 2026 - 3:45 PM                          │   │
│  │ "Patient presented with anxiety symptoms and    │   │
│  │ reported difficulty sleeping..."                │   │
│  │                                    [View →]      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Jan 30, 2026 - 10:15 AM                         │   │
│  │ "Follow-up session with John regarding his      │   │
│  │ progress on coping strategies..."              │   │
│  │                                    [View →]      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [Load More]                                            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Verification**:
- Navigate to /archive/dap
- Verify sessions display
- Click "View" to go to detail

### Step 8: Create Session Detail Page

**Action**: Create `/archive/dap/[id]/page.tsx`

**Requirements**:
- Fetch session by ID
- Verify session belongs to user (security check)
- Display full input
- Display full output (DAP note formatted nicely)
- Display metadata (tokens, time, model)
- Back link to archive list
- Handle not found state

**UI Mockup**:
```
┌─────────────────────────────────────────────────────────┐
│  ← Back to Archive                                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  DAP Note - Jan 31, 2026                               │
│                                                         │
│  ┌─ Input ──────────────────────────────────────────┐  │
│  │ Patient presented with anxiety symptoms and       │  │
│  │ reported difficulty sleeping over the past two    │  │
│  │ weeks. They described work-related stress...      │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─ Generated DAP Note ─────────────────────────────┐  │
│  │                                                   │  │
│  │ DATA                                              │  │
│  │ Subjective: Patient reports increased anxiety... │  │
│  │ Objective: Patient appeared restless...          │  │
│  │                                                   │  │
│  │ ASSESSMENT                                        │  │
│  │ Clinical Impression: Generalized anxiety...      │  │
│  │                                                   │  │
│  │ PLAN                                              │  │
│  │ Interventions: ...                                │  │
│  │ Homework: ...                                     │  │
│  │ Next Session: ...                                 │  │
│  │                                                   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─ Metadata ───────────────────────────────────────┐  │
│  │ Tokens: 1,234 | Time: 2.3s | Model: sonnet       │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Verification**:
- Click session from archive list
- Verify all data displays correctly
- Test with non-existent ID (404 page)

### Step 9: Add Styling

**Action**: Create CSS module for archive pages

**Requirements**:
- Consistent with existing /dap styling
- Responsive layout
- Clear typography
- Card-based session items

### Step 10: Update Environment

**Action**: Update `.env.example` with Redis configuration

**Verification**:
- Check file exists with REDIS_URL variable
- Update documentation in CLAUDE.md if needed

## API Endpoints

### GET /api/archive/sessions

Fetch sessions for the current anonymous user.

**Headers**:
- `X-Anonymous-User-Id`: string (required)

**Query Parameters**:
- `limit`: number (default: 20, max: 100)
- `offset`: number (default: 0)

**Response**:
```json
{
  "sessions": [
    {
      "id": "uuid",
      "createdAt": "2026-01-31T15:45:00Z",
      "inputPreview": "Patient presented with anxiety...",
      "mode": "generated"
    }
  ],
  "total": 42,
  "hasMore": true
}
```

### GET /api/archive/sessions/[id]

Fetch single session details.

**Headers**:
- `X-Anonymous-User-Id`: string (required)

**Response**:
```json
{
  "session": {
    "id": "uuid",
    "userId": "user-uuid",
    "createdAt": "2026-01-31T15:45:00Z",
    "input": {
      "sessionDescription": "Full input text..."
    },
    "output": {
      "mode": "generated",
      "dapNote": { ... }
    },
    "metadata": {
      "tokensUsed": 1234,
      "executionTime": 2300,
      "model": "sonnet"
    }
  }
}
```

**Errors**:
- 404: Session not found or doesn't belong to user
- 400: Missing user ID header

## Completion Criteria

- [ ] Redis client configured and connecting
- [ ] Anonymous user ID generated and persisted in localStorage
- [ ] DAP generation saves sessions to Redis
- [ ] /archive/dap page lists user's sessions
- [ ] /archive/dap/[id] page shows session details
- [ ] User can only see their own sessions
- [ ] Empty states handled gracefully
- [ ] Redis connection errors don't break generation

## Security Considerations

### For POC (Current Scope)
- Anonymous user ID provides minimal separation between users
- No real security - anyone with session ID could access it
- No rate limiting
- No data encryption

### Future Enhancements (Not in Scope)
- Real authentication (OAuth, email magic link)
- Session ownership verification via signed tokens
- Rate limiting per user
- Data encryption at rest
- Session expiration/TTL
- GDPR compliance (data export, deletion)

## Redis Setup Options

### Local Development
```bash
# Docker
docker run -d --name redis -p 6379:6379 redis:alpine

# Or Homebrew (macOS)
brew install redis
brew services start redis
```

### Cloud Options (for deployment)
- Upstash (serverless, free tier)
- Redis Cloud
- AWS ElastiCache
- Railway

**Recommended for POC**: Upstash - free tier, serverless, no management needed

## TTL Strategy

For POC, sessions persist indefinitely. Consider adding TTL for production:
- Session data: 90 days
- User session index: No TTL (references cleaned up when sessions expire)

```typescript
// Optional: Set expiry when saving
await redis.setex(`dap:session:${sessionId}`, 90 * 24 * 60 * 60, JSON.stringify(session));
```

## Notes

### Why Redis?
- Simple key-value storage perfect for POC
- Fast reads for archive listing
- Built-in sorted sets for chronological ordering
- Easy to set up locally and deploy
- Can migrate to proper database later if needed

### Why Anonymous User ID?
- No authentication required (POC constraint)
- Users can still see their own history
- Simple localStorage implementation
- Natural upgrade path to real auth later

### Migration Path
When adding real authentication:
1. Keep anonymous ID system for unauthenticated users
2. Add user account linking (merge anonymous sessions into account)
3. Add session ownership claims signed by auth system

## Resources

- [Redis AI Resources](https://github.com/redis-developer/redis-ai-resources) - Collection of patterns for Redis + AI applications, including session management and message history examples

---

**Status**: Draft
**Created**: 2026-02-01
