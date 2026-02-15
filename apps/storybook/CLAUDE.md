# apps/storybook - Component Explorer

## Overview

Storybook 10 setup for developing and showcasing `packages/ui` components in isolation. Uses `@storybook/react-vite` (not `nextjs-vite`) since shared UI components are pure React.

## Running

```bash
# From root
pnpm storybook          # Dev server at http://localhost:6006
pnpm build:storybook    # Static export to storybook-static/
```

## Architecture

- **Version**: Storybook 10 (ESM-only, essentials bundled into core)
- **Framework**: `@storybook/react-vite` — faster builds, no Next.js dependency
- **Essentials**: Built into `storybook` core — do NOT install `@storybook/addon-essentials` (removed in v10)
- **Tailwind v4**: Uses `@tailwindcss/vite` via dynamic import in `viteFinal` (static import fails with ESM/CJS issues)
- **CSS**: `.storybook/globals.css` mirrors `packages/ui/src/globals.css` design tokens
- **Dark mode**: Toggle via `@storybook/addon-themes` toolbar button
- **Docgen**: Disabled (`reactDocgen: false`) to avoid monorepo crashes
- **Story discovery**: Glob `packages/ui/src/**/*.stories.@(ts|tsx)`
- **Story format**: CSF3 (Component Story Format 3)

## Writing Stories

Stories are co-located with components:

```
packages/ui/src/components/
├── button.tsx              # Component
├── button.stories.tsx      # Story
├── card.tsx
├── card.stories.tsx
└── ...
```

### Story Template (CSF3)

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { MyComponent } from "./my-component";

const meta = {
  title: "Components/MyComponent",
  component: MyComponent,
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary"],
    },
  },
  args: {
    children: "Default content",
  },
} satisfies Meta<typeof MyComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { variant: "default" },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "8px" }}>
      <MyComponent variant="default">Default</MyComponent>
      <MyComponent variant="secondary">Secondary</MyComponent>
    </div>
  ),
};
```

## When to Write a Story

**Write one when:**
- Designing a specific interaction or visual experience
- Component has multiple variants/states worth seeing side by side
- Iterating on look-and-feel in isolation
- Component is reusable and others need to understand the API
- Dark mode, responsive, or edge cases matter

**Skip when:**
- Thin wrapper or layout with no visual states
- Tightly coupled to app data/routing (needs heavy mocking)
- Just wiring pieces together, not crafting an experience

**Rule of thumb:** If you're working on *how something looks or feels*, a story saves time. If you're connecting pieces, skip it.

## Key Files

| File | Purpose |
|------|---------|
| `.storybook/main.ts` | Framework, addon config, viteFinal for Tailwind v4 |
| `.storybook/preview.ts` | Global decorators and parameters |
| `.storybook/globals.css` | Tailwind v4 entry, design tokens |
