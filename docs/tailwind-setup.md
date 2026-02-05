# Tailwind CSS v4 Configuration Guide

## Overview

This document outlines our Tailwind CSS v4 configuration for the CW Hackathon monorepo. We use a CSS-first configuration pattern with `@source` directives instead of JavaScript config files.

## Architecture

### Single-Layer CSS System

Our monorepo currently uses a single-layer CSS configuration:

**App Layer** (`apps/web/app/globals.css`)
- Imports Tailwind CSS
- Defines theme variables
- Scans app files with `@source` directives
- No separate UI package CSS (yet)

## Configuration

### App CSS (`apps/web/app/globals.css`)

```css
@custom-variant dark (&:is(.dark *));

@import "tailwindcss";

/* Scan app source files */
@source "./app/**/*.{ts,tsx}";
@source "./components/**/*.{ts,tsx}";
@source "./lib/**/*.{ts,tsx}";

/* Exclude test files for performance */
@source not "./**/*.test.{ts,tsx}";
@source not "./**/*.stories.{ts,tsx}";

/* CSS Reset */
* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

html,
body {
  max-width: 100vw;
  overflow-x: hidden;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial,
    sans-serif;
  line-height: 1.6;
  padding: 2rem;
}

main {
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: #333;
}

p {
  font-size: 1.125rem;
  color: #666;
}

/* Theme variables and utilities */
@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --radius-2xl: calc(var(--radius) + 8px);
  --radius-3xl: calc(var(--radius) + 12px);
  --radius-4xl: calc(var(--radius) + 16px);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
  --animate-blink-cursor: blink-cursor 1.2s step-end infinite;
  @keyframes blink-cursor {
    0%,
    49% {
      opacity: 1;
    }
    50%,
    100% {
      opacity: 0;
    }
  }
}

/* Theme color variables */
:root {
  --radius: 0.65rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.141 0.005 285.823);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.141 0.005 285.823);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.141 0.005 285.823);
  --primary: oklch(0.648 0.2 131.684);
  --primary-foreground: oklch(0.986 0.031 120.757);
  --secondary: oklch(0.967 0.001 286.375);
  --secondary-foreground: oklch(0.21 0.006 285.885);
  --muted: oklch(0.967 0.001 286.375);
  --muted-foreground: oklch(0.552 0.016 285.938);
  --accent: oklch(0.967 0.001 286.375);
  --accent-foreground: oklch(0.21 0.006 285.885);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.92 0.004 286.32);
  --input: oklch(0.92 0.004 286.32);
  --ring: oklch(0.841 0.238 128.85);
  --chart-1: oklch(0.871 0.15 154.449);
  --chart-2: oklch(0.723 0.219 149.579);
  --chart-3: oklch(0.627 0.194 149.214);
  --chart-4: oklch(0.527 0.154 150.069);
  --chart-5: oklch(0.448 0.119 151.328);
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.141 0.005 285.823);
  --sidebar-primary: oklch(0.648 0.2 131.684);
  --sidebar-primary-foreground: oklch(0.986 0.031 120.757);
  --sidebar-accent: oklch(0.967 0.001 286.375);
  --sidebar-accent-foreground: oklch(0.21 0.006 285.885);
  --sidebar-border: oklch(0.92 0.004 286.32);
  --sidebar-ring: oklch(0.841 0.238 128.85);
}

.dark {
  --background: oklch(0.141 0.005 285.823);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.21 0.006 285.885);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.21 0.006 285.885);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.648 0.2 131.684);
  --primary-foreground: oklch(0.986 0.031 120.757);
  --secondary: oklch(0.274 0.006 286.033);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.274 0.006 286.033);
  --muted-foreground: oklch(0.705 0.015 286.067);
  --accent: oklch(0.274 0.006 286.033);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.405 0.101 131.063);
  --chart-1: oklch(0.871 0.15 154.449);
  --chart-2: oklch(0.723 0.219 149.579);
  --chart-3: oklch(0.627 0.194 149.214);
  --chart-4: oklch(0.527 0.154 150.069);
  --chart-5: oklch(0.448 0.119 151.328);
  --sidebar: oklch(0.21 0.006 285.885);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.768 0.233 130.85);
  --sidebar-primary-foreground: oklch(0.986 0.031 120.757);
  --sidebar-accent: oklch(0.274 0.006 286.033);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.405 0.101 131.063);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

## Key Concepts

### `@source` Directive

`@source` tells Tailwind which files to scan for class names. **Paths are relative to the CSS file location.**

```css
/* In apps/web/app/globals.css */
@source "./app/**/*.{ts,tsx}"          /* Scans apps/web/app/ */
@source "./components/**/*.{ts,tsx}"   /* Scans apps/web/components/ */
@source "./lib/**/*.{ts,tsx}"          /* Scans apps/web/lib/ */
```

### Why `@source` is Critical

Without `@source` directives, Tailwind v4 **will not scan any files** and won't generate CSS for your classes. This results in unstyled components even though you're using Tailwind classes in your code.

### Import Order Matters

```css
/* 1. Custom variants FIRST (before @import) */
@custom-variant dark (&:is(.dark *));

