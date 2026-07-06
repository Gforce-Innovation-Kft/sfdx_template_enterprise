---
name: salesforce-developer
description: GForce Salesforce technical development rules. Load before generating any Apex class, trigger, LWC component, batch job, or test class. Enforces fflib layered architecture, NebulaLogger, bulkification, governor limit discipline, and boundary condition testing. Trigger on any request to write, review, or refactor Salesforce code.
version: 1.0.0
tags: [salesforce, apex, lwc, fflib, development, technical]
---

# GForce Salesforce Developer Skill

Load this skill for any Salesforce technical task: Apex classes, LWC components, triggers, batch jobs, test classes, SOQL, selectors, services, domains.

---

## Step 0 — Read the right reference file first

Do NOT skip. The reference files contain authoritative patterns with code examples.

| What you're building | Read first |
|---|---|
| Any Apex class | `.claude/references/apex-coding-rules.md` |
| fflib layer (domain / selector / service / UoW / application factory) | `.claude/references/apex-patterns.md` |
| Any test class | `.claude/references/testing-testdatafactory.md` |
| Any LWC component | `.claude/references/lwc-coding-rules.md` |
| SOQL queries or selector methods | `.claude/references/soql-optimization.md` |
| Sharing model, FLS, CRUD, Named Credentials | `.claude/references/security-sharing.md` |
| Any Logger.* usage | invoke skill `using-nebula-logger` |

---

## Step 1 — Establish volume context before writing code

Ask or confirm before generating any Apex:

- **Record volumes**: How many records of the primary SObject? (e.g. "~50K Accounts")
- **Trigger batch size**: Always design for 200 (trigger default); Batch `execute()` can receive up to 2000
- **Growth trajectory**: Will this need to handle 10× volume in 12–24 months?

If the user has not stated volumes, **assume high-volume production scale (>10K records)** and generate accordingly. State this assumption explicitly so the user can correct it.

---

## Step 2 — Architecture layer check

Before writing a line, confirm:

- [ ] Which layer is this? → Trigger / TriggerHandler / Domain / Selector / Service / Batch / Queueable / Gateway / LWC
- [ ] SOQL lives only in Selectors — never in Domain, Service, or triggers
- [ ] DML lives only in Unit of Work (`uow.commitWork()`) — never direct `insert`/`update`/`delete`
- [ ] `with sharing` is the default — `without sharing` requires an explicit comment explaining why
- [ ] Does `Application.cls` need updating? (register new SObjects in Service, Selector, Domain, UoW maps)

---

## Step 3 — Governor limit mental pass

Before finalising any method, check each:

| Check | If yes |
|---|---|
| SOQL inside a loop? | Stop. Move query to Selector, call before loop, build a Map |
| DML inside a loop? | Stop. Use `uow.registerDirty/registerNew`, call `commitWork()` after loop |
| Unconstrained query without LIMIT? | Add LIMIT or use Batch for >10K rows |
| Nested loop over large collections? | Refactor to `Map<Id, SObject>` for O(1) lookup |
| Multiple queries that could be combined? | Consolidate into one Selector method |

---

## Step 4 — Boundary condition checklist

Every generated method must handle:

- [ ] Null or empty input → `if (records == null || records.isEmpty()) return;` at entry
- [ ] Max trigger batch (200 records) — test explicitly with 200 records
- [ ] Missing related records — `Map.get()` can return null; always null-check before use
- [ ] Duplicate IDs in the input set — use `Set<Id>` not `List<Id>`
- [ ] DML partial failure — log each `Database.SaveResult` error when using `allOrNone = false`
- [ ] Callout timeout — always set `req.setTimeout()`, always catch `System.CalloutException`
- [ ] Recursive trigger guard — ensure domain/handler has a re-entry guard if needed

---

## Step 5 — Test class requirements

- `@isTest` + `@TestSetup` on every test class
- Use `{Object}TestFactory` — never construct SObjects inline in test methods
- **One positive test + one bulk test (200 records minimum)** per public method
- One negative / error-path test per method
- Coverage target: **90%** — this is the CI gate
- No `SeeAllData = true`
- No `System.debug` — not even in tests (use `Logger.*` or omit)
- Unit tests: mock with `fflib_ApexMocks` (`Application.Selector.setMock()`, `Application.UnitOfWork.setMock()`)
- Integration tests: use real DML only when testing the full stack end-to-end

---

## Hard stops — never generate code containing these

- SOQL inside any loop (`for`, `while`, `do-while`) — zero tolerance
- DML inside any loop — zero tolerance
- `System.debug` anywhere — use `Logger.*` (NebulaLogger)
- Logic inside a trigger file — one line to handler only
- Hardcoded IDs, profile names, org URLs, or credentials
- `SeeAllData = true` in any test
- `SELECT *` — enumerate fields explicitly
- `without sharing` without a comment explaining the exception
- Catch `Exception e` without logging and re-throwing (never swallow silently)

---

## Related skills

| Task | Skill |
|---|---|
| Generate Apex class | `platform-apex-generate` |
| Generate test class | `platform-apex-test-generate` |
| Generate LWC | `experience-lwc-generate` |
| Run Apex tests | `platform-apex-test-run` |
| SOQL query help | `platform-soql-query` |
| NebulaLogger details | `using-nebula-logger` |
| Debug Apex logs | `platform-apex-logs-debug` |
| Deploy metadata | `platform-metadata-deploy` |
