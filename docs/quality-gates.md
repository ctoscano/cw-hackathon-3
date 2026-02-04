# Quality Gates

This document describes the automated quality checks that run at different stages of development.

## Overview

We use a multi-tier approach to catch issues early:

- **Tier 1 (Pre-Commit)**: Fast checks on staged files (~5-10 seconds)
- **Tier 2 (Pre-Push)**: Comprehensive checks before pushing (~30-60 seconds)
- **Tier 3 (CI/CD)**: Final verification on pull requests (future)

## Tier 1: Pre-Commit Checks

**When:** Before every `git commit`

**What it checks:**
- Format and lint staged files with Biome
- Auto-fixes issues where possible

**Tools:**
- `husky` - Git hooks manager
- `lint-staged` - Run commands on staged files only
- `biome` - Unified linter and formatter

**Configuration:** `package.json` → `lint-staged` field

**Time:** ~5-10 seconds

**Bypass (not recommended):**
```bash
git commit --no-verify -m "message"
```

## Tier 2: Pre-Push Checks

**When:** Before every `git push`

**What it checks:**
1. Type check all workspaces (`pnpm type-check`)
2. Build all workspaces for production (`pnpm build`)

**Why this matters:**
- Catches TypeScript errors across the monorepo
- Ensures production build succeeds (catches issues like Server Action rules)
- Prevents broken code from reaching remote repository

**Configuration:** `.husky/pre-push`

**Time:** ~30-60 seconds

**Bypass (emergency only):**
```bash
git push --no-verify
```

⚠️ **Warning:** Only bypass in emergencies. Broken builds block other developers.

## Common Scenarios

### Scenario 1: "I need to commit work-in-progress code"

**Solution:** Use git stash or feature branches:
```bash
# Option A: Stash changes
git stash
git checkout -b wip/my-feature
git stash pop
git commit -m "WIP: partial implementation"

# Option B: Commit to WIP branch with --no-verify (use sparingly)
git commit --no-verify -m "WIP: broken build, fixing..."
```

### Scenario 2: "The pre-push check is too slow"

**Solutions:**
1. **Recommended:** Use Turbo cache - second runs are much faster
2. Ensure your changes are incremental (small commits)
3. If building repeatedly, consider fixing all issues first, then push once

### Scenario 3: "I'm getting lint-staged errors"

**Check:**
```bash
# See what lint-staged would do
pnpm lint-staged --dry-run

# Manually run biome on all files
pnpm check
```

**Common fixes:**
- Run `pnpm format` to auto-format
- Run `pnpm check` to auto-fix lint issues
- Check `.gitignore` isn't excluding your files

### Scenario 4: "Build passes locally but fails in pre-push"

**This usually means:**
- You didn't run `pnpm build` before committing
- Environment variables missing (check `.env.local` vs `.env.example`)
- Dependencies out of sync (run `pnpm install`)

**Fix:**
```bash
# Clean and rebuild
rm -rf .next dist node_modules/.cache
pnpm install
pnpm build
```

## What Each Check Catches

### Pre-Commit (lint-staged)
✅ Code formatting issues
✅ Linting violations
✅ Basic syntax errors
❌ Type errors (only checks staged files, may miss cross-file issues)
❌ Build failures
❌ Runtime errors

### Pre-Push (type-check + build)
✅ All type errors across monorepo
✅ Build failures (webpack, Next.js, etc.)
✅ Missing dependencies
✅ Next.js specific rules (Server Actions, etc.)
❌ Runtime errors
❌ Integration test failures

## Maintenance

### Updating lint-staged rules

Edit `package.json`:
```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "biome check --write --no-errors-on-unmatched",
      "biome format --write --no-errors-on-unmatched"
    ]
  }
}
```

### Updating pre-push checks

Edit `.husky/pre-push`:
```bash
# Example: Add test runner
pnpm test || exit 1
```

### Disabling hooks temporarily

```bash
# Disable for one commit
git commit --no-verify

# Disable for one push
git push --no-verify

# Disable all hooks (not recommended)
rm -rf .husky
# Re-enable: pnpm prepare
```

## Best Practices

1. **Run checks before committing manually:**
   ```bash
   pnpm check && pnpm type-check && pnpm build
   ```

2. **Commit frequently with small changes:**
   - Smaller commits = faster checks
   - Easier to fix issues when they occur

3. **Fix issues immediately:**
   - Don't accumulate technical debt
   - Future you will thank present you

4. **Use Turbo cache:**
   - First build: ~60 seconds
   - Cached build: ~5 seconds
   - Cache is shared across all developers

5. **Don't bypass hooks habitually:**
   - They exist to prevent broken code
   - Bypassing creates problems for the team

## Troubleshooting

### "husky not found"

```bash
pnpm install
pnpm prepare
```

### "lint-staged: command not found"

```bash
pnpm install
```

### "Permission denied" on hooks

```bash
chmod +x .husky/pre-commit
chmod +x .husky/pre-push
```

### Hooks not running at all

```bash
# Check git hooks are enabled
git config --get core.hooksPath
# Should output: .husky

# Re-initialize husky
pnpm prepare
```

## Future Enhancements

**Tier 3: CI/CD Pipeline** (not yet implemented)
- GitHub Actions workflow
- Run on pull requests
- Parallel jobs: lint, type-check, build, test
- Block merges if checks fail
- Deploy previews for PRs

See `docs/prds/` for planned implementations.
