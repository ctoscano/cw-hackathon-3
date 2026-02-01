# Documentation

This directory contains documentation for the CW Hackathon monorepo.

## Structure

- **prds/** - Product Requirement Documents
  - [repo-setup.md](./prds/repo-setup.md) - Initial monorepo setup implementation plan
- **templates/** - Document templates
  - [prd-template.md](./templates/prd-template.md) - Template for creating new PRDs
- **[react-best-practices.md](./react-best-practices.md)** - React and Next.js development patterns and performance guidelines

## Quick Links

- [Root README](../README.md) - Project overview and quick start
- [CLAUDE.md](../CLAUDE.md) - Detailed AI assistant context and development guide

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

Create new PRDs using the `/prd plan` skill command, which will copy the template and set up the initial structure.

PRDs should include:
- Overview and goals
- Technical requirements
- Implementation details
- Verification steps
- Dependencies and tech stack

### General Documentation

- Use clear, concise language
- Include code examples
- Link to related docs
- Keep up to date with code changes
