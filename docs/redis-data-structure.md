# Redis Data Structure and Design Documentation

## Overview

This document describes the Redis-based data persistence layer for the CW Hackathon project, including DAP (Disclosure, Assessment, Plan) note archival and Intake questionnaire tracking.

## Connection Configuration

### Environment Variables

All Redis connection details are stored in environment variables (never committed to git):

```bash
REDIS_HOST=<your-redis-cloud-host>     # Redis Cloud hostname
REDIS_PORT=<port-number>                # Redis Cloud port
REDIS_PASSWORD=<your-password>          # Redis Cloud password
REDIS_CONNECT_TIMEOUT=5000              # Optional: connection timeout (ms)
REDIS_ENABLED=true                      # Optional: enable/disable Redis
```

**Location:**
- Web app: `apps/web/.env.local` (gitignored)
- CLI: `packages/data/.env` (gitignored)
- Templates: `apps/web/.env.example`, `packages/data/.env.example` (committed with placeholders)

### Redis Cloud Setup

This project uses Redis Cloud (hosted Redis) instead of local Redis instances:
- **Provider**: Redis Cloud
- **Authentication**: Password-based (no TLS client certificates)
- **Access**: Configured via environment variables
- **Client Library**: redis v5.10.0 (official Node.js client)

## Key Design

### Naming Convention

All keys follow a namespace pattern: `<domain>:<identifier>:<sub-key>`

This provides:
- **Collision prevention**: Namespaces separate different data types
- **Easy querying**: Pattern matching with `KEYS` or `SCAN`
- **Clear organization**: Domain-based grouping
- **Independent TTL**: Different expiration per data type

### DAP Archive Keys

**Purpose**: Store generated DAP notes with metadata for historical review

```
dap:{sessionId}           # Hash - Single DAP note
dap:recent                # Sorted Set - Recent DAP session IDs (score = timestamp)
```

**Key: `dap:{sessionId}`** (Hash)
- `sessionId`: UUID v4 of the session
- `timestamp`: ISO 8601 timestamp of generation
- `intakeType`: Type of intake (e.g., "therapy_readiness")
- `dap`: JSON string containing disclosure, assessment, plan
- `metadata`: JSON string with model, tokensUsed, generationTimeMs

**Key: `dap:recent`** (Sorted Set)
- Members: Session IDs
- Scores: Unix timestamps
- Sorted: Newest first
- Limit: Last 100 entries (older entries automatically removed)

### Intake Session Keys

**Purpose**: Track user progress through intake questionnaire and associated data

```
intake:{sessionId}:progress       # List - Question/answer history
intake:{sessionId}:completion     # Hash - Final completion outputs
intake:{sessionId}:contact        # Hash - Contact information (email/phone)
intake:{sessionId}:interactions   # List - User interaction events
intake:{sessionId}:meta           # Hash - Session metadata
```

**Key: `intake:{sessionId}:progress`** (List)
- Each entry: JSON string containing:
  - `questionId`: Question identifier
  - `questionPrompt`: The question text
  - `answer`: String or array of strings
  - `reflection`: AI-generated reflection
  - `timestamp`: ISO 8601 timestamp

**Key: `intake:{sessionId}:completion`** (Hash)
- `sessionId`: Session identifier
- `timestamp`: ISO 8601 completion timestamp
- `personalizedBrief`: Final personalized brief
- `firstSessionGuide`: First session guide
- `experiments`: JSON string array of experiments

**Key: `intake:{sessionId}:contact`** (Hash)
- `sessionId`: Session identifier
- `email`: User email (optional)
- `phone`: User phone (optional)
- `timestamp`: ISO 8601 timestamp

**Key: `intake:{sessionId}:interactions`** (List)
- Each entry: JSON string containing:
  - `type`: Event type (e.g., "chatgpt_click")
  - `timestamp`: ISO 8601 timestamp
  - `metadata`: Optional additional data

**Key: `intake:{sessionId}:meta`** (Hash)
- `sessionId`: Session identifier
- `intakeType`: Type of intake
- `createdAt`: ISO 8601 creation timestamp
- `completedAt`: ISO 8601 completion timestamp (optional)
- `lastUpdated`: ISO 8601 last update timestamp

## Session ID Format

**Format**: UUID v4 (Universally Unique Identifier, version 4)

**Example**: `550e8400-e29b-41d4-a716-446655440000`

