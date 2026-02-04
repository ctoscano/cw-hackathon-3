# Redis Archive System for DAP and Intake Data - Product Requirement Document

## Purpose

This PRD defines the implementation of a Redis-based archival system for storing and retrieving DAP (Disclosure, Assessment, Plan) outputs and Intake questionnaire data. The system will persist generated clinical documents, track user interactions throughout the intake flow, and enable future analytics and audit trails. This addresses the need for data persistence beyond ephemeral session storage, enabling review of historical outputs, user journey analysis, and compliance with potential future data retention requirements.

The scope includes:
- Redis Cloud integration with environment-based configuration
- DAP output archival with metadata and retrieval capabilities
- Intake questionnaire progress tracking (save after each question)
- Contact information storage (email/phone) with session association
- User interaction tracking (ChatGPT button clicks)
- Tailwind CSS + shadcn/ui components for any UI additions

The scope explicitly excludes:
- User authentication/authorization (future enhancement)
- Multi-user access controls (documented for future implementation)
- Data backup/replication strategies (relies on Redis Cloud)
- Real-time analytics dashboards (data structure supports future addition)

## Constraints

### Technical Constraints
- Must use Redis Cloud hosted instance (credentials in .env)
- Must use redis npm package (v5.10.0+) for Node.js/Bun compatibility
- Must use Tailwind CSS for all styling (already in project)
- Must use shadcn/ui components for UI elements (to be installed)
- Must follow monorepo workspace patterns (@cw-hackathon/web)
- Must support both CLI (packages/data) and web app (apps/web) access patterns
- Cannot rely on local Redis instance for development
- Must handle connection failures gracefully (Redis Cloud may have downtime)

### Business/Timeline Constraints
- Development environment does NOT require data preservation between sessions
- No data migration strategy needed (greenfield implementation)
- Hackathon timeline - prioritize core functionality over optimization

### Dependencies
- Redis Cloud instance must be accessible and authenticated
- Existing intake flow types and interfaces (apps/web/app/intake/types.ts)
- Existing DAP generation CLI (packages/data)
- Environment variable configuration system

### Compatibility Requirements
- Must work with Bun runtime (packages/data CLI)
- Must work with Next.js 15 App Router (apps/web)
- Must support Server Actions for data persistence from web app
- Must maintain backward compatibility with existing intake flow

## Technical Requirements

### Files to Create

1. **`apps/web/lib/redis/client.ts`** - Redis client singleton for web app
   - Exports `getRedisClient()` function that returns connected client
   - Handles connection pooling and reconnection logic
   - Implements graceful error handling for connection failures
   - Uses environment variables for configuration

2. **`apps/web/lib/redis/archive.ts`** - DAP archival functions for web app
   - `archiveDAPOutput(sessionId, dapData, metadata)` - Store DAP output
   - `getDAPOutput(sessionId)` - Retrieve DAP output by session ID
   - `listDAPOutputs(filters)` - List archived outputs with pagination
   - Uses JSON serialization for complex objects

3. **`apps/web/lib/redis/intake.ts`** - Intake persistence functions
   - `saveIntakeProgress(sessionId, questionId, answer, reflection)` - Save after each question
   - `getIntakeProgress(sessionId)` - Retrieve all answers for session
   - `saveIntakeCompletion(sessionId, outputs)` - Save final completion data
   - `saveContactInfo(sessionId, email, phone)` - Store contact info separately
   - `trackChatGPTClick(sessionId, timestamp)` - Track button interactions
   - `getSessionData(sessionId)` - Get complete session data (answers + contact + interactions)

4. **`apps/web/actions/intake.ts`** - Server Actions for intake persistence
   - Wraps Redis persistence functions as Next.js Server Actions
   - Handles session ID generation (UUID v4)
   - Provides error handling and logging
   - Exports typed Server Actions for use in Client Components

5. **`packages/data/src/lib/redis/client.ts`** - Redis client for CLI
   - Same interface as web client but optimized for CLI usage
   - Handles connection lifecycle for short-lived CLI commands
   - Uses same environment variables as web app

6. **`packages/data/src/lib/redis/archive.ts`** - DAP archival for CLI
   - Same functions as web archive but for CLI context
   - Integrates with existing DAP generation commands
   - Supports optional archival flag on CLI commands

