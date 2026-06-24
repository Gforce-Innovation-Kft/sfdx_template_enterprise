"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");

const {
  replaceTokens,
  initSubmodules,
  installNpmDeps,
  installSfSkills,
  setupGraphify,
  collectProjectInfo,
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
    writeFile(tmp, "graphify-out/graph.json", "");

    const files = _walkFiles(tmp).map((f) => f.replace(tmp, ""));
    expect(files.some((f) => f.includes("valid.md"))).toBe(true);
    expect(files.some((f) => f.includes("node_modules"))).toBe(false);
    expect(files.some((f) => f.includes("libs"))).toBe(false);
    expect(files.some((f) => f.includes("graphify-out"))).toBe(false);
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

// ── installSfSkills ───────────────────────────────────────────────────────────

describe("installSfSkills", () => {
  it("calls npx skills add when npx is available", () => {
    const exec = jest.fn();
    installSfSkills({ hasCommand: () => true, execSync: exec });
    expect(exec).toHaveBeenCalledWith(
      expect.stringContaining("npx skills add"),
      expect.anything()
    );
  });

  it("does not throw when npx is absent", () => {
    expect(() =>
      installSfSkills({ hasCommand: () => false, execSync: jest.fn() })
    ).not.toThrow();
  });
});

// ── setupGraphify ─────────────────────────────────────────────────────────────

describe("setupGraphify", () => {
  it("runs install + hook + update when graphify is already installed and graph exists", () => {
    const tmp = makeTmpDir();
    try {
      writeFile(tmp, "graphify-out/graph.json", "{}");
      const exec = jest.fn();
      setupGraphify({
        hasCommand: (cmd) => cmd === "graphify",
        execSync: exec,
        root: tmp
      });
      const calls = exec.mock.calls.map(([cmd]) => cmd);
      expect(calls.some((c) => c.includes("graphify install"))).toBe(true);
      expect(calls.some((c) => c.includes("graphify hook install"))).toBe(true);
      expect(calls.some((c) => c.includes("graphify update"))).toBe(true);
    } finally {
      rimraf(tmp);
    }
  });

  it("runs graphify build when installed but no graph.json yet", () => {
    const tmp = makeTmpDir();
    try {
      const exec = jest.fn();
      setupGraphify({
        hasCommand: (cmd) => cmd === "graphify",
        execSync: exec,
        root: tmp
      });
      const calls = exec.mock.calls.map(([cmd]) => cmd.trim());
      expect(calls).toContain("graphify .");
    } finally {
      rimraf(tmp);
    }
  });

  it("tries uv install when graphify missing but uv present", () => {
    const tmp = makeTmpDir();
    try {
      const exec = jest.fn();
      setupGraphify({
        hasCommand: (cmd) => cmd === "uv",
        execSync: exec,
        root: tmp
      });
      expect(exec).toHaveBeenCalledWith(
        expect.stringContaining("uv tool install"),
        expect.anything()
      );
    } finally {
      rimraf(tmp);
    }
  });

  it("does not throw when no graphify, uv, or pipx found", () => {
    const tmp = makeTmpDir();
    try {
      expect(() =>
        setupGraphify({
          hasCommand: () => false,
          execSync: jest.fn(),
          root: tmp
        })
      ).not.toThrow();
    } finally {
      rimraf(tmp);
    }
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
});