**Generation**:
- Web app: `crypto.randomUUID()` (client-side, in React hook)
- CLI: `crypto.randomUUID()` (when --archive flag is used)

**Properties**:
- 128-bit random identifier
- Collision probability: ~1 in 2^122 (negligible)
- No sequential ordering (privacy-friendly)
- No central coordination required

## Data Types Rationale

### Why Hash for Structured Data?

Used for: DAP entries, completion data, contact info, metadata

**Advantages**:
- Field-level access (get/set individual fields)
- Memory efficient for key-value pairs
- Native Redis operations (HGET, HSET, HGETALL)
- Easy to add fields without migration

**Example**:
```redis
HSET dap:abc-123 sessionId abc-123 timestamp 2026-02-04T12:00:00Z
HGET dap:abc-123 sessionId
HGETALL dap:abc-123
```

### Why List for Ordered Collections?

Used for: Progress tracking, interaction events

**Advantages**:
- Maintains insertion order
- Append operations are O(1)
- Range queries (LRANGE)
- Natural fit for append-only logs

**Example**:
```redis
RPUSH intake:abc-123:progress '{"questionId":"q1","answer":"yes"}'
LRANGE intake:abc-123:progress 0 -1  # Get all entries
```

### Why Sorted Set for Recent DAP?

Used for: `dap:recent` list

**Advantages**:
- Automatically sorted by score (timestamp)
- Range queries by score
- Efficient removal of old entries
- Built-in deduplication

**Example**:
```redis
ZADD dap:recent 1707055200 abc-123
ZRANGE dap:recent 0 19 REV  # Get 20 most recent
ZREMRANGEBYRANK dap:recent 0 -101  # Keep only last 100
```

## Connection Management

### Web App (apps/web/lib/redis/client.ts)

**Pattern**: Singleton with lazy connection

- Single Redis client instance shared across Server Actions
- Connection opened on first use
- Reconnection handled automatically by redis client
- Connection kept alive between requests

**Why**: Minimize connection overhead in long-running Next.js server

```typescript
let client: RedisClientType | null = null;
export async function getRedisClient(): Promise<RedisClientType> {
  if (client?.isOpen) return client;
  // ... create and connect
  client = await connectRedis();
  return client;
}
```

### CLI (packages/data/src/lib/redis/client.ts)

**Pattern**: Short-lived connections

- New connection per command execution
- Explicit connect/disconnect
- Helper function `withRedisClient()` for automatic cleanup

**Why**: CLI commands are short-lived processes; no benefit to persistent connections

```typescript
export async function withRedisClient<T>(
  operation: (client: RedisClientType) => Promise<T>,
): Promise<T> {
  const client = await createRedisClient();
  try {
    return await operation(client);
  } finally {
    await client.quit();
  }
}
```

## Error Handling Strategy

### Graceful Degradation

**Principle**: Persistence failures should never block user experience

**Implementation**:
- All persistence calls wrapped in try/catch
- Errors logged to console but not surfaced to user
- Application continues normally even if Redis is unavailable

**Example** (from `useIntakeForm.ts`):
```typescript
if (sessionId && !wasStale) {
  saveIntakeProgress(sessionId, questionId, answer, data.reflection).catch((err) => {
    console.error("Failed to save intake progress to Redis:", err);
    // Continue - persistence failure shouldn't block user
  });
}
```

### Redis Disabled State

The `REDIS_ENABLED` environment variable allows disabling Redis without code changes:

```typescript
export function isRedisEnabled(): boolean {
  return process.env.REDIS_ENABLED !== "false";
}
```

**Use cases**:
- Testing without Redis
- Temporary disable during incidents
- Development environments

## Future: Access Control Lists (ACLs)

**Current State**: Single default user with full access

**Production Recommendation**: Implement least-privilege access using Redis ACLs

### Creating Restricted Users

Redis Cloud supports ACLs for fine-grained permissions:

```redis
# Read-only user for analytics
ACL SETUSER analytics_readonly on >password ~* -@all +@read

# Intake writer (write progress, completion, contact, interactions)
ACL SETUSER intake_writer on >password ~intake:* +hset +rpush +zadd

# DAP reader/writer
ACL SETUSER dap_rw on >password ~dap:* +@all -@dangerous

# Admin (for migrations, cleanup)
ACL SETUSER admin on >password ~* +@all
```

### Environment Variables for Multiple Users