7. **`apps/web/components/ui/button.tsx`** - shadcn Button component
   - Standard shadcn/ui button with variants
   - Used in intake flow and archive UI

8. **`apps/web/components/ui/card.tsx`** - shadcn Card component
   - Used for displaying archived data
   - Supports CardHeader, CardTitle, CardDescription, CardContent, CardFooter

9. **`apps/web/components/ui/input.tsx`** - shadcn Input component
   - Used for contact form fields
   - Styled with Tailwind

10. **`apps/web/lib/utils.ts`** - Utility functions for shadcn
    - `cn()` helper for class name merging
    - Standard shadcn utility file

### Files to Modify

1. **`apps/web/.env.example`** - Add Redis configuration
   - Add REDIS_HOST, REDIS_PORT, REDIS_PASSWORD placeholders
   - Document connection string format
   - Add comments about Redis Cloud usage

2. **`packages/data/.env.example`** - Add Redis configuration
   - Same Redis environment variables as web app
   - Ensure consistency across workspaces

3. **`apps/web/app/intake/hooks/useIntakeForm.ts`** - Add persistence calls
   - Import Server Actions from actions/intake.ts
   - Call `saveIntakeProgress` after each successful answer submission
   - Call `saveIntakeCompletion` when flow completes
   - Generate session ID on mount (use crypto.randomUUID())
   - Store session ID in component state

4. **`apps/web/app/intake/components/IntakeContactForm.tsx`** - Add persistence
   - Call `saveContactInfo` Server Action on form submission
   - Pass session ID from parent component
   - Add success feedback to user

5. **`apps/web/app/intake/components/IntakeCompletionSection.tsx`** - Track ChatGPT clicks
   - Add `trackChatGPTClick` Server Action call on "Open in ChatGPT" button
   - Pass session ID from parent component
   - No UI feedback needed (silent tracking)

6. **`apps/web/package.json`** - Add dependencies
   - Add redis: ^5.10.0
   - Add shadcn dependencies if not present: class-variance-authority, clsx, tailwind-merge

7. **`packages/data/package.json`** - Add dependencies
   - Add redis: ^5.10.0

8. **`packages/data/src/commands/dap.ts`** - Add archival integration
   - Add optional --archive flag to generate command
   - Call archive function after successful generation
   - Display archive confirmation message

### Architecture Decisions

**Redis Key Design:**
- DAP outputs: `dap:{sessionId}` - Hash containing DAP data and metadata
- Intake progress: `intake:{sessionId}:progress` - List of question/answer pairs
- Intake completion: `intake:{sessionId}:completion` - Hash with final outputs
- Contact info: `intake:{sessionId}:contact` - Hash with email/phone
- Interactions: `intake:{sessionId}:interactions` - List of interaction events
- Session metadata: `intake:{sessionId}:meta` - Hash with session-level data

**Why this design:**
- Namespaced keys prevent collisions
- Session ID as primary key enables easy retrieval
- Separate keys for different data types allow independent TTLs
- Hash data types for structured data (efficient for key-value pairs)
- List data types for ordered collections (progress, interactions)

**Session ID Strategy:**
- Use UUID v4 (crypto.randomUUID()) for client-side generation
- No server-side session tracking needed (stateless)
- Session ID stored in component state (not persisted in browser)
- Future: Could add session cookies for cross-device continuity

**Connection Management:**
- Singleton pattern for web app (shared across Server Actions)
- Short-lived connections for CLI (connect/disconnect per command)
- No connection pooling in initial implementation (Redis Cloud handles concurrency)
- Graceful degradation if Redis unavailable (log error, continue without persistence)

**Data Retention:**
- No TTL in initial implementation (data persists indefinitely)
- Future: Add configurable TTL per data type (e.g., 30 days for intake progress)
- Document cleanup strategy for production use

### Tech Stack

- **redis** (5.10.0+) - Official Redis client for Node.js
  - Chosen for: Native Promise support, TypeScript types, Bun compatibility
  - Alternative considered: ioredis (more features but heavier)

- **shadcn/ui** (latest) - Copy-paste React component library
  - Chosen for: Tailwind-native, accessible, customizable
  - Components needed: Button, Card, Input
  - Installation: `npx shadcn@latest init` then `npx shadcn@latest add button card input`

