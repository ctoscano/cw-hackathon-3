# SPA Pattern for Data-Heavy Pages

## Overview

This document describes the Single Page Application (SPA) pattern used for data-heavy pages in the codebase, specifically implemented for the Operations Dashboard (`/ops`). This pattern eliminates server round trips when viewing detail modals, providing instant client-side rendering while maintaining shareable, bookmarkable URLs.

## Key Principles

1. **Client-Side State Management with nuqs**: ALL state (tabs, pagination, search, AND detail views) managed via URL query parameters
2. **No Separate Routes for Details**: Detail views render as modals/panels, not separate page routes
3. **Instant Navigation**: Clicking items opens modals instantly without server requests
4. **Shareable URLs**: Full application state encoded in URL (`?tab=intake&session=abc123`)
5. **Browser Navigation Support**: Back/forward buttons work correctly, closing/opening modals as expected

## When to Use This Pattern

Use this SPA pattern for pages that:
- Display **lists of data** with clickable items
- Require **detail views** for individual items
- Need **filtering, pagination, or search** functionality
- Benefit from **instant navigation** without page reloads
- Should support **shareable URLs** to specific views

**Examples:**
- Operations dashboards (our implementation)
- User management panels
- Document browsers
- Data exploration tools
- Any admin interface with list + detail views

## Architecture

### URL State Management with nuqs

nuqs is a type-safe library for managing state via URL query parameters. It provides:
- Automatic URL synchronization
- Type-safe parsers (integers, strings, etc.)
- Shareable, bookmarkable state
- Browser history integration

**Installation:**
```bash
pnpm add nuqs
```

### State Structure

All state lives in URL query parameters:

```
/ops?tab=intake&page=2&search=test&session=abc-123
      ↑         ↑       ↑           ↑
      tab       page    search      detail modal
```

### Implementation Example (Operations Dashboard)

```typescript
"use client";

import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import SessionDetail from "./components/SessionDetail";

export default function OpsPage() {
  // Define all state as URL query parameters
  const [{ tab, page, search, session }, setQuery] = useQueryStates({
    tab: parseAsString.withDefault("intake"),      // Current tab
    page: parseAsInteger.withDefault(1),           // Pagination
    search: parseAsString,                         // Search filter
    session: parseAsString,                        // Detail modal (SPA pattern!)
  });

  const handleSelectSession = (sessionId: string) => {
    setQuery({ session: sessionId }); // Opens modal, no route change
  };

  const handleCloseDetail = () => {
    setQuery({ session: null }); // Closes modal, clears URL param
  };

  return (
    <div>
      <Tabs value={tab} onValueChange={(value) => setQuery({ tab: value })}>
        {/* Tab content with lists */}
      </Tabs>

      {/* Conditional modal rendering based on URL state */}
      {session && (
        <SessionDetail
          sessionId={session}
          sessionType={tab}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  );
}
```

## Component Patterns

### 1. List Component (Client-Side Data Fetching)

**Purpose**: Fetch and display paginated data

```typescript
"use client";

export default function IntakeList({
  page,
  search,
  onPageChange,
  onSelectSession,
}: IntakeListProps) {
  const [data, setData] = useState<PaginatedResponse | null>(null);

  useEffect(() => {
    async function fetchData() {
      const params = new URLSearchParams({ page: page.toString() });
      if (search) params.append("search", search);

      const response = await fetch(`/api/ops/intake?${params}`);
      const result = await response.json();
      setData(result);
    }
    fetchData();
  }, [page, search]);

  return (
    <SessionTable
      sessions={data.items}
      onSelectSession={onSelectSession} // Callback, not navigation
    />
  );
}
```

### 2. Table Component (Callback-Based Selection)

**Purpose**: Display data with clickable rows that trigger callbacks

```typescript
"use client";

export default function SessionTable({
  sessions,
  onSelectSession,
}: SessionTableProps) {
  return (
    <div>
      {sessions.map((session) => (
        <button
          key={session.id}
          onClick={() => onSelectSession(session.id)} // Callback, not Link
          type="button"
          className="w-full text-left"
        >
          {/* Session row content */}
        </button>
      ))}
    </div>
  );
}
```

**❌ ANTI-PATTERN**: Using Next.js `Link` for detail navigation
```typescript
// DON'T DO THIS - causes server round trips
<Link href={`/ops/intake/${session.id}`}>
  {session.name}
</Link>
```

**✅ CORRECT PATTERN**: Using callbacks with nuqs
```typescript
// DO THIS - instant client-side modal
<button onClick={() => onSelectSession(session.id)}>
  {session.name}
</button>
```

### 3. Detail Modal Component (Client-Side Data Fetching)

**Purpose**: Fetch and display individual item details in a modal

