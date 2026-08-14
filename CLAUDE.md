# GForce SF Enterprise Template

Reusable Salesforce DX scaffold for GForce Innovation client engagements.
Clone → run `scripts/setup.sh` → AI pair-programming is ready.

## Architecture

```
Trigger → TriggerHandler → Domain → Selector → Service → UnitOfWork → Gateway → Logger
```

All layers use fflib enterprise patterns. NebulaLogger for all logging. Never `System.debug`.

## Before writing any feature code

1. Read `docs/product/PRODUCT.md` — what the system does and why
2. Read the relevant `docs/product/requirements/REQ-*.yaml`
3. For Apex: use the `platform-apex-generate` sf-skill + read `.claude/references/apex-coding-rules.md`
4. For LWC: use the `experience-lwc-generate` sf-skill + read `.claude/references/lwc-coding-rules.md`
5. For tests: use the `platform-apex-test-generate` sf-skill + read `.claude/references/apex-patterns.md` + read `.claude/references/testing-testdatafactory.md`

## AI layer

- **L2 `salesforce-developer`** — the house SF standard, consumed from `gforce-ai` via
  `skills-lock.json`. It was authored here and donated; **do not edit it in this repo** —
  changes go to `Gforce-Innovation-Kft/gforce-ai`.
- **L2 `gforce-github-actions`** + agent `gha-workflow-author`.
- **L2 agent `sf-code-reviewer`** — read-only Apex/LWC review.
- **L3 override** — [`.claude/references/local-standards.md`](.claude/references/local-standards.md),
  read last, wins on conflict.
- **Local skills** — `using-nebula-logger`, `new-requirement`.

**sf-skills** (vendored in `.agents/skills/` + `.claude/skills/` symlinks; pinned by
`skills-lock.json`, updated only via a reviewed `npx skills update` PR):
`platform-apex-generate`, `platform-apex-test-generate`, `experience-lwc-generate`,
`platform-apex-test-run`, `platform-metadata-deploy`, `dx-code-analyzer-run`, and 80+ more.

## GForce Reference Files (`.claude/references/`)

Read the relevant file before generating code — do NOT skip this step:

| File                         | When to read                                                         |
| ---------------------------- | -------------------------------------------------------------------- |
| `apex-coding-rules.md`       | Any Apex generation — bulk safety, NebulaLogger, fflib, security     |
| `lwc-coding-rules.md`        | Any LWC generation — wire, 4-state template, SLDS, FLS               |
| `apex-patterns.md`           | fflib Application factory, domain/selector/service/UoW patterns      |
| `testing-testdatafactory.md` | TestDataFactory API, project factory wrappers, standard test pattern |
| `security-sharing.md`        | CRUD/FLS, WITH SECURITY_ENFORCED, Named Credentials                  |
| `soql-optimization.md`       | Selector SOQL, bind vars, index fields                               |
| `deployment-devops.md`       | Branching, scratch orgs, CI gates, promotion                         |

## Hard constraints

- No SOQL or DML in loops — ever
- All SOQL through Selectors with `WITH SECURITY_ENFORCED`
- All DML through Unit of Work
- `with sharing` on all classes unless explicitly justified
- Triggers: zero logic — one line to handler
- No hardcoded IDs or credentials
- Use `Logger.*` (NebulaLogger) — never `System.debug`
- Tests: `@isTest`, `@TestSetup`, TestDataFactory, no `SeeAllData=true`

<!-- skills-tooling -->

## Skills & AI tooling

**External skills** (lockfile-managed — update with `npx skills check` / `npx skills update`):

~90 vendored **forcedotcom/sf-skills** covering the full platform — Apex/LWC/test generation, DX org + code-analyzer ops, metadata, flows, Agentforce, Data360, OmniStudio, Experience/UI bundles, integration, mobile, SLDS. **The authoritative list is `skills-lock.json`** — check there (or `ls .claude/skills/`) before assuming a capability is missing. Key ones are named in context above.

Plus 2 from **Gforce-Innovation-Kft/gforce-ai**: `salesforce-developer`, `gforce-github-actions` — see "AI layer" above.

**Local skills** (hand-written, repo-specific):

- `new-requirement`
- `using-nebula-logger`

**Global tooling available in every session:** lean-ctx (prefer `ctx_*` MCP tools for reads/search/shell — token-compressed) and superpowers process skills.

<!-- /skills-tooling -->
