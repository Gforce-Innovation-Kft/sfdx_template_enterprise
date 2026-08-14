# GForce SF Enterprise Template

> **This is a template repository.** Click **Use this template** on GitHub (or clone it),
> run one setup command, and you have a production-grade Salesforce DX project with
> enterprise patterns, CI/CD, and AI pair-programming pre-wired.

Reusable Salesforce DX scaffold for GForce Innovation client engagements.

## What you get

- **fflib enterprise patterns** — Application factory, Domain / Selector / Service / Unit of Work layers (fflib-apex-common + fflib-apex-mocks as git submodules)
- **NebulaLogger** — structured logging everywhere, `System.debug` banned by convention and PMD
- **AI pair-programming, ready on clone** — `CLAUDE.md` conventions, 89 vendored [sf-skills](https://github.com/forcedotcom/sf-skills) pinned by `skills-lock.json`, GForce custom skills, and the house `salesforce-developer` standard consumed from [gforce-ai](https://github.com/Gforce-Innovation-Kft/gforce-ai) (override it per project in `.claude/references/local-standards.md`)
- **CI/CD** — PR checks (`jest` + scratch-org deploy/test) plus a delta check-only validate against the Dev Hub, gated `devhub` deploy with quick-deploy promotion (delta → full fallback) and a full audit trail (GitHub Deployments + artifacts), plus a template self-verification workflow — all via [shared reusable workflows](https://github.com/Gforce-Innovation-Kft/shared-github-actions)
- **Worked reference feature** — FX Invoice Conversion (`Invoice__c`, trigger → handler → domain → selector → service → UoW → gateway, LWC, tests). It demonstrates every layer end-to-end; strip or replace it once your real requirements land. See `docs/product/PRODUCT.md`.
- **Test scaffolding** — TestDataFactory (source-tracked, no package install), Jest for LWC, contract tests that keep the template itself honest

```
Trigger → TriggerHandler → Domain → Selector → Service → UnitOfWork → Gateway → Logger
```

## Prerequisites

- **Salesforce CLI** — [install guide](https://developer.salesforce.com/tools/salesforcecli)
- **Node.js 20+** and npm
- **git** (submodules are used for fflib and NebulaLogger)
- **A Dev Hub** for scratch orgs — enable under Setup → Dev Hub in your production/developer org

## Getting started

```bash
# 1. Create your repo from this template (GitHub "Use this template" button), then:
git clone --recurse-submodules <your-new-repo-url> my-project
cd my-project

# 2. Personalise + install everything (interactive):
node setup.js

#    …or non-interactive (CI / scripted):
node setup.js --project-name acme-sf --client-name "Acme Corp" --org-alias acme-dev

# 3. Authenticate and create a scratch org:
sf org login web --alias devhub --set-default-dev-hub
./scripts/create-scratch-org.sh

# 4. Deploy and test:
sf project deploy start
sf apex run test --test-level RunLocalTests
```

`setup.js` replaces the `{{PROJECT_NAME}}` / `{{CLIENT_NAME}}` / `{{ORG_ALIAS}}` tokens across the project, initialises submodules, installs npm dependencies, and verifies the vendored sf-skills against `skills-lock.json`. It is idempotent and fails loudly if the template is incomplete.

## Everyday commands

| Command                | What it does                            |
| ---------------------- | --------------------------------------- |
| `npm run test:unit`    | LWC Jest tests                          |
| `npm run test:setup`   | Template setup + contract tests         |
| `npm run lint`         | ESLint (aura/lwc)                       |
| `npm run prettier`     | Format all sources (Apex, LWC, XML, MD) |
| `scripts/run-tests.sh` | Apex tests against the default org      |
| `scripts/deploy.sh`    | Deploy source to the default org        |

## CI/CD and required secrets

The pipeline is two thin callers (`pr-validate.yml`, `release.yml`) over the reusable workflows in [shared-github-actions](https://github.com/Gforce-Innovation-Kft/shared-github-actions): PR = `jest` + scratch-org deploy/test (`pr-validate.yml`) and a delta check-only validate against the Dev Hub (`release.yml`); merge = required-reviewer gate on the `devhub` GitHub Environment, then a **quick deploy** of the PR-validated request (falls back to delta → full deploy). Every deploy leaves a GitHub Deployment record and an audit artifact. `Template Verify` needs **no secrets**; org access needs exactly one:

| Secret            | Used by                          | How to generate                                                                      |
| ----------------- | -------------------------------- | ------------------------------------------------------------------------------------ |
| `DEVHUB_AUTH_URL` | `pr-validate.yml`, `release.yml` | `sf org display --target-org devhub --verbose --json \| jq -r '.result.sfdxAuthUrl'` |

Also add GitHub **environment protection** named `devhub` (required reviewer) and the branch ruleset on `main`. Full setup, quick-deploy mechanics, and the audit-trail story are in [docs/CICD.md](docs/CICD.md); branch model and quality gates in [CONTRIBUTING.md](CONTRIBUTING.md).

## Working with AI (Claude Code)

Open the repo in Claude Code and it picks up `CLAUDE.md`, the vendored skills, and the reference files automatically. Start with:

- _"Use the new-requirement skill to create a requirement for …"_ — generates `docs/product/requirements/REQ-NNN.yaml`
- _"Use the platform-apex-generate skill to implement REQ-002"_
- _"Use the platform-apex-test-run skill to run and analyse tests"_

## Project structure

- `force-app/main/default/` — application source (contains the FX Invoice reference feature)
- `libs/` — fflib-apex-common, fflib-apex-mocks, NebulaLogger (git submodules)
- `config/scratch-orgs/` — scratch org definitions (dev / ci / full)
- `docs/product/` — product context + `requirements/REQ-*.yaml`
- `.claude/` — AI conventions, references, vendored skills
- `scripts/` — scratch org / deploy / test helpers

## License

Proprietary — © Gforce Innovation Kft. See [LICENSE](LICENSE).