/* 2. Import Tailwind */
@import "tailwindcss";

/* 3. Source directives AFTER import */
@source "./app/**/*.{ts,tsx}";
```

### Theme Configuration

Use `@theme inline` to map CSS custom properties to Tailwind utilities:

```css
@theme inline {
  --color-primary: var(--primary);     /* Creates bg-primary, text-primary */
  --color-brand: var(--brand);         /* Creates bg-brand, text-brand */
}
```

## Performance Optimizations

### Exclude Unnecessary Files

```css
@source not "./**/*.test.{ts,tsx}";
@source not "./**/*.stories.{ts,tsx}";
```

### Use Specific Paths

Instead of scanning everything:
```css
/* ❌ Too broad */
@source "./**/*.{ts,tsx}";

/* ✅ Specific directories */
@source "./app/**/*.{ts,tsx}";
@source "./components/**/*.{ts,tsx}";
@source "./lib/**/*.{ts,tsx}";
```

## Migration from v3

### What Changed
- No `tailwind.config.js` or `tailwind.config.ts` needed
- `content` array replaced with `@source` directives in CSS
- Theme defined with `@theme inline` instead of JS config
- CSS-first configuration approach
- Must use `@import "tailwindcss"` in CSS

### What We Removed
- ❌ `tailwind.config.ts` (not needed in v4)
- ❌ `content` array in JS config
- ❌ `theme.extend` in JS config

### What We Added
- ✅ `@source` directives in `globals.css`
- ✅ `@import "tailwindcss"` at top of CSS
- ✅ `@theme inline` for theme mappings
- ✅ `@custom-variant` for dark mode

## Troubleshooting

### Classes Not Generating (Unstyled Components)

**Symptom:** Components look plain, no styling applied

**Solution:**
- Check `@source` paths are correct relative to CSS file
- Ensure `@import "tailwindcss"` is present
- Verify paths include all component directories

```css
/* Make sure you have all these */
@import "tailwindcss";
@source "./app/**/*.{ts,tsx}";
@source "./components/**/*.{ts,tsx}";
```

### Build Performance Issues
- Add `@source not` for test files and stories
- Use specific paths instead of `"./**/*"`

### Theme Variables Not Working
- Ensure CSS custom properties are defined in `:root` and `.dark`
- Check `@theme inline` maps variables correctly
- Variables must be defined BEFORE `@theme inline`

## File Structure

```
apps/web/
├── app/
│   ├── globals.css       # Main CSS with @source directives
│   ├── layout.tsx        # Imports "./globals.css"
│   ├── page.tsx
│   ├── ops/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   └── components/
│   └── intake/
├── components/           # UI components
│   └── ui/              # shadcn/ui components
└── lib/                 # Utility functions
```

## Best Practices

1. **Always include `@source` directives** - Tailwind v4 requires them
2. **Use precise paths** - Scan only what you need
3. **Exclude test files** - Use `@source not` for performance
4. **Import order**: Custom variants → Tailwind → Source directives
5. **Define theme in CSS** - Use `@theme inline` for custom properties
6. **No config files** - Everything in CSS (v4 way)

## PostCSS Configuration

We use `@tailwindcss/postcss` plugin for Tailwind v4:

```js
// postcss.config.mjs
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

## Dependencies

- `tailwindcss` - Latest v4
- `@tailwindcss/postcss` - PostCSS plugin for v4
- `@heroui/react@beta` - HeroUI v3 React components
- `@heroui/styles@beta` - HeroUI v3 styles
- `tailwind-variants` - Required by HeroUI for variant management

## Common Mistakes

❌ **Forgetting `@source` directives**
```css
@import "tailwindcss";
/* Missing @source - nothing will be scanned! */
```

❌ **Using v3 config file**
```js
// tailwind.config.ts - NOT NEEDED in v4
export default {
  content: [...], // This doesn't work in v4
}
```

❌ **Wrong import order**
```css
@import "tailwindcss";
@custom-variant dark (&:is(.dark *)); // Too late!
```

✅ **Correct setup**
```css
@custom-variant dark (&:is(.dark *));
@import "tailwindcss";
@source "./app/**/*.{ts,tsx}";
```

## Demo Page

We've created a comprehensive demo page at `/ops/demo` to verify that all components render correctly with Tailwind CSS v4:

**Visit:** http://localhost:3001/ops/demo

The demo page demonstrates:
1. **HeroUI v3 Components** - Button, SearchField, Modal from @heroui/react
2. **shadcn/ui Components** - Button, Card, Badge, Table, Tabs from apps/web/components/ui/
3. **Tailwind CSS v4 Utilities** - Color system (OKLCH), spacing, typography, responsive grid

![Demo page screenshot](./images/web/ops/demo.png)

This demo proves our `@source` directives correctly scan all component locations and Tailwind v4 generates the required CSS.

## References

- [Tailwind CSS v4 Alpha](https://tailwindcss.com/blog/tailwindcss-v4-alpha)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
