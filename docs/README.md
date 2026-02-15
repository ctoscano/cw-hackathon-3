# Documentation

This directory contains documentation for the CW Hackathon monorepo.

## Start Here

- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Development guide for new engineers (skills, workflows, architecture)

## Structure

- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Development guide (start here for onboarding)
- **[prds/](./prds/)** - Product Requirement Documents (check the folder for the full list, prefixed by wave number for chronological ordering)
- **templates/** - Document templates
  - [prd-template.md](./templates/prd-template.md) - Template for creating new PRDs
- **[react-best-practices.md](./react-best-practices.md)** - React and Next.js development patterns and performance guidelines
- **[design-guidelines.md](./design-guidelines.md)** - Color palette, typography, icon usage
- **[tailwind-setup.md](./tailwind-setup.md)** - Tailwind CSS v4 configuration reference
- **[quality-gates.md](./quality-gates.md)** - Pre-commit and pre-push automated checks
- **[chrome-devtools-mcp.md](./chrome-devtools-mcp.md)** - Browser debugging with Chrome DevTools Protocol
- **[heroui-tailwind-monorepo.md](./heroui-tailwind-monorepo.md)** - HeroUI + Tailwind v4 integration guide
- **[spa-pattern-data-heavy-pages.md](./spa-pattern-data-heavy-pages.md)** - SPA patterns for data-intensive pages
- **[redis-data-structure.md](./redis-data-structure.md)** - Redis schema design

## Quick Links

- [Root README](../README.md) - Project overview and quick start
- [CLAUDE.md](../CLAUDE.md) - Detailed AI assistant context and development guide
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development guide for new engineers

## Adding Documentation

When adding new documentation:

1. Place PRDs in `prds/` directory
2. Use descriptive filenames (e.g., `feature-name.md`)
3. Update this README with links to new docs
4. Follow markdown best practices
5. Include code examples where relevant

## Documentation Guidelines

### PRDs (Product Requirement Documents)

Use the [PRD template](./templates/prd-template.md) to create new PRDs. The template includes:
- Purpose and scope definition
- Constraints and dependencies
- Technical requirements (files, architecture, tech stack)
- Implementation steps with verification criteria
- Meta-instructions to guide LLMs in proper PRD creation

#### PRD Workflow

Create and manage PRDs using the `/prd` skill commands:

1. **Create** - `/prd plan` - Create new PRD from template
2. **Implement** - `/prd start` - Add implementation notes and track progress
3. **Complete** - `/prd end` - Mark as pending review (runs quality checks)
4. **Review** - User verifies the implementation works
5. **Accept/Reject** - `/prd accept` or `/prd reject [reason]`
6. **Check Status** - `/prd status` - View current PRD state

#### PRD States

- **Draft** - Just created, not started
- **In Progress** - Implementation underway
- **Pending Review** - Implementation complete, awaiting user verification
- **Accepted** - User verified and approved

#### Quality Gates

Before a PRD can be marked "Pending Review", it must pass:
- TypeScript type checks (`pnpm type-check`)
- Production build (`pnpm build`)
- Demo instructions must be provided
- All completion criteria should be met

PRDs should include:
- Overview and goals
- Technical requirements
- Implementation details
- Verification steps
- Dependencies and tech stack
- Quality checks section (auto-populated by `/prd end`)

### General Documentation

- Use clear, concise language
- Include code examples
- Link to related docs
- Keep up to date with code changes
