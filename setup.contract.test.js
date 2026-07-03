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
 *   3. Every .claude/references/*.md file promised by CLAUDE.md exists.
 *   4. Core repo shape (sfdx-project.json, submodules, scripts, docs).
 *   5. Token state is consistent: either pristine template (tokens present)
 *      or fully personalised (no tokens anywhere) — never half-replaced.
 */

const fs = require("fs");
const path = require("path");

const { CUSTOM_SKILLS, _walkFiles } = require("./setup.js");

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

// ── 3. Reference files promised by CLAUDE.md exist ────────────────────────────

describe("CLAUDE.md reference files", () => {
  // Referenced either as full paths (`.claude/references/x.md`) or as bare
  // backticked filenames in the reference-file table.
  const text = read("CLAUDE.md");
  const refs = [
    ...text.matchAll(/\.claude\/references\/([a-z0-9-]+\.md)/g),
    ...text.matchAll(/`([a-z0-9-]+\.md)`/g)
  ].map((m) => m[1]);

  it("CLAUDE.md references at least the seven core files", () => {
    expect(new Set(refs).size).toBeGreaterThanOrEqual(7);
  });

  it.each([...new Set(refs)])(".claude/references/%s exists", (file) => {
    expect(exists(path.join(".claude", "references", file))).toBe(true);
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
    "force-app"
  ])("%s exists", (p) => {
    expect(exists(p)).toBe(true);
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
      } else {
        const dirty = _walkFiles(ROOT).filter((f) => {
          const text = fs.readFileSync(f, "utf8");
          return TOKENS.some((t) => text.includes(t));
        });
        expect(dirty).toEqual([]);
      }
    }
  );
});
