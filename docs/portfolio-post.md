# Paranoid — tests passed, but does it actually work?

> **Tests passed. But does the feature actually run? Paranoid checks.**

Two files tell the whole story.

- `evidence/02-demo-tests-green.txt` — the agent's own unit test suite:
  **1 pass, 0 fail, exit 0.** Green.
- `evidence/03-real-app-500.txt` — the *same code*, booted as a real server and
  hit on its real endpoint: **`GET /api/users/123 -> HTTP 500`, exit 1.**

Same commit. Green tests, broken app. **Paranoid is the thing that notices** —
it blocks an AI coding agent from reporting "done" until a developer-owned check
runs against the actual application and passes.

[SHOT-a] — `npm test` green in the demo project
[SHOT-b] — the live check returning HTTP 500

---

## The failure class

The demo bug is deliberately mundane, which is the point. The database returns
`display_name` (snake_case); the feature reads `user.displayName` (camelCase)
and throws. The unit test is green because **the agent wrote the test against
the shape it invented** — it fed `formatUser` a camelCase object it made up,
never the shape the real `db.mjs` returns.

This isn't a strawman. A 2026 MSR study of 1.2 million commits found that
coding-agent test commits added mocks *more* often than non-agent commits (36%
vs 26%) and warned that mocked tests can be easier to generate while giving
weaker evidence about real interactions
([arXiv:2602.00409](https://arxiv.org/abs/2602.00409), cited in the project
README). An agent that mocks its own assumptions can be simultaneously
"fully tested" and wrong. Paranoid targets exactly that gap.

---

## Design decisions (and why)

Every one of these is a "fail toward catching the bug" choice:

- **The check belongs to the developer, not the agent.** An agent grading its
  own homework proves nothing. Paranoid runs a command from a committed
  `.paranoid.json` the agent doesn't own, and the PreToolUse guard denies
  Edit/Write against the check and other protected paths. Uncommitted changes to
  those paths **block completion** rather than being trusted
  (`evidence/05-tamper-blocked.txt`: an uncommitted edit to a protected check →
  tamper block, exit 2).
- **Fail closed, never open.** Invalid `timeoutSeconds`, unparseable config, a
  check that won't start, or a check that times out all **block** — the safe
  direction is "keep working," never "silently pass" (`CHANGELOG.md` 0.1.1).
- **Re-run on continuation, don't exit early.** `stop_hook_active: true` means
  "the agent is continuing after an earlier block" — precisely when the check
  must run *again* to confirm the fix is real. Paranoid re-runs it and still
  blocks a still-broken app (`evidence/06-continuation-blocks.txt`: exit 2 on the
  continuation stop). It leans on Claude Code's own consecutive-block safety cap
  to stay bounded instead of looping forever.
- **Timeout aligned under the host.** Project checks are capped at **240s** so
  they can't outlive the plugin hook's **300s** host timeout and fail open at the
  boundary — the 60s of headroom is for cleanup and reporting (`CHANGELOG.md`
  0.1.3; README limitations).
- **Config discovery is `.git`-bounded.** When `CLAUDE_PROJECT_DIR` isn't set,
  Paranoid walks up from the working directory to the nearest `.paranoid.json`
  but **never crosses a `.git` boundary** into a parent project's config — so a
  nested repo can't accidentally inherit someone else's check (`CHANGELOG.md`
  0.1.2 / 0.1.3).

The whole plugin ships with a **14/14** zero-dependency test suite
(`evidence/00-suite-14of14.txt`) and passes `claude plugin validate . --strict`
(`evidence/01-plugin-validate.txt`).

[SHOT-c] — Paranoid blocking the agent's first finish attempt in the transcript
[SHOT-d] — the one-line fix, then the second finish attempt passing

---

## The adversarial audit story

Paranoid was hardened across **four adversarial audit rounds between two AI
models**, plus a fifth native-validation pass in this build. Every row is drawn
from `CHANGELOG.md`. The pattern is the interesting part: each round's fix
*looked* correct — and still failed the actual promise until it was exercised
against the real edge.

| Round | Claimed fixed | What the next pass still found |
|-------|---------------|--------------------------------|
| **0.1.0** | Initial build: Stop-hook reality check, PreToolUse guard, portable skill, demo, packaging. | Continuation stops exited early (a still-broken app stopped blocking); subdirectory runs bypassed the project root; invalid timeouts failed **open**; the demo check leaked processes / used a fixed port. |
| **0.1.1** | Re-run on continuation; project root via `CLAUDE_PROJECT_DIR`; invalid timeouts fail **closed**; demo check gets a dynamic port + clean teardown. | With `CLAUDE_PROJECT_DIR` absent (manual runs, Codex), there was no config discovery at all — and any walk-up had to stop at `.git` so a parent project's config is never used. |
| **0.1.2** | Config walk-up to the nearest `.paranoid.json`, stopping at `.git`; documented the block-cap knob; 10 tests. | Marketplace packaging was invalid (root source must be `"./"`); a hidden **10-directory** discovery ceiling silently bypassed the check in deep trees; checks could outlive the 300s host timeout and fail open; git tamper detection mishandled NUL-delimited output, spaces, and renames; no Windows CI. |
| **0.1.3** | `"./"` source; ceiling removed; 240s cap under the 300s host; NUL-delimited porcelain parsing (spaces + renames); Windows CI + regression tests. | The `npm test` script globbed `tests/*.test.mjs` — which Windows `cmd.exe` + Node 20 don't expand, so the new Windows CI leg would fail. |
| **0.1.4** | Test script names the file explicitly (`node --test tests/hooks.test.mjs`). | `claude plugin validate . --strict` (run natively in this build) flagged the marketplace manifest for a missing top-level `description` — tolerated by the runtime, an **error** under `--strict`. |
| **0.1.5** | Added the marketplace `description`; validator passes clean (exit 0). | — (this build) |

**The lesson: test the promise, not the pattern.** A block that looks like a
block, a discovery walk that looks like discovery, a tamper check that looks like
tamper detection — each passed inspection and still broke against the real
continuation stop, the real missing env var, the real deep tree, the real
Windows shell, the real strict validator. That is Paranoid's own thesis turned
on Paranoid itself.

---

## Limitations (stated plainly)

Copied from the project's own honesty, not softened:

- Paranoid guarantees only that the configured, developer-owned command **ran
  and passed** before the agent could finish. It does **not** prove the whole
  feature is correct — a check proves only what it actually exercises. It's a
  guardrail, not a QA department, and not a replacement for integration tests,
  contract tests, code review, or CI.
- Claude Code overrides a Stop hook after **eight consecutive blocks** by
  default. Paranoid re-runs the check each continuation but cannot override that
  platform cap (raise it with `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP` if a check
  legitimately needs more iterations).
- The Edit/Write guard is **not a security sandbox.** Git catches *uncommitted*
  changes to protected files; a deliberately committed bypass is outside the
  threat model. Paranoid targets lazy or mistaken completion, not a malicious
  agent.
- The test-runner filter resolves one level of npm/pnpm/yarn scripts — a
  guardrail, not a complete command classifier.
- No `.paranoid.json` means Paranoid stays silent; it never invents a check.
  `PARANOID_DISABLE=1` disables the hooks.

---

## Shot map

| Placeholder | Shot (see `RECORDING.md`) |
|-------------|---------------------------|
| `[SHOT-a]` | `npm test` green in the live-demo project |
| `[SHOT-b]` | the live check returning HTTP 500 |
| `[SHOT-c]` | Paranoid blocking the agent's first finish attempt (scripted fallback: `evidence/04`, labeled as scripted) |
| `[SHOT-d]` | the one-line fix + the second finish attempt passing |
| `[SHOT-e]` | `claude plugin list` — `paranoid@paranoid`, v0.1.5, local, enabled |

[SHOT-e] — `claude plugin list` showing paranoid installed

---

## Résumé / LinkedIn version (3 lines)

> **Paranoid** — a Claude Code plugin that blocks an AI coding agent from
> declaring a task "done" until a developer-owned check passes against the
> *running* application, closing the "green tests, broken feature" gap.
> Hardened across four adversarial AI-vs-AI audit rounds; ships a 14/14
> zero-dependency test suite and passes `claude plugin validate --strict`.
> Every portfolio claim is backed by a committed, reproducible capture in
> `evidence/` — the project verifies itself the way it asks agents to.
