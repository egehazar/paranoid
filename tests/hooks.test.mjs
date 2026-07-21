import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..");
const stopHook = path.join(repo, "scripts", "paranoid-stop.mjs");
const guardHook = path.join(repo, "scripts", "paranoid-guard.mjs");

function tempProject() {
  return mkdtempSync(path.join(tmpdir(), "paranoid-test-"));
}

function runHook(script, input, env = {}) {
  return spawnSync(process.execPath, [script], {
    input: JSON.stringify(input),
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
}

function writeJson(file, value) {
  writeFileSync(file, JSON.stringify(value, null, 2));
}

test("stays silent when no config exists", () => {
  const root = tempProject();
  try {
    const run = runHook(stopHook, { cwd: root, stop_hook_active: false });
    assert.equal(run.status, 0);
    assert.equal(run.stdout, "");
    assert.equal(run.stderr, "");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("blocks a failing check on the first stop", () => {
  const root = tempProject();
  try {
    writeJson(path.join(root, ".paranoid.json"), {
      check: `${JSON.stringify(process.execPath)} -e "process.exit(7)"`,
    });
    const run = runHook(stopHook, { cwd: root, stop_hook_active: false });
    assert.equal(run.status, 2);
    assert.match(run.stderr, /Real app check\s+✗ failed/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("re-runs and blocks a still-failing check on a continuation stop", () => {
  const root = tempProject();
  try {
    writeJson(path.join(root, ".paranoid.json"), {
      check: `${JSON.stringify(process.execPath)} -e "process.exit(7)"`,
    });
    const run = runHook(stopHook, { cwd: root, stop_hook_active: true });
    assert.equal(run.status, 2);
    assert.match(run.stderr, /still fails after the previous block/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("allows completion when the check passes", () => {
  const root = tempProject();
  try {
    writeJson(path.join(root, ".paranoid.json"), {
      check: `${JSON.stringify(process.execPath)} -e "process.exit(0)"`,
    });
    const run = runHook(stopHook, { cwd: root, stop_hook_active: true });
    assert.equal(run.status, 0);
    assert.match(run.stdout, /Real app check\s+✓ passed/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("uses CLAUDE_PROJECT_DIR even when cwd is a subdirectory", () => {
  const root = tempProject();
  try {
    const sub = path.join(root, "src");
    mkdirSync(sub);
    writeJson(path.join(root, ".paranoid.json"), {
      check: `${JSON.stringify(process.execPath)} -e "process.exit(9)"`,
    });
    const run = runHook(
      stopHook,
      { cwd: sub, stop_hook_active: false },
      { CLAUDE_PROJECT_DIR: root },
    );
    assert.equal(run.status, 2);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("rejects direct and npm-script test runners", () => {
  const root = tempProject();
  try {
    writeJson(path.join(root, "package.json"), { scripts: { reality: "vitest run" } });
    writeJson(path.join(root, ".paranoid.json"), { check: "npm run reality" });
    const run = runHook(stopHook, { cwd: root, stop_hook_active: false });
    assert.equal(run.status, 2);
    assert.match(run.stderr, /looks like a unit-test runner/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("invalid timeout values block rather than failing open", () => {
  const root = tempProject();
  try {
    writeJson(path.join(root, ".paranoid.json"), {
      check: `${JSON.stringify(process.execPath)} -e "process.exit(7)"`,
      timeoutSeconds: "Infinity",
    });
    const run = runHook(stopHook, { cwd: root, stop_hook_active: false });
    assert.equal(run.status, 2);
    assert.match(run.stderr, /invalid timeoutSeconds/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("guard denies protected Edit/Write targets and allows other files", () => {
  const root = tempProject();
  try {
    mkdirSync(path.join(root, "scripts"));
    writeJson(path.join(root, ".paranoid.json"), {
      check: "node scripts/check.mjs",
      protected: ["scripts/check.mjs"],
    });

    const denied = runHook(guardHook, {
      cwd: root,
      tool_input: { file_path: path.join(root, "scripts", "check.mjs") },
    });
    assert.equal(denied.status, 0);
    const output = JSON.parse(denied.stdout);
    assert.equal(output.hookSpecificOutput.permissionDecision, "deny");

    const allowed = runHook(guardHook, {
      cwd: root,
      tool_input: { file_path: path.join(root, "src", "app.mjs") },
    });
    assert.equal(allowed.status, 0);
    assert.equal(allowed.stdout, "");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("finds config from a subdirectory without CLAUDE_PROJECT_DIR", () => {
  const root = tempProject();
  try {
    const sub = path.join(root, "src", "deep");
    mkdirSync(sub, { recursive: true });
    writeJson(path.join(root, ".paranoid.json"), {
      check: `${JSON.stringify(process.execPath)} -e "process.exit(7)"`,
    });
    const run = runHook(stopHook, { cwd: sub, stop_hook_active: false }, { CLAUDE_PROJECT_DIR: "" });
    assert.equal(run.status, 2);
    assert.match(run.stderr, /Real app check\s+✗ failed/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("never crosses a .git boundary into a parent project's config", () => {
  const parent = tempProject();
  try {
    writeJson(path.join(parent, ".paranoid.json"), {
      check: `${JSON.stringify(process.execPath)} -e "process.exit(7)"`,
    });
    const child = path.join(parent, "child-repo");
    mkdirSync(path.join(child, ".git"), { recursive: true });
    const run = runHook(stopHook, { cwd: child, stop_hook_active: false }, { CLAUDE_PROJECT_DIR: "" });
    assert.equal(run.status, 0);
    assert.equal(run.stderr, "");
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});


test("finds config more than ten directories above cwd", () => {
  const root = tempProject();
  try {
    let deep = root;
    for (let i = 0; i < 15; i++) {
      deep = path.join(deep, `level-${i}`);
      mkdirSync(deep);
    }
    writeJson(path.join(root, ".paranoid.json"), {
      check: `${JSON.stringify(process.execPath)} -e "process.exit(7)"`,
    });
    const run = runHook(stopHook, { cwd: deep, stop_hook_active: false }, { CLAUDE_PROJECT_DIR: "" });
    assert.equal(run.status, 2);
    assert.match(run.stderr, /Real app check\s+✗ failed/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("marketplace root plugin source uses the required ./ prefix", () => {
  const marketplace = JSON.parse(
    readFileSync(path.join(repo, ".claude-plugin", "marketplace.json"), "utf8"),
  );
  assert.equal(marketplace.plugins[0].source, "./");
});

test("rejects a project timeout that can outlive the host hook", () => {
  const root = tempProject();
  try {
    writeJson(path.join(root, ".paranoid.json"), {
      check: `${JSON.stringify(process.execPath)} -e "process.exit(0)"`,
      timeoutSeconds: 241,
    });
    const run = runHook(stopHook, { cwd: root, stop_hook_active: false });
    assert.equal(run.status, 2);
    assert.match(run.stderr, /at most 240/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("Stop hook blocks uncommitted changes to a protected path with spaces", () => {
  const root = tempProject();
  try {
    mkdirSync(path.join(root, "scripts"));
    const checkPath = path.join(root, "scripts", "check live.mjs");
    writeFileSync(checkPath, "process.exit(0);\n");
    writeJson(path.join(root, ".paranoid.json"), {
      check: `node "scripts/check live.mjs"`,
      protected: ["scripts/check live.mjs"],
    });
    for (const args of [
      ["init"],
      ["config", "user.email", "paranoid@example.com"],
      ["config", "user.name", "Paranoid Tests"],
      ["add", "."],
      ["commit", "-m", "baseline"],
    ]) {
      const git = spawnSync("git", args, { cwd: root, encoding: "utf8" });
      assert.equal(git.status, 0, git.stderr);
    }
    writeFileSync(checkPath, "process.exit(7);\n");
    const run = runHook(stopHook, { cwd: root, stop_hook_active: false });
    assert.equal(run.status, 2);
    assert.match(run.stderr, /reality check has uncommitted changes/);
    assert.match(run.stderr, /scripts\/check live\.mjs/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
