#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────────────────────
# GForce SF Enterprise Template — setup.sh
# Run once after cloning. Personalises the template and installs all tooling.
# ─────────────────────────────────────────────────────────────────────────────

BOLD=$(tput bold 2>/dev/null || echo '')
RESET=$(tput sgr0 2>/dev/null || echo '')
GREEN=$(tput setaf 2 2>/dev/null || echo '')
YELLOW=$(tput setaf 3 2>/dev/null || echo '')
BLUE=$(tput setaf 4 2>/dev/null || echo '')
RED=$(tput setaf 1 2>/dev/null || echo '')

info()    { echo "${BLUE}▶${RESET} $*"; }
success() { echo "${GREEN}✔${RESET} $*"; }
warn()    { echo "${YELLOW}⚠${RESET}  $*"; }
error()   { echo "${RED}✘${RESET} $*" >&2; }
header()  { echo ""; echo "${BOLD}$*${RESET}"; echo ""; }

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# ─── 1. Collect project info ──────────────────────────────────────────────────
header "═══ GForce SF Enterprise Template — Project Setup ═══"

read -rp "  Project name (e.g. acme-sf): " PROJECT_NAME
read -rp "  Client name  (e.g. Acme Corp): " CLIENT_NAME
read -rp "  Default org alias (e.g. acme-dev): " ORG_ALIAS

if [[ -z "$PROJECT_NAME" || -z "$CLIENT_NAME" || -z "$ORG_ALIAS" ]]; then
  error "All fields are required. Aborting."
  exit 1
fi

# ─── 2. Token replacement ─────────────────────────────────────────────────────
header "1/6  Personalising template files"

replace_token() {
  local token="$1"
  local value="$2"
  # macOS-compatible sed (-i '' for in-place without backup)
  find . \
    \( -name ".git" -o -name "node_modules" -o -name "libs" -o -name "graphify-out" \) -prune \
    -o \( -name "*.json" -o -name "*.yaml" -o -name "*.yml" \
         -o -name "*.md" -o -name "*.sh" -o -name "*.cls" \
         -o -name "*.trigger" -o -name "*.html" -o -name "*.js" \) \
    -print | xargs sed -i '' "s|${token}|${value}|g" 2>/dev/null || true
}

replace_token "{{PROJECT_NAME}}" "$PROJECT_NAME"
replace_token "{{CLIENT_NAME}}"  "$CLIENT_NAME"
replace_token "{{ORG_ALIAS}}"    "$ORG_ALIAS"

success "Tokens replaced"

# ─── 3. Git submodules ────────────────────────────────────────────────────────
header "2/6  Initialising git submodules"
info "Cloning fflib-apex-common, fflib-apex-mocks, NebulaLogger..."

if [[ -f ".gitmodules" ]]; then
  git submodule update --init --recursive
  success "Submodules initialised"
else
  warn "No .gitmodules found — skipping"
fi

# ─── 4. npm install ───────────────────────────────────────────────────────────
header "3/6  Installing npm dependencies"

if command -v npm &>/dev/null; then
  npm install --silent
  success "npm dependencies installed"
else
  warn "npm not found — skipping (install Node.js to enable lint/format/jest)"
fi

# ─── 5. sf-skills ─────────────────────────────────────────────────────────────
header "4/6  Installing Salesforce sf-skills"

if command -v npx &>/dev/null; then
  info "Running: npx skills add forcedotcom/sf-skills"
  npx skills add forcedotcom/sf-skills
  success "sf-skills installed (generating-apex, generating-lwc-components, running-apex-tests, deploying-metadata, ...)"
else
  warn "npx not found — install Node.js then run: npx skills add forcedotcom/sf-skills"
fi

# ─── 6. Graphify ──────────────────────────────────────────────────────────────
header "5/6  Setting up graphify (knowledge graph for token-efficient AI navigation)"

install_graphify() {
  if command -v uv &>/dev/null; then
    info "Installing via uv..."
    uv tool install graphifyy
  elif command -v pipx &>/dev/null; then
    info "Installing via pipx..."
    pipx install graphifyy
  else
    warn "Neither uv nor pipx found. Install one of:"
    warn "  uv:   curl -LsSf https://astral.sh/uv/install.sh | sh"
    warn "  pipx: brew install pipx"
    return 1
  fi
}

