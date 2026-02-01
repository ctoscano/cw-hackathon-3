# React Best Practices

This document outlines React development patterns and performance optimization strategies for our Next.js 15 + React 19 monorepo, based on industry best practices and official React guidance.

## Sources
- [React Official Guide: You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
- [Vercel: Introducing React Best Practices](https://vercel.com/blog/introducing-react-best-practices)

---

## Performance Optimization Priority Order

Focus on **high-impact changes first**. Most performance work fails because it starts too low in the stack.

### 1. CRITICAL: Eliminate Async Waterfalls
**Problem**: Sequential async operations that could run in parallel.

**Impact**: Causes significant delays as each operation blocks the next.

**Solution**:
```typescript
// ❌ Bad: Sequential fetching
const user = await fetchUser(userId);
const posts = await fetchPosts(user.id);
const comments = await fetchComments(posts[0].id);

// ✅ Good: Parallel fetching where possible
const [user, config] = await Promise.all([
  fetchUser(userId),
  fetchConfig()
]);
```

**For our codebase**:
- Check for sequential API calls or data fetches that could be parallelized
- Move conditional checks BEFORE data fetching
- Use `Promise.all()` for independent API calls or async operations

### 2. CRITICAL: Reduce Bundle Size
**Problem**: Large client bundles create a "long-term tax on every session."

**Solution**:
```typescript
// ❌ Bad: Eager state initialization
const [data, setData] = useState(JSON.parse(localStorage.getItem('key')));

// ✅ Good: Lazy initialization
const [data, setData] = useState(() => JSON.parse(localStorage.getItem('key')));
```

**For our codebase**:
- Lazy load large components with `React.lazy()`
- Use dynamic imports for routes
- Keep UI package components small and focused

### 3. Server-Side Database Optimization
**Problem**: Sequential database queries.

**Solution**:
```typescript
// ❌ Bad: Sequential
const user = await db.getUser(id);
const settings = await db.getSettings(id);

// ✅ Good: Parallel
const [user, settings] = await Promise.all([
  db.getUser(id),
  db.getSettings(id)
]);
```

### 4. Client-Side Data Fetching
**Problem**: Unnecessary data requests.

**Solution**: Minimize API dependencies and use proper caching strategies. Prefer Server Components for initial data loading.

### 5. Re-render Optimization
**Note**: Use `useMemo` selectively. It won't fix architectural issues.

**When to use `useMemo`**:
- Expensive calculations (not simple filtering/mapping)
- Passing objects/arrays as props to memoized components
- Complex derived state

**When NOT to use `useMemo`**:
- Simple string concatenation
- Basic filtering/mapping operations
- Premature optimization

---

## When NOT to Use useEffect

### Core Principle
**Effects should synchronize with external systems, not transform data or handle user events.**

### Anti-Pattern 1: Data Transformation
**Problem**: Effects that transform data for rendering cause cascading updates.

```typescript
// ❌ Bad: Using Effect for derived state
const [fullName, setFullName] = useState('');
useEffect(() => {
  setFullName(firstName + ' ' + lastName);
}, [firstName, lastName]);

// ✅ Good: Calculate during rendering
const fullName = `${firstName} ${lastName}`;
```

**Why**: This pattern triggers two renders:
1. Initial render with stale data
2. Effect runs and triggers re-render with updated data

### Anti-Pattern 2: Event-Specific Logic in Effects
**Problem**: Effects lose context about what the user did.

```typescript
// ❌ Bad: Using Effect for form submission
const [jsonToSubmit, setJsonToSubmit] = useState(null);
useEffect(() => {
  if (jsonToSubmit !== null) {
    post('/api/register', jsonToSubmit);
  }
}, [jsonToSubmit]);

function handleSubmit(e) {
  e.preventDefault();
  setJsonToSubmit({ firstName, lastName });
}

// ✅ Good: Handle in event handler directly
function handleSubmit(e) {
  e.preventDefault();
  post('/api/register', { firstName, lastName });
}
```

### Anti-Pattern 3: Chains of Effects
**Problem**: Multiple Effects updating state create fragile, inefficient code.

```typescript
// ❌ Bad: Cascading Effects
useEffect(() => {
  if (card?.gold) setGoldCardCount(c => c + 1);
}, [card]);

useEffect(() => {
  if (goldCardCount > 3) setRound(r => r + 1);
}, [goldCardCount]);

// ✅ Good: Single event handler
function handlePlaceCard(nextCard) {
  setCard(nextCard);
  if (nextCard.gold) {
    if (goldCardCount < 3) {
      setGoldCardCount(goldCardCount + 1);
    } else {
      setGoldCardCount(0);
      setRound(round + 1);
    }
  }
}
```

### Anti-Pattern 4: Resetting State on Prop Changes
**Problem**: Using Effects to sync state with props.

```typescript
// ❌ Bad: Effect to reset state
useEffect(() => {
  setComment('');
}, [userId]);

// ✅ Good: Use key prop
export default function ProfilePage({ userId }) {
  return <Profile userId={userId} key={userId} />;
}

function Profile({ userId }) {
  const [comment, setComment] = useState('');
  // Entire component resets when key changes
}
```

---

## Decision Framework: Effect vs Event Handler

### Use Effects When:
Code should run because the component was **displayed** to the user.

**Examples**:
- Initial data fetch
- Syncing with external systems (browser APIs)
- Setting up subscriptions

```typescript
// ✅ Good: External system synchronization
useEffect(() => {
  const connection = createConnection();
  return () => connection.disconnect();
}, []);
```

### Use Event Handlers When:
Code runs because of a specific **user interaction**.

**Examples**:
- Form submissions
- Button clicks
- Navigation events

```typescript
// ✅ Good: User-triggered action
function handleBuyClick() {
  addToCart(product);
  showNotification(`Added ${product.name}`);
}
```

---

## Data Fetching Best Practices

### Race Condition Prevention
When fetching with Effects, implement cleanup:

```typescript
useEffect(() => {
  let ignore = false;

  async function fetchData() {
    const result = await fetchResults(query);
    if (!ignore) {
      setResults(result);
    }
  }

  fetchData();
  return () => { ignore = true; };
}, [query]);
```

### Prefer Framework Data Fetching
Instead of manual Effects, use:
- **Next.js Server Components** for initial data (our default approach)
- **Server Actions** for mutations and form handling
- React Query / SWR / TanStack Query for complex client-side fetching (if needed in future)

---

## Component Design Patterns

### Server vs Client Components (Next.js 15)

**Default to Server Components** for:
- Static content
- Initial data fetching
- SEO-critical pages

**Use Client Components** (`'use client'`) only when needed:
- Interactive UI elements
- Browser APIs (localStorage, etc.)
- React hooks (useState, useEffect)
- Event handlers

```typescript
// ✅ Good: Server Component (default)
export default async function Page() {
  const data = await fetchData(); // Server-side
  return <Display data={data} />;
}

// ✅ Good: Client Component (when needed)
'use client';
export function InteractiveWidget() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

---

## State Management

### Local State First
Start with `useState` for component-specific state.

### Lift State When:
- Multiple components need the same state
- State needs to be synchronized
- Parent needs to control child state

### Context or Global State When:
- Data is used across many components
- Data needs to persist across navigation
- Complex state needs centralized management
- Consider React Context, Zustand, or similar lightweight solutions

### Avoid:
- Storing derived values in state
- Duplicating server data in local state
- Over-lifting state too early

---

## Code Organization

### Component Structure
```
components/
├── ui/              # Shared UI primitives (Button, Input)
├── features/        # Feature-specific components
└── layouts/         # Page layouts

Each component should have:
- Single responsibility
- Clear prop interface
- Minimal dependencies
```

### File Naming
- **Components**: Use PascalCase for files: `UserProfile.tsx`
- **Utilities**: Use camelCase for files: `formatDate.ts`
- Match component names to file names: `UserProfile` component in `UserProfile.tsx`
- Co-locate related files: `UserProfile.tsx`, `UserProfile.test.tsx`
- See `CLAUDE.md` for complete naming conventions

---

## Checklist for New Components

✅ Calculate derived state during rendering (not in Effects)
✅ Use `key` prop to reset component state
✅ Handle user events in event handlers (not Effects)
✅ Use `useMemo` only for expensive calculations
✅ Implement cleanup for subscriptions and Effects
✅ Avoid chains of Effects
✅ Default to Server Components
✅ Use Client Components only when necessary
✅ Parallelize independent async operations
✅ Lazy load large components

---

## When to Break These Rules

Rules are guidelines, not absolutes. Break them when:
- Performance profiling shows a real bottleneck
- Specific use case requires different approach
- External library dictates pattern

**Always**: Document WHY you're breaking the rule.

---

## Additional Resources

- [React Documentation](https://react.dev) - Official React docs
- [Next.js Documentation](https://nextjs.org/docs) - Next.js 15 App Router guide
- [Vercel React Best Practices](https://vercel.com/blog/introducing-react-best-practices) - Performance patterns
- Our internal: `CLAUDE.md` - Project conventions and development guide