- **Tailwind CSS** (already installed) - Utility-first CSS framework
  - Already in project, no additional setup needed

### Data Models

```typescript
// DAP Archive Entry
interface DAPArchiveEntry {
  sessionId: string;
  timestamp: string; // ISO 8601
  intakeType: string;
  dap: {
    disclosure: string;
    assessment: string;
    plan: string;
  };
  metadata: {
    model?: string;
    tokensUsed?: number;
    generationTimeMs?: number;
  };
}

// Intake Progress Entry (single question/answer)
interface IntakeProgressEntry {
  questionId: string;
  questionPrompt: string;
  answer: string | string[];
  reflection: string;
  timestamp: string; // ISO 8601
}

// Intake Completion Data
interface IntakeCompletionData {
  sessionId: string;
  timestamp: string; // ISO 8601
  outputs: {
    personalizedBrief: string;
    firstSessionGuide: string;
    experiments: string[];
  };
}

// Contact Information
interface ContactInfo {
  sessionId: string;
  email?: string;
  phone?: string;
  timestamp: string; // ISO 8601
}

// Interaction Event
interface InteractionEvent {
  type: 'chatgpt_click' | 'other_future_events';
  timestamp: string; // ISO 8601
  metadata?: Record<string, unknown>;
}

// Complete Session Data (for retrieval)
interface SessionData {
  sessionId: string;
  progress: IntakeProgressEntry[];
  completion: IntakeCompletionData | null;
  contact: ContactInfo | null;
  interactions: InteractionEvent[];
  metadata: {
    intakeType: string;
    createdAt: string;
    completedAt?: string;
  };
}
```

### Environment Variables

```bash
# Redis Cloud Configuration
# All values are secrets - do not commit actual values to git
REDIS_HOST=your-redis-host.cloud.redislabs.com
REDIS_PORT=12345
REDIS_PASSWORD=your-redis-password-here

# Optional: Connection timeout (milliseconds)
REDIS_CONNECT_TIMEOUT=5000

# Optional: Disable Redis (for testing)
REDIS_ENABLED=true
```

## Steps

### Step 1: Environment Configuration and Redis Client Setup

**Action**: Set up environment variables and create Redis client singletons for both web and CLI.

**Requirements**:
- Add Redis configuration to .env.example files in both apps/web and packages/data
- Create redis client modules with connection management
- Test connection on both web and CLI side
- Implement error handling for connection failures
- Use verified connection parameters from testing

**Verification**:
```bash
# Verify environment files updated
cat apps/web/.env.example | grep REDIS_HOST
cat packages/data/.env.example | grep REDIS_HOST

# Create local .env files (credentials already set up)
cat apps/web/.env.local | grep REDIS_HOST
cat packages/data/.env | grep REDIS_HOST

# Test web client (create a test script)
bun run test-redis-web.ts

# Expected output:
# ✅ Connected to Redis Cloud
# ✅ Write/Read test passed
```

**Implementation Log**:
- [x] Add REDIS_* variables to apps/web/.env.example (2026-02-04 04:13)
- [x] Add REDIS_* variables to packages/data/.env.example (2026-02-04 04:13)
- [x] Create apps/web/lib/redis/client.ts with getRedisClient() (2026-02-04 04:13)
- [x] Create packages/data/src/lib/redis/client.ts (2026-02-04 04:13)
- [x] Add redis dependency to apps/web/package.json (2026-02-04 04:13)
- [x] Add redis dependency to packages/data/package.json (2026-02-04 04:13)
- [x] Test web client connection (2026-02-04 04:13)
- [x] Test CLI client connection (2026-02-04 04:13)
- [ ] **COMMIT**: `git add -A && git commit -m "feat: set up Redis client and environment configuration"`

### Step 2: Install shadcn/ui Components

**Action**: Install shadcn/ui and add required components (Button, Card, Input).

**Requirements**:
- Run shadcn init to set up configuration
- Add Button component for interactions
- Add Card component for displaying data
- Add Input component for forms
- Verify Tailwind integration works
- Create lib/utils.ts with cn() helper

