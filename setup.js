"use strict";

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const os = require("os");

const REPO_ROOT = __dirname;

// ── ANSI helpers ──────────────────────────────────────────────────────────────
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const RED = "\x1b[31m";

const log = {
  info: (...a) => console.log(`${BLUE}▶${RESET}`, ...a),
  success: (...a) => console.log(`${GREEN}✔${RESET}`, ...a),
  warn: (...a) => console.log(`${YELLOW}⚠${RESET} `, ...a),
  error: (...a) => console.error(`${RED}✘${RESET}`, ...a),
  header: (...a) => console.log(`\n${BOLD}${a.join(" ")}${RESET}\n`)
};

// ── Internal utilities ────────────────────────────────────────────────────────

function hasCommand(cmd, deps = {}) {
  const exec = deps.execSync || execSync;
  try {
    exec(`command -v ${cmd}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: "inherit", cwd: REPO_ROOT, ...opts });
}

// ── Step 0: Collect project info ──────────────────────────────────────────────

async function collectProjectInfo(deps = {}) {
  const createInterface =
    deps.createInterface ||
    (() =>
      readline.createInterface({
        input: process.stdin,
        output: process.stdout
      }));

  const rl = createInterface();
  const ask = (q) => new Promise((res) => rl.question(q, res));

  try {
    const projectName = (await ask("  Project name (e.g. acme-sf): ")).trim();
    const clientName = (await ask("  Client name  (e.g. Acme Corp): ")).trim();
    const orgAlias = (
      await ask("  Default org alias (e.g. acme-dev): ")
    ).trim();

    if (!projectName || !clientName || !orgAlias) {
      throw new Error("All fields are required.");
    }

    return { projectName, clientName, orgAlias };
  } finally {
    rl.close();
  }
}

// ── Step 1/6: Token replacement ───────────────────────────────────────────────

const EXCLUDED_DIRS = new Set([
  ".git",
  "node_modules",
  "libs",
  "graphify-out",
  ".agents"
]);
const INCLUDED_EXTS = new Set([
  ".json",
  ".yaml",
  ".yml",
  ".md",
  ".cls",
  ".trigger",
  ".html",
  ".js"
]);
const EXCLUDED_FILES = new Set(["setup.js", "setup.sh"]);

function _walkFiles(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRS.has(entry.name))
        _walkFiles(path.join(dir, entry.name), results);
    } else if (entry.isFile()) {
      if (
        !EXCLUDED_FILES.has(entry.name) &&
        INCLUDED_EXTS.has(path.extname(entry.name))
      ) {
        results.push(path.join(dir, entry.name));
      }
    }
  }
  return results;
}

function replaceTokens(
  { projectName, clientName, orgAlias },
  root = REPO_ROOT
) {
  const tokens = {
    "{{PROJECT_NAME}}": projectName,
    "{{CLIENT_NAME}}": clientName,
    "{{ORG_ALIAS}}": orgAlias
  };

  const files = _walkFiles(root);
  let count = 0;

  for (const file of files) {
    const original = fs.readFileSync(file, "utf8");
    let updated = original;
    for (const [token, value] of Object.entries(tokens)) {
      updated = updated.split(token).join(value);
    }
    if (updated !== original) {
      fs.writeFileSync(file, updated, "utf8");
      count++;
    }
  }

  log.success(`Tokens replaced in ${count} file(s)`);
}

// ── Step 2/6: Git submodules ──────────────────────────────────────────────────

function initSubmodules(deps = {}) {
  const exec = deps.execSync || ((cmd, opts) => run(cmd, opts));
  const rootDir = deps.root || REPO_ROOT;

  if (!fs.existsSync(path.join(rootDir, ".gitmodules"))) {
    log.warn("No .gitmodules found — skipping submodules");
    return;
  }

  log.info("Cloning fflib-apex-common, fflib-apex-mocks, NebulaLogger...");
  exec("git submodule update --init --recursive", {
    cwd: rootDir,
    stdio: "inherit"
  });
  log.success("Submodules initialised");
}

// ── Step 3/6: npm install ─────────────────────────────────────────────────────

function installNpmDeps(deps = {}) {
  const _hasCommand = deps.hasCommand || hasCommand;
  const exec = deps.execSync || ((cmd, opts) => run(cmd, opts));

  if (!_hasCommand("npm")) {
    log.warn(
      "npm not found — skipping (install Node.js to enable lint/format/jest)"
    );
    return;
  }

  exec("npm install --silent", { cwd: REPO_ROOT, stdio: "inherit" });
  log.success("npm dependencies installed");
}

// ── Step 4/6: sf-skills ───────────────────────────────────────────────────────

function installSfSkills(deps = {}) {
  const _hasCommand = deps.hasCommand || hasCommand;
  const exec = deps.execSync || ((cmd, opts) => run(cmd, opts));

  if (!_hasCommand("npx")) {
    log.warn(
      "npx not found — install Node.js then run: npx skills add forcedotcom/sf-skills"
    );
    return;
  }

  log.info("Running: npx skills add forcedotcom/sf-skills");
  try {
    exec("npx skills add forcedotcom/sf-skills", {
      cwd: REPO_ROOT,
      stdio: "inherit"
    });
  } catch {
    // non-fatal
  }
  log.success("sf-skills installed");
}

// ── Step 5/6: Graphify ────────────────────────────────────────────────────────

function setupGraphify(deps = {}) {
  const _hasCommand = deps.hasCommand || hasCommand;
  const exec = deps.execSync || ((cmd, opts) => run(cmd, opts));
  const rootDir = deps.root || REPO_ROOT;

  if (!_hasCommand("graphify")) {
    if (_hasCommand("uv")) {
      log.info("Installing graphify via uv...");
      try {
        exec("uv tool install graphifyy", { cwd: rootDir, stdio: "inherit" });
      } catch {
        /* non-fatal */
      }
    } else if (_hasCommand("pipx")) {
      log.info("Installing graphify via pipx...");
      try {
        exec("pipx install graphifyy", { cwd: rootDir, stdio: "inherit" });
      } catch {
        /* non-fatal */
      }
    } else {
      log.warn("Neither uv nor pipx found. Install one of:");
      log.warn("  uv:   curl -LsSf https://astral.sh/uv/install.sh | sh");
      log.warn("  pipx: brew install pipx");
    }
  }

  if (!_hasCommand("graphify")) {
    log.warn("graphify not installed — run manually after setup");
    return;
  }

  log.info("Registering graphify with Claude Code (project-scoped)...");
  try {
    exec("graphify install --project", { cwd: rootDir, stdio: "inherit" });
  } catch {
    /* non-fatal */
  }

  log.info("Installing git hooks (auto-update graph on commit)...");
  try {
    exec("graphify hook install", { cwd: rootDir, stdio: "inherit" });
  } catch {
    /* non-fatal */
  }

  const graphJson = path.join(rootDir, "graphify-out", "graph.json");
  if (fs.existsSync(graphJson)) {
    log.info("Updating existing knowledge graph...");
    try {
      exec("graphify update .", { cwd: rootDir, stdio: "inherit" });
    } catch {
      /* non-fatal */
    }
  } else {
    log.info(
      "Building initial knowledge graph (code-only, no API key needed)..."
    );
    try {
      exec("graphify .", { cwd: rootDir, stdio: "inherit" });
    } catch {
      log.warn(
        "graphify build skipped — run '/graphify .' in Claude Code to build"
      );
    }
  }

  log.success(
    "graphify ready — use 'graphify query \"<question>\"' or '/graphify .' in Claude Code"
  );
}

// ── Step 6/6: TestDataFactory ─────────────────────────────────────────────────

function confirmTestDataFactory() {
  log.info(
    "TestDataFactory (benahm) is source-tracked in force-app/main/default/classes/"
  );
  log.info(
    "It deploys automatically with 'sf project deploy start' — no package install required."
  );
  log.success("TestDataFactory ready");
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  log.header("═══ GForce SF Enterprise Template — Project Setup ═══");

  const names = await collectProjectInfo();

  log.header("1/6  Personalising template files");
  replaceTokens(names);

  log.header("2/6  Initialising git submodules");
  initSubmodules();

  log.header("3/6  Installing npm dependencies");
  installNpmDeps();

  log.header("4/6  Installing Salesforce sf-skills");
  installSfSkills();

  log.header("5/6  Setting up graphify");
  setupGraphify();

  log.header("6/6  TestDataFactory");
  confirmTestDataFactory();

  log.header("═══ Setup complete! ═══");
  console.log(`
  ${BOLD}Next steps:${RESET}

  1. Fill in docs/product/PRODUCT.md with project context
  2. Create your first requirement: use the new-requirement skill in Claude Code
  3. Authenticate orgs: sf org login web --alias <alias>
  4. Add GitHub secrets: DEVHUB_AUTH_URL, STAGING_AUTH_URL, PRODUCTION_AUTH_URL
  5. Add GitHub environment protection for 'production' (manual approval)
  6. Build full knowledge graph in Claude Code: /graphify .

  ${BOLD}sf-skills quick reference:${RESET}
  'Use the generating-apex skill to create an AccountService for [requirement]'
  'Use the generating-lwc-components skill to build [component name]'
  'Use the running-apex-tests skill to run and analyse test results'

  ${GREEN}${BOLD}Happy building!${RESET}
`);
}

module.exports = {
  collectProjectInfo,
  replaceTokens,
  initSubmodules,
  installNpmDeps,
  installSfSkills,
  setupGraphify,
  confirmTestDataFactory,
  _walkFiles
};

if (require.main === module) {
  main().catch((err) => {
    log.error(err.message);
    process.exit(1);
  });
}
