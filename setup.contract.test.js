"use strict";

/**
 * Template contract tests.
 *
 * These assert the REPO STATE itself — not function behaviour — so that the
 * template (and every repo cloned from it) is verifiably in the shape the
 * setup flow and docs promise:
 *
 *   1. Vendored sf-skills match skills-lock.json (canonical dir + symlink).
 *   2. Every sf-skill name referenced in the docs actually exists.
 *   3. The seven core rule files ship in the salesforce-developer skill, this
 *      repo keeps no shadowing copy, and CLAUDE.md promises nothing missing.
 *   4. Core repo shape (sfdx-project.json, submodules, scripts, docs).
 *   5. Token state is consistent: either pristine template (tokens present)
 *      or fully personalised (no tokens anywhere) — never half-replaced.
 */

const fs = require("fs");
const path = require("path");

const {
  CUSTOM_SKILLS,
  TEMPLATE_PACKAGE_NAME,
  _walkFiles
} = require("./setup.js");

const ROOT = __dirname;
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const exists = (p) => fs.existsSync(path.join(ROOT, p));

// ── 1. Vendored skills match the lockfile ─────────────────────────────────────

describe("vendored sf-skills", () => {
  const lock = JSON.parse(read("skills-lock.json"));
  const locked = Object.keys(lock.skills);

  it("lockfile is non-trivial", () => {
    expect(locked.length).toBeGreaterThan(50);
  });

  it.each(locked)("%s exists in .agents/skills and .claude/skills", (name) => {
    expect(exists(path.join(".agents", "skills", name, "SKILL.md"))).toBe(true);
    expect(exists(path.join(".claude", "skills", name, "SKILL.md"))).toBe(true);
  });

  it.each(CUSTOM_SKILLS)("GForce custom skill %s exists", (name) => {
    expect(exists(path.join(".claude", "skills", name, "SKILL.md"))).toBe(true);
  });

  it("has no untracked strays in .claude/skills", () => {
    const dirs = fs
      .readdirSync(path.join(ROOT, ".claude", "skills"))
      .filter((d) =>
        fs.statSync(path.join(ROOT, ".claude", "skills", d)).isDirectory()
      );
    const expected = new Set([...locked, ...CUSTOM_SKILLS]);
    const strays = dirs.filter((d) => !expected.has(d));
    expect(strays).toEqual([]);
  });
});

// ── 2. Docs only reference skills that exist ──────────────────────────────────

describe("doc ↔ skill lockstep", () => {
  // sf-skills naming taxonomy (post-2026 rename). Any backticked token with one
  // of these prefixes is treated as a skill reference and must exist on disk.
  const SKILL_PREFIXES =
    /^(platform|experience|dx|data360|omnistudio|agentforce|automation|commerce|design-systems|integration|mobile|external)-[a-z0-9-]+$/;

  const DOC_FILES = [
    "CLAUDE.md",
    "README.md",
    ".github/copilot-instructions.md",
    "setup.js"
  ].filter(exists);

  function referencedSkills(file) {
    const text = read(file);
    const names = new Set();
    for (const m of text.matchAll(/`?([a-z0-9]+(?:-[a-z0-9]+)+)`?/g)) {
      const token = m[1];
      if (SKILL_PREFIXES.test(token) || CUSTOM_SKILLS.includes(token)) {
        names.add(token);
      }
    }
    return [...names];
  }

  it.each(DOC_FILES)("every skill referenced in %s exists", (file) => {
    const missing = referencedSkills(file).filter(
      (name) => !exists(path.join(".claude", "skills", name, "SKILL.md"))
    );
    expect(missing).toEqual([]);
  });

  it("docs no longer reference pre-rename skill names", () => {
    const RETIRED = [
      "generating-apex",
      "generating-apex-test",
      "generating-lwc-components",
      "running-apex-tests",
      "running-code-analyzer",
      "deploying-metadata",
      "debugging-apex-logs",
      "querying-soql"
    ];
    for (const file of DOC_FILES) {
      const text = read(file);
      const found = RETIRED.filter((name) => text.includes(`\`${name}\``));
      expect({ file, found }).toEqual({ file, found: [] });
    }
  });
});

// ── 3. Coding rules live in the skill; this repo holds only its override ──────

describe("coding-rule references", () => {
  const CORE_RULES = [
    "apex-coding-rules.md",
    "apex-patterns.md",
    "deployment-devops.md",
    "lwc-coding-rules.md",
    "security-sharing.md",
    "soql-optimization.md",
    "testing-testdatafactory.md"
  ];
  const SKILL_REFS = path.join(
    ".claude",
    "skills",
    "salesforce-developer",
    "references"
  );

  // These used to be duplicated into .claude/references/ as well. The copies
  // drifted — by the time they were removed they taught `if:true`/`if:false`
  // and asserted that WITH USER_MODE does not enforce FLS, both of which the
  // skill had long since corrected. A second copy of a rule is a rule that will
  // go stale, so the contract now asserts the single-source shape.
  it.each(CORE_RULES)("the salesforce-developer skill ships %s", (file) => {
    expect(exists(path.join(SKILL_REFS, file))).toBe(true);
  });

  it("no local rule file shadows a skill reference", () => {
    const dir = path.join(ROOT, ".claude", "references");
    const local = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
    expect(local.filter((f) => CORE_RULES.includes(f))).toEqual([]);
  });

  it("local-standards.md exists — the only sanctioned override point", () => {
    expect(
      exists(path.join(".claude", "references", "local-standards.md"))
    ).toBe(true);
  });

  it("every .claude/references file CLAUDE.md promises actually exists", () => {
    const promised = [
      ...new Set(
        [
          ...read("CLAUDE.md").matchAll(
            /\.claude\/references\/([a-z0-9-]+\.md)/g
          )
        ].map((m) => m[1])
      )
    ];
    expect(promised.length).toBeGreaterThan(0);
    const missing = promised.filter(
      (f) => !exists(path.join(".claude", "references", f))
    );
    expect(missing).toEqual([]);
  });
});

