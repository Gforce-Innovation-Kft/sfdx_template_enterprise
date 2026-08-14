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
3. Invoke the **`salesforce-developer` skill**. It is the router — it decides which rule
   file applies (Apex, LWC, tests, security, SOQL, deployment) and reads it for you.
   Do not go looking for reference files yourself.
4. Then generate with the matching sf-skill: `platform-apex-generate`,
   `experience-lwc-generate`, or `platform-apex-test-generate`.

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

## Where the coding rules live

**In the `salesforce-developer` skill, not in this repo.** The skill ships its own
`references/` (Apex, LWC, patterns, tests, security, SOQL, deployment) and routes to
the right one. This repo used to keep parallel copies in `.claude/references/`; they
drifted and were deleted — a duplicated rule file is a rule file that goes stale.

`.claude/references/` now holds exactly one file: **`local-standards.md`** (L3). The
skill reads it **last** and it **wins** on conflict. That is the only supported way to
specialize the standard here. Editing the skill in this repo is not — it breaks
`npx skills update` permanently.

## Hard constraints

- No SOQL or DML in loops — ever
- All SOQL through Selectors, in **user mode** (`WITH USER_MODE`) — it enforces CRUD,
  FLS _and_ sharing. `WITH SECURITY_ENFORCED` is not equivalent and is flagged in new
  code by `sf-code-reviewer`; see the skill's `references/security-sharing.md`
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

**Global tooling available in every session:** rtk (Bash output compression — automatic via hook), lean-ctx (prefer `ctx_*` MCP tools for reads/search — token-compressed), and superpowers process skills.

<!-- /skills-tooling -->
