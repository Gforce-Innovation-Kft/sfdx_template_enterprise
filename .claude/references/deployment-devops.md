# GForce Deployment & DevOps

---

## 1. Branching Strategy

```
main          ← production-ready; protected; requires PR + approval + CI pass
  └── develop ← integration branch; auto-deploys to staging
        └── feature/REQ-001-account-enhancements  ← short-lived, per-ticket
        └── feature/REQ-002-lwc-account-form
        └── hotfix/critical-bug-fix               ← branches from main, merges to main + develop
```

- `main` → production (deploy-production.yml, manual approval gate)
- `develop` → staging (deploy-staging.yml, auto on push)
- `feature/*` → scratch org only (validated by validate-pr.yml on PR to develop)
- `hotfix/*` → branches from `main`, merges to both `main` and `develop`

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
- Pass CI (validate-pr.yml): scratch org creation + push + Apex tests + PMD/Code Analyzer
- Have a completed PULL_REQUEST_TEMPLATE.md checklist
- Link to the relevant REQ-NNN.yaml or ticket
- Be reviewed by at least one other developer before merge
- Not contain `System.debug` calls, hardcoded IDs, or `SeeAllData=true`
- Have test coverage ≥ 85% for changed classes

Squash merge into `develop`. No merge commits on `main`.

---

## 4. Scratch Org Validation (CI)

The `validate-pr.yml` workflow:
1. Authenticates to Dev Hub via `DEVHUB_AUTH_URL` secret
2. Creates a scratch org using `config/scratch-orgs/ci.json`
3. Pushes all source
4. Installs TestDataFactory unlocked package (`04t1n000002WsK5AAK`)
5. Runs all Apex tests (`sf apex run test --test-level RunLocalTests --result-format json`)
6. Runs Salesforce Code Analyzer (PMD rules)
7. **Always** deletes the scratch org (even on failure) — prevents org leaks

Scratch org lifespan in CI: 1 day max. Always pass `--duration-days 1`.

---

## 5. Staging Promotion

Push to `develop` triggers `deploy-staging.yml`:
1. Authenticates via `STAGING_AUTH_URL` secret
2. Runs `sf project deploy start --target-org staging` (source format)
3. Runs smoke tests (manual or automated Apex test subset)

Staging = always green. If a deploy breaks staging, roll forward (fix) not roll back.

---

## 6. Production Promotion

Push to `main` triggers `deploy-production.yml`:
1. Requires manual approval (GitHub environment protection: `production`)
2. Authenticates via `PRODUCTION_AUTH_URL` secret
3. Runs `sf project deploy start --target-org production`
4. Posts Slack notification on success/failure

Production deployments: business hours only (08:00–17:00 CET). No Friday deployments.

---

## 7. Secret Management

| Secret | Used in | Value source |
|--------|---------|-------------|
| `DEVHUB_AUTH_URL` | validate-pr.yml | `sf org display --target-org devhub --verbose --json` |
| `STAGING_AUTH_URL` | deploy-staging.yml | `sf org display --target-org staging --verbose --json` |
| `PRODUCTION_AUTH_URL` | deploy-production.yml | `sf org display --target-org production --verbose --json` |

Store in GitHub repo secrets (Settings → Secrets and variables → Actions). Never commit auth URLs.

To generate an auth URL:
```bash
sf org display --target-org <alias> --verbose --json | jq -r '.result.sfdxAuthUrl'
```

---

## 8. Package Installation in CI

```yaml
- name: Install TestDataFactory
  run: sf package install --package 04t1n000002WsK5AAK --target-org $SCRATCH_ORG_ALIAS --no-prompt --wait 10
```

If the project uses additional unlocked packages, add them to a `scripts/install-packages.sh` and call it from all workflow jobs that need them.

---

## 9. Code Analyzer (PMD)

Run the Salesforce Code Analyzer on every PR:
```bash
sf scanner run --target force-app/ --format table --severity-threshold 3
```

Severity 1–2: block the PR. Severity 3: warn but allow merge with justification.

Key PMD rules enforced:
- `ApexSOQLInjection` — all SOQL through selectors with bind vars
- `ApexCRUDViolation` — WITH SECURITY_ENFORCED on all queries
- `AvoidSoqlInLoops` / `AvoidDmlInLoops` — zero tolerance
- `ApexUnitTestClassShouldHaveAsserts` — every test must assert

---

## 10. Quality Gates Summary

| Gate | Trigger | Must Pass |
|------|---------|-----------|
| Lint + Prettier | Pre-commit (Husky) | Yes |
| Apex tests (scratch org) | PR to develop/main | Yes (≥85% coverage) |
| PMD Code Analyzer | PR to develop/main | Severity 1–2 = block |
| Manual PR review | PR to develop/main | ≥1 approval |
| Manual approval | Deploy to production | Required (GitHub env) |
