# Design Guidelines

## Overview

This document outlines the design system and visual guidelines for the CW Hackathon project, ensuring consistency across all interfaces.

## Anthropic-Inspired Design System

### Color Palette

The project uses an Anthropic-inspired color palette defined in `apps/web/app/globals.css`:

```css
:root {
  /* Primary Colors */
  --anthropic-dark: #141413;        /* Primary text, headings */
  --anthropic-light: #faf9f5;       /* Backgrounds, light sections */

  /* Accent Colors */
  --anthropic-orange: #d97757;      /* Primary accent, CTAs, highlights */
  --anthropic-blue: #6a9bcc;        /* Secondary accent, info states */
  --anthropic-green: #788c5d;       /* Success states, confirmations */

  /* Neutral Colors */
  --anthropic-mid-gray: #b0aea5;    /* Borders, dividers */
  --anthropic-light-gray: #e8e6dc;  /* Subtle backgrounds, disabled states */
}
```

**Usage Examples:**
- **Headings**: `text-anthropic-dark` with `font-heading`
- **Body text**: `text-anthropic-dark` with `font-body`
- **Primary actions**: `bg-anthropic-orange` or `border-anthropic-orange`
- **Info sections**: Icons with `text-anthropic-blue`
- **Success states**: Icons with `text-anthropic-green`
- **Borders**: `border-anthropic-mid-gray/20` (with opacity)

### Typography

Two font families are used throughout the application:

```css
--font-heading: "Poppins", Arial, sans-serif;  /* Headings, labels, UI text */
--font-body: "Lora", Georgia, serif;           /* Body text, content, descriptions */
```

**Usage:**
- **Headings (h1-h6)**: `font-heading font-semibold` or `font-heading font-bold`
- **Body text**: `font-body` with `leading-relaxed` for readability
- **UI elements**: `font-heading font-medium` or `font-heading font-semibold`
- **Code/monospace**: `font-mono` (system default)

**Importing Fonts:**
```tsx
// apps/web/app/layout.tsx
import { Lora, Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heading",
});

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});
```

### Spacing and Layout

- **Container padding**: `px-6 py-4` for standard sections
- **Card spacing**: `p-6` for card interiors
- **Section gaps**: `space-y-6` for major sections, `space-y-4` for subsections
- **Grid gaps**: `gap-4` for grids, `gap-2` for compact layouts
- **Border radius**: `rounded-lg` (8px) for cards, `rounded-full` for pills/badges

### Component Patterns

#### Cards
```tsx
<div className="bg-white border border-anthropic-mid-gray/20 rounded-lg p-6 shadow-sm">
  <h3 className="text-lg font-heading font-semibold text-anthropic-dark flex items-center gap-2 mb-4">
    <Icon className="h-5 w-5 text-anthropic-blue flex-shrink-0" />
    Section Title
  </h3>
  {/* Card content */}
</div>
```

#### Content Blocks
```tsx
<div className="bg-gradient-to-br from-anthropic-light to-white border-l-4 border-anthropic-orange rounded-r-lg p-4 text-sm font-body leading-relaxed text-anthropic-dark shadow-sm">
  {content}
</div>
```

#### Section Headers
```tsx
<div className="flex items-center gap-2 mb-3">
  <div className="h-1 w-12 bg-anthropic-orange rounded-full" />
  <p className="text-sm font-heading font-semibold text-anthropic-dark uppercase tracking-wide">
    Section Title
  </p>
</div>
```

## Icon Usage

### ❌ NEVER Use Emojis

**Rule**: Never use emoji characters (📊, 🔍, 📋, etc.) in the codebase. Always use Lucide SVG icons instead.

**Why:**
- Emojis render inconsistently across platforms and browsers
- Emojis don't match the professional Anthropic aesthetic
- SVG icons are more accessible and customizable
- Icons can be styled with Tailwind classes (size, color, etc.)

### ✅ Use Lucide React Icons

**Installation:**
```bash
pnpm add lucide-react
```

