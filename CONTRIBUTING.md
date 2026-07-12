# Contributing

This applies both to the template itself and to projects bootstrapped from it.
Full details live in `.claude/references/deployment-devops.md`.

## Branch model (trunk-based)

```
main          ← protected by ruleset; every merge deploys via the production gate
  └── feature/REQ-001-short-description   ← short-lived, per-ticket
  └── hotfix/critical-bug-fix             ← same flow, expedited review
```

Branch names: `feature/REQ-NNN-…`, `bugfix/REQ-NNN-…`, `hotfix/…`, `chore/…` —
always reference the REQ number when one exists. No long-lived `develop`
branch; additional environments are extra gated jobs in `deploy.yml`, not
extra branches (see [docs/CICD.md](docs/CICD.md)).

## Pull requests

Every PR must:

- Pass CI (`pr-validate.yml` → shared `sf-validate.yml@v1`: delta check-only
  deploy with tests + scratch-org validation + Code Analyzer)
- Be up to date with `main` before merge (ruleset-enforced — keeps the
  validated deploy request identical to what merges, enabling quick deploy)
- Complete the `PULL_REQUEST_TEMPLATE.md` checklist
- Link the relevant `docs/product/requirements/REQ-NNN.yaml` or ticket
- Have ≥ 1 review approval
- Contain no `System.debug`, hardcoded IDs, or `SeeAllData=true`
- Keep test coverage ≥ 85% for changed classes

Squash-merge or merge commit — never rebase-merge (rewritten SHAs break the
quick-deploy lookup).

## Quality gates

| Gate                        | Trigger            | Must pass                  |
| --------------------------- | ------------------ | -------------------------- |
| Lint + Prettier             | Pre-commit (Husky) | Yes                        |
| Delta check-only deploy     | PR to main         | Yes                        |
| Apex tests (scratch org)    | PR to main         | Yes (≥ 85% coverage)       |
| Code Analyzer (PMD)         | PR to main         | Severity 1–2 = block       |
| Template contract tests     | PR to main         | Yes (`npm run test:setup`) |
| Branch up to date with main | PR merge (ruleset) | Yes                        |
| Manual review               | PR to main         | ≥ 1 approval (CODEOWNERS)  |
| Manual approval             | Deploy             | GitHub `production` env    |

## Hard rules for code

See `CLAUDE.md` — the same constraints bind humans and AI: no SOQL/DML in
loops, all SOQL through Selectors with `WITH SECURITY_ENFORCED`, all DML
through Unit of Work, `with sharing` by default, one-line triggers,
NebulaLogger only, TestDataFactory-based tests.

## Template maintenance

- Vendored sf-skills are pinned by `skills-lock.json`; update them only via a
  dedicated PR running `npx skills update`, and keep doc references in sync
  (the contract tests enforce this).
- Any change to setup or repo shape must keep `npm run test:setup` green in
  both pristine (template) and personalised (post-setup) states.