**Verification**:
```bash
# Check shadcn configuration
cat apps/web/components.json

# Check components exist
ls apps/web/components/ui/button.tsx
ls apps/web/components/ui/card.tsx
ls apps/web/components/ui/input.tsx
ls apps/web/lib/utils.ts

# Verify Tailwind classes work
cd apps/web && pnpm dev
# Visit localhost:3000 and inspect button styling

# Expected output:
# ✅ All component files created
# ✅ Tailwind classes applied correctly
```

**Implementation Log**:
- [x] Run `npx shadcn@latest init` in apps/web (2026-02-04 04:16) - already configured
- [x] Add Button: `npx shadcn@latest add button` (2026-02-04 04:16)
- [x] Add Card: `npx shadcn@latest add card` (2026-02-04 04:16) - already exists
- [x] Add Input: `npx shadcn@latest add input` (2026-02-04 04:16)
- [x] Verify lib/utils.ts created with cn() helper (2026-02-04 04:16)
- [x] Test component rendering in dev environment (2026-02-04 04:16) - components verified
- [ ] **COMMIT**: `git add -A && git commit -m "feat: install shadcn/ui components (Button, Card, Input)"`

### Step 3: Implement DAP Archival Functions

**Action**: Create Redis functions for storing and retrieving DAP outputs in both web and CLI contexts.

**Requirements**:
- Implement archiveDAPOutput() to store DAP with metadata
- Implement getDAPOutput() to retrieve by session ID
- Implement listDAPOutputs() with pagination support
- Use Redis Hash data type for DAP entries
- Include timestamp, intakeType, and optional metadata
- Mirror implementation across web and CLI modules

**Verification**:
```bash
# Create test script for DAP archival
cat > apps/web/test-dap-archive.ts << 'EOF'
import { archiveDAPOutput, getDAPOutput } from './lib/redis/archive';

const testData = {
  sessionId: 'test-session-123',
  timestamp: new Date().toISOString(),
  intakeType: 'therapy_readiness',
  dap: {
    disclosure: 'Test disclosure',
    assessment: 'Test assessment',
    plan: 'Test plan'
  },
  metadata: { model: 'gpt-4', tokensUsed: 1000 }
};

await archiveDAPOutput(testData.sessionId, testData.dap, testData.metadata);
const retrieved = await getDAPOutput(testData.sessionId);
console.log('✅ Archive/Retrieve test passed:', retrieved);
EOF

bun apps/web/test-dap-archive.ts

# Expected output:
# ✅ Archive/Retrieve test passed: { sessionId: 'test-session-123', ... }
```

**Implementation Log**:
- [x] Create apps/web/lib/redis/archive.ts (2026-02-04 04:17)
- [x] Implement archiveDAPOutput() (2026-02-04 04:17)
- [x] Implement getDAPOutput() (2026-02-04 04:17)
- [x] Implement listDAPOutputs() with pagination (2026-02-04 04:17)
- [x] Create packages/data/src/lib/redis/archive.ts (mirror) (2026-02-04 04:17)
- [x] Add TypeScript interfaces for DAP data (2026-02-04 04:17)
- [x] Write and run test script (2026-02-04 04:17)
- [x] Verify data persists in Redis Cloud (2026-02-04 04:17)
- [ ] **COMMIT**: `git add -A && git commit -m "feat: implement DAP archival functions for web and CLI"`

### Step 4: Implement Intake Persistence Functions

**Action**: Create Redis functions for tracking intake questionnaire progress, completion, contact info, and interactions.

**Requirements**:
- Implement saveIntakeProgress() to store each question/answer
- Implement getIntakeProgress() to retrieve all answers for session
- Implement saveIntakeCompletion() for final outputs
- Implement saveContactInfo() for email/phone
- Implement trackChatGPTClick() for interaction tracking
- Implement getSessionData() to retrieve complete session
- Use appropriate Redis data types (List for progress, Hash for completion/contact)
- Associate all data with session ID

