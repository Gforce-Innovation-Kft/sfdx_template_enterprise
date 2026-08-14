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

function parseCliArgs(argv = process.argv.slice(2)) {
  const flags = {
    "--project-name": "projectName",
    "--client-name": "clientName",
    "--org-alias": "orgAlias"
  };
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const key = flags[argv[i]];
    if (key && argv[i + 1] !== undefined) {
      out[key] = argv[i + 1].trim();
      i++;
    }
  }
  return out;
}

async function collectProjectInfo(deps = {}) {
  // Non-interactive mode (CI / scripted setup):
  //   node setup.js --project-name acme-sf --client-name "Acme Corp" --org-alias acme-dev
  const cli = deps.cliArgs || parseCliArgs();
  if (cli.projectName || cli.clientName || cli.orgAlias) {
    if (!cli.projectName || !cli.clientName || !cli.orgAlias) {
      throw new Error(
        "Non-interactive mode requires all of --project-name, --client-name, --org-alias."
      );
    }
    return cli;
  }

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

// ── Step 1/5: Token replacement ───────────────────────────────────────────────

const EXCLUDED_DIRS = new Set([".git", "node_modules", "libs", ".agents"]);
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
const EXCLUDED_FILES = new Set([
  "setup.js",
  "setup.sh",
  "setup.test.js",
  "setup.contract.test.js"
]);

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

// ── Step 1b: package.json personalisation ────────────────────────────────────
//
// Done as a JSON-safe update rather than via tokens: a literal {{PROJECT_NAME}}
// in package.json "name" would be an invalid npm name and break `npm ci` on the
// pristine template.

const TEMPLATE_PACKAGE_NAME = "gforce-sf-enterprise-template";

function toKebabCase(s) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function personalizePackageJson({ projectName, clientName }, root = REPO_ROOT) {
  const pkgPath = path.join(root, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  pkg.name = toKebabCase(projectName);
  pkg.description = `${clientName} Salesforce project`;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  log.success(`package.json personalised (name: ${pkg.name})`);
}

// ── Step 2/5: Git submodules ──────────────────────────────────────────────────

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

// ── Step 3/5: npm install ─────────────────────────────────────────────────────

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

// ── Step 4/5: sf-skills ───────────────────────────────────────────────────────
//
// Skills are vendored in the template (.agents/skills/ + .claude/skills/ symlinks)
// so every clone gets the exact reviewed versions — nothing is downloaded here.
// This step only VERIFIES the vendored set matches skills-lock.json and that the
// GForce custom skills are present. A mismatch fails setup loudly.

const CUSTOM_SKILLS = [
  "new-requirement",
  "salesforce-developer",
  "using-nebula-logger"
];

function verifySfSkills(deps = {}) {
  const rootDir = deps.root || REPO_ROOT;
  const lockPath = path.join(rootDir, "skills-lock.json");

  if (!fs.existsSync(lockPath)) {
    throw new Error("skills-lock.json not found — template is corrupt.");
  }

  const lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
  const expected = Object.keys(lock.skills || {});
  const missing = [];

  for (const name of [...expected, ...CUSTOM_SKILLS]) {
    const skillMd = path.join(rootDir, ".claude", "skills", name, "SKILL.md");
    if (!fs.existsSync(skillMd)) missing.push(name);
  }

  if (missing.length > 0) {
    throw new Error(
      `Vendored skills missing or broken (${missing.length}): ${missing.join(", ")}\n` +
        "  The template repo is incomplete — re-clone it, or restore skills with:\n" +
        "  npx skills add forcedotcom/sf-skills"
    );
  }

  log.success(
    `sf-skills verified — ${expected.length} vendored + ${CUSTOM_SKILLS.length} GForce custom skills present`
  );
}

// ── Step 5/5: TestDataFactory ─────────────────────────────────────────────────

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

  log.header("1/5  Personalising template files");
  replaceTokens(names);
  personalizePackageJson(names);

  log.header("2/5  Initialising git submodules");
  initSubmodules();

  log.header("3/5  Installing npm dependencies");
  installNpmDeps();

  log.header("4/5  Verifying vendored Salesforce sf-skills");
  verifySfSkills();

  log.header("5/5  TestDataFactory");
  confirmTestDataFactory();

  log.header("═══ Setup complete! ═══");
  console.log(`
  ${BOLD}Next steps:${RESET}

  1. Fill in docs/product/PRODUCT.md with project context
  2. Create your first requirement: use the new-requirement skill in Claude Code
  3. Authenticate orgs: sf org login web --alias <alias>
  4. Add GitHub secrets: DEVHUB_AUTH_URL, STAGING_AUTH_URL, PRODUCTION_AUTH_URL
  5. Add GitHub environment protection for 'production' (manual approval)

  ${BOLD}sf-skills quick reference:${RESET}
  'Use the platform-apex-generate skill to create an AccountService for [requirement]'
  'Use the experience-lwc-generate skill to build [component name]'
  'Use the platform-apex-test-run skill to run and analyse test results'

  ${GREEN}${BOLD}Happy building!${RESET}
`);
}

module.exports = {
  collectProjectInfo,
  parseCliArgs,
  replaceTokens,
  personalizePackageJson,
  toKebabCase,
  TEMPLATE_PACKAGE_NAME,
  initSubmodules,
  installNpmDeps,
  verifySfSkills,
  CUSTOM_SKILLS,
  confirmTestDataFactory,
  _walkFiles
};

if (require.main === module) {
  main().catch((err) => {
    log.error(err.message);
    process.exit(1);
  });
}
