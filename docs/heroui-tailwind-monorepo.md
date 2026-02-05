# HeroUI v3 + Tailwind CSS v4 Monorepo Configuration

## Critical Issue: Double Tailwind Import

**Problem:** HeroUI's `@heroui/styles` package imports Tailwind CSS internally, causing a double import when you also import Tailwind in your app's CSS.

**Symptom:** Components render but have no styling, or webpack errors like `__webpack_modules__[moduleId] is not a function`.

## Solution: Import Component CSS Individually

Instead of importing the full `@heroui/styles` package, import only the component CSS files you need:

### ✅ Correct Configuration

```css
/* apps/web/app/globals.css */
@custom-variant dark (&:is(.dark *));

/* Import Tailwind CSS ONCE */
@import "tailwindcss";
@import "tw-animate-css";

/* Import ONLY HeroUI component CSS (not the full package) */
@import "@heroui/styles/base";
@import "@heroui/styles/components/button.css";
@import "@heroui/styles/components/card.css";
@import "@heroui/styles/components/modal.css";
@import "@heroui/styles/components/search-field.css";
@import "@heroui/styles/themes/default";
@import "@heroui/styles/utilities";
@import "@heroui/styles/variants";

/* Scan app source files */
@source "./app/**/*.{ts,tsx}";
@source "./components/**/*.{ts,tsx}";
@source "./lib/**/*.{ts,tsx}";

/* Scan HeroUI components in node_modules */
@source "../node_modules/@heroui/react/dist/**/*.{js,mjs}";

/* Exclude test files */
@source not "./**/*.test.{ts,tsx}";
@source not "./**/*.stories.{ts,tsx}";
```

### ❌ Incorrect Configuration (Causes Issues)

```css
/* DON'T DO THIS - causes double Tailwind import */
@import "tailwindcss";
@import "@heroui/styles";  /* This re-imports Tailwind internally! */
```

## Why This Happens

Looking at `@heroui/styles/dist/index.css`:

```css
@layer theme, base, components, utilities;

/* Base layer - Tailwind CSS v4 */
@import "tailwindcss";  /* ⚠️ Tailwind is imported HERE */
@import "tw-animate-css";

/* ... rest of HeroUI styles */
```

When you import both:
1. Your `globals.css` imports Tailwind
2. `@heroui/styles` imports Tailwind again
3. Result: Double import = broken styles or webpack errors

## Required Steps After Changing CSS

1. **Stop the dev server** (Ctrl+C)
2. **Clear Next.js cache:**
   ```bash
   rm -rf apps/web/.next
   ```
3. **Restart dev server:**
   ```bash
   pnpm dev
   ```

## Available HeroUI Component CSS Files

Import only what you use:

```
@heroui/styles/components/accordion.css
@heroui/styles/components/alert.css
@heroui/styles/components/avatar.css
@heroui/styles/components/button.css
@heroui/styles/components/card.css
@heroui/styles/components/checkbox.css
@heroui/styles/components/dropdown.css
@heroui/styles/components/input.css
@heroui/styles/components/modal.css
@heroui/styles/components/popover.css
@heroui/styles/components/search-field.css
@heroui/styles/components/select.css
@heroui/styles/components/tabs.css
@heroui/styles/components/tooltip.css
... and many more
```

Full list: `ls node_modules/@heroui/styles/dist/components/`

## Critical `@source` Directives

For Tailwind v4 to generate classes from HeroUI components, you MUST add:

```css
/* Scan HeroUI's compiled JavaScript for class names */
@source "../node_modules/@heroui/react/dist/**/*.{js,mjs}";
```

Without this, Tailwind won't scan HeroUI's component files and won't generate the CSS classes they use.

## Monorepo-Specific Considerations

### Path Resolution

`@source` paths are **relative to the CSS file location**, not the project root:

```css
/* In apps/web/app/globals.css */
@source "./app/**/*.{ts,tsx}"              /* ✅ apps/web/app/ */
@source "../node_modules/@heroui/..."      /* ✅ apps/web/node_modules/ */
```

### pnpm Workspaces

HeroUI packages are symlinked in `apps/web/node_modules/@heroui/` but physically located in `node_modules/.pnpm/@heroui+...`. The symlink resolution works correctly with `@source`.

## Troubleshooting

### Styles Not Applying

**Symptom:** Components render but look unstyled

**Fixes:**
1. Check you're importing component CSS individually (not `@heroui/styles`)
2. Verify `@source` directive includes HeroUI node_modules
3. Restart dev server and clear `.next` cache
4. Check browser DevTools for CSS being loaded

### Webpack Module Errors

**Symptom:** `__webpack_modules__[moduleId] is not a function`

**Cause:** HMR (Hot Module Replacement) got confused by CSS changes

**Fix:**
```bash
rm -rf apps/web/.next
pnpm dev
```

### Build Works But Dev Doesn't

**Cause:** Dev server caching issues

**Fix:** Always restart dev server after changing `globals.css`

## Related Resources

- [Tailwind CSS v4 Monorepo Discussion #18770](https://github.com/tailwindlabs/tailwindcss/discussions/18770)
- [Tailwind Monorepo Content Detection #13136](https://github.com/tailwindlabs/tailwindcss/issues/13136)
- [Setting up Tailwind CSS v4 in a Turbo Monorepo](https://medium.com/@philippbtrentmann/setting-up-tailwind-css-v4-in-a-turbo-monorepo-7688f3193039)
- [Configure Tailwind 4 with Vite in NPM Workspace](https://nx.dev/blog/setup-tailwind-4-npm-workspace)

## Summary

✅ **DO:**
- Import component CSS individually from `@heroui/styles/components/`
- Add `@source` directive for `node_modules/@heroui/react/dist/`
- Restart dev server after CSS changes
- Import `tw-animate-css` separately

❌ **DON'T:**
- Import `@heroui/styles` (it re-imports Tailwind)
- Forget to scan HeroUI's node_modules
- Skip restarting dev server after changes