**Common Icons:**
```tsx
import {
  ArrowLeft,       // Back navigation
  CheckCircle,     // Success, completion
  ClipboardList,   // Plans, lists
  Database,        // Data, storage
  Info,            // Information sections
  MessageSquare,   // Chat, conversations
  Search,          // Search, assessment
  User,            // User, contact info
} from "lucide-react";

// Usage in components
<Info className="h-5 w-5 text-anthropic-blue flex-shrink-0" />
<MessageSquare className="h-5 w-5 text-anthropic-orange flex-shrink-0" />
```

**Icon Sizing:**
- Small icons: `h-4 w-4` (16px) - for buttons, inline text
- Standard icons: `h-5 w-5` (20px) - for section headers, cards
- Large icons: `h-6 w-6` (24px) - for major headings, hero sections

**Icon Colors:**
- Match to section color: `text-anthropic-orange`, `text-anthropic-blue`, `text-anthropic-green`
- Use `flex-shrink-0` to prevent icon squishing in flex containers

### Icon Mappings (Emoji to Lucide)

| Instead of | Use | Example |
|------------|-----|---------|
| 📋 | `<ClipboardList />` | `<ClipboardList className="h-6 w-6 text-primary" />` |
| 📝 | `<FileText />` | `<FileText className="h-6 w-6 text-secondary" />` |
| ✓ ✔ | `<Check />` | `<Check className="h-4 w-4 text-accent" />` |
| ✓ Complete | `<CheckCircle />` | `<CheckCircle className="h-4 w-4" />` |
| 🧪 | `<FlaskConical />` | `<FlaskConical className="h-6 w-6 text-muted-foreground" />` |
| ✨ | `<Sparkles />` | `<Sparkles className="h-5 w-5 text-primary" />` |
| ⚡ | `<Zap />` | `<Zap className="h-5 w-5 text-yellow-500" />` |
| 🌙 | `<Moon />` | `<Moon className="h-5 w-5 text-purple-400" />` |
| 🎉 | `<PartyPopper />` | `<PartyPopper className="h-5 w-5" />` |
| 🎯 | `<Target />` | `<Target className="h-5 w-5" />` |
| 🚀 | `<Rocket />` | `<Rocket className="h-5 w-5" />` |

**Loading Messages:**
Instead of emoji-laden loading messages like "Gathering insights ✨", use plain text with ellipsis:
- "Gathering insights..."
- "Personalizing results..."
- "Almost ready..."

## Component Libraries

### HeroUI v3

Used for interactive components (buttons, modals, tabs, etc.):

```tsx
import { Button, Modal, Tabs } from "@heroui/react";

<Button variant="outline" size="sm">
  Click Me
</Button>
```

**See:** [docs/heroui-tailwind-monorepo.md](./heroui-tailwind-monorepo.md) for setup details.

### shadcn/ui

Used for accessible, unstyled components (tables, dialogs, badges, etc.):

```tsx
import { Badge } from "@/components/ui/badge";
import { Table } from "@/components/ui/table";
```

### ai-elements

Used for conversational UI components:

```tsx
import { QuestionMessage, AnswerMessage, ReflectionMessage } from "@/components/ui/message-bubble";

<QuestionMessage questionNumber={1} questionText="What brings you here today?" />
<AnswerMessage answer="I'm experiencing anxiety..." />
```

## Accessibility

- Use semantic HTML elements (`<button>`, `<nav>`, `<header>`, etc.)
- Include `aria-label` for icon-only buttons
- Ensure color contrast meets WCAG AA standards (4.5:1 for normal text)
- Provide keyboard navigation for all interactive elements
- Use `flex-shrink-0` on icons in flex containers to prevent squishing

## Dark Mode (Future)

The design system includes dark mode support via `.dark` class:

```css
.dark {
  --background: oklch(0.078 0 0);  /* Dark background */
  --foreground: oklch(0.942 0 0);  /* Light text */
  /* ... other dark mode colors ... */
}
```

Apply dark mode to the root element:
```tsx
<html className="dark">
```

## Examples

For live examples of the design system in action:
- **Operations Dashboard**: `/ops` - Full implementation with Anthropic design
- **Demo Page**: `/ops/demo` - Component library testing

## Design System Files

- `apps/web/app/globals.css` - CSS custom properties, theme configuration
- `apps/web/app/layout.tsx` - Font loading, root layout
- `apps/web/components/ui/*` - shadcn/ui components
- `docs/design-guidelines.md` - This file
