# GForce Deployment & DevOps

The pipeline implementation lives in
[shared-github-actions](https://github.com/Gforce-Innovation-Kft/shared-github-actions)
(`sf-validate.yml` / `sf-deploy.yml` reusable workflows); this repo only ships
thin callers. Operational setup guide: [docs/CICD.md](../../docs/CICD.md).
If the pipeline needs something the shared workflows lack, raise a change
request there — never copy workflow logic into this repo.

---

## 1. Branching Strategy (trunk-based)

```
main          ← protected by ruleset; every merge deploys via the production gate
  └── feature/REQ-001-account-enhancements   ← short-lived, per-ticket
  └── feature/REQ-002-lwc-account-form
  └── hotfix/critical-bug-fix                ← same flow, expedited review
```

- `feature/*` → PR to `main` → validated by `pr-validate.yml` (delta check-only
  deploy + scratch org + Code Analyzer)
- merge to `main` → `deploy.yml` → **production GitHub Environment gate**
  (required reviewer) → quick deploy of the PR-validated request
- No long-lived `develop` branch. Additional environments (integration/uat)
  are added as extra gated jobs in `deploy.yml`, not extra branches.

---

## 2. Branch Naming

```
feature/REQ-001-short-description
bugfix/REQ-042-fix-account-validation
hotfix/critical-invoice-calculation
chore/update-apex-api-version
```

Always reference the REQ number when one exists.

---

## 3. PR Rules

Every PR must:

- Pass CI (`pr-validate.yml` → shared `sf-validate.yml@v1`): delta check-only
  deploy with tests + scratch org validation + Code Analyzer
- Be **up to date with `main`** before merge (ruleset-enforced — this keeps the
  validated deploy request identical to what merges, which is what makes quick
  deploy safe)
- Have a completed PULL_REQUEST_TEMPLATE.md checklist
- Link to the relevant REQ-NNN.yaml or ticket
- Be reviewed (CODEOWNERS enforced)
- Not contain `System.debug` calls, hardcoded IDs, or `SeeAllData=true`
- Have test coverage ≥ 85% for changed classes

Squash or merge commits only — rebase-merges rewrite SHAs and break the
quick-deploy lookup (the fallback delta deploy covers it, but tests re-run).

---

## 4. PR Validation (CI)

`pr-validate.yml` calls the shared `sf-validate.yml`, which:

1. Generates a delta package between the PR base and head (sfdx-git-delta)
2. Runs a **check-only deploy of the delta with tests against the Dev Hub**
   (auth via `DEVHUB_AUTH_URL`) — the resulting validated deploy request is the
   quick-deploy handle, shipped in the `sf-validate-<run>` artifact
3. Runs Salesforce Code Analyzer on changed files
4. Creates a scratch org from `config/scratch-orgs/ci.json` (`--duration-days 1`),
   pushes source, assigns permission sets, runs all local tests, and **always**
   deletes the org
5. Posts a sticky summary comment on the PR

---

## 5. Deployment (promotion)

Merge to `main` triggers `deploy.yml` → shared `sf-deploy.yml`:

1. Waits at the **`production` GitHub Environment** for required-reviewer
   approval
2. Creates a GitHub Deployment record (audit trail, links the Salesforce
   deploy-request page)
3. **Quick deploys** the PR-validated request (no tests re-run); falls back to
   a delta deploy, then a full deploy of all package directories
4. Uploads the audit artifact: delta manifest, deploy result JSON, JUnit test
   results, quick-deploy decision

Bootstrap/re-baseline: `gh workflow run deploy.yml -f full-deploy=true`.
Production deployments: business hours only (08:00–17:00 CET). No Friday
deployments.

---

## 6. Secret & Variable Management

| Name              | Kind                                         | Used by        | Value source                                                                          |
| ----------------- | -------------------------------------------- | -------------- | ------------------------------------------------------------------------------------- |
| `DEVHUB_AUTH_URL` | Repo secret                                  | both workflows | `sf org display --target-org <alias> --verbose --json \| jq -r '.result.sfdxAuthUrl'` |
| `SF_ORG_ALIAS`    | `production` environment variable (optional) | deploy         | CLI alias, defaults to the environment name                                           |

Never commit auth URLs. For real client projects, move the auth URL to an
**environment secret** behind the gate, one per target org.

---

## 7. Package Installation in CI

TestDataFactory is source-tracked in `force-app/main/default/classes/` and deploys
with the regular source push — no package install step is needed for it.

If the project adds unlocked packages, install them after the source push via a
`scripts/install-packages.sh` invoked from the caller workflow (or raise a
change request to add package-install inputs to the shared workflows).

---

## 8. Code Analyzer (PMD)

The shared `sf-validate.yml` runs Salesforce Code Analyzer on every PR with
changed-files-only gating (severity 1–2 block). The project ruleset for local
runs lives at `config/pmd-ruleset.xml`:

```bash
sf scanner run --target force-app/ --pmdconfig config/pmd-ruleset.xml --format table --severity-threshold 2
```

Key PMD rules enforced:

- `ApexSOQLInjection` — all SOQL through selectors with bind vars
- `ApexCRUDViolation` — WITH SECURITY_ENFORCED on all queries
- `AvoidSoqlInLoops` / `AvoidDmlInLoops` — zero tolerance
- `ApexUnitTestClassShouldHaveAsserts` — every test must assert

---

## 9. Quality Gates Summary

| Gate                        | Trigger            | Must Pass                       |
| --------------------------- | ------------------ | ------------------------------- |
| Lint + Prettier             | Pre-commit (Husky) | Yes                             |
| Delta check-only deploy     | PR to main         | Yes                             |
| Apex tests (scratch org)    | PR to main         | Yes (≥85% coverage)             |
| PMD Code Analyzer           | PR to main         | Severity 1–2 = block            |
| Branch up to date with main | PR merge (ruleset) | Yes                             |
| Manual PR review            | PR to main         | CODEOWNERS approval             |
| Manual approval             | Deploy             | `production` GitHub Environment |