```bash
# Different credentials per role
REDIS_USER_ANALYTICS=analytics_readonly
REDIS_PASSWORD_ANALYTICS=<password>

REDIS_USER_INTAKE=intake_writer
REDIS_PASSWORD_INTAKE=<password>

REDIS_USER_DAP=dap_rw
REDIS_PASSWORD_DAP=<password>
```

### Code Changes Required

Modify client creation to accept username:

```typescript
const client = createClient({
  socket: { host, port },
  username: process.env.REDIS_USER_INTAKE,
  password: process.env.REDIS_PASSWORD_INTAKE,
});
```

### Benefits of ACLs

1. **Blast radius reduction**: Compromised credentials have limited scope
2. **Audit trail**: Per-user logging for compliance
3. **Defense in depth**: Even if app is compromised, Redis access is limited
4. **Compliance**: Meet HIPAA, SOC 2, etc. requirements

## Data Retention Strategy

### Current Implementation

**No TTL**: Data persists indefinitely

**Rationale**:
- POC/hackathon project
- Data size small during development
- Manual cleanup acceptable

### Production Recommendations

Implement TTL (Time-To-Live) based on data type:

```redis
# 30 days for intake progress (GDPR-friendly)
SET intake:abc-123:progress "..." EX 2592000

# 90 days for DAP notes (clinical records)
HSET dap:abc-123 ...
EXPIRE dap:abc-123 7776000

# 7 days for interactions (analytics)
RPUSH intake:abc-123:interactions "..."
EXPIRE intake:abc-123:interactions 604800
```

### Cleanup Strategies

**Option 1: Active Deletion**
- Scheduled job scans for expired sessions
- Deletes associated keys
- Pros: Control timing, logging
- Cons: Requires job runner

**Option 2: Redis TTL**
- Set EXPIRE on each key
- Redis automatically removes
- Pros: Built-in, reliable
- Cons: Less control, harder to audit

**Option 3: Hybrid**
- TTL for short-term data (interactions)
- Active deletion for long-term (DAP notes, with archival to S3 first)

### GDPR Considerations

For production, implement:
- User data export (gather all keys for session ID)
- Right to be forgotten (delete all keys for session ID)
- Data retention limits (TTL)
- Access logging (who accessed what data)

## Troubleshooting

### Connection Issues

**Symptom**: `ECONNREFUSED` or `ETIMEDOUT`

**Solutions**:
1. Check environment variables are set:
   ```bash
   echo $REDIS_HOST
   echo $REDIS_PORT
   echo $REDIS_PASSWORD
   ```

2. Verify Redis Cloud instance is running (check dashboard)

3. Check network connectivity:
   ```bash
   redis-cli -h <REDIS_HOST> -p <REDIS_PORT> -a <REDIS_PASSWORD> PING
   ```

4. Confirm firewall/security groups allow your IP

**Symptom**: `NOAUTH Authentication required`

**Solution**: Check `REDIS_PASSWORD` is correct

**Symptom**: `Connection timeout`

**Solution**: Increase `REDIS_CONNECT_TIMEOUT` or check network latency

### Data Not Persisting

**Check 1**: Is Redis enabled?
```typescript
console.log("Redis enabled:", isRedisEnabled());
```

**Check 2**: Are errors being logged?
- Check browser console (web app)
- Check terminal output (CLI)

**Check 3**: Verify keys exist in Redis:
```bash
redis-cli -h <host> -p <port> -a <password> KEYS "intake:*"
```

**Check 4**: Check Server Action is being called:
- Add `console.log` in Server Action
- Verify function is imported correctly
- Check `'use server'` directive is present

### TypeScript Errors

**Symptom**: `RedisClientType` incompatibility

**Solution**: Use type assertion in CLI client:
```typescript
return client as RedisClientType;
```

**Symptom**: Import path with `.ts` extension

**Solution**: Use `.js` extension for imports (TypeScript convention):
```typescript
import { foo } from "./module.js";  // Correct
import { foo } from "./module.ts";  // Error
```

## Design Decisions

### Why Client-Side Session ID Generation?

**Decision**: Generate session IDs in the browser/client

**Rationale**:
- No server round-trip required
- Stateless (no session tracking on server)
- UUID v4 collision probability negligible
- Simplifies architecture

**Trade-offs**:
- Can't prevent malicious duplicate IDs (acceptable for POC)
- Can't guarantee sequential ordering (not needed)

