# Recording the Paranoid demo

> **Status (2026-08-02):** a real gated session has been captured end-to-end —
> block, root-cause fix, and passing finish — with full transcripts and the
> `--debug` log published in [`evidence/live-session/`](./evidence/live-session/)
> and distilled in `evidence/08-live-gated-session.txt`. This document remains
> the runbook for filming a *visual* (GIF/video) take of the same flow.

This is the human-recorded companion to the scripted evidence in `evidence/`.
Record it in the **live-demo project**, not this repo:

```
../paranoid-live-demo/
```

That project's root **is** the demo app, so `.paranoid.json` sits at the root
and Paranoid's config discovery finds it. (If you opened Claude Code in *this*
plugin repo instead, discovery would correctly find nothing and the hook would
stay silent — that is by design.) The plugin is already installed there at
**local scope** and enabled (`.claude/settings.local.json` →
`enabledPlugins: { "paranoid@paranoid": true }`), verified in
`evidence/07-live-install-verified.txt`.

---

## 1. The Session-2 prompt

Open a **fresh** Claude Code session in `../paranoid-live-demo/` — nothing about
Paranoid, nothing about the fix. Pick based on what you want to film:

**A. Deterministic block (recommended — guarantees shot (c) fires live):**

> Run the existing unit tests and report whether the project is ready. Do not
> modify any files.

The agent runs the green tests, can't touch anything, ends its turn — and
Paranoid fires the real-app check, hits the 500, and blocks the turn. Because
the agent is forbidden to change files, the block is near-certain. This tests
the *integration* (does the installed hook actually fire on a real Stop?), which
is the one thing the scripted `evidence/` captures cannot prove.

**B. Orthogonal task (stronger story, block still very likely):**

> Add a GET /health endpoint that returns 200, write a test for it, and finish.

The agent does clean, correct work on a new route — then tries to finish and
Paranoid blocks it on the *pre-existing* 500 on `/api/users/123`, a route the
agent never touched. A more compelling narrative than catching the bug it was
sent to fix.

**C. Realistic (block only if the agent stops before fixing):**

> Users report GET /api/users/123 returns a 500 in production, but our test
> suite is green. Find the bug, fix it, and finish the task.

A capable agent may fix the camelCase/snake_case mismatch *before* its first
finish attempt, in which case no block is filmed — fall back to `evidence/04`,
labeled as scripted (see the honest note below).

**Capture the integration proof.** Run Claude Code with hook debugging enabled
(`claude --debug`, or set the hook debug env var) so the transcript records the
hook *matching and executing* — that is far stronger integration evidence than
piping JSON into the script by hand. What to catch: (1) plugin loaded at local
scope; (2) a real agent response reaching `Stop`; (3) the Paranoid hook selected;
(4) hook exits 2; (5) the agent receives the failure and keeps working.

---

## 2. Shot list (in order)

Record one screenshot / GIF segment per step. Capture a few idle frames before
and after each action so the GIF plays smoothly.

| # | Shot | What to capture |
|---|------|-----------------|
| **a** | Tests green | In `../paranoid-live-demo/`, run `npm test` — 1 pass, 0 fail. The suite the ticket says is green. |
| **b** | The real 500 | Run `node scripts/check-live-app.mjs` (or `npm run paranoid:check`). Shows `GET /api/users/123 -> HTTP 500`. The app is actually broken. |
| **c** | Paranoid blocks the finish | In the Session-2 transcript, the moment Claude first tries to finish and the **PARANOID** report appears instead, sending the real 500 back to the agent. |
| **d** | The fix + clean finish | Claude edits `lib/format-user.mjs` (`user.displayName` → `user.display_name`), tries to finish again, and Paranoid lets it through (`Real app check ✓ passed`). |
| **e** | Proof it's installed | `claude plugin list` showing `paranoid@paranoid`, Version 0.1.5, Scope local, Status ✔ enabled. |

### Honest note about shot (c)

Shot (c) is the payoff — but it only happens live **if the agent tries to
declare "done" before it has actually fixed the bug** (or fixes it wrong). A
capable agent may find and fix the camelCase/snake_case mismatch *before* its
first finish attempt, in which case the Stop hook's first run already passes and
no block is filmed.

If that happens, **do not stage a fake block.** Use the scripted capture
`evidence/04-stop-hook-blocks.txt` instead, and in the post label it plainly as
a scripted reproduction of the Stop hook (the identical report, run outside a
live session). The whole project's credibility rests on never dressing up a
scripted capture as a live one.

---

## 3. Recorder

Use whatever you're comfortable with — [asciinema](https://asciinema.org/) or
[vhs](https://github.com/charmbracelet/vhs) for crisp terminal casts, or a plain
screen recorder if you want the Claude Code TUI and the transcript in-frame for
shots (c) and (d). Your choice.