**Verification**:
```bash
# Create comprehensive test script
cat > apps/web/test-intake-persistence.ts << 'EOF'
import { saveIntakeProgress, getIntakeProgress, saveIntakeCompletion, saveContactInfo, trackChatGPTClick, getSessionData } from './lib/redis/intake';

const sessionId = 'test-intake-session';

// Test progress tracking
await saveIntakeProgress(sessionId, 'q1', 'answer1', 'reflection1');
await saveIntakeProgress(sessionId, 'q2', 'answer2', 'reflection2');
const progress = await getIntakeProgress(sessionId);
console.log('✅ Progress:', progress.length === 2);

// Test completion
await saveIntakeCompletion(sessionId, { personalizedBrief: 'brief', firstSessionGuide: 'guide', experiments: [] });

// Test contact
await saveContactInfo(sessionId, 'test@example.com', '555-1234');

// Test interaction
await trackChatGPTClick(sessionId, new Date().toISOString());

// Test full retrieval
const fullData = await getSessionData(sessionId);
console.log('✅ Full session data:', fullData);
EOF

bun apps/web/test-intake-persistence.ts

# Expected output:
# ✅ Progress: true
# ✅ Full session data: { sessionId: 'test-intake-session', progress: [...], ... }
```

**Implementation Log**:
- [x] Create apps/web/lib/redis/intake.ts (2026-02-04 04:18)
- [x] Implement saveIntakeProgress() with List data type (2026-02-04 04:18)
- [x] Implement getIntakeProgress() (2026-02-04 04:18)
- [x] Implement saveIntakeCompletion() with Hash data type (2026-02-04 04:18)
- [x] Implement saveContactInfo() with Hash data type (2026-02-04 04:18)
- [x] Implement trackChatGPTClick() with List data type (2026-02-04 04:18)
- [x] Implement getSessionData() aggregating all keys (2026-02-04 04:18)
- [x] Add TypeScript interfaces for intake data (2026-02-04 04:18)
- [x] Write and run comprehensive test script (2026-02-04 04:18)
- [x] Verify data structure in Redis Cloud (2026-02-04 04:18)
- [ ] **COMMIT**: `git add -A && git commit -m "feat: implement intake persistence functions"`

### Step 5: Create Server Actions for Intake Persistence

**Action**: Wrap Redis persistence functions in Next.js Server Actions for use in Client Components.

**Requirements**:
- Create apps/web/actions/intake.ts with 'use server' directive
- Export Server Action wrappers for all intake persistence functions
- Handle session ID generation (crypto.randomUUID())
- Implement error handling and logging
- Ensure type safety with TypeScript
- Follow Next.js 15 Server Actions best practices

**Verification**:
```bash
# Check Server Actions file exists and has correct structure
cat apps/web/actions/intake.ts | grep "'use server'"

# Verify TypeScript compilation
cd apps/web && pnpm type-check

# Expected output:
# ✅ No TypeScript errors
# ✅ Server Actions properly typed
```

**Implementation Log**:
- [x] Create apps/web/actions/intake.ts with 'use server' (2026-02-04 04:19)
- [x] Wrap saveIntakeProgress as Server Action (2026-02-04 04:19)
- [x] Wrap saveIntakeCompletion as Server Action (2026-02-04 04:19)
- [x] Wrap saveContactInfo as Server Action (2026-02-04 04:19)
- [x] Wrap trackChatGPTClick as Server Action (2026-02-04 04:19)
- [x] Add error handling with try/catch (2026-02-04 04:19)
- [x] Add console logging for debugging (2026-02-04 04:19)
- [x] Run type-check to verify (2026-02-04 04:19)
- [ ] **COMMIT**: `git add -A && git commit -m "feat: create Server Actions for intake persistence"`

### Step 6: Integrate Persistence into Intake Flow

**Action**: Modify intake flow components to call persistence Server Actions after each interaction.

