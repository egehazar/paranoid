#!/usr/bin/env node
/**
 * paranoid-guard.mjs — Claude Code PreToolUse hook (Edit|Write|MultiEdit|NotebookEdit).
 *
 * Denies ordinary agent edits to .paranoid.json and any paths listed in
 * its "protected" array. The Stop hook separately catches uncommitted
 * changes made through other routes such as Bash.
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

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

const input = readStdinJson();
if (process.env.PARANOID_DISABLE === "1") process.exit(0);
if (process.env.PARANOID_ALLOW_CHECK_EDITS === "1") process.exit(0);

const root = projectRoot(input);
const configFile = path.join(root, ".paranoid.json");
if (!existsSync(configFile)) process.exit(0);

let config = {};
try {
  config = JSON.parse(readFileSync(configFile, "utf8"));
} catch {
  config = {};
}

const configured = Array.isArray(config.protected)
  ? config.protected.filter((p) => typeof p === "string" && p.trim())
  : [];
const protectedPaths = [".paranoid.json", ...configured].map((p) => path.resolve(root, p));

const target =
  (input.tool_input && (input.tool_input.file_path || input.tool_input.notebook_path)) || "";
if (!target) process.exit(0);

const resolved = path.resolve(root, target);
const hit = protectedPaths.some((p) => resolved === p || resolved.startsWith(p + path.sep));
if (!hit) process.exit(0);

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason:
        `Paranoid: ${path.relative(root, resolved) || resolved} is part of the project-owned ` +
        "reality check and must not be modified by the agent during a task. " +
        "If the check itself is wrong, tell the user and let them change it " +
        "(or they can set PARANOID_ALLOW_CHECK_EDITS=1).",
    },
  })
);
process.exit(0);
