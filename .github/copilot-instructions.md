# GForce SF Enterprise — AI Pair-Programming Instructions

These instructions apply to all AI coding assistants (GitHub Copilot, Cursor, Windsurf, Claude Code).

---

## Before Generating ANY Salesforce Code

Follow this three-step workflow every time:

The rules live in the **`salesforce-developer` skill**, vendored at
`.claude/skills/salesforce-developer/`. Claude Code loads it automatically; assistants
that do not support skills should read the files below directly.

1. **Read the relevant coding rules**
   - Apex: `.claude/skills/salesforce-developer/references/apex-coding-rules.md`
   - LWC: `.claude/skills/salesforce-developer/references/lwc-coding-rules.md`

2. **Read the relevant patterns**
   - fflib layers: `.claude/skills/salesforce-developer/references/apex-patterns.md`
   - Security & sharing: `.claude/skills/salesforce-developer/references/security-sharing.md`
   - SOQL queries: `.claude/skills/salesforce-developer/references/soql-optimization.md`
   - CI/CD & deployment: `.claude/skills/salesforce-developer/references/deployment-devops.md`

3. **Read `.claude/references/local-standards.md` last** — this repo's overrides win
   over anything above.

4. **Read the business context**
   - `docs/product/PRODUCT.md` — what the system does and why
   - `docs/product/requirements/REQ-*.yaml` — specific requirements for this feature

Do NOT skip these steps. They prevent the most common LLM-generated Apex mistakes.

---

## Architecture

```
Trigger → TriggerHandler → Domain → Selector → Service → UnitOfWork → Gateway → Logger
```

- **Trigger**: zero logic — one line: `AccountTriggerHandler.run();`
- **TriggerHandler**: delegates to `fflib_SObjectDomain.triggerHandler(AccountDomain.class)`
- **Domain**: field validation, SObject-specific rules. No SOQL. No DML.
- **Selector**: all SOQL. No DML. No business logic. Always `WITH SECURITY_ENFORCED`.
- **Service**: orchestrates Domain + Selector + UoW. One method = one business operation.
- **UnitOfWork**: all DML via `Application.UnitOfWork.newInstance()`. No direct `insert/update/delete`.
- **Gateway**: HTTP callouts via Named Credentials. Has a mockable interface.
- **Logger**: `Logger.*` (NebulaLogger) everywhere. Never `System.debug`.

All classes registered in `Application.cls` (service, selector, domain, UoW).

---

## Hard Rules — Zero Exceptions

- No SOQL inside loops
- No DML inside loops
- All SOQL through Selectors with `WITH SECURITY_ENFORCED`
- All DML through Unit of Work (`uow.registerNew/Dirty/Deleted` → `uow.commitWork()`)
- `with sharing` on every class (unless justified in an inline comment)
- No hardcoded IDs, org URLs, or credentials
- `Logger.*` everywhere — never `System.debug`
- Triggers: zero logic — delegation only
- Tests: `@isTest`, `@TestSetup`, `TestDataFactory.createSObject()`, no `SeeAllData=true`

---

## Apex Generation Checklist

When generating an Apex class, verify:

- [ ] `public with sharing class`
- [ ] Implements the correct interface (`IAccountService`, `IAccountSelector`, etc.)
- [ ] Registered in `Application.cls`
- [ ] All SOQL has `WITH SECURITY_ENFORCED`
- [ ] All DML via `fflib_ISObjectUnitOfWork`
- [ ] `Logger.*` calls at entry points and catch blocks
- [ ] `Logger.saveLog()` before returning from service methods
- [ ] No `System.debug`
- [ ] `apiVersion: 67.0` in meta file
- [ ] `status: Active` in meta file

---

## LWC Generation Checklist

When generating an LWC component, verify:

- [ ] Four-state template: loading / error / empty / success
- [ ] `lwc:if/elseif/else` (not `if:true/if:false`)
- [ ] Wire for reads, imperative for mutations
- [ ] All async calls wrapped in `try/catch/finally`
- [ ] No hardcoded strings — Custom Labels used
- [ ] Event names are lowercase
- [ ] `lightning-record-form` / base components used where possible
- [ ] SLDS classes for layout and typography

---

## Test Class Checklist

- [ ] `@isTest` annotation on class
- [ ] `@TestSetup` static method for shared data
- [ ] `TestDataFactory.createSObject('Account', overrides)` for all test data
- [ ] `Application.Selector.setMock()` / `Application.UnitOfWork.setMock()` for mocks
- [ ] Positive, negative, and bulk (200 records) test scenarios
- [ ] Assertions on every test method — no empty tests
- [ ] No `SeeAllData=true`
- [ ] No hardcoded IDs

---

## Skills Available

```
npx skills add forcedotcom/sf-skills
```

Invoke by name in your prompt:

- `platform-apex-generate` — generate Apex following the workflow above
- `platform-apex-test-generate` — generate test classes
- `experience-lwc-generate` — generate LWC components
- `platform-apex-test-run` — run and analyse test results
- `platform-metadata-deploy` — deploy to target org
- `dx-code-analyzer-run` — PMD/static analysis
- `platform-custom-object-generate` / `platform-custom-field-generate` — metadata generation
