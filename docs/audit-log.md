# Audit log — the four adversarial rounds, as a table

Paranoid's plugin code was built and hardened across four adversarial
AI-vs-AI audit rounds (two frontier models alternating as auditor) before this
repository existed. This table makes that process inspectable instead of
narrated.

**Sources and epistemic status.** Rows were reconstructed on 2026-07-22 from
two independent records: (1) the original build/audit conversation (Claude,
which holds the round-by-round artifacts — `paranoid-fixed-v0.1.1.zip`,
`paranoid-v0.1.3-audited.zip`, `paranoid-v0.1.4-verified.zip` — and the pasted
auditor verdicts), and (2) this repository's own [`CHANGELOG.md`](../CHANGELOG.md),
whose per-version fix lists match the rounds one-for-one. The auditing model's
internal reproduction transcripts are not held; where a bug's discovery is the
auditor's claim rather than an independently re-verified fact, the
Verification column says so. Nothing in this table is reconstructed from
memory alone.

| Round | Auditor → auditee | Version | Claim under test | Bugs found | Fix | Verification |
|---|---|---|---|---|---|---|
| 0 (build) | — | v0.1.0 | Initial build: Stop-hook reality check, PreToolUse guard, portable skill, demo app, packaging | — | — | Builder smoke-tested 7 behaviors: block, loop-guard, pass-after-fix, script + config tamper, test-runner rejection, no-config silence, guard deny |
| 1 | GPT → Claude's build | v0.1.0 → v0.1.1 | "Blocks until the check passes" | (1) `stop_hook_active` early-exit let the 2nd stop pass unchecked; (2) `input.cwd` subdirectory bypass; (3) demo server process leak (`process.exit` inside `try` skipping `finally`); (4) `timeoutSeconds: "Infinity"` failed open; (5) user-scope install = arbitrary command execution across repos | Re-run check on continuation stops; project root via `CLAUDE_PROJECT_DIR`; timeout validation fails closed; demo rewritten (dynamic port, reliable cleanup); Local-scope warning; 8 tests + CI | Reproductions are the auditor's claims; the builder independently code-read every change, ran the 8 tests (8/8), confirmed continuation-blocks and no leaked process, and verified the consecutive-block cap + `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP` against official docs |
| 2 | Claude → GPT's fixes | v0.1.1 → v0.1.2 | GPT's round-1 fixes are complete | Subdirectory bypass persisted outside Claude Code (no `CLAUDE_PROJECT_DIR` in manual/Codex runs) — reproduced, exit 0 | Bounded walk-up config discovery stopping at `.git`; block-cap knob documented; +2 tests (10 total) | Command-verified: bypass reproduced pre-fix, blocked post-fix; full matrix re-run |
| 3 | GPT → v0.1.2 | v0.1.2 → v0.1.3 | Launch readiness | (1) marketplace `"source": "."` invalid; (2) ten-level walk ceiling silently bypassed deep repos; (3) 3600s check cap vs 300s host hook timeout could fail open (a joint miss — the 3600 from round 1's fixes, the 300 from the original wiring); (4) fragile `git status` parsing; (5) no in-suite tamper tests | `"./"` source; unlimited walk to `.git`/root; 240s cap; NUL-delimited porcelain parsing; +4 tests (14 total); Windows CI added | Builder code-read all diffs, ran 14/14, live `git mv` rename-tamper probe (both names flagged), demo matrix; `"./"` requirement verified against official marketplace docs |
| 4 | Claude → v0.1.3 | v0.1.3 → v0.1.4 | Round-3 fixes + new CI are sound | Windows + Node 20 CI leg would fail: cmd.exe does not expand globs and Node 20's test runner does not glob patterns — the literal `tests/*.test.mjs` was unresolvable | Explicit test filename in the CI test script | Suite re-run 14/14; the Windows leg was a reasoning-level fix not natively run by either AI pre-push — later confirmed green in this repo's live Actions run (all 4 matrix legs). The v0.1.4 artifact was then round-trip confirmed: SHA-256 match + file-level diff of the re-downloaded tree, byte-identical |

Post-import history (v0.1.5 native-validation fix onward, the evidence
captures, and the [Reality-Gap eval](./reality-gap.md)) is recorded directly
in this repository's commit history and needs no reconstruction.