// ── 4. Core repo shape ────────────────────────────────────────────────────────

describe("repo shape", () => {
  it("sfdx-project.json lists force-app and the three library packages", () => {
    const proj = JSON.parse(read("sfdx-project.json"));
    const paths = proj.packageDirectories.map((d) => d.path);
    expect(paths).toEqual(
      expect.arrayContaining([
        "force-app",
        "libs/fflib-apex-common/sfdx-source/apex-common",
        "libs/fflib-apex-mocks/sfdx-source/apex-mocks",
        "libs/NebulaLogger/nebula-logger/core"
      ])
    );
  });

  it("declares the three git submodules", () => {
    const gitmodules = read(".gitmodules");
    for (const lib of [
      "libs/fflib-apex-common",
      "libs/fflib-apex-mocks",
      "libs/NebulaLogger"
    ]) {
      expect(gitmodules).toContain(`path = ${lib}`);
    }
  });

  it.each([
    "docs/product/PRODUCT.md",
    "scripts/create-scratch-org.sh",
    "scripts/deploy.sh",
    "scripts/run-tests.sh",
    "config/scratch-orgs/dev.json",
    ".claude/settings.json",
    "force-app",
    "LICENSE",
    "CONTRIBUTING.md",
    ".github/CODEOWNERS",
    ".editorconfig"
  ])("%s exists", (p) => {
    expect(exists(p)).toBe(true);
  });
});

// ── 4b. README documents the template contract ────────────────────────────────

describe("README contract", () => {
  const readme = read("README.md");

  it("explains this is a template and how to run setup", () => {
    expect(readme.toLowerCase()).toContain("template");
    expect(readme).toContain("setup.js");
    expect(readme).toContain("--project-name");
  });

  it("documents every CI secret the workflows reference", () => {
    const workflowDir = path.join(ROOT, ".github", "workflows");
    const secrets = new Set();
    for (const f of fs.readdirSync(workflowDir)) {
      const text = read(path.join(".github", "workflows", f));
      for (const m of text.matchAll(/secrets\.([A-Z0-9_]+)/g)) {
        secrets.add(m[1]);
      }
    }
    expect(secrets.size).toBeGreaterThan(0);
    const undocumented = [...secrets].filter((s) => !readme.includes(s));
    expect(undocumented).toEqual([]);
  });
});

// ── 4c. No personal or org-specific leaks ─────────────────────────────────────

describe("no leaks", () => {
  it("no personal author name in tracked template files", () => {
    // Only git-tracked files ship with the template — local caches and
    // developer-specific settings are irrelevant here. Names are built
    // dynamically so this test file never matches itself.
    const { execSync } = require("child_process");
    const personal = ["demeter" + "gabor", "gambe" + "94"];
    const tracked = execSync("git ls-files", { cwd: ROOT, encoding: "utf8" })
      .split("\n")
      .filter(Boolean)
      .filter((f) => !f.startsWith(".agents/"))
      .filter((f) => f !== path.posix.join(".github", "CODEOWNERS"));
    const dirty = tracked.filter((f) => {
      const full = path.join(ROOT, f);
      if (!fs.existsSync(full) || fs.statSync(full).isDirectory()) return false;
      const text = fs.readFileSync(full, "utf8").toLowerCase();
      return personal.some((p) => text.includes(p));
    });
    expect(dirty).toEqual([]);
  });

  it("no hardcoded package IDs in workflows", () => {
    const workflowDir = path.join(ROOT, ".github", "workflows");
    for (const f of fs.readdirSync(workflowDir)) {
      const text = read(path.join(".github", "workflows", f));
      expect({ file: f, ids: text.match(/04t[a-zA-Z0-9]{12,15}/g) }).toEqual({
        file: f,
        ids: null
      });
    }
  });
});

// ── 5. Token state is all-or-nothing ──────────────────────────────────────────

describe("template tokens", () => {
  // Built dynamically so these literals could never be clobbered by a
  // misconfigured replaceTokens run over this file.
  const TOKENS = ["PROJECT_NAME", "CLIENT_NAME", "ORG_ALIAS"].map(
    (n) => "{{" + n + "}}"
  );
  const isTemplateMode = read("sfdx-project.json").includes(TOKENS[0]);

  it(
    isTemplateMode
      ? "template mode: token anchors are present where setup expects them"
      : "personalised mode: no tokens remain anywhere",
    () => {
      if (isTemplateMode) {
        expect(read("sfdx-project.json")).toContain(TOKENS[0]);
        expect(read("config/scratch-orgs/dev.json")).toContain(TOKENS[0]);
        expect(read("config/project-scratch-def.json")).toContain(TOKENS[0]);
        expect(JSON.parse(read("package.json")).name).toBe(
          TEMPLATE_PACKAGE_NAME
        );
      } else {
        const dirty = _walkFiles(ROOT).filter((f) => {
          const text = fs.readFileSync(f, "utf8");
          return TOKENS.some((t) => text.includes(t));
        });
        expect(dirty).toEqual([]);
        expect(JSON.parse(read("package.json")).name).not.toBe(
          TEMPLATE_PACKAGE_NAME
        );
      }
    }
  );
});
