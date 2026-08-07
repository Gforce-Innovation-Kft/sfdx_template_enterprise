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

> **`salesforce-developer` is the canonical GForce Salesforce standard**, not a template-local
> skill. It is symlinked to `~/.claude/skills/salesforce-developer`, so it loads in **every**
> repo — `sf-develop-demo`, client engagements, anywhere. This repo remains its home; edit it
> here and the change applies everywhere immediately.
>
> Its `references/` is itself a symlink to `.claude/references/`, so the reference files travel
> with the skill instead of resolving against whatever repo you happen to be in. Its `assets/`
> holds compiling fflib templates to read before authoring.
>
> If you edit anything under `.claude/references/`, you are changing the standard for every
> repo. That is the point — but it means the blast radius is not local.

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

<!-- skills-tooling -->

## Skills & AI tooling

**External skills** (lockfile-managed — update with `npx skills check` / `npx skills update`):

- `agentforce-architecture-analyze` — from forcedotcom/sf-skills
- `agentforce-d360-analyze` — from forcedotcom/sf-skills
- `agentforce-generate` — from forcedotcom/sf-skills
- `agentforce-observe` — from forcedotcom/sf-skills
- `agentforce-test` — from forcedotcom/sf-skills
- `automation-flow-generate` — from forcedotcom/sf-skills
- `commerce-b2b-open-code-components-integrate` — from forcedotcom/sf-skills
- `commerce-b2b-open-code-components-replace` — from forcedotcom/sf-skills
- `commerce-b2b-store-create` — from forcedotcom/sf-skills
- `data360-activate` — from forcedotcom/sf-skills
- `data360-code-extension-generate` — from forcedotcom/sf-skills
- `data360-connect` — from forcedotcom/sf-skills
- `data360-harmonize` — from forcedotcom/sf-skills
- `data360-orchestrate` — from forcedotcom/sf-skills
- `data360-prepare` — from forcedotcom/sf-skills
- `data360-query` — from forcedotcom/sf-skills
- `data360-schema-get` — from forcedotcom/sf-skills
- `data360-segment` — from forcedotcom/sf-skills
- `design-systems-slds-apply` — from forcedotcom/sf-skills
- `design-systems-slds-validate` — from forcedotcom/sf-skills
- `design-systems-slds2-migrate` — from forcedotcom/sf-skills
- `dx-app-analytics-query` — from forcedotcom/sf-skills
- `dx-code-analyzer-configure` — from forcedotcom/sf-skills
- `dx-code-analyzer-custom-rule-create` — from forcedotcom/sf-skills
- `dx-code-analyzer-run` — from forcedotcom/sf-skills
- `dx-devops-test-failures-analyze` — from forcedotcom/sf-skills
- `dx-devops-test-pipeline-configure` — from forcedotcom/sf-skills
- `dx-devops-test-suite-assignments-configure` — from forcedotcom/sf-skills
- `dx-devops-test-suite-run` — from forcedotcom/sf-skills
- `dx-org-manage` — from forcedotcom/sf-skills
- `dx-org-permission-set-assign` — from forcedotcom/sf-skills
- `dx-org-switch` — from forcedotcom/sf-skills
- `experience-cms-brand-apply` — from forcedotcom/sf-skills
- `experience-content-media-search` — from forcedotcom/sf-skills
- `experience-lwc-generate` — from forcedotcom/sf-skills
- `experience-ui-bundle-agentforce-client-generate` — from forcedotcom/sf-skills
- `experience-ui-bundle-app-coordinate` — from forcedotcom/sf-skills
- `experience-ui-bundle-custom-app-generate` — from forcedotcom/sf-skills
- `experience-ui-bundle-deploy` — from forcedotcom/sf-skills
- `experience-ui-bundle-features-generate` — from forcedotcom/sf-skills
- `experience-ui-bundle-file-upload-generate` — from forcedotcom/sf-skills
- `experience-ui-bundle-frontend-generate` — from forcedotcom/sf-skills
- `experience-ui-bundle-metadata-generate` — from forcedotcom/sf-skills
- `experience-ui-bundle-salesforce-data-access` — from forcedotcom/sf-skills
- `experience-ui-bundle-site-generate` — from forcedotcom/sf-skills
- `external-diagram-mermaid-generate` — from forcedotcom/sf-skills
- `external-diagram-visual-generate` — from forcedotcom/sf-skills
- `integration-connectivity-connected-app-configure` — from forcedotcom/sf-skills
- `integration-connectivity-generate` — from forcedotcom/sf-skills
- `integration-eventing-cdc-configure` — from forcedotcom/sf-skills
- `integration-eventing-subscription-configure` — from forcedotcom/sf-skills
- `mobile-apps-create` — from forcedotcom/sf-skills
- `mobile-platform-native-capabilities-integrate` — from forcedotcom/sf-skills
- `mobile-platform-offline-validate` — from forcedotcom/sf-skills
- `omnistudio-callable-apex-generate` — from forcedotcom/sf-skills
- `omnistudio-datamapper-generate` — from forcedotcom/sf-skills
- `omnistudio-datapacks-deploy` — from forcedotcom/sf-skills
- `omnistudio-dependencies-analyze` — from forcedotcom/sf-skills
- `omnistudio-epc-catalog-generate` — from forcedotcom/sf-skills
- `omnistudio-flexcard-generate` — from forcedotcom/sf-skills
- `omnistudio-integration-procedure-generate` — from forcedotcom/sf-skills
- `omnistudio-omniscript-generate` — from forcedotcom/sf-skills
- `platform-agentexchange-partner-offers-configure` — from forcedotcom/sf-skills
- `platform-agentsetup-categories-fetch` — from forcedotcom/sf-skills
- `platform-apex-generate` — from forcedotcom/sf-skills
- `platform-apex-logs-debug` — from forcedotcom/sf-skills
- `platform-apex-test-generate` — from forcedotcom/sf-skills
- `platform-apex-test-run` — from forcedotcom/sf-skills
- `platform-custom-application-generate` — from forcedotcom/sf-skills
- `platform-custom-field-generate` — from forcedotcom/sf-skills
- `platform-custom-lightning-type-generate` — from forcedotcom/sf-skills
- `platform-custom-object-generate` — from forcedotcom/sf-skills
- `platform-custom-tab-generate` — from forcedotcom/sf-skills
- `platform-data-manage` — from forcedotcom/sf-skills
- `platform-docs-get` — from forcedotcom/sf-skills
- `platform-flexipage-generate` — from forcedotcom/sf-skills
- `platform-lightning-app-coordinate` — from forcedotcom/sf-skills
- `platform-list-view-generate` — from forcedotcom/sf-skills
- `platform-metadata-api-context-get` — from forcedotcom/sf-skills
- `platform-metadata-deploy` — from forcedotcom/sf-skills
- `platform-metadata-retrieve` — from forcedotcom/sf-skills
- `platform-permission-set-generate` — from forcedotcom/sf-skills
- `platform-sharing-rules-generate` — from forcedotcom/sf-skills
- `platform-soql-query` — from forcedotcom/sf-skills
- `platform-tracing-agentforce-configure` — from forcedotcom/sf-skills
- `platform-tracing-configure` — from forcedotcom/sf-skills
- `platform-trust-archive-manage` — from forcedotcom/sf-skills
- `platform-validation-rule-generate` — from forcedotcom/sf-skills
- `platform-value-set-generate` — from forcedotcom/sf-skills

**Local skills** (hand-written, repo-specific):

- `graphify`
- `new-requirement`
- `salesforce-developer`
- `using-nebula-logger`

**Global tooling available in every session:** lean-ctx (prefer `ctx_*` MCP tools for reads/search/shell — token-compressed), superpowers process skills, and graphify (knowledge graph present — use `graphify query`).

<!-- /skills-tooling -->
