# Changelog

## 0.1.4
- CI test script now names the test file explicitly (`node --test
  tests/hooks.test.mjs`): npm scripts on Windows run under cmd.exe, which does
  not expand globs, and Node 20's test runner does not glob patterns itself —
  the literal `tests/*.test.mjs` would have failed the Windows + Node 20 leg.

## 0.1.3
- Fixed marketplace packaging: the root plugin source is now `"./"`, as required
  by Claude Code's marketplace schema.
- Removed the ten-directory config-discovery ceiling; deeply nested working
  directories now walk to the repository boundary without silently bypassing the
  check.
- Capped project checks at 240 seconds so they cannot outlive the plugin hook's
  300-second host timeout and fail open.
- Git tamper detection now parses NUL-delimited porcelain output, including paths
  with spaces and rename/copy records.
- Added Windows CI and regression coverage for deep discovery, marketplace
  packaging, host-timeout alignment, and Stop-hook tamper detection.

## 0.1.2
- Config discovery now walks up from the working directory to the nearest
  `.paranoid.json` when `CLAUDE_PROJECT_DIR` is absent (manual runs, Codex),
  stopping at `.git` boundaries so a parent project's config is never used.
- Documented the `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP` tuning knob.
- Two new regression tests (10 total).

## 0.1.1
- Stop hook re-runs the check on continuation stops instead of exiting early
  on `stop_hook_active` — a still-broken app now blocks again (bounded by
  Claude Code's consecutive-block cap).
- Project root resolved via `CLAUDE_PROJECT_DIR` (subdirectory bypass fixed).
- Invalid `timeoutSeconds` and check startup errors now fail closed (block).
- Demo check: dynamic port, reliable server cleanup, no leaked processes.
- Local-scope install warning; softened research claim; smoke tests + CI.

## 0.1.0
- Initial build: Stop-hook reality check, PreToolUse guard, portable skill,
  demo app, plugin packaging.