### Why Separate Keys Per Data Type?

**Decision**: Use `intake:{id}:progress`, `intake:{id}:contact`, etc. instead of single key

**Rationale**:
- Independent TTL per data type
- Easier to query specific data
- Clearer data structure
- Allows future ACL restrictions

**Trade-offs**:
- More keys (minimal cost)
- Multiple round-trips to get full session (acceptable)

### Why JSON Strings Instead of Native Redis Types?

**Decision**: Store complex objects as JSON strings within Hashes/Lists

**Rationale**:
- Preserves type information
- Easy to deserialize in JavaScript/TypeScript
- Flexible for schema evolution
- Standard serialization format

**Trade-offs**:
- Slightly larger storage (acceptable)
- Can't query nested fields directly (could use RedisJSON module if needed)

### Why No Connection Pooling?

**Decision**: Single connection (web) or short-lived connections (CLI)

**Rationale**:
- Redis Cloud handles concurrency well
- Node.js is single-threaded (single connection sufficient for web)
- CLI commands are short-lived (pooling adds complexity)
- redis client handles reconnection automatically

**Trade-offs**:
- Could add pooling if high concurrency needed
- For now, simplicity > optimization

## Security Considerations

### Current State (POC)

- ⚠️ Single default user with full Redis access
- ⚠️ No encryption at rest (depends on Redis Cloud config)
- ⚠️ No encryption in transit (depends on Redis Cloud config)
- ⚠️ No rate limiting per session
- ⚠️ Session IDs could theoretically be guessed (UUID v4 is very unlikely)

### Production Hardening Checklist

- [ ] Implement Redis ACLs (see "Future: Access Control Lists" section)
- [ ] Enable TLS for Redis connections
- [ ] Implement rate limiting (per session, per IP)
- [ ] Add encryption at rest (Redis Cloud feature)
- [ ] Rotate Redis passwords regularly
- [ ] Implement audit logging
- [ ] Add session ID signing/verification (prevent tampering)
- [ ] Set up alerts for connection failures
- [ ] Implement backup/restore procedures
- [ ] Document incident response procedures

## Performance Characteristics

### Expected Load (Hackathon)

- **Intake sessions**: ~10-100 sessions
- **DAP notes**: ~10-50 notes
- **Writes per intake**: ~10-15 (one per question + metadata)
- **Reads**: Minimal (review/analytics)

**Conclusion**: Current simple design is more than sufficient

### Scaling Considerations

If scaling to production:

1. **Connection Pooling**: Add when concurrent load > 100 req/sec
2. **Read Replicas**: If read load becomes significant
3. **Caching Layer**: Add Redis caching for frequently accessed data
4. **Sharding**: If data size > 10GB (unlikely for text data)
5. **Monitoring**: Add Redis metrics (latency, memory, connections)

### Benchmarks

Redis Cloud typical performance:
- **Writes (HSET, RPUSH)**: < 1ms
- **Reads (HGET, LRANGE)**: < 1ms
- **Pattern match (KEYS)**: 10-100ms (depends on key count)
- **Sorted set operations (ZADD, ZRANGE)**: < 2ms

**Conclusion**: Redis operations add negligible latency to application

## Monitoring and Observability

### Current Logging

- Console.log for all Redis operations
- Error logging on persistence failures
- Server Action logging in Next.js

### Production Monitoring Recommendations

1. **Metrics to track**:
   - Connection success/failure rate
   - Operation latency (p50, p95, p99)
   - Error rate by operation type
   - Memory usage
   - Key count by namespace

2. **Alerts to set up**:
   - Connection failures > 5% for 5 minutes
   - Operation latency > 100ms
   - Memory usage > 80%
   - Sudden key count drop (data loss?)

3. **Tools**:
   - Redis Cloud dashboard
   - Datadog / New Relic integration
   - Custom metrics endpoint (`/api/metrics`)

## Summary

This Redis integration provides:
- ✅ Persistent storage for DAP notes and intake sessions
- ✅ Graceful error handling (never blocks user experience)
- ✅ Clear data structure with namespaced keys
- ✅ Type-safe interfaces with TypeScript
- ✅ Separation of concerns (web vs CLI)
- ✅ Foundation for future analytics and features
- ✅ Well-documented for maintenance and enhancement

**Next Steps**: See "Future: Access Control Lists" and "Production Hardening Checklist" sections for production readiness.
