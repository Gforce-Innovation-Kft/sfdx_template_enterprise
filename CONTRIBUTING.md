# Contributing

This applies both to the template itself and to projects bootstrapped from it.
Full details live in `.claude/references/deployment-devops.md`.

## Branch model

```
main          ← production-ready; protected; PR + approval + CI pass required
  └── develop ← integration branch; auto-deploys to staging
        └── feature/REQ-001-short-description   ← short-lived, per-ticket
        └── hotfix/critical-bug-fix             ← from main, merges to main + develop
```

Branch names: `feature/REQ-NNN-…`, `bugfix/REQ-NNN-…`, `hotfix/…`, `chore/…` —
always reference the REQ number when one exists.

## Pull requests

Every PR must:

- Pass CI (`validate-pr.yml`: scratch org + source push + Apex tests + Code Analyzer)
- Complete the `PULL_REQUEST_TEMPLATE.md` checklist
- Link the relevant `docs/product/requirements/REQ-NNN.yaml` or ticket
- Have ≥ 1 review approval
- Contain no `System.debug`, hardcoded IDs, or `SeeAllData=true`
- Keep test coverage ≥ 85% for changed classes

Squash-merge into `develop`. No merge commits on `main`.

## Quality gates

| Gate                     | Trigger            | Must pass                  |
| ------------------------ | ------------------ | -------------------------- |
| Lint + Prettier          | Pre-commit (Husky) | Yes                        |
| Apex tests (scratch org) | PR to develop/main | Yes (≥ 85% coverage)       |
| Code Analyzer (PMD)      | PR to develop/main | Severity 1–2 = block       |
| Template contract tests  | PR to develop/main | Yes (`npm run test:setup`) |
| Manual review            | PR to develop/main | ≥ 1 approval               |
| Manual approval          | Production deploy  | GitHub `production` env    |

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
