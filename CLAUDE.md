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

## Code navigation (graphify)

When `graphify-out/graph.json` exists:

- `graphify query "<question>"` — broad context lookup (replaces grep)
- `graphify path "ClassA" "ClassB"` — relationship trace
- `graphify explain "ClassName"` — node detail
- After editing code: `graphify update .` (AST-only, no API cost)

## Skills

**sf-skills** (vendored in `.agents/skills/` + `.claude/skills/` symlinks; pinned by
`skills-lock.json`, updated only via a reviewed `npx skills update` PR):
`platform-apex-generate`, `platform-apex-test-generate`, `experience-lwc-generate`,
`platform-apex-test-run`, `platform-metadata-deploy`, `dx-code-analyzer-run`, and 80+ more.

**GForce custom skills:**

| Skill                  | Trigger                              | Purpose                                                                                                                                        |
| ---------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `salesforce-developer` | Any Apex / LWC / trigger / test task | Volume context, layer checklist, governor limit discipline, boundary conditions, 90% coverage gate — load before generating any technical code |
| `new-requirement`      | New feature request                  | Generate a `REQ-NNN.yaml` from a business description                                                                                          |
| `using-nebula-logger`  | Any `Logger.*` usage                 | Full NebulaLogger API reference                                                                                                                |

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

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:

- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