```typescript
"use client";

export default function SessionDetail({
  sessionId,
  sessionType,
  onClose,
}: SessionDetailProps) {
  const [data, setData] = useState(null);

  useEffect(() => {
    async function fetchData() {
      const url = sessionType === "intake"
        ? `/api/ops/intake/${sessionId}`
        : `/api/ops/dap/${sessionId}`;

      const response = await fetch(url);
      const result = await response.json();
      setData(result);
    }
    fetchData();
  }, [sessionId, sessionType]);

  return (
    <Modal>
      <Modal.Backdrop isOpen={!!sessionId} onOpenChange={(open) => !open && onClose()}>
        {/* Modal content */}
      </Modal.Backdrop>
    </Modal>
  );
}
```

## API Route Design

API routes should support:
1. **List endpoints** with pagination, search, filtering
2. **Detail endpoints** for individual items
3. **Consistent response formats**

```typescript
// List endpoint: GET /api/ops/intake?page=1&search=test
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Number.parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search");

  const data = await listIntakeSessions(page, 20, search);

  return NextResponse.json(data);
}

// Detail endpoint: GET /api/ops/intake/[sessionId]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const data = await getSessionData(sessionId);

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
```

## Benefits

### 1. **Performance**
- No page reloads when opening details
- Instant modal rendering
- Only fetch data when needed
- Browser back/forward is instant (no server request)

### 2. **User Experience**
- Smooth, app-like navigation
- No loading spinners between views
- Shareable URLs for specific states
- Browser history works intuitively

### 3. **Developer Experience**
- Type-safe URL state management
- Single source of truth (URL)
- Predictable component lifecycle
- Easy to test (just check URL params)

## Common Pitfalls

### 1. Using Separate Routes for Details
**❌ DON'T:**
```
/ops/intake/[sessionId]/page.tsx  // Separate route
```

**✅ DO:**
```
?session=abc-123  // URL param, modal in same page
```

### 2. Managing State in Component State
**❌ DON'T:**
```typescript
const [selectedSession, setSelectedSession] = useState(null); // Lost on refresh
```

**✅ DO:**
```typescript
const [{ session }, setQuery] = useQueryStates({ session: parseAsString }); // Persisted in URL
```

### 3. Using Next.js Link for Detail Navigation
**❌ DON'T:**
```typescript
<Link href={`/ops/detail/${id}`}>View</Link> // Server round trip
```

**✅ DO:**
```typescript
<button onClick={() => setQuery({ session: id })}>View</button> // Instant modal
```

## Migration Guide

Converting an existing page from routes to SPA pattern:

### Step 1: Remove Detail Routes
Delete `/app/page-name/[detailId]/page.tsx` files

### Step 2: Add nuqs State Management
```typescript
const [{ session }, setQuery] = useQueryStates({
  session: parseAsString,
});
```

### Step 3: Convert Links to Callbacks
Replace:
```typescript
<Link href={`/detail/${id}`}>View</Link>
```

With:
```typescript
<button onClick={() => setQuery({ session: id })}>View</button>
```

### Step 4: Add Conditional Modal Rendering
```typescript
{session && (
  <DetailModal
    id={session}
    onClose={() => setQuery({ session: null })}
  />
)}
```

### Step 5: Update Component Props
Remove route-based props, add callback props:
```typescript
interface ListProps {
  onSelectItem: (id: string) => void; // Add callback
}
```

## Testing

### Testing URL State
```typescript
test("opens detail modal when session param is set", () => {
  render(<OpsPage />, { url: "?session=abc-123" });
  expect(screen.getByText("Session Details")).toBeInTheDocument();
});

test("closes modal when session param is cleared", () => {
  const { rerender } = render(<OpsPage />, { url: "?session=abc-123" });
  rerender(<OpsPage />, { url: "" });
  expect(screen.queryByText("Session Details")).not.toBeInTheDocument();
});
```

### Testing Callbacks
```typescript
test("calls onSelectSession when row clicked", () => {
  const onSelectSession = jest.fn();
  render(<SessionTable sessions={mockSessions} onSelectSession={onSelectSession} />);

  fireEvent.click(screen.getByText("Session 1"));
  expect(onSelectSession).toHaveBeenCalledWith("session-1");
});
```

## Real-World Example: Operations Dashboard

See the full implementation in:
- `apps/web/app/ops/page.tsx` - Main page with nuqs state
- `apps/web/app/ops/components/SessionTable.tsx` - Callback-based table
- `apps/web/app/ops/components/SessionDetail.tsx` - Client-side modal
- `apps/web/app/api/ops/intake/route.ts` - List API
- `apps/web/app/api/ops/intake/[sessionId]/route.ts` - Detail API

## Summary

This SPA pattern provides:
- ✅ Instant navigation with no page reloads
- ✅ Shareable, bookmarkable URLs
- ✅ Type-safe state management
- ✅ Better performance and UX
- ✅ Simpler codebase (no duplicate routes)

Use this pattern for all data-heavy pages that need list + detail views with filtering/pagination.