if ! command -v graphify &>/dev/null; then
  install_graphify || warn "graphify not installed — run manually after setup"
fi

if command -v graphify &>/dev/null; then
  info "Registering graphify with Claude Code (project-scoped)..."
  graphify install --project 2>/dev/null || true

  info "Installing git hooks (auto-update graph on commit)..."
  graphify hook install 2>/dev/null || true

  if [[ -f "graphify-out/graph.json" ]]; then
    info "Updating existing knowledge graph..."
    graphify update . 2>/dev/null || true
  else
    info "Building initial knowledge graph (code-only, no API key needed)..."
    graphify . 2>/dev/null || warn "graphify build skipped — run '/graphify .' in Claude Code to build"
  fi

  success "graphify ready — use 'graphify query \"<question>\"' or '/graphify .' in Claude Code"
fi

# ─── 7. TestDataFactory package (optional — needs a target org) ──────────────
header "6/6  Salesforce package installation"

INSTALL_TDF="n"
read -rp "  Install TestDataFactory package now? (requires authenticated org) [y/N]: " INSTALL_TDF

if [[ "${INSTALL_TDF,,}" == "y" ]]; then
  if command -v sf &>/dev/null; then
    info "Installing TestDataFactory unlocked package..."
    sf package install \
      --package 04t1n000002WsK5AAK \
      --target-org "$ORG_ALIAS" \
      --no-prompt \
      --wait 10
    success "TestDataFactory installed"
  else
    warn "'sf' CLI not found — install Salesforce CLI then run:"
    warn "  sf package install --package 04t1n000002WsK5AAK --target-org $ORG_ALIAS --no-prompt"
  fi
else
  info "Skipped. Run later:"
  info "  sf package install --package 04t1n000002WsK5AAK --target-org <alias> --no-prompt"
fi

# ─── Optional: create scratch org ─────────────────────────────────────────────
CREATE_SCRATCH="n"
read -rp "  Create a scratch org now? [y/N]: " CREATE_SCRATCH

if [[ "${CREATE_SCRATCH,,}" == "y" ]]; then
  if command -v sf &>/dev/null; then
    bash scripts/create-scratch-org.sh "$ORG_ALIAS"
  else
    warn "'sf' CLI not found — install Salesforce CLI first"
  fi
fi

# ─── Optional: create GitHub repo ─────────────────────────────────────────────
CREATE_REPO="n"
read -rp "  Push to a new GitHub repo? (requires gh CLI) [y/N]: " CREATE_REPO

if [[ "${CREATE_REPO,,}" == "y" ]]; then
  if command -v gh &>/dev/null; then
    read -rp "  GitHub org/user: " GH_ORG
    gh repo create "${GH_ORG}/${PROJECT_NAME}" --private --source=. --push
    success "Repo created and pushed"
  else
    warn "'gh' CLI not found — install GitHub CLI then run: gh repo create"
  fi
fi

# ─── Done ─────────────────────────────────────────────────────────────────────
header "═══ Setup complete! ═══"
echo ""
echo "  ${BOLD}Next steps:${RESET}"
echo ""
echo "  1. Fill in docs/product/PRODUCT.md with project context"
echo "  2. Create your first requirement: use the new-requirement skill in Claude Code"
echo "  3. Authenticate orgs: sf org login web --alias <alias>"
echo "  4. Add GitHub secrets: DEVHUB_AUTH_URL, STAGING_AUTH_URL, PRODUCTION_AUTH_URL"
echo "  5. Add GitHub environment protection for 'production' (manual approval)"
echo "  6. Build full knowledge graph in Claude Code: /graphify ."
echo ""
echo "  ${BOLD}sf-skills quick reference:${RESET}"
echo "  'Use the generating-apex skill to create an AccountService for [requirement]'"
echo "  'Use the generating-lwc-components skill to build [component name]'"
echo "  'Use the running-apex-tests skill to run and analyse test results'"
echo ""
echo "  ${GREEN}${BOLD}Happy building!${RESET}"
echo ""