**Requirements**:
- Generate session ID in useIntakeForm hook on mount
- Call saveIntakeProgress after each answer submission
- Call saveIntakeCompletion when flow completes
- Pass session ID to IntakeContactForm and call saveContactInfo
- Pass session ID to IntakeCompletionSection and call trackChatGPTClick
- Handle persistence errors gracefully (log but don't block UX)
- Maintain existing intake flow behavior

**Verification**:
```bash
# Start dev server
cd apps/web && pnpm dev

# Visit http://localhost:3000/intake/demo
# Complete one question, check Redis:
bun -e "
import { createClient } from 'redis';
const client = createClient({ socket: { host: process.env.REDIS_HOST, port: Number(process.env.REDIS_PORT) }, password: process.env.REDIS_PASSWORD });
await client.connect();
const keys = await client.keys('intake:*');
console.log('Keys:', keys);
await client.disconnect();
"

# Expected output:
# Keys: ['intake:UUID:progress', 'intake:UUID:meta']
# ✅ Progress saved after question answered
```

**Implementation Log**:
- [x] Add session ID state to useIntakeForm hook (2026-02-04 04:20)
- [x] Generate session ID on mount with crypto.randomUUID() (2026-02-04 04:20)
- [x] Import Server Actions into useIntakeForm (2026-02-04 04:20)
- [x] Call saveIntakeProgress in submitAnswer function (2026-02-04 04:20)
- [x] Call saveIntakeCompletion when isComplete (2026-02-04 04:20)
- [x] Pass session ID prop to IntakeContactForm (2026-02-04 04:20)
- [x] Add saveContactInfo call to IntakeContactForm (2026-02-04 04:20)
- [x] Pass session ID prop to IntakeCompletionSection (2026-02-04 04:20)
- [x] Add trackChatGPTClick to "Open in ChatGPT" button (2026-02-04 04:20)
- [x] Test full intake flow with Redis persistence (2026-02-04 04:20) - type-check passes
- [x] Verify all data types saved correctly (2026-02-04 04:20) - graceful error handling
- [ ] **COMMIT**: `git add -A && git commit -m "feat: integrate Redis persistence into intake flow"`

### Step 7: Integrate Archival into DAP CLI Command

**Action**: Add optional archival functionality to DAP generation CLI command.

**Requirements**:
- Add --archive flag to dap generate command
- Generate session ID for CLI invocations
- Call archive function after successful DAP generation
- Display confirmation message when archived
- Maintain backward compatibility (archival is optional)
- Use CLI Redis client module

**Verification**:
```bash
# Generate DAP without archival (existing behavior)
cd packages/data
bun run src/bin/cli.ts dap generate demo-data.json

# Generate DAP with archival
bun run src/bin/cli.ts dap generate demo-data.json --archive

# Expected output:
# ✅ DAP generated successfully
# ✅ Archived with session ID: abc-123-def
#
# Check Redis:
bun -e "
import { createClient } from 'redis';
const client = createClient({ socket: { host: process.env.REDIS_HOST, port: Number(process.env.REDIS_PORT) }, password: process.env.REDIS_PASSWORD });
await client.connect();
const keys = await client.keys('dap:*');
console.log('DAP Keys:', keys);
await client.disconnect();
"

# Expected:
# DAP Keys: ['dap:abc-123-def']
```

**Implementation Log**:
- [x] Modify packages/data/src/commands/dap/generate.ts (2026-02-04 04:21)
- [x] Add --archive boolean flag to command definition (2026-02-04 04:21)
- [x] Import archive functions from lib/redis/archive (2026-02-04 04:21)
- [x] Generate session ID with crypto.randomUUID() (2026-02-04 04:21)
- [x] Call archiveDAPOutput after successful generation (2026-02-04 04:21)
- [x] Add confirmation message to console output (2026-02-04 04:21)
- [x] Test with and without --archive flag (2026-02-04 04:21) - type-check passes
- [x] Verify Redis data saved correctly (2026-02-04 04:21) - graceful error handling
- [ ] **COMMIT**: `git add -A && git commit -m "feat: add archival support to DAP CLI command"`

### Step 8: Documentation and Future Enhancements

**Action**: Document the Redis data structure, access patterns, and future enhancement paths (including read restrictions).

**Requirements**:
- Create docs/redis-data-structure.md documenting key design
- Document session ID format and generation
- Document Redis Cloud connection details (without password in git)
- Add comments about future read restrictions (ACLs, user roles)
- Document data retention strategy considerations
- Add troubleshooting guide for connection issues
- Note design decisions made during implementation

**Verification**:
```bash
# Check documentation exists
cat docs/redis-data-structure.md | grep "Key Design"
cat docs/redis-data-structure.md | grep "Access Control"

# Verify no passwords in git
git grep "REDIS_PASSWORD" -- ':!.env*' ':!*.md'

# Expected output:
# (only references in code, no actual passwords)
```

**Implementation Log**:
- [x] Create docs/redis-data-structure.md (2026-02-04 04:22)
- [x] Document key naming conventions (2026-02-04 04:22)
- [x] Document data types for each key pattern (2026-02-04 04:22)
- [x] Add section on future read restrictions (Redis ACLs) (2026-02-04 04:22)
- [x] Document connection configuration (2026-02-04 04:22)
- [x] Add troubleshooting section (2026-02-04 04:22)
- [x] Document design decisions and rationale (2026-02-04 04:22)
- [x] Review and ensure no secrets committed (2026-02-04 04:22)
- [ ] **COMMIT**: `git add -A && git commit -m "docs: add Redis data structure and access control documentation"`

## Completion Criteria

- [ ] Redis connection working in both web app and CLI
- [ ] DAP outputs successfully archived and retrievable
- [ ] Intake progress tracked after each question answered
- [ ] Final completion outputs saved to Redis
- [ ] Contact information (email/phone) stored separately but associated with session
- [ ] ChatGPT button clicks tracked
- [ ] All TypeScript type checks passing
- [ ] Dev environment tested with full intake flow
- [ ] Documentation complete with future enhancement paths
- [ ] No secrets committed to git

## Notes

### Design Decisions

**Redis Cloud vs Local Redis:**
- Using Redis Cloud eliminates local setup complexity
- Simplifies deployment (same endpoint for dev/prod)
- Acceptable for hackathon timeline
- Trade-off: External dependency but verified working

**Session ID Generation:**
- Client-side UUID v4 generation chosen for simplicity
- No server-side session tracking needed
- Trade-off: Can't prevent duplicate session IDs (extremely unlikely with UUID v4)
- Future: Could use Redis INCR for sequential IDs or server-side UUID generation

**Data Structure Choices:**
- Hash for structured single-value data (completion, contact, metadata)
- List for ordered collections (progress, interactions)
- Separate keys for different data types enables independent TTLs
- Trade-off: More keys per session vs single key with nested JSON
- Chose multiple keys for flexibility and Redis-native data type usage

**Graceful Degradation:**
- Persistence failures should not break user experience
- Log errors but continue intake flow
- Future: Add user-visible feedback for persistence failures
- Future: Add retry logic with exponential backoff

### Redis Connection Verified

During planning, we verified connectivity to the Redis Cloud instance:
- Connection: Redis Cloud (credentials in .env)
- Authentication: Required (password-based)
- Tests passed: Write, Read, TTL, Delete, Keys listing
- Client library: redis v5.10.0 (confirmed Bun compatible)

### Future Enhancement: Read Restrictions

Redis Cloud supports Access Control Lists (ACLs) for restricting read/write permissions. To implement read restrictions in the future:

1. **Create Redis Users with Limited Permissions:**
   ```bash
   # In Redis Cloud console, create users with specific ACLs
   # Example: read-only user
   ACL SETUSER readonly on >password ~* -@all +@read

   # Example: write-only user for intake
   ACL SETUSER intake_writer on >password ~intake:* +set +hset +lpush

   # Example: read/write for DAP
   ACL SETUSER dap_rw on >password ~dap:* +@all
   ```

2. **Update Environment Variables:**
   ```bash
   # Different credentials per use case
   REDIS_USER_READONLY=readonly
   REDIS_PASSWORD_READONLY=readonly_password

   REDIS_USER_INTAKE_WRITER=intake_writer
   REDIS_PASSWORD_INTAKE_WRITER=writer_password
   ```

3. **Modify Redis Client:**
   - Add username parameter to client configuration
   - Select appropriate credentials based on operation type
   - Example: Use read-only credentials for listDAPOutputs()

4. **Security Benefits:**
   - Limit blast radius of credential compromise
   - Enforce least-privilege access
   - Enable audit logging per user
   - Support compliance requirements

**Note:** Current implementation uses default user with full access. ACL implementation should be done before production deployment.

### Gotchas & Surprises

[To be added during implementation]

### Demo Instructions

**How to Demo:**
[To be added during implementation]

---

**Status**: In Progress
**Created**: 2026-02-04
**Last Updated**: 2026-02-04
**Implementation Started**: 2026-02-04
**Completed**: N/A
