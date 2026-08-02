# Evidence — reproducible command captures

These files are **first-party, reproducible command captures with exit codes** —
the actual output of commands run during the build, each with its command shown
at the top. They are receipts you can re-run yourself, **not** an independent
audit or cryptographic proof. The independent check is CI: GitHub Actions
re-runs the full test suite (`test` workflow) and re-proves the green-tests /
broken-app thesis (`demo-thesis` workflow) on GitHub's own runners every push.

**Local paths normalized for privacy:** absolute machine paths have been
replaced with `<repo>`, `<live-demo>`, and `<tmp>`. Commands, outputs, and exit
codes are otherwise unchanged.

| File | What it shows |
|------|----------------|
| `00-suite-14of14.txt` | `npm test` → 14 pass / 0 fail (exit 0) |
| `01-plugin-validate.txt` | `claude plugin validate . --strict` → passed (exit 0) |
| `01-plugin-validate-before-fix.txt` | the pre-0.1.5 `--strict` failure (exit 1) |
| `02-demo-tests-green.txt` | demo `node --test` → 1 pass / 0 fail (exit 0) |
| `03-real-app-500.txt` | live check → HTTP 500 (exit 1) |
| `04-stop-hook-blocks.txt` | Stop hook → PARANOID check-failed block (exit 2) |
| `05-tamper-blocked.txt` | uncommitted protected-file edit → tamper block (exit 2) |
| `06-continuation-blocks.txt` | `stop_hook_active:true` → still blocks (exit 2) |
| `07-live-install-verified.txt` | plugin installed at local scope; installed Stop hook blocks (exit 2) |
| `08-live-gated-session.txt` | a real gated session, distilled: agent says "not ready" → Stop hook blocks (13:41:59Z) → root-cause fix → check passes (13:43:30Z) |
| `live-session/` | the full capture behind `08`: both stream-json transcripts, the complete `--debug` log, and the capture script |

`02` + `03` are the thesis in two files: the unit tests are green while the
running app is broken.
