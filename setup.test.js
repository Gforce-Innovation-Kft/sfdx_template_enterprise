"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");

const {
  replaceTokens,
  personalizePackageJson,
  toKebabCase,
  initSubmodules,
  installNpmDeps,
  verifySfSkills,
  CUSTOM_SKILLS,
  collectProjectInfo,
  parseCliArgs,
  _walkFiles
} = require("./setup.js");

// ── helpers ───────────────────────────────────────────────────────────────────

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "setup-test-"));
}

function writeFile(dir, relPath, content) {
  const full = path.join(dir, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, "utf8");
  return full;
}

function readFile(dir, relPath) {
  return fs.readFileSync(path.join(dir, relPath), "utf8");
}

function rimraf(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

// ── replaceTokens ─────────────────────────────────────────────────────────────

describe("replaceTokens", () => {
  let tmp;
  beforeEach(() => {
    tmp = makeTmpDir();
  });
  afterEach(() => {
    rimraf(tmp);
  });

  it("replaces all three tokens in .json, .yaml, .md and .cls files", () => {
    writeFile(
      tmp,
      "sfdx-project.json",
      '{"name":"{{PROJECT_NAME}}","org":"{{ORG_ALIAS}}"}'
    );
    writeFile(tmp, "README.md", "# {{PROJECT_NAME}} for {{CLIENT_NAME}}");
    writeFile(tmp, "config/scratch.yaml", "orgName: {{CLIENT_NAME}}");
    writeFile(
      tmp,
      "force-app/main/default/classes/Foo.cls",
      "String org = '{{ORG_ALIAS}}';"
    );

    replaceTokens(
      { projectName: "AcmeSF", clientName: "Acme Corp", orgAlias: "acme-dev" },
      tmp
    );

    expect(readFile(tmp, "sfdx-project.json")).toBe(
      '{"name":"AcmeSF","org":"acme-dev"}'
    );
    expect(readFile(tmp, "README.md")).toBe("# AcmeSF for Acme Corp");
    expect(readFile(tmp, "config/scratch.yaml")).toBe("orgName: Acme Corp");
    expect(readFile(tmp, "force-app/main/default/classes/Foo.cls")).toBe(
      "String org = 'acme-dev';"
    );
  });

  it("does not modify files inside excluded directories", () => {
    writeFile(tmp, "node_modules/pkg/index.js", "// {{PROJECT_NAME}}");
    writeFile(tmp, "libs/fflib/README.md", "{{CLIENT_NAME}}");
    writeFile(tmp, ".git/config", "{{ORG_ALIAS}}");

    replaceTokens({ projectName: "X", clientName: "Y", orgAlias: "Z" }, tmp);

    expect(readFile(tmp, "node_modules/pkg/index.js")).toBe(
      "// {{PROJECT_NAME}}"
    );
    expect(readFile(tmp, "libs/fflib/README.md")).toBe("{{CLIENT_NAME}}");
    expect(readFile(tmp, ".git/config")).toBe("{{ORG_ALIAS}}");
  });

  it("leaves setup.js and setup.sh untouched", () => {
    writeFile(tmp, "scripts/setup.js", 'const token = "{{PROJECT_NAME}}";');
    writeFile(tmp, "scripts/setup.sh", "exec node setup.js {{PROJECT_NAME}}");

    replaceTokens(
      { projectName: "AcmeSF", clientName: "Acme Corp", orgAlias: "acme-dev" },
      tmp
    );

    expect(readFile(tmp, "scripts/setup.js")).toBe(
      'const token = "{{PROJECT_NAME}}";'
    );
    expect(readFile(tmp, "scripts/setup.sh")).toBe(
      "exec node setup.js {{PROJECT_NAME}}"
    );
  });

  it("handles multiple occurrences of the same token in one file", () => {
    writeFile(
      tmp,
      "multi.md",
      "{{PROJECT_NAME}} {{PROJECT_NAME}} {{PROJECT_NAME}}"
    );

    replaceTokens({ projectName: "Zap", clientName: "C", orgAlias: "o" }, tmp);

    expect(readFile(tmp, "multi.md")).toBe("Zap Zap Zap");
  });
});

// ── personalizePackageJson ────────────────────────────────────────────────────

describe("personalizePackageJson", () => {
  let tmp;
  beforeEach(() => {
    tmp = makeTmpDir();
  });
  afterEach(() => {
    rimraf(tmp);
  });

  it("sets kebab-cased name and client description", () => {
    writeFile(
      tmp,
      "package.json",
      JSON.stringify({
        name: "gforce-sf-enterprise-template",
        version: "1.0.0"
      })
    );

    personalizePackageJson(
      { projectName: "Acme SF Project", clientName: "Acme Corp" },
      tmp
    );

    const pkg = JSON.parse(readFile(tmp, "package.json"));
    expect(pkg.name).toBe("acme-sf-project");
    expect(pkg.description).toBe("Acme Corp Salesforce project");
    expect(pkg.version).toBe("1.0.0");
  });
});

describe("toKebabCase", () => {
  it.each([
    ["Acme SF", "acme-sf"],
    ["  acme_sf  ", "acme-sf"],
    ["ACME!! Corp 2", "acme-corp-2"],
    ["already-kebab", "already-kebab"]
  ])("%s -> %s", (input, expected) => {
    expect(toKebabCase(input)).toBe(expected);
  });
});

// ── _walkFiles ────────────────────────────────────────────────────────────────

describe("_walkFiles", () => {
  let tmp;
  beforeEach(() => {
    tmp = makeTmpDir();
  });
  afterEach(() => {
    rimraf(tmp);
  });

  it("only returns files with included extensions", () => {
    writeFile(tmp, "a.json", "");
    writeFile(tmp, "b.cls", "");
    writeFile(tmp, "c.sh", "");
    writeFile(tmp, "d.png", "");

    const files = _walkFiles(tmp).map((f) => path.basename(f));
    expect(files).toContain("a.json");
    expect(files).toContain("b.cls");
    expect(files).not.toContain("c.sh");
    expect(files).not.toContain("d.png");
  });

  it("skips excluded directories", () => {
    writeFile(tmp, "ok/valid.md", "");
    writeFile(tmp, "node_modules/pkg/index.js", "");
    writeFile(tmp, "libs/fflib/src/Foo.cls", "");

    const files = _walkFiles(tmp).map((f) => f.replace(tmp, ""));
    expect(files.some((f) => f.includes("valid.md"))).toBe(true);
    expect(files.some((f) => f.includes("node_modules"))).toBe(false);
    expect(files.some((f) => f.includes("libs"))).toBe(false);
  });
});

// ── initSubmodules ────────────────────────────────────────────────────────────

describe("initSubmodules", () => {
  it("calls git submodule update when .gitmodules exists", () => {
    const tmp = makeTmpDir();
    try {
      writeFile(
        tmp,
        ".gitmodules",
        '[submodule "libs/fflib"]\n  path = libs/fflib\n  url = https://github.com/example/fflib'
      );
      let called = "";
      initSubmodules({
        root: tmp,
        execSync: (cmd) => {
          called = cmd;
        }
      });
      expect(called).toContain("git submodule update");
    } finally {
      rimraf(tmp);
    }
  });

  it("skips gracefully when .gitmodules is absent", () => {
    const tmp = makeTmpDir();
    try {
      const exec = jest.fn();
      initSubmodules({ root: tmp, execSync: exec });
      expect(exec).not.toHaveBeenCalled();
    } finally {
      rimraf(tmp);
    }
  });
});

// ── installNpmDeps ────────────────────────────────────────────────────────────

describe("installNpmDeps", () => {
  it("calls npm install when npm is available", () => {
    const exec = jest.fn();
    installNpmDeps({ hasCommand: () => true, execSync: exec });
    expect(exec).toHaveBeenCalledWith(
      expect.stringContaining("npm install"),
      expect.anything()
    );
  });

  it("does not throw when npm is absent", () => {
    expect(() =>
      installNpmDeps({ hasCommand: () => false, execSync: jest.fn() })
    ).not.toThrow();
  });
});

// ── verifySfSkills ────────────────────────────────────────────────────────────

describe("verifySfSkills", () => {
  let tmp;

  function seedSkills(names) {
    for (const n of names) {
      writeFile(tmp, path.join(".claude", "skills", n, "SKILL.md"), `# ${n}`);
    }
  }

  function seedLock(names) {
    const skills = {};
    for (const n of names) {
      skills[n] = { source: "forcedotcom/sf-skills", sourceType: "github" };
    }
    writeFile(tmp, "skills-lock.json", JSON.stringify({ version: 1, skills }));
  }

  beforeEach(() => {
    tmp = makeTmpDir();
  });
  afterEach(() => {
    rimraf(tmp);
  });

  it("passes when all locked and custom skills are present", () => {
    seedLock(["platform-apex-generate", "experience-lwc-generate"]);
    seedSkills([
      "platform-apex-generate",
      "experience-lwc-generate",
      ...CUSTOM_SKILLS
    ]);
    expect(() => verifySfSkills({ root: tmp })).not.toThrow();
  });

  it("throws and names the missing skill when a locked skill is absent", () => {
    seedLock(["platform-apex-generate", "platform-metadata-deploy"]);
    seedSkills(["platform-apex-generate", ...CUSTOM_SKILLS]);
    expect(() => verifySfSkills({ root: tmp })).toThrow(
      /platform-metadata-deploy/
    );
  });

  it("throws when a GForce custom skill is missing", () => {
    seedLock(["platform-apex-generate"]);
    seedSkills(["platform-apex-generate", "new-requirement"]);
    expect(() => verifySfSkills({ root: tmp })).toThrow(/salesforce-developer/);
  });

  it("throws when skills-lock.json is missing", () => {
    seedSkills(CUSTOM_SKILLS);
    expect(() => verifySfSkills({ root: tmp })).toThrow(/skills-lock\.json/);
  });
});

// ── collectProjectInfo ────────────────────────────────────────────────────────

describe("collectProjectInfo", () => {
  function fakeInterface(answers) {
    let idx = 0;
    return () => ({
      question: (_, cb) => cb(answers[idx++]),
      close: () => {}
    });
  }

  it("returns trimmed project info from user input", async () => {
    const result = await collectProjectInfo({
      createInterface: fakeInterface([
        "  AcmeSF ",
        "  Acme Corp ",
        "  acme-dev "
      ])
    });
    expect(result).toEqual({
      projectName: "AcmeSF",
      clientName: "Acme Corp",
      orgAlias: "acme-dev"
    });
  });

  it("throws when any field is blank", async () => {
    await expect(
      collectProjectInfo({
        createInterface: fakeInterface(["AcmeSF", "", "acme-dev"])
      })
    ).rejects.toThrow(/required/);
  });

  it("throws when all fields are blank", async () => {
    await expect(
      collectProjectInfo({ createInterface: fakeInterface(["", "", ""]) })
    ).rejects.toThrow(/required/);
  });

  it("uses CLI args without prompting when all three are provided", async () => {
    const createInterface = jest.fn();
    const result = await collectProjectInfo({
      cliArgs: {
        projectName: "acme-sf",
        clientName: "Acme Corp",
        orgAlias: "acme-dev"
      },
      createInterface
    });
    expect(result).toEqual({
      projectName: "acme-sf",
      clientName: "Acme Corp",
      orgAlias: "acme-dev"
    });
    expect(createInterface).not.toHaveBeenCalled();
  });

  it("throws when CLI args are incomplete", async () => {
    await expect(
      collectProjectInfo({ cliArgs: { projectName: "acme-sf" } })
    ).rejects.toThrow(/Non-interactive/);
  });
});

// ── parseCliArgs ──────────────────────────────────────────────────────────────

describe("parseCliArgs", () => {
  it("parses the three setup flags", () => {
    expect(
      parseCliArgs([
        "--project-name",
        "acme-sf",
        "--client-name",
        "Acme Corp",
        "--org-alias",
        "acme-dev"
      ])
    ).toEqual({
      projectName: "acme-sf",
      clientName: "Acme Corp",
      orgAlias: "acme-dev"
    });
  });

  it("returns empty object for no args", () => {
    expect(parseCliArgs([])).toEqual({});
  });
});
