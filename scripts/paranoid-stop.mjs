#!/usr/bin/env node
/**
 * paranoid-stop.mjs — Claude Code Stop hook.
 *
 * Runs the project-owned reality check defined in .paranoid.json and
 * blocks the agent from finishing until it passes (subject to Claude
 * Code's own consecutive Stop-hook safety cap).
 *
 * Exit codes (per Claude Code hook semantics):
 *   0 — no objection (check passed, or no .paranoid.json, or disabled)
 *   2 — block: stderr is fed back to the agent, which must keep working
 */

import { spawnSync, execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const MAX_OUTPUT_CHARS = 1200;
const DEFAULT_TIMEOUT_SECONDS = 120;
const MAX_TIMEOUT_SECONDS = 240;

function readStdinJson() {
  try {
    const raw = readFileSync(0, "utf8");
    return raw.trim() ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function findConfigRoot(startDir) {
  let dir = path.resolve(startDir);
  while (true) {
    if (existsSync(path.join(dir, ".paranoid.json"))) return dir;
    // Stop at a repo boundary: never cross into a parent project's config.
    if (existsSync(path.join(dir, ".git"))) return null;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function projectRoot(input) {
  if (process.env.CLAUDE_PROJECT_DIR) return process.env.CLAUDE_PROJECT_DIR;
  const start = input.cwd || process.cwd();
  return findConfigRoot(start) || start;
}

function loadConfig(root) {
  const file = path.join(root, ".paranoid.json");
  if (!existsSync(file)) return null;
  try {
    return { file, ...JSON.parse(readFileSync(file, "utf8")) };
  } catch (err) {
    return { file, __parseError: String(err && err.message) };
  }
}

/** Best-effort: resolve `npm run x` / `pnpm run x` / `yarn x` to the underlying script. */
function resolveCommand(cmd, root) {
  const m = /^\s*(?:npm|pnpm|yarn)\s+(?:run\s+)?([\w:.-]+)/.exec(cmd || "");
  if (!m) return cmd || "";
  try {
    const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
    const script = pkg.scripts && pkg.scripts[m[1]];
    return script ? `${cmd} :: ${script}` : cmd;
  } catch {
    return cmd;
  }
}

const TEST_RUNNER_RE =
  /\b(jest|vitest|mocha|ava|tap|node\s+--test|npm\s+test|pnpm\s+test|yarn\s+test|pytest|go\s+test|cargo\s+test|dotnet\s+test|phpunit|rspec)\b/;

function gitChangedPaths(root) {
  try {
    const out = execFileSync("git", ["status", "--porcelain=v1", "-z"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const entries = out.split("\0");
    const paths = [];
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (!entry) continue;
      const status = entry.slice(0, 2);
      paths.push(entry.slice(3));
      // In -z mode, renames/copies store the second path as the next field.
      if (/[RC]/.test(status) && entries[i + 1]) paths.push(entries[++i]);
    }
    return paths;
  } catch {
    return null;
  }
}

function isProtected(changedPath, protectedPaths) {
  const norm = changedPath.replace(/\\/g, "/");
  return protectedPaths.some((p) => {
    const prot = p.replace(/\\/g, "/").replace(/\/+$/, "");
    return norm === prot || norm.startsWith(prot + "/");
  });
}

function parseProtected(config) {
  const values = [".paranoid.json", ...(Array.isArray(config.protected) ? config.protected : [])];
  return values.filter((p) => typeof p === "string" && p.trim()).map((p) => p.trim());
}

function parseTimeout(config) {
  if (config.timeoutSeconds === undefined) return DEFAULT_TIMEOUT_SECONDS;
  const n = Number(config.timeoutSeconds);
  return Number.isFinite(n) && n > 0 && n <= MAX_TIMEOUT_SECONDS ? n : null;
}

function trimOutput(s) {
  if (!s) return "";
  const clean = s.replace(/\x1b\[[0-9;]*m/g, "").trimEnd();
  return clean.length > MAX_OUTPUT_CHARS
    ? "…" + clean.slice(-MAX_OUTPUT_CHARS)
    : clean;
}

function report(lines) {
  return ["", "PARANOID", "─".repeat(46), ...lines, "─".repeat(46), ""].join("\n");
}

function block(lines) {
  process.stderr.write(report(lines));
  process.exit(2);
}

function pass(lines) {
  process.stdout.write(report(lines));
  process.exit(0);
}

const input = readStdinJson();
if (process.env.PARANOID_DISABLE === "1") process.exit(0);

// Do not exit early when stop_hook_active is true. That flag means this is a
// continuation after an earlier block — exactly when the check must be run
// again to confirm the agent actually fixed the failure. Claude Code itself
// provides a consecutive-block safety cap to prevent unbounded loops.
const continuation = Boolean(input.stop_hook_active);

const root = projectRoot(input);
const config = loadConfig(root);
if (!config) process.exit(0);

if (config.__parseError) {
  block([
    "✗ .paranoid.json is not valid JSON.",
    `  ${config.__parseError}`,
    "",
    "Do not edit it yourself — report this to the user.",
  ]);
}

const check = typeof config.check === "string" ? config.check.trim() : "";
if (!check) {
  block([
    '✗ .paranoid.json has no "check" command.',
    "",
    "Ask the user to define one, e.g.:",
    '  { "check": "node scripts/check-live-app.mjs" }',
  ]);
}

const timeoutSeconds = parseTimeout(config);
if (timeoutSeconds === null) {
  block([
    "✗ .paranoid.json has an invalid timeoutSeconds value.",
    `  Use a number greater than 0 and at most ${MAX_TIMEOUT_SECONDS}.`,
  ]);
}

if (TEST_RUNNER_RE.test(resolveCommand(check, root))) {
  block([
    "✗ The configured check looks like a unit-test runner:",
    `    ${check}`,
    "",
    "Unit tests do not count as a reality check — the agent wrote them.",
    "Ask the user to point .paranoid.json at a real-app check instead",
    "(boot the app, hit the real endpoint, exercise the real CLI).",
  ]);
}

const protectedPaths = parseProtected(config);
if (process.env.PARANOID_ALLOW_CHECK_EDITS !== "1") {
  const changed = gitChangedPaths(root);
  if (changed) {
    const touched = changed.filter((p) => isProtected(p, protectedPaths));
    if (touched.length > 0) {
      block([
        "✗ The reality check has uncommitted changes:",
        ...touched.map((p) => `    ${p}`),
        "",
        "Paranoid only trusts the committed project-owned check.",
        "Revert these files or ask the user to approve and commit",
        "the check change themselves.",
      ]);
    }
  }
}

const timeoutMs = timeoutSeconds * 1000;
const started = Date.now();
let run;
try {
  run = spawnSync(check, {
    cwd: root,
    shell: true,
    encoding: "utf8",
    timeout: timeoutMs,
    env: { ...process.env, PARANOID: "1" },
  });
} catch (err) {
  block([
    "Real app check   ✗ could not start",
    `  ${check}`,
    "",
    String(err && err.message ? err.message : err),
  ]);
}

const elapsed = ((Date.now() - started) / 1000).toFixed(1);
const output = trimOutput([run.stdout, run.stderr].filter(Boolean).join("\n"));

if (run.error && run.error.code === "ETIMEDOUT") {
  block([
    `Real app check   ✗ timed out after ${timeoutSeconds}s`,
    `  ${check}`,
    ...(output ? ["", output] : []),
    "",
    "The check never finished. Investigate why the app hangs,",
    "fix it, then finish — Paranoid will re-run the check.",
  ]);
}

if (run.status !== 0) {
  block([
    `Real app check   ✗ failed (exit ${run.status ?? "?"}, ${elapsed}s)`,
    `  ${check}`,
    "",
    ...(output ? [output, ""] : []),
    continuation ? "The reality check still fails after the previous block." : "Tests may be green. The feature isn't.",
    "Fix the underlying issue — do not touch the check or",
    ".paranoid.json — then finish. Paranoid will re-run it.",
  ]);
}

pass([
  `Real app check   ✓ passed (${elapsed}s)`,
  `  ${check}`,
  "",
  "Tests passed. The feature actually ran.",
]);
