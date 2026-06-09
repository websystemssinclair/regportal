# Sinclair Registration Portal — Agent Instructions

Course registration portal for Sinclair College. Students search, plan, and register for Sections each Term.

## Language Rules

- **No TypeScript in source code.** Plain JavaScript only (`src/`). TypeScript is allowed only in test files.
- Use the domain vocabulary defined in `CONTEXT.md`. Do not drift to synonyms the glossary explicitly avoids (e.g., use **Registration**, not Enrollment; **Term**, not Semester; **Section**, not Class Section).

## Stack

- Vue 3 + Vite, Pinia (state), Vue Router, PrimeVue (unstyled mode), Tailwind CSS v4, Axios
- Tests: Vitest + `@vue/test-utils`
- Run dev: `npm run dev` | Run tests: `npm run test`

## Issue Tracker

Issues and PRDs live as local markdown files under `.scratch/`. No GitHub Issues.

- One feature per directory: `.scratch/<feature-slug>/`
- PRD: `.scratch/<feature-slug>/PRD.md`
- Issues: `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`
- Triage state is a `Status: <label>` line near the top of each issue file
- Comments/history append under a `## Comments` heading at the bottom

See `docs/agents/issue-tracker.md` for full conventions.

## Triage Labels

| Role | Label | Meaning |
|------|-------|---------|
| needs-triage | `needs-triage` | Maintainer needs to evaluate |
| needs-info | `needs-info` | Waiting on reporter |
| ready-for-agent | `ready-for-agent` | Fully specified, safe for an AFK agent |
| ready-for-human | `ready-for-human` | Requires human implementation |
| wontfix | `wontfix` | Will not be actioned |

See `docs/agents/triage-labels.md` for full mapping.

## Domain Docs

Before exploring any area of the codebase, read:

1. `CONTEXT.md` at the repo root — domain glossary, roles, and relationships
2. `docs/adr/` — ADRs that touch the area you're working in

If a file doesn't exist, proceed silently. If your output contradicts an existing ADR, surface it explicitly rather than silently overriding it.

See `docs/agents/domain.md` for full conventions.
